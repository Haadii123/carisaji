import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { runWithDb } from '../config/db.js';
import { JWT_SECRET } from '../config/jwt.js';
import { nextAutoId } from '../config/sqlFallbackStore.js';

export const register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: 'Nama lengkap, email, dan kata sandi wajib diisi.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Kata sandi minimal harus terdiri dari 6 karakter.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const outcome = await runWithDb(
      async (pool) => {
        const [existing] = await pool.query(
          'SELECT user_id FROM users WHERE email = ? LIMIT 1',
          [normalizedEmail]
        );
        if (existing.length > 0) {
          return { conflict: true };
        }
        const [result] = await pool.query(
          'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
          [full_name.trim(), normalizedEmail, hashedPassword, 'user']
        );
        return {
          conflict: false,
          user: {
            user_id: result.insertId,
            full_name: full_name.trim(),
            email: normalizedEmail,
            role: 'user',
          },
        };
      },
      (store) => {
        const existing = store.users.find(
          (u) => String(u.email).toLowerCase() === normalizedEmail
        );
        if (existing) return { conflict: true };
        const userId = nextAutoId(store.users, 'user_id');
        const newRow = {
          user_id: userId,
          uid: `seed-user-${userId}`,
          full_name: full_name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: 'user',
          created_at: new Date().toISOString(),
        };
        store.users.push(newRow);
        return {
          conflict: false,
          user: {
            user_id: userId,
            full_name: newRow.full_name,
            email: newRow.email,
            role: 'user',
          },
        };
      }
    );

    if (outcome.conflict) {
      return res.status(409).json({
        message:
          'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk.',
      });
    }

    const token = jwt.sign(outcome.user, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'Pendaftaran berhasil. Selamat datang di CARISAJI.',
      token,
      user: outcome.user,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      message: 'Terjadi kesalahan pada server saat memproses pendaftaran.',
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: 'Email dan kata sandi wajib diisi.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const foundUser = await runWithDb(
      async (pool) => {
        const [rows] = await pool.query(
          'SELECT user_id, full_name, email, password, role FROM users WHERE email = ? LIMIT 1',
          [normalizedEmail]
        );
        return rows[0] || null;
      },
      (store) =>
        store.users.find(
          (u) => String(u.email).toLowerCase() === normalizedEmail
        ) || null
    );

    if (!foundUser) {
      return res.status(401).json({
        message: 'Email atau kata sandi tidak sesuai.',
      });
    }

    if (!foundUser.password) {
      return res.status(401).json({
        message: 'Akun ini belum memiliki kata sandi yang valid.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, foundUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Email atau kata sandi tidak sesuai.',
      });
    }

    const user = {
      user_id: foundUser.user_id,
      full_name: foundUser.full_name,
      email: foundUser.email,
      role: foundUser.role,
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: 'Berhasil masuk ke CARISAJI.',
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: 'Terjadi kesalahan pada server saat memproses login.',
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const profile = await runWithDb(
      async (pool) => {
        const [rows] = await pool.query(
          'SELECT user_id, full_name, email, role, created_at FROM users WHERE user_id = ? LIMIT 1',
          [req.user.user_id]
        );
        return rows[0] || null;
      },
      (store) => {
        const found = store.users.find(
          (u) => Number(u.user_id) === Number(req.user.user_id)
        );
        if (!found) return null;
        return {
          user_id: found.user_id,
          full_name: found.full_name,
          email: found.email,
          role: found.role,
          created_at: found.created_at,
        };
      }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    return res.json({ user: profile });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ message: 'Gagal memuat profil pengguna.' });
  }
};
