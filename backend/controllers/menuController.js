import { runWithDb } from '../config/db.js';
import { nextAutoId } from '../config/sqlFallbackStore.js';

export const getMenusByRestaurant = async (req, res) => {
  try {
    const restaurantId = Number(req.params.restaurantId);
    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      return res.status(400).json({ message: 'ID restoran tidak valid.' });
    }

    const menus = await runWithDb(
      async (pool) => {
        const [rows] = await pool.query(
          'SELECT menu_id, restaurant_id, item_name, price, category FROM menus WHERE restaurant_id = ? ORDER BY category ASC, menu_id ASC',
          [restaurantId]
        );
        return rows.map((m) => ({ ...m, price: Number(m.price) }));
      },
      (store) =>
        store.menus
          .filter((m) => Number(m.restaurant_id) === restaurantId)
          .sort(
            (a, b) =>
              String(a.category || '').localeCompare(String(b.category || '')) ||
              Number(a.menu_id) - Number(b.menu_id)
          )
          .map((m) => ({ ...m, price: Number(m.price) }))
    );

    return res.json({ menus });
  } catch (error) {
    console.error('getMenusByRestaurant error:', error);
    return res.status(500).json({ message: 'Gagal memuat daftar menu.' });
  }
};

export const createMenu = async (req, res) => {
  try {
    const { restaurant_id, item_name, price, category } = req.body;
    const restaurantId = Number(restaurant_id);
    const numericPrice = Number(price);

    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      return res.status(400).json({ message: 'Pilih restoran yang valid.' });
    }

    if (!item_name?.trim()) {
      return res.status(400).json({ message: 'Nama menu wajib diisi.' });
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: 'Harga menu harus lebih dari 0.' });
    }

    const cleanCategory = category?.trim() || 'Paket Kombo';

    const created = await runWithDb(
      async (pool) => {
        const [restaurantRows] = await pool.query(
          'SELECT restaurant_id FROM restaurants WHERE restaurant_id = ? LIMIT 1',
          [restaurantId]
        );
        if (restaurantRows.length === 0) return null;

        const [result] = await pool.query(
          'INSERT INTO menus (restaurant_id, item_name, price, category) VALUES (?, ?, ?, ?)',
          [restaurantId, item_name.trim(), numericPrice, cleanCategory]
        );

        return {
          menu_id: result.insertId,
          restaurant_id: restaurantId,
          item_name: item_name.trim(),
          price: numericPrice,
          category: cleanCategory,
        };
      },
      (store) => {
        const exists = store.restaurants.some(
          (r) => Number(r.restaurant_id) === restaurantId
        );
        if (!exists) return null;
        const newMenu = {
          menu_id: nextAutoId(store.menus, 'menu_id'),
          restaurant_id: restaurantId,
          item_name: item_name.trim(),
          price: numericPrice,
          category: cleanCategory,
        };
        store.menus.push(newMenu);
        return newMenu;
      }
    );

    if (!created) {
      return res.status(404).json({ message: 'Restoran tidak ditemukan.' });
    }

    return res.status(201).json({
      message: 'Menu baru berhasil ditambahkan.',
      menu: created,
    });
  } catch (error) {
    console.error('createMenu error:', error);
    return res.status(500).json({ message: 'Gagal menambahkan item menu.' });
  }
};

export const deleteMenu = async (req, res) => {
  try {
    const menuId = Number(req.params.id);
    if (!Number.isInteger(menuId) || menuId <= 0) {
      return res.status(400).json({ message: 'ID menu tidak valid.' });
    }

    const deleted = await runWithDb(
      async (pool) => {
        const [result] = await pool.query('DELETE FROM menus WHERE menu_id = ?', [
          menuId,
        ]);
        return result.affectedRows > 0;
      },
      (store) => {
        const idx = store.menus.findIndex((m) => Number(m.menu_id) === menuId);
        if (idx === -1) return false;
        store.menus.splice(idx, 1);
        return true;
      }
    );

    if (!deleted) {
      return res.status(404).json({ message: 'Item menu tidak ditemukan.' });
    }

    return res.json({ message: 'Item menu berhasil dihapus.' });
  } catch (error) {
    console.error('deleteMenu error:', error);
    return res.status(500).json({ message: 'Gagal menghapus item menu.' });
  }
};
