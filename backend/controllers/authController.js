import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'carisaji_pangkalpinang_rahasia_2026';

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
    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
      [full_name.trim(), normalizedEmail, hashedPassword, 'user']
    );

    const user = {
      user_id: result.insertId,
      full_name: full_name.trim(),
      email: normalizedEmail,
      role: 'user',
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'Pendaftaran berhasil. Selamat datang di CARISAJI.',
      token,
      user,
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
    const [rows] = await pool.query(
      'SELECT user_id, full_name, email, password, role FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Email atau kata sandi tidak sesuai.',
      });
    }

    const foundUser = rows[0];
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
    const [rows] = await pool.query(
      'SELECT user_id, full_name, email, role, created_at FROM users WHERE user_id = ? LIMIT 1',
      [req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    return res.json({ user: rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ message: 'Gagal memuat profil pengguna.' });
  }
};
