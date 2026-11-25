import { runWithDb } from '../config/db.js';
import { nextAutoId } from '../config/sqlFallbackStore.js';

function normalizeCoordinates(rawLat, rawLng) {
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    return { latitude: lng, longitude: lat };
  }
  return { latitude: lat, longitude: lng };
}

function hydrateFallbackRestaurant(row, store) {
  const coords = normalizeCoordinates(row.latitude, row.longitude);
  const reviews = store.reviews.filter(
    (rv) => Number(rv.restaurant_id) === Number(row.restaurant_id)
  );
  const menuCount = store.menus.filter(
    (m) => Number(m.restaurant_id) === Number(row.restaurant_id)
  ).length;
  const activeQueueCount = store.orders.filter(
    (o) =>
      Number(o.restaurant_id) === Number(row.restaurant_id) &&
      (o.order_status === 'menunggu_pembayaran' ||
        o.order_status === 'sedang_disiapkan')
  ).length;
  const avgRating =
    reviews.length > 0
      ? Number(
          (
            reviews.reduce((sum, rv) => sum + Number(rv.rating), 0) /
            reviews.length
          ).toFixed(1)
        )
      : 0;

  return {
    ...row,
    latitude: coords.latitude,
    longitude: coords.longitude,
    base_prep_minutes: Number(row.base_prep_minutes) || 10,
    active_queue_count: activeQueueCount,
    avg_rating: avgRating,
    review_count: reviews.length,
    menu_count: menuCount,
  };
}

export const getAllRestaurants = async (_req, res) => {
  try {
    const restaurants = await runWithDb(
      async (pool) => {
        const [rows] = await pool.query(`
          SELECT
            r.restaurant_id,
            r.name,
            r.address,
            r.operating_hours,
            r.latitude,
            r.longitude,
            r.base_prep_minutes,
            r.created_at,
            COALESCE(
              (SELECT ROUND(AVG(rv.rating), 1)
               FROM reviews rv
               WHERE rv.restaurant_id = r.restaurant_id),
              0
            ) AS avg_rating,
            (SELECT COUNT(*)
             FROM reviews rv
             WHERE rv.restaurant_id = r.restaurant_id) AS review_count,
            (SELECT COUNT(*)
             FROM menus m
             WHERE m.restaurant_id = r.restaurant_id) AS menu_count,
            (SELECT COUNT(*)
             FROM orders o
             WHERE o.restaurant_id = r.restaurant_id
               AND o.order_status IN ('menunggu_pembayaran', 'sedang_disiapkan')) AS active_queue_count
          FROM restaurants r
          ORDER BY r.restaurant_id ASC
        `);

        return rows.map((row) => {
          const coords = normalizeCoordinates(row.latitude, row.longitude);
          return {
            ...row,
            latitude: coords.latitude,
            longitude: coords.longitude,
            base_prep_minutes: Number(row.base_prep_minutes) || 10,
            active_queue_count: Number(row.active_queue_count) || 0,
            avg_rating: Number(row.avg_rating) || 0,
            review_count: Number(row.review_count) || 0,
            menu_count: Number(row.menu_count) || 0,
          };
        });
      },
      (store) =>
        [...store.restaurants]
          .sort((a, b) => Number(a.restaurant_id) - Number(b.restaurant_id))
          .map((row) => hydrateFallbackRestaurant(row, store))
    );

    return res.json({ restaurants });
  } catch (error) {
    console.error('getAllRestaurants error:', error);
    return res.status(500).json({
      message: 'Gagal memuat daftar restoran dari database.',
    });
  }
};

export const getRestaurantById = async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);
    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      return res.status(400).json({ message: 'ID restoran tidak valid.' });
    }

    const restaurant = await runWithDb(
      async (pool) => {
        const [rows] = await pool.query(
          `
          SELECT
            r.restaurant_id,
            r.name,
            r.address,
            r.operating_hours,
            r.latitude,
            r.longitude,
            r.base_prep_minutes,
            r.created_at,
            COALESCE(
              (SELECT ROUND(AVG(rv.rating), 1)
               FROM reviews rv
               WHERE rv.restaurant_id = r.restaurant_id),
              0
            ) AS avg_rating,
            (SELECT COUNT(*)
             FROM reviews rv
             WHERE rv.restaurant_id = r.restaurant_id) AS review_count,
            (SELECT COUNT(*)
             FROM orders o
             WHERE o.restaurant_id = r.restaurant_id
               AND o.order_status IN ('menunggu_pembayaran', 'sedang_disiapkan')) AS active_queue_count
          FROM restaurants r
          WHERE r.restaurant_id = ?
          LIMIT 1
          `,
          [restaurantId]
        );

        if (rows.length === 0) return null;

        const [menus] = await pool.query(
          'SELECT menu_id, restaurant_id, item_name, price, category FROM menus WHERE restaurant_id = ? ORDER BY category ASC, menu_id ASC',
          [restaurantId]
        );

        const [reviews] = await pool.query(
          `
          SELECT
            rv.review_id,
            rv.restaurant_id,
            rv.user_id,
            u.full_name,
            rv.rating,
            rv.comment,
            rv.created_at
          FROM reviews rv
          INNER JOIN users u ON rv.user_id = u.user_id
          WHERE rv.restaurant_id = ?
          ORDER BY rv.created_at DESC, rv.review_id DESC
          `,
          [restaurantId]
        );

        const coords = normalizeCoordinates(rows[0].latitude, rows[0].longitude);

        return {
          ...rows[0],
          latitude: coords.latitude,
          longitude: coords.longitude,
          base_prep_minutes: Number(rows[0].base_prep_minutes) || 10,
          active_queue_count: Number(rows[0].active_queue_count) || 0,
          avg_rating: Number(rows[0].avg_rating) || 0,
          review_count: Number(rows[0].review_count) || 0,
          menus: menus.map((m) => ({ ...m, price: Number(m.price) })),
          reviews,
        };
      },
      (store) => {
        const found = store.restaurants.find(
          (r) => Number(r.restaurant_id) === restaurantId
        );
        if (!found) return null;

        const base = hydrateFallbackRestaurant(found, store);
        const menus = store.menus
          .filter((m) => Number(m.restaurant_id) === restaurantId)
          .sort(
            (a, b) =>
              String(a.category || '').localeCompare(String(b.category || '')) ||
              Number(a.menu_id) - Number(b.menu_id)
          )
          .map((m) => ({ ...m, price: Number(m.price) }));

        const reviews = store.reviews
          .filter((rv) => Number(rv.restaurant_id) === restaurantId)
          .map((rv) => {
            const author = store.users.find(
              (u) => Number(u.user_id) === Number(rv.user_id)
            );
            return {
              ...rv,
              full_name: author?.full_name || 'Pengguna CARISAJI',
            };
          })
          .sort((a, b) => Number(b.review_id) - Number(a.review_id));

        return {
          ...base,
          menus,
          reviews,
        };
      }
    );

    if (!restaurant) {
      return res.status(404).json({ message: 'Restoran tidak ditemukan.' });
    }

    return res.json({ restaurant });
  } catch (error) {
    console.error('getRestaurantById error:', error);
    return res.status(500).json({
      message: 'Gagal memuat detail restoran.',
    });
  }
};

export const createRestaurant = async (req, res) => {
  try {
    const {
      name,
      address,
      operating_hours,
      latitude,
      longitude,
      base_prep_minutes,
    } = req.body;
    const lat = Number(latitude);
    const lng = Number(longitude);
    const basePrep =
      Number.isFinite(Number(base_prep_minutes)) &&
      Number(base_prep_minutes) > 0
        ? Math.round(Number(base_prep_minutes))
        : 10;

    if (!name?.trim() || !address?.trim()) {
      return res.status(400).json({
        message: 'Nama restoran dan alamat wajib diisi.',
      });
    }

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        message:
          'Koordinat Latitude (-90 s.d. 90) dan Longitude (-180 s.d. 180) harus valid.',
      });
    }

    const cleanHours = operating_hours?.trim() || '10:00 - 22:00';

    const restaurant = await runWithDb(
      async (pool) => {
        const [result] = await pool.query(
          `INSERT INTO restaurants (name, address, operating_hours, latitude, longitude, base_prep_minutes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [name.trim(), address.trim(), cleanHours, lat, lng, basePrep]
        );
        return {
          restaurant_id: result.insertId,
          name: name.trim(),
          address: address.trim(),
          operating_hours: cleanHours,
          latitude: lat,
          longitude: lng,
          base_prep_minutes: basePrep,
          active_queue_count: 0,
          avg_rating: 0,
          review_count: 0,
          menu_count: 0,
        };
      },
      (store) => {
        const newRest = {
          restaurant_id: nextAutoId(store.restaurants, 'restaurant_id'),
          name: name.trim(),
          address: address.trim(),
          operating_hours: cleanHours,
          latitude: lat,
          longitude: lng,
          base_prep_minutes: basePrep,
          created_at: new Date().toISOString(),
        };
        store.restaurants.push(newRest);
        return {
          ...newRest,
          active_queue_count: 0,
          avg_rating: 0,
          review_count: 0,
          menu_count: 0,
        };
      }
    );

    return res.status(201).json({
      message: 'Restoran baru berhasil ditambahkan.',
      restaurant,
    });
  } catch (error) {
    console.error('createRestaurant error:', error);
    return res.status(500).json({
      message: 'Gagal menambahkan restoran baru.',
    });
  }
};

export const updateRestaurant = async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);
    const {
      name,
      address,
      operating_hours,
      latitude,
      longitude,
      base_prep_minutes,
    } = req.body;
    const lat = Number(latitude);
    const lng = Number(longitude);
    const basePrep =
      Number.isFinite(Number(base_prep_minutes)) &&
      Number(base_prep_minutes) > 0
        ? Math.round(Number(base_prep_minutes))
        : 10;

    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      return res.status(400).json({ message: 'ID restoran tidak valid.' });
    }

    if (!name?.trim() || !address?.trim()) {
      return res.status(400).json({
        message: 'Nama restoran dan alamat wajib diisi.',
      });
    }

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        message: 'Koordinat Latitude dan Longitude harus valid.',
      });
    }

    const cleanHours = operating_hours?.trim() || '10:00 - 22:00';

    const updated = await runWithDb(
      async (pool) => {
        const [result] = await pool.query(
          `UPDATE restaurants
           SET name = ?, address = ?, operating_hours = ?, latitude = ?, longitude = ?, base_prep_minutes = ?
           WHERE restaurant_id = ?`,
          [name.trim(), address.trim(), cleanHours, lat, lng, basePrep, restaurantId]
        );
        if (result.affectedRows === 0) return null;
        return {
          restaurant_id: restaurantId,
          name: name.trim(),
          address: address.trim(),
          operating_hours: cleanHours,
          latitude: lat,
          longitude: lng,
          base_prep_minutes: basePrep,
        };
      },
      (store) => {
        const target = store.restaurants.find(
          (r) => Number(r.restaurant_id) === restaurantId
        );
        if (!target) return null;
        target.name = name.trim();
        target.address = address.trim();
        target.operating_hours = cleanHours;
        target.latitude = lat;
        target.longitude = lng;
        target.base_prep_minutes = basePrep;
        return {
          restaurant_id: restaurantId,
          name: target.name,
          address: target.address,
          operating_hours: target.operating_hours,
          latitude: target.latitude,
          longitude: target.longitude,
          base_prep_minutes: target.base_prep_minutes,
        };
      }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Restoran tidak ditemukan.' });
    }

    return res.json({
      message: 'Data restoran berhasil diperbarui.',
      restaurant: updated,
    });
  } catch (error) {
    console.error('updateRestaurant error:', error);
    return res.status(500).json({
      message: 'Gagal memperbarui data restoran.',
    });
  }
};

export const deleteRestaurant = async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);
    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      return res.status(400).json({ message: 'ID restoran tidak valid.' });
    }

    const deleted = await runWithDb(
      async (pool) => {
        const [result] = await pool.query(
          'DELETE FROM restaurants WHERE restaurant_id = ?',
          [restaurantId]
        );
        return result.affectedRows > 0;
      },
      (store) => {
        const idx = store.restaurants.findIndex(
          (r) => Number(r.restaurant_id) === restaurantId
        );
        if (idx === -1) return false;
        store.restaurants.splice(idx, 1);
        store.menus = store.menus.filter(
          (m) => Number(m.restaurant_id) !== restaurantId
        );
        store.reviews = store.reviews.filter(
          (rv) => Number(rv.restaurant_id) !== restaurantId
        );
        return true;
      }
    );

    if (!deleted) {
      return res.status(404).json({ message: 'Restoran tidak ditemukan.' });
    }

    return res.json({ message: 'Restoran berhasil dihapus.' });
  } catch (error) {
    console.error('deleteRestaurant error:', error);
    return res.status(500).json({
      message: 'Gagal menghapus restoran.',
    });
  }
};
