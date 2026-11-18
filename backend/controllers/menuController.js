import pool from '../config/db.js';

export const getMenusByRestaurant = async (req, res) => {
  try {
    const restaurantId = Number(req.params.restaurantId);
    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      return res.status(400).json({ message: 'ID restoran tidak valid.' });
    }

    const [menus] = await pool.query(
      'SELECT menu_id, restaurant_id, item_name, price, category FROM menus WHERE restaurant_id = ? ORDER BY category ASC, menu_id ASC',
      [restaurantId]
    );

    return res.json({
      menus: menus.map((m) => ({ ...m, price: Number(m.price) })),
    });
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

    const [restaurantRows] = await pool.query(
      'SELECT restaurant_id FROM restaurants WHERE restaurant_id = ? LIMIT 1',
      [restaurantId]
    );
    if (restaurantRows.length === 0) {
      return res.status(404).json({ message: 'Restoran tidak ditemukan.' });
    }

    const cleanCategory = category?.trim() || 'Paket Kombo';
    const [result] = await pool.query(
      'INSERT INTO menus (restaurant_id, item_name, price, category) VALUES (?, ?, ?, ?)',
      [restaurantId, item_name.trim(), numericPrice, cleanCategory]
    );

    return res.status(201).json({
      message: 'Menu baru berhasil ditambahkan.',
      menu: {
        menu_id: result.insertId,
        restaurant_id: restaurantId,
        item_name: item_name.trim(),
        price: numericPrice,
        category: cleanCategory,
      },
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

    const [result] = await pool.query('DELETE FROM menus WHERE menu_id = ?', [
      menuId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item menu tidak ditemukan.' });
    }

    return res.json({ message: 'Item menu berhasil dihapus.' });
  } catch (error) {
    console.error('deleteMenu error:', error);
    return res.status(500).json({ message: 'Gagal menghapus item menu.' });
  }
};
