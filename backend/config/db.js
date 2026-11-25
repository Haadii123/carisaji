import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { getSqlFallbackStore } from './sqlFallbackStore.js';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'carisaji',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 1500,
  charset: 'utf8mb4',
});

const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ECONNRESET',
  'PROTOCOL_CONNECTION_LOST',
]);

let lastMysqlRefusedAt = 0;
let loggedFallbackNotice = false;
const RETRY_INTERVAL_MS = 5000;

export function isMysqlConnectionError(error) {
  if (!error) return false;
  if (CONNECTION_ERROR_CODES.has(error.code)) return true;
  if (Array.isArray(error.errors)) {
    return error.errors.some((e) => CONNECTION_ERROR_CODES.has(e?.code));
  }
  const msg = String(error.message || '');
  return (
    msg.includes('ECONNREFUSED') ||
    msg.includes('connect ETIMEDOUT') ||
    msg.includes('ENOTFOUND')
  );
}

export function markMysqlUnavailable() {
  lastMysqlRefusedAt = Date.now();
  if (!loggedFallbackNotice) {
    loggedFallbackNotice = true;
    console.warn(
      'MySQL/MariaDB Laragon (127.0.0.1:3306) tidak aktif. Memakai data cadangan langsung dari database/carisaji.sql.'
    );
  }
}

export function markMysqlAvailable() {
  lastMysqlRefusedAt = 0;
  loggedFallbackNotice = false;
}

export async function runWithDb(mysqlFn, fallbackFn) {
  const inCooldown =
    lastMysqlRefusedAt > 0 &&
    Date.now() - lastMysqlRefusedAt < RETRY_INTERVAL_MS;

  if (inCooldown && typeof fallbackFn === 'function') {
    return fallbackFn(getSqlFallbackStore());
  }

  try {
    const result = await mysqlFn(pool);
    markMysqlAvailable();
    return result;
  } catch (error) {
    if (isMysqlConnectionError(error) && typeof fallbackFn === 'function') {
      markMysqlUnavailable();
      return fallbackFn(getSqlFallbackStore());
    }
    throw error;
  }
}

export default pool;
