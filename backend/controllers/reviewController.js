import pool from '../config/db.js';

export const createReview = async (req, res) => {
  try {
    const restaurantId = Number(req.params.restaurantId);
    const { rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      return res.status(400).json({ message: 'ID restoran tidak valid.' });
    }

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: 'Rating harus berupa angka 1 sampai 5 bintang.',
      });
    }

    if (!comment?.trim()) {
      return res.status(400).json({
        message: 'Komentar ulasan tidak boleh kosong.',
      });
    }

    const [restaurantRows] = await pool.query(
      'SELECT restaurant_id FROM restaurants WHERE restaurant_id = ? LIMIT 1',
      [restaurantId]
    );
    if (restaurantRows.length === 0) {
      return res.status(404).json({ message: 'Restoran tidak ditemukan.' });
    }

    const [result] = await pool.query(
      'INSERT INTO reviews (restaurant_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [restaurantId, req.user.user_id, numericRating, comment.trim()]
    );

    return res.status(201).json({
      message: 'Terima kasih! Ulasan Anda berhasil dikirim.',
      review: {
        review_id: result.insertId,
        restaurant_id: restaurantId,
        user_id: req.user.user_id,
        full_name: req.user.full_name,
        rating: numericRating,
        comment: comment.trim(),
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('createReview error:', error);
    return res.status(500).json({ message: 'Gagal menyimpan ulasan.' });
  }
};
