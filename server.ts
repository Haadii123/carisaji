import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { runWithDb } from './backend/config/db.js';
import authRoutes from './backend/routes/authRoutes.js';
import restaurantRoutes from './backend/routes/restaurantRoutes.js';
import menuRoutes from './backend/routes/menuRoutes.js';
import reviewRoutes from './backend/routes/reviewRoutes.js';
import orderRoutes from './backend/routes/orderRoutes.js';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', async (_req, res) => {
    try {
      const info = await runWithDb(
        async (pool: { query: (sql: string) => Promise<unknown> }) => {
          await pool.query('SELECT 1');
          return { status: 'ok', mode: 'mysql' };
        },
        (store: { restaurants: unknown[] }) => ({
          status: 'ok',
          mode: 'sql-preview',
          restaurants: store.restaurants.length,
        })
      );
      res.json(info);
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message:
          err instanceof Error ? err.message : 'Gagal memeriksa status database.',
      });
    }
  });

  // Gunakan controller & rute MySQL/MariaDB yang sama dengan backend/
  app.use('/api/auth', authRoutes);
  app.use('/api/restaurants', restaurantRoutes);
  app.use('/api/menus', menuRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/orders', orderRoutes);

  // Vite dev middleware / static production dist
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`CARISAJI berjalan di http://localhost:${PORT}`);
    try {
      const status = await runWithDb(
        async (pool: {
          query: (sql: string) => Promise<[Array<{ total: number }>, unknown]>;
        }) => {
          const [rows] = await pool.query(
            'SELECT COUNT(*) AS total FROM restaurants'
          );
          return { mode: 'mysql', total: rows[0]?.total ?? 0 };
        },
        (store: { restaurants: unknown[] }) => ({
          mode: 'sql-preview',
          total: store.restaurants.length,
        })
      );

      if (status.mode === 'mysql') {
        console.log(
          `Terhubung ke database MySQL/MariaDB (${status.total} restoran ditemukan).`
        );
      } else {
        console.warn(
          `MySQL Laragon (127.0.0.1:3306) belum aktif; menjalankan mode pratinjau (${status.total} restoran dari database/carisaji.sql).`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        'Database MySQL/MariaDB Laragon belum siap (pastikan database/carisaji.sql sudah diimpor):',
        msg
      );
    }
  });
}

startServer();
