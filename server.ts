import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createOptionalMysqlPool, localStore } from './server/store';
import { normalizeCoordinates } from './src/utils/geo';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET =
  process.env.JWT_SECRET || 'carisaji_pangkalpinang_rahasia_2026';

interface JwtPayload {
  user_id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthRequest extends Request {
  user?: JwtPayload;
}

function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

  if (!token) {
    res.status(401).json({
      message: 'Akses ditolak. Silakan masuk terlebih dahulu.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      message: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
    });
  }
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      message: 'Akses terbatas. Fitur ini hanya untuk Pengelola Data (Admin).',
    });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  const mysqlPool = await createOptionalMysqlPool();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', async (_req, res) => {
    res.json({
      status: 'ok',
      mode: mysqlPool ? 'mysql8' : 'carisaji-sql-seed',
    });
  });

  // --- AUTH ---
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { full_name, email, password } = req.body ?? {};
      if (!full_name?.trim() || !email?.trim() || !password) {
        res.status(400).json({
          message: 'Nama lengkap, email, dan kata sandi wajib diisi.',
        });
        return;
      }
      if (String(password).length < 6) {
        res.status(400).json({
          message: 'Kata sandi minimal harus terdiri dari 6 karakter.',
        });
        return;
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const hashedPassword = await bcrypt.hash(String(password), 10);

      if (mysqlPool) {
        const [existing] = (await mysqlPool.query(
          'SELECT user_id FROM users WHERE email = ? LIMIT 1',
          [normalizedEmail]
        )) as [Array<{ user_id: number }>, unknown];
        if (existing.length > 0) {
          res.status(409).json({
            message: 'Alamat email ini sudah terdaftar.',
          });
          return;
        }
        const [result] = (await mysqlPool.query(
          'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
          [String(full_name).trim(), normalizedEmail, hashedPassword, 'user']
        )) as [{ insertId: number }, unknown];
        const user: JwtPayload = {
          user_id: result.insertId,
          full_name: String(full_name).trim(),
          email: normalizedEmail,
          role: 'user',
        };
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
          message: 'Pendaftaran berhasil. Selamat datang di CARISAJI.',
          token,
          user,
        });
        return;
      }

      if (localStore.findUserByEmail(normalizedEmail)) {
        res.status(409).json({
          message: 'Alamat email ini sudah terdaftar.',
        });
        return;
      }
      const created = localStore.createUser(
        String(full_name).trim(),
        normalizedEmail,
        hashedPassword
      );
      const user: JwtPayload = {
        user_id: created.user_id,
        full_name: created.full_name,
        email: created.email,
        role: created.role,
      };
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({
        message: 'Pendaftaran berhasil. Selamat datang di CARISAJI.',
        token,
        user,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        message: 'Terjadi kesalahan saat memproses pendaftaran.',
      });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body ?? {};
      if (!email?.trim() || !password) {
        res.status(400).json({
          message: 'Email dan kata sandi wajib diisi.',
        });
        return;
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      if (mysqlPool) {
        const [rows] = (await mysqlPool.query(
          'SELECT user_id, full_name, email, password, role FROM users WHERE email = ? LIMIT 1',
          [normalizedEmail]
        )) as [
          Array<{
            user_id: number;
            full_name: string;
            email: string;
            password: string;
            role: 'admin' | 'user';
          }>,
          unknown
        ];
        if (rows.length === 0) {
          res.status(401).json({ message: 'Email atau kata sandi tidak sesuai.' });
          return;
        }
        const found = rows[0];
        const valid = await bcrypt.compare(String(password), found.password);
        if (!valid) {
          res.status(401).json({ message: 'Email atau kata sandi tidak sesuai.' });
          return;
        }
        const user: JwtPayload = {
          user_id: found.user_id,
          full_name: found.full_name,
          email: found.email,
          role: found.role,
        };
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Berhasil masuk.', token, user });
        return;
      }

      const found = localStore.findUserByEmail(normalizedEmail);
      if (!found) {
        res.status(401).json({ message: 'Email atau kata sandi tidak sesuai.' });
        return;
      }
      const valid = await bcrypt.compare(String(password), found.password);
      if (!valid) {
        res.status(401).json({ message: 'Email atau kata sandi tidak sesuai.' });
        return;
      }
      const user: JwtPayload = {
        user_id: found.user_id,
        full_name: found.full_name,
        email: found.email,
        role: found.role,
      };
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
      res.json({ message: 'Berhasil masuk.', token, user });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat masuk.' });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });

  // --- RESTAURANTS ---
  app.get('/api/restaurants', async (_req, res) => {
    try {
      if (mysqlPool) {
        const [rows] = (await mysqlPool.query(`
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
        `)) as [Array<Record<string, unknown>>, unknown];

        const restaurants = rows.map((row) => {
          const coords = normalizeCoordinates(
            Number(row.latitude),
            Number(row.longitude)
          );
          return {
            ...row,
            latitude: coords.latitude,
            longitude: coords.longitude,
            avg_rating: Number(row.avg_rating) || 0,
            review_count: Number(row.review_count) || 0,
            menu_count: Number(row.menu_count) || 0,
          };
        });
        res.json({ restaurants });
        return;
      }

      res.json({ restaurants: localStore.getAllRestaurants() });
    } catch (error) {
      console.error('getAllRestaurants error:', error);
      res.status(500).json({ message: 'Gagal memuat daftar restoran.' });
    }
  });

  app.get('/api/restaurants/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ message: 'ID restoran tidak valid.' });
        return;
      }

      if (mysqlPool) {
        const [rows] = (await mysqlPool.query(
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
          [id]
        )) as [Array<Record<string, unknown>>, unknown];
        if (rows.length === 0) {
          res.status(404).json({ message: 'Restoran tidak ditemukan.' });
          return;
        }
        const [menus] = (await mysqlPool.query(
          'SELECT menu_id, restaurant_id, item_name, price, category FROM menus WHERE restaurant_id = ? ORDER BY category ASC, menu_id ASC',
          [id]
        )) as [Array<Record<string, unknown>>, unknown];
        const [reviews] = (await mysqlPool.query(
          `
          SELECT rv.review_id, rv.restaurant_id, rv.user_id, u.full_name, rv.rating, rv.comment, rv.created_at
          FROM reviews rv
          INNER JOIN users u ON rv.user_id = u.user_id
          WHERE rv.restaurant_id = ?
          ORDER BY rv.created_at DESC, rv.review_id DESC
          `,
          [id]
        )) as [Array<Record<string, unknown>>, unknown];

        const coords = normalizeCoordinates(
          Number(rows[0].latitude),
          Number(rows[0].longitude)
        );
        res.json({
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
        return;
      }

      const restaurant = localStore.getRestaurantById(id);
      if (!restaurant) {
        res.status(404).json({ message: 'Restoran tidak ditemukan.' });
        return;
      }
      res.json({ restaurant });
    } catch (error) {
      console.error('getRestaurantById error:', error);
      res.status(500).json({ message: 'Gagal memuat detail restoran.' });
    }
  });

  app.post(
    '/api/restaurants',
    authenticateToken,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const { name, address, operating_hours, latitude, longitude } =
          req.body ?? {};
        const lat = Number(latitude);
        const lng = Number(longitude);

        if (!name?.trim() || !address?.trim()) {
          res.status(400).json({
            message: 'Nama restoran dan alamat wajib diisi.',
          });
          return;
        }

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180
        ) {
          res.status(400).json({
            message: 'Koordinat Latitude dan Longitude tidak valid.',
          });
          return;
        }

        const cleanHours = String(operating_hours || '').trim() || '10:00 - 22:00';

        if (mysqlPool) {
          const [result] = (await mysqlPool.query(
            `INSERT INTO restaurants (name, address, operating_hours, location)
             VALUES (?, ?, ?, ST_GeomFromText(?, 4326))`,
            [
              String(name).trim(),
              String(address).trim(),
              cleanHours,
              `POINT(${lat} ${lng})`,
            ]
          )) as [{ insertId: number }, unknown];
          res.status(201).json({
            message: 'Restoran baru berhasil ditambahkan.',
            restaurant: {
              restaurant_id: result.insertId,
              name: String(name).trim(),
              address: String(address).trim(),
              operating_hours: cleanHours,
              latitude: lat,
              longitude: lng,
              avg_rating: 0,
              review_count: 0,
              menu_count: 0,
            },
          });
          return;
        }

        const restaurant = localStore.createRestaurant({
          name: String(name).trim(),
          address: String(address).trim(),
          operating_hours: cleanHours,
          latitude: lat,
          longitude: lng,
        });
        res.status(201).json({
          message: 'Restoran baru berhasil ditambahkan.',
          restaurant,
        });
      } catch (error) {
        console.error('createRestaurant error:', error);
        res.status(500).json({ message: 'Gagal menambahkan restoran.' });
      }
    }
  );

  app.put(
    '/api/restaurants/:id',
    authenticateToken,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const id = Number(req.params.id);
        const { name, address, operating_hours, latitude, longitude } =
          req.body ?? {};
        const lat = Number(latitude);
        const lng = Number(longitude);

        if (!Number.isInteger(id) || id <= 0) {
          res.status(400).json({ message: 'ID restoran tidak valid.' });
          return;
        }
        if (!name?.trim() || !address?.trim()) {
          res.status(400).json({
            message: 'Nama restoran dan alamat wajib diisi.',
          });
          return;
        }
        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180
        ) {
          res.status(400).json({
            message: 'Koordinat Latitude dan Longitude tidak valid.',
          });
          return;
        }

        const cleanHours = String(operating_hours || '').trim() || '10:00 - 22:00';

        if (mysqlPool) {
          const [result] = (await mysqlPool.query(
            `UPDATE restaurants
             SET name = ?, address = ?, operating_hours = ?, location = ST_GeomFromText(?, 4326)
             WHERE restaurant_id = ?`,
            [
              String(name).trim(),
              String(address).trim(),
              cleanHours,
              `POINT(${lat} ${lng})`,
              id,
            ]
          )) as [{ affectedRows: number }, unknown];
          if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Restoran tidak ditemukan.' });
            return;
          }
          res.json({
            message: 'Data restoran berhasil diperbarui.',
            restaurant: {
              restaurant_id: id,
              name: String(name).trim(),
              address: String(address).trim(),
              operating_hours: cleanHours,
              latitude: lat,
              longitude: lng,
            },
          });
          return;
        }

        const updated = localStore.updateRestaurant(id, {
          name: String(name).trim(),
          address: String(address).trim(),
          operating_hours: cleanHours,
          latitude: lat,
          longitude: lng,
        });
        if (!updated) {
          res.status(404).json({ message: 'Restoran tidak ditemukan.' });
          return;
        }
        res.json({
          message: 'Data restoran berhasil diperbarui.',
          restaurant: updated,
        });
      } catch (error) {
        console.error('updateRestaurant error:', error);
        res.status(500).json({ message: 'Gagal memperbarui restoran.' });
      }
    }
  );

  app.delete(
    '/api/restaurants/:id',
    authenticateToken,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res.status(400).json({ message: 'ID restoran tidak valid.' });
          return;
        }

        if (mysqlPool) {
          const [result] = (await mysqlPool.query(
            'DELETE FROM restaurants WHERE restaurant_id = ?',
            [id]
          )) as [{ affectedRows: number }, unknown];
          if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Restoran tidak ditemukan.' });
            return;
          }
          res.json({ message: 'Restoran berhasil dihapus.' });
          return;
        }

        const deleted = localStore.deleteRestaurant(id);
        if (!deleted) {
          res.status(404).json({ message: 'Restoran tidak ditemukan.' });
          return;
        }
        res.json({ message: 'Restoran berhasil dihapus.' });
      } catch (error) {
        console.error('deleteRestaurant error:', error);
        res.status(500).json({ message: 'Gagal menghapus restoran.' });
      }
    }
  );

  // --- MENUS ---
  app.get('/api/menus/restaurant/:restaurantId', async (req, res) => {
    try {
      const restaurantId = Number(req.params.restaurantId);
      if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
        res.status(400).json({ message: 'ID restoran tidak valid.' });
        return;
      }

      if (mysqlPool) {
        const [menus] = (await mysqlPool.query(
          'SELECT menu_id, restaurant_id, item_name, price, category FROM menus WHERE restaurant_id = ? ORDER BY category ASC, menu_id ASC',
          [restaurantId]
        )) as [Array<Record<string, unknown>>, unknown];
        res.json({
          menus: menus.map((m) => ({ ...m, price: Number(m.price) })),
        });
        return;
      }

      res.json({ menus: localStore.getMenusByRestaurant(restaurantId) });
    } catch (error) {
      console.error('getMenus error:', error);
      res.status(500).json({ message: 'Gagal memuat menu restoran.' });
    }
  });

  app.post(
    '/api/menus',
    authenticateToken,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const { restaurant_id, item_name, price, category } = req.body ?? {};
        const restaurantId = Number(restaurant_id);
        const numericPrice = Number(price);

        if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
          res.status(400).json({ message: 'Pilih restoran yang valid.' });
          return;
        }
        if (!item_name?.trim()) {
          res.status(400).json({ message: 'Nama menu wajib diisi.' });
          return;
        }
        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
          res.status(400).json({ message: 'Harga menu harus lebih dari 0.' });
          return;
        }

        const cleanCategory = String(category || '').trim() || 'Paket Kombo';

        if (mysqlPool) {
          const [result] = (await mysqlPool.query(
            'INSERT INTO menus (restaurant_id, item_name, price, category) VALUES (?, ?, ?, ?)',
            [restaurantId, String(item_name).trim(), numericPrice, cleanCategory]
          )) as [{ insertId: number }, unknown];
          res.status(201).json({
            message: 'Item menu berhasil ditambahkan.',
            menu: {
              menu_id: result.insertId,
              restaurant_id: restaurantId,
              item_name: String(item_name).trim(),
              price: numericPrice,
              category: cleanCategory,
            },
          });
          return;
        }

        const menu = localStore.createMenu({
          restaurant_id: restaurantId,
          item_name: String(item_name).trim(),
          price: numericPrice,
          category: cleanCategory,
        });
        if (!menu) {
          res.status(404).json({ message: 'Restoran tidak ditemukan.' });
          return;
        }
        res.status(201).json({
          message: 'Item menu berhasil ditambahkan.',
          menu,
        });
      } catch (error) {
        console.error('createMenu error:', error);
        res.status(500).json({ message: 'Gagal menambahkan item menu.' });
      }
    }
  );

  app.delete(
    '/api/menus/:id',
    authenticateToken,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res.status(400).json({ message: 'ID menu tidak valid.' });
          return;
        }

        if (mysqlPool) {
          const [result] = (await mysqlPool.query(
            'DELETE FROM menus WHERE menu_id = ?',
            [id]
          )) as [{ affectedRows: number }, unknown];
          if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Item menu tidak ditemukan.' });
            return;
          }
          res.json({ message: 'Item menu berhasil dihapus.' });
          return;
        }

        const deleted = localStore.deleteMenu(id);
        if (!deleted) {
          res.status(404).json({ message: 'Item menu tidak ditemukan.' });
          return;
        }
        res.json({ message: 'Item menu berhasil dihapus.' });
      } catch (error) {
        console.error('deleteMenu error:', error);
        res.status(500).json({ message: 'Gagal menghapus item menu.' });
      }
    }
  );

  // --- REVIEWS ---
  const handleCreateReview = async (req: AuthRequest, res: Response) => {
    try {
      const restaurantId = Number(req.params.restaurantId);
      const { rating, comment } = req.body ?? {};
      const numericRating = Number(rating);

      if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
        res.status(400).json({ message: 'ID restoran tidak valid.' });
        return;
      }
      if (
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        res.status(400).json({
          message: 'Rating harus berupa angka 1 sampai 5 bintang.',
        });
        return;
      }
      if (!comment?.trim()) {
        res.status(400).json({
          message: 'Komentar ulasan tidak boleh kosong.',
        });
        return;
      }

      if (mysqlPool) {
        const [result] = (await mysqlPool.query(
          'INSERT INTO reviews (restaurant_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
          [
            restaurantId,
            req.user!.user_id,
            numericRating,
            String(comment).trim(),
          ]
        )) as [{ insertId: number }, unknown];
        res.status(201).json({
          message: 'Terima kasih! Ulasan Anda berhasil disimpan.',
          review: {
            review_id: result.insertId,
            restaurant_id: restaurantId,
            user_id: req.user!.user_id,
            full_name: req.user!.full_name,
            rating: numericRating,
            comment: String(comment).trim(),
            created_at: new Date().toISOString(),
          },
        });
        return;
      }

      const review = localStore.createReview({
        restaurant_id: restaurantId,
        user_id: req.user!.user_id,
        full_name: req.user!.full_name,
        rating: numericRating,
        comment: String(comment).trim(),
      });
      if (!review) {
        res.status(404).json({ message: 'Restoran tidak ditemukan.' });
        return;
      }
      res.status(201).json({
        message: 'Terima kasih! Ulasan Anda berhasil disimpan.',
        review,
      });
    } catch (error) {
      console.error('createReview error:', error);
      res.status(500).json({ message: 'Gagal menyimpan ulasan.' });
    }
  };

  app.post(
    '/api/restaurants/:restaurantId/reviews',
    authenticateToken,
    handleCreateReview
  );
  app.post('/api/reviews/:restaurantId', authenticateToken, handleCreateReview);

  // --- VITE / STATIC SERVING ---
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server CARISAJI aktif di http://localhost:${PORT}`);
  });
}

startServer();
