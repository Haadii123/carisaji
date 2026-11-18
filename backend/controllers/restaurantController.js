import pool from '../config/db.js';

function normalizeCoordinates(rawLat, rawLng) {
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    return { latitude: lng, longitude: lat };
  }
  return { latitude: lat, longitude: lng };
}

export const getAllRestaurants = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        r.restaurant_id,
        r.name,
        r.address,
        r.operating_hours,
        ST_X(r.location) AS latitude,
        ST_Y(r.location) AS longitude,
        r.created_at,
        COALESCE(ROUND(AVG(rv.rating), 1), 0) AS avg_rating,
        COUNT(DISTINCT rv.review_id) AS review_count,
        COUNT(DISTINCT m.menu_id) AS menu_count
      FROM restaurants r
      LEFT JOIN reviews rv ON r.restaurant_id = rv.restaurant_id
      LEFT JOIN menus m ON r.restaurant_id = m.restaurant_id
      GROUP BY r.restaurant_id
      ORDER BY r.restaurant_id ASC
    `);

    const restaurants = rows.map((row) => {
      const coords = normalizeCoordinates(row.latitude, row.longitude);
      return {
        ...row,
        latitude: coords.latitude,
        longitude: coords.longitude,
        avg_rating: Number(row.avg_rating) || 0,
        review_count: Number(row.review_count) || 0,
        menu_count: Number(row.menu_count) || 0,
      };
    });

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

    const [rows] = await pool.query(
      `
      SELECT
        r.restaurant_id,
        r.name,
        r.address,
        r.operating_hours,
        ST_X(r.location) AS latitude,
        ST_Y(r.location) AS longitude,
        r.created_at,
        COALESCE(ROUND(AVG(rv.rating), 1), 0) AS avg_rating,
        COUNT(DISTINCT rv.review_id) AS review_count
      FROM restaurants r
      LEFT JOIN reviews rv ON r.restaurant_id = rv.restaurant_id
      WHERE r.restaurant_id = ?
      GROUP BY r.restaurant_id
      LIMIT 1
      `,
      [restaurantId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Restoran tidak ditemukan.' });
    }

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

    return res.json({
      restaurant: {
        ...rows[0],
        latitude: coords.latitude,
        longitude: coords.longitude,
        avg_rating: Number(rows[0].avg_rating) || 0,
        review_count: Number(rows[0].review_count) || 0,
        menus: menus.map((m) => ({ ...m, price: Number(m.price) })),
        reviews,
      },
    });
  } catch (error) {
    console.error('getRestaurantById error:', error);
    return res.status(500).json({
      message: 'Gagal memuat detail restoran.',
    });
  }
};

export const createRestaurant = async (req, res) => {
  try {
    const { name, address, operating_hours, latitude, longitude } = req.body;
    const lat = Number(latitude);
    const lng = Number(longitude);

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
        message: 'Koordinat Latitude (-90 s.d. 90) dan Longitude (-180 s.d. 180) harus valid.',
      });
    }

    const pointWkt = `POINT(${lat} ${lng})`;
    const [result] = await pool.query(
      `INSERT INTO restaurants (name, address, operating_hours, location)
       VALUES (?, ?, ?, ST_GeomFromText(?, 4326))`,
      [
        name.trim(),
        address.trim(),
        operating_hours?.trim() || '10:00 - 22:00',
        pointWkt,
      ]
    );

    return res.status(201).json({
      message: 'Restoran baru berhasil ditambahkan.',
      restaurant: {
        restaurant_id: result.insertId,
        name: name.trim(),
        address: address.trim(),
        operating_hours: operating_hours?.trim() || '10:00 - 22:00',
        latitude: lat,
        longitude: lng,
        avg_rating: 0,
        review_count: 0,
        menu_count: 0,
      },
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
    const { name, address, operating_hours, latitude, longitude } = req.body;
    const lat = Number(latitude);
    const lng = Number(longitude);

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

    const pointWkt = `POINT(${lat} ${lng})`;
    const [result] = await pool.query(
      `UPDATE restaurants
       SET name = ?, address = ?, operating_hours = ?, location = ST_GeomFromText(?, 4326)
       WHERE restaurant_id = ?`,
      [
        name.trim(),
        address.trim(),
        operating_hours?.trim() || '10:00 - 22:00',
        pointWkt,
        restaurantId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Restoran tidak ditemukan.' });
    }

    return res.json({
      message: 'Data restoran berhasil diperbarui.',
      restaurant: {
        restaurant_id: restaurantId,
        name: name.trim(),
        address: address.trim(),
        operating_hours: operating_hours?.trim() || '10:00 - 22:00',
        latitude: lat,
        longitude: lng,
      },
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

    const [result] = await pool.query(
      'DELETE FROM restaurants WHERE restaurant_id = ?',
      [restaurantId]
    );

    if (result.affectedRows === 0) {
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
