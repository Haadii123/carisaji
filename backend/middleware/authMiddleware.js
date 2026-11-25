import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      message: 'Akses ditolak. Silakan masuk terlebih dahulu.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Sesi Anda telah berakhir atau token tidak valid. Silakan masuk ulang.',
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Akses terbatas. Fitur ini hanya tersedia untuk Pengelola Data (Admin).',
    });
  }
  next();
};
