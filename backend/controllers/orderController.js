import { runWithDb } from '../config/db.js';
import { nextAutoId } from '../config/sqlFallbackStore.js';

const BANK_CODES = {
  va_bca: '3901',
  va_bri: '88810',
  va_mandiri: '89022',
  va_bni: '8277',
};

const VALID_ORDER_TYPES = ['dine_in', 'takeaway'];
const VALID_PAYMENT_METHODS = ['qris', 'va_bca', 'va_bri', 'va_mandiri', 'va_bni'];
const VALID_ORDER_STATUSES = [
  'menunggu_pembayaran',
  'sedang_disiapkan',
  'siap_diambil',
  'selesai',
];

function buildVaNumber(paymentMethod, orderId, userId) {
  const bankCode = BANK_CODES[paymentMethod];
  if (!bankCode) return null;
  const userPad = String(userId % 1000).padStart(3, '0');
  const orderPad = String(100000 + orderId).slice(-6);
  return `${bankCode}0812${userPad}${orderPad}`;
}

function hydrateFallbackOrder(o, store, includeCustomer = false) {
  const rest = store.restaurants.find(
    (r) => Number(r.restaurant_id) === Number(o.restaurant_id)
  );
  const cust = store.users.find(
    (u) => Number(u.user_id) === Number(o.user_id)
  );
  const items = store.order_items
    .filter((it) => Number(it.order_id) === Number(o.order_id))
    .sort((a, b) => Number(a.order_item_id) - Number(b.order_item_id))
    .map((it) => ({
      ...it,
      price: Number(it.price),
      subtotal: Number(it.subtotal),
    }));

  return {
    ...o,
    ...(includeCustomer ? { customer_name: cust?.full_name || 'Pelanggan' } : {}),
    restaurant_name: rest?.name || 'Restoran CARISAJI',
    restaurant_address: rest?.address || '',
    restaurant_latitude: rest ? Number(rest.latitude) : undefined,
    restaurant_longitude: rest ? Number(rest.longitude) : undefined,
    total_amount: Number(o.total_amount),
    estimated_prep_minutes: Number(o.estimated_prep_minutes) || 12,
    items,
  };
}

export const createOrder = async (req, res) => {
  try {
    const {
      restaurant_id,
      order_type,
      pickup_time,
      customer_note,
      payment_method,
      items,
    } = req.body ?? {};

    const restaurantId = Number(restaurant_id);
    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      return res.status(400).json({ message: 'Restoran tidak valid.' });
    }
    if (!VALID_ORDER_TYPES.includes(order_type)) {
      return res.status(400).json({
        message: 'Pilih metode pesanan: Makan di Tempat atau Bawa Pulang.',
      });
    }
    if (!VALID_PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({
        message: 'Pilih metode pembayaran QRIS atau Virtual Account Bank.',
      });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Keranjang pesanan kosong. Pilih minimal 1 menu.',
      });
    }

    const cleanPickupTime = String(pickup_time || '').trim() || '15 Menit Lagi';
    const cleanNote = String(customer_note || '').trim() || null;

    const outcome = await runWithDb(
      async (pool) => {
        const connection = await pool.getConnection();
        try {
          const [restRows] = await connection.query(
            'SELECT restaurant_id, name, address, latitude, longitude, base_prep_minutes FROM restaurants WHERE restaurant_id = ? LIMIT 1',
            [restaurantId]
          );
          if (restRows.length === 0) {
            return { status: 404, message: 'Restoran tidak ditemukan.' };
          }

          const [queueRows] = await connection.query(
            "SELECT COUNT(*) AS cnt FROM orders WHERE restaurant_id = ? AND order_status IN ('menunggu_pembayaran', 'sedang_disiapkan')",
            [restaurantId]
          );
          const activeQueueCount = Number(queueRows[0]?.cnt) || 0;

          const [menuRows] = await connection.query(
            'SELECT menu_id, item_name, price FROM menus WHERE restaurant_id = ?',
            [restaurantId]
          );

          const validatedItems = [];
          for (const reqItem of items) {
            const qty = Math.floor(Number(reqItem.quantity));
            if (!Number.isFinite(qty) || qty <= 0) continue;
            const foundMenu = menuRows.find(
              (m) => m.menu_id === Number(reqItem.menu_id)
            );
            if (!foundMenu) {
              return {
                status: 400,
                message: 'Salah satu item menu tidak valid untuk restoran ini.',
              };
            }
            const price = Number(foundMenu.price);
            validatedItems.push({
              menu_id: foundMenu.menu_id,
              item_name: foundMenu.item_name,
              price,
              quantity: qty,
              subtotal: price * qty,
            });
          }

          if (validatedItems.length === 0) {
            return { status: 400, message: 'Pilih minimal 1 menu yang valid.' };
          }

          const totalAmount = validatedItems.reduce(
            (sum, i) => sum + i.subtotal,
            0
          );
          const totalQty = validatedItems.reduce(
            (sum, i) => sum + i.quantity,
            0
          );
          const basePrep = Number(restRows[0].base_prep_minutes) || 10;
          const queuePenalty = Math.min(activeQueueCount * 3, 24);
          const itemPenalty = Math.min(totalQty * 2, 16);
          const modeOffset = order_type === 'dine_in' ? 2 : 1;
          const estimatedPrepMinutes =
            basePrep + queuePenalty + itemPenalty + modeOffset;

          await connection.beginTransaction();

          const tempCode = `CSJ-TMP-${Date.now()}`;
          const [insertRes] = await connection.query(
            `INSERT INTO orders (order_code, user_id, restaurant_id, order_type, pickup_time, customer_note, payment_method, total_amount, estimated_prep_minutes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              tempCode,
              req.user.user_id,
              restaurantId,
              order_type,
              cleanPickupTime,
              cleanNote,
              payment_method,
              totalAmount,
              estimatedPrepMinutes,
            ]
          );

          const orderId = insertRes.insertId;
          const orderCode = `CSJ-${String(1000 + orderId)}`;
          const vaNumber = buildVaNumber(
            payment_method,
            orderId,
            req.user.user_id
          );

          await connection.query(
            'UPDATE orders SET order_code = ?, va_number = ? WHERE order_id = ?',
            [orderCode, vaNumber, orderId]
          );

          const persistedItems = [];
          for (const vi of validatedItems) {
            const [itemRes] = await connection.query(
              'INSERT INTO order_items (order_id, menu_id, item_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
              [
                orderId,
                vi.menu_id,
                vi.item_name,
                vi.price,
                vi.quantity,
                vi.subtotal,
              ]
            );
            persistedItems.push({
              order_item_id: itemRes.insertId,
              order_id: orderId,
              ...vi,
            });
          }

          await connection.commit();

          return {
            status: 201,
            order: {
              order_id: orderId,
              order_code: orderCode,
              user_id: req.user.user_id,
              customer_name: req.user.full_name,
              restaurant_id: restaurantId,
              restaurant_name: restRows[0].name,
              restaurant_address: restRows[0].address,
              restaurant_latitude: Number(restRows[0].latitude),
              restaurant_longitude: Number(restRows[0].longitude),
              order_type,
              pickup_time: cleanPickupTime,
              customer_note: cleanNote,
              payment_method,
              va_number: vaNumber,
              payment_status: 'menunggu_pembayaran',
              order_status: 'menunggu_pembayaran',
              total_amount: totalAmount,
              estimated_prep_minutes: estimatedPrepMinutes,
              created_at: new Date().toISOString(),
              paid_at: null,
              items: persistedItems,
            },
          };
        } catch (err) {
          try {
            await connection.rollback();
          } catch {
            // abaikan rollback error
          }
          throw err;
        } finally {
          connection.release();
        }
      },
      (store) => {
        const rest = store.restaurants.find(
          (r) => Number(r.restaurant_id) === restaurantId
        );
        if (!rest) {
          return { status: 404, message: 'Restoran tidak ditemukan.' };
        }

        const activeQueueCount = store.orders.filter(
          (o) =>
            Number(o.restaurant_id) === restaurantId &&
            (o.order_status === 'menunggu_pembayaran' ||
              o.order_status === 'sedang_disiapkan')
        ).length;

        const restMenus = store.menus.filter(
          (m) => Number(m.restaurant_id) === restaurantId
        );

        const validatedItems = [];
        for (const reqItem of items) {
          const qty = Math.floor(Number(reqItem.quantity));
          if (!Number.isFinite(qty) || qty <= 0) continue;
          const foundMenu = restMenus.find(
            (m) => Number(m.menu_id) === Number(reqItem.menu_id)
          );
          if (!foundMenu) {
            return {
              status: 400,
              message: 'Salah satu item menu tidak valid untuk restoran ini.',
            };
          }
          const price = Number(foundMenu.price);
          validatedItems.push({
            menu_id: foundMenu.menu_id,
            item_name: foundMenu.item_name,
            price,
            quantity: qty,
            subtotal: price * qty,
          });
        }

        if (validatedItems.length === 0) {
          return { status: 400, message: 'Pilih minimal 1 menu yang valid.' };
        }

        const totalAmount = validatedItems.reduce(
          (sum, i) => sum + i.subtotal,
          0
        );
        const totalQty = validatedItems.reduce(
          (sum, i) => sum + i.quantity,
          0
        );
        const basePrep = Number(rest.base_prep_minutes) || 10;
        const queuePenalty = Math.min(activeQueueCount * 3, 24);
        const itemPenalty = Math.min(totalQty * 2, 16);
        const modeOffset = order_type === 'dine_in' ? 2 : 1;
        const estimatedPrepMinutes =
          basePrep + queuePenalty + itemPenalty + modeOffset;

        const orderId = nextAutoId(store.orders, 'order_id');
        const orderCode = `CSJ-${String(1000 + orderId)}`;
        const vaNumber = buildVaNumber(
          payment_method,
          orderId,
          req.user.user_id
        );

        const newOrder = {
          order_id: orderId,
          order_code: orderCode,
          user_id: req.user.user_id,
          restaurant_id: restaurantId,
          order_type,
          pickup_time: cleanPickupTime,
          customer_note: cleanNote,
          payment_method,
          va_number: vaNumber,
          payment_status: 'menunggu_pembayaran',
          order_status: 'menunggu_pembayaran',
          total_amount: totalAmount,
          estimated_prep_minutes: estimatedPrepMinutes,
          created_at: new Date().toISOString(),
          paid_at: null,
        };
        store.orders.push(newOrder);

        let nextItemId = nextAutoId(store.order_items, 'order_item_id');
        const persistedItems = validatedItems.map((vi) => {
          const row = {
            order_item_id: nextItemId++,
            order_id: orderId,
            ...vi,
          };
          store.order_items.push(row);
          return row;
        });

        return {
          status: 201,
          order: {
            ...newOrder,
            customer_name: req.user.full_name,
            restaurant_name: rest.name,
            restaurant_address: rest.address,
            restaurant_latitude: Number(rest.latitude),
            restaurant_longitude: Number(rest.longitude),
            items: persistedItems,
          },
        };
      }
    );

    if (outcome.status !== 201) {
      return res.status(outcome.status).json({ message: outcome.message });
    }

    return res.status(201).json({
      message: 'Pesanan berhasil dibuat. Silakan selesaikan pembayaran.',
      order: outcome.order,
    });
  } catch (error) {
    console.error('createOrder error:', error);
    return res.status(500).json({ message: 'Gagal membuat pesanan.' });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await runWithDb(
      async (pool) => {
        const [rows] = await pool.query(
          `SELECT o.*, r.name AS restaurant_name, r.address AS restaurant_address,
                  r.latitude AS restaurant_latitude, r.longitude AS restaurant_longitude
           FROM orders o
           INNER JOIN restaurants r ON o.restaurant_id = r.restaurant_id
           WHERE o.user_id = ?
           ORDER BY o.order_id DESC`,
          [req.user.user_id]
        );

        return Promise.all(
          rows.map(async (o) => {
            const [items] = await pool.query(
              'SELECT * FROM order_items WHERE order_id = ? ORDER BY order_item_id ASC',
              [o.order_id]
            );
            return {
              ...o,
              restaurant_latitude: Number(o.restaurant_latitude),
              restaurant_longitude: Number(o.restaurant_longitude),
              total_amount: Number(o.total_amount),
              estimated_prep_minutes: Number(o.estimated_prep_minutes) || 12,
              items: items.map((it) => ({
                ...it,
                price: Number(it.price),
                subtotal: Number(it.subtotal),
              })),
            };
          })
        );
      },
      (store) =>
        store.orders
          .filter((o) => Number(o.user_id) === Number(req.user.user_id))
          .sort((a, b) => Number(b.order_id) - Number(a.order_id))
          .map((o) => hydrateFallbackOrder(o, store, false))
    );

    return res.json({ orders });
  } catch (error) {
    console.error('getMyOrders error:', error);
    return res.status(500).json({ message: 'Gagal memuat riwayat pesanan.' });
  }
};

export const confirmOrderPayment = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'ID pesanan tidak valid.' });
    }

    const outcome = await runWithDb(
      async (pool) => {
        const [rows] = await pool.query(
          'SELECT * FROM orders WHERE order_id = ? LIMIT 1',
          [orderId]
        );
        if (rows.length === 0) {
          return { status: 404, message: 'Pesanan tidak ditemukan.' };
        }
        if (req.user.role !== 'admin' && rows[0].user_id !== req.user.user_id) {
          return {
            status: 403,
            message: 'Anda tidak memiliki akses ke pesanan ini.',
          };
        }

        await pool.query(
          `UPDATE orders
           SET payment_status = 'lunas', order_status = 'sedang_disiapkan', paid_at = NOW()
           WHERE order_id = ?`,
          [orderId]
        );

        const [updated] = await pool.query(
          `SELECT o.*, r.name AS restaurant_name, r.address AS restaurant_address,
                  r.latitude AS restaurant_latitude, r.longitude AS restaurant_longitude
           FROM orders o
           INNER JOIN restaurants r ON o.restaurant_id = r.restaurant_id
           WHERE o.order_id = ? LIMIT 1`,
          [orderId]
        );
        const [items] = await pool.query(
          'SELECT * FROM order_items WHERE order_id = ?',
          [orderId]
        );

        return {
          status: 200,
          order: {
            ...updated[0],
            restaurant_latitude: Number(updated[0].restaurant_latitude),
            restaurant_longitude: Number(updated[0].restaurant_longitude),
            total_amount: Number(updated[0].total_amount),
            estimated_prep_minutes:
              Number(updated[0].estimated_prep_minutes) || 12,
            items: items.map((it) => ({
              ...it,
              price: Number(it.price),
              subtotal: Number(it.subtotal),
            })),
          },
        };
      },
      (store) => {
        const order = store.orders.find((o) => Number(o.order_id) === orderId);
        if (!order) {
          return { status: 404, message: 'Pesanan tidak ditemukan.' };
        }
        if (
          req.user.role !== 'admin' &&
          Number(order.user_id) !== Number(req.user.user_id)
        ) {
          return {
            status: 403,
            message: 'Anda tidak memiliki akses ke pesanan ini.',
          };
        }
        order.payment_status = 'lunas';
        order.order_status = 'sedang_disiapkan';
        order.paid_at = new Date().toISOString();
        return {
          status: 200,
          order: hydrateFallbackOrder(order, store, false),
        };
      }
    );

    if (outcome.status !== 200) {
      return res.status(outcome.status).json({ message: outcome.message });
    }

    return res.json({
      message:
        'Pembayaran berhasil dikonfirmasi! Restoran mulai menyiapkan pesanan Anda.',
      order: outcome.order,
    });
  } catch (error) {
    console.error('confirmOrderPayment error:', error);
    return res.status(500).json({ message: 'Gagal mengonfirmasi pembayaran.' });
  }
};

export const getAllOrders = async (_req, res) => {
  try {
    const orders = await runWithDb(
      async (pool) => {
        const [rows] = await pool.query(
          `SELECT o.*, u.full_name AS customer_name, r.name AS restaurant_name,
                  r.address AS restaurant_address, r.latitude AS restaurant_latitude, r.longitude AS restaurant_longitude
           FROM orders o
           INNER JOIN users u ON o.user_id = u.user_id
           INNER JOIN restaurants r ON o.restaurant_id = r.restaurant_id
           ORDER BY o.order_id DESC`
        );

        return Promise.all(
          rows.map(async (o) => {
            const [items] = await pool.query(
              'SELECT * FROM order_items WHERE order_id = ? ORDER BY order_item_id ASC',
              [o.order_id]
            );
            return {
              ...o,
              restaurant_latitude: Number(o.restaurant_latitude),
              restaurant_longitude: Number(o.restaurant_longitude),
              total_amount: Number(o.total_amount),
              estimated_prep_minutes: Number(o.estimated_prep_minutes) || 12,
              items: items.map((it) => ({
                ...it,
                price: Number(it.price),
                subtotal: Number(it.subtotal),
              })),
            };
          })
        );
      },
      (store) =>
        [...store.orders]
          .sort((a, b) => Number(b.order_id) - Number(a.order_id))
          .map((o) => hydrateFallbackOrder(o, store, true))
    );

    return res.json({ orders });
  } catch (error) {
    console.error('getAllOrders error:', error);
    return res.status(500).json({ message: 'Gagal memuat semua pesanan.' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { order_status } = req.body ?? {};
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'ID pesanan tidak valid.' });
    }
    if (!VALID_ORDER_STATUSES.includes(order_status)) {
      return res.status(400).json({ message: 'Status pesanan tidak valid.' });
    }

    const updated = await runWithDb(
      async (pool) => {
        const [result] = await pool.query(
          'UPDATE orders SET order_status = ? WHERE order_id = ?',
          [order_status, orderId]
        );
        return result.affectedRows > 0;
      },
      (store) => {
        const order = store.orders.find((o) => Number(o.order_id) === orderId);
        if (!order) return false;
        order.order_status = order_status;
        return true;
      }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    return res.json({ message: 'Status pesanan berhasil diperbarui.' });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return res.status(500).json({ message: 'Gagal memperbarui status pesanan.' });
  }
};
