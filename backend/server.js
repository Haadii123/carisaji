import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { runWithDb } from './config/db.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
  })
);
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const info = await runWithDb(
      async (pool) => {
        await pool.query('SELECT 1');
        return { status: 'ok', database: 'mysql-mariadb-connected' };
      },
      (store) => ({
        status: 'ok',
        database: 'sql-file-preview',
        restaurants: store.restaurants.length,
      })
    );
    res.json(info);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server CARISAJI berjalan di http://127.0.0.1:${PORT}`);
  try {
    const status = await runWithDb(
      async (pool) => {
        const [rows] = await pool.query(
          'SELECT COUNT(*) AS total FROM restaurants'
        );
        return { mode: 'mysql', total: rows[0]?.total ?? 0 };
      },
      (store) => ({ mode: 'sql-preview', total: store.restaurants.length })
    );

    if (status.mode === 'mysql') {
      console.log(
        `Terhubung ke database MySQL/MariaDB (${status.total} restoran ditemukan).`
      );
    } else {
      console.warn(
        `Mode pratinjau aktif (${status.total} restoran dimuat dari database/carisaji.sql). Aktifkan MySQL Laragon di 127.0.0.1:3306 untuk koneksi database langsung.`
      );
    }
  } catch (err) {
    console.warn(
      'Database MySQL/MariaDB Laragon belum siap (pastikan database/carisaji.sql sudah diimpor):',
      err.message
    );
  }
});
