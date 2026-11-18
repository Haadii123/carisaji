import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { normalizeCoordinates } from '../src/utils/geo';

export interface StoredUser {
  user_id: number;
  full_name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface StoredRestaurant {
  restaurant_id: number;
  name: string;
  address: string;
  operating_hours: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface StoredMenu {
  menu_id: number;
  restaurant_id: number;
  item_name: string;
  price: number;
  category: string;
}

export interface StoredReview {
  review_id: number;
  restaurant_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

interface StoreData {
  users: StoredUser[];
  restaurants: StoredRestaurant[];
  menus: StoredMenu[];
  reviews: StoredReview[];
}

const STORE_FILE = '/tmp/carisaji-store.json';
const SQL_FILE = path.resolve(
  process.cwd(),
  'public/assets/aistudio/carisaji__3__fa24d661.sql'
);

function unescapeSqlString(raw: string): string {
  return raw
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function decodeWkbPointHex(hex: string): { latitude: number; longitude: number } {
  const buf = Buffer.from(hex, 'hex');
  // MySQL 8 SRID 4326 WKB: 4 bytes SRID + 1 byte endian + 4 bytes type + 8 bytes X + 8 bytes Y
  const x = buf.readDoubleLE(9);
  const y = buf.readDoubleLE(17);
  return normalizeCoordinates(x, y);
}

export function parseCarisajiSql(): StoreData {
  const sql = fs.readFileSync(SQL_FILE, 'utf8');

  const menus: StoredMenu[] = [];
  const menuSection = sql.match(
    /INSERT INTO `menus`[\s\S]*?VALUES\s*([\s\S]*?);/
  );
  if (menuSection) {
    const menuRe =
      /\((\d+),\s*(\d+),\s*'((?:[^'\\]|\\.)*)',\s*([\d.]+),\s*'((?:[^'\\]|\\.)*)'\)/g;
    let m: RegExpExecArray | null;
    while ((m = menuRe.exec(menuSection[1])) !== null) {
      menus.push({
        menu_id: Number(m[1]),
        restaurant_id: Number(m[2]),
        item_name: unescapeSqlString(m[3]),
        price: Number(m[4]),
        category: unescapeSqlString(m[5]),
      });
    }
  }

  const restaurants: StoredRestaurant[] = [];
  const restSection = sql.match(
    /INSERT INTO `restaurants`[\s\S]*?VALUES\s*([\s\S]*?);/
  );
  if (restSection) {
    const restRe =
      /\((\d+),\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*0x([0-9a-fA-F]+),\s*'([^']*)'\)/g;
    let m: RegExpExecArray | null;
    while ((m = restRe.exec(restSection[1])) !== null) {
      const coords = decodeWkbPointHex(m[5]);
      restaurants.push({
        restaurant_id: Number(m[1]),
        name: unescapeSqlString(m[2]),
        address: unescapeSqlString(m[3]),
        operating_hours: unescapeSqlString(m[4]),
        latitude: coords.latitude,
        longitude: coords.longitude,
        created_at: m[6],
      });
    }
  }

  const reviews: StoredReview[] = [];
  const revSection = sql.match(
    /INSERT INTO `reviews`[\s\S]*?VALUES\s*([\s\S]*?);/
  );
  if (revSection) {
    const revRe =
      /\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*'((?:[^'\\]|\\.)*)',\s*'([^']*)'\)/g;
    let m: RegExpExecArray | null;
    while ((m = revRe.exec(revSection[1])) !== null) {
      reviews.push({
        review_id: Number(m[1]),
        restaurant_id: Number(m[2]),
        user_id: Number(m[3]),
        rating: Number(m[4]),
        comment: unescapeSqlString(m[5]),
        created_at: m[6],
      });
    }
  }

  const users: StoredUser[] = [];
  const userSection = sql.match(
    /INSERT INTO `users`[\s\S]*?VALUES\s*([\s\S]*?);/
  );
  const demoAdminHash = bcrypt.hashSync('admin123', 10);
  const demoUserHash = bcrypt.hashSync('user123', 10);
  if (userSection) {
    const userRe =
      /\((\d+),\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'(admin|user)',\s*'([^']*)'\)/g;
    let m: RegExpExecArray | null;
    while ((m = userRe.exec(userSection[1])) !== null) {
      const role = m[5] as 'admin' | 'user';
      users.push({
        user_id: Number(m[1]),
        full_name: unescapeSqlString(m[2]),
        email: unescapeSqlString(m[3]).toLowerCase(),
        password: role === 'admin' ? demoAdminHash : demoUserHash,
        role,
        created_at: m[6],
      });
    }
  }

  return { users, restaurants, menus, reviews };
}

class LocalJsonStore {
  private data: StoreData;

  constructor() {
    if (fs.existsSync(STORE_FILE)) {
      try {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw) as StoreData;
        if (parsed.restaurants?.length > 0 && parsed.users?.length > 0) {
          this.data = parsed;
          return;
        }
      } catch {
        // Re-seed from SQL if corrupted
      }
    }
    this.data = parseCarisajiSql();
    this.save();
  }

  private save() {
    fs.writeFileSync(STORE_FILE, JSON.stringify(this.data, null, 2), 'utf8');
  }

  findUserByEmail(email: string) {
    return this.data.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  findUserById(userId: number) {
    return this.data.users.find((u) => u.user_id === userId);
  }

  createUser(fullName: string, email: string, hashedPassword: string) {
    const nextId =
      this.data.users.reduce((max, u) => Math.max(max, u.user_id), 0) + 1;
    const newUser: StoredUser = {
      user_id: nextId,
      full_name: fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  getAllRestaurants() {
    return this.data.restaurants.map((r) => {
      const restReviews = this.data.reviews.filter(
        (rv) => rv.restaurant_id === r.restaurant_id
      );
      const restMenus = this.data.menus.filter(
        (m) => m.restaurant_id === r.restaurant_id
      );
      const avg =
        restReviews.length > 0
          ? Number(
              (
                restReviews.reduce((sum, rv) => sum + rv.rating, 0) /
                restReviews.length
              ).toFixed(1)
            )
          : 0;
      return {
        ...r,
        avg_rating: avg,
        review_count: restReviews.length,
        menu_count: restMenus.length,
      };
    });
  }

  getRestaurantById(restaurantId: number) {
    const r = this.data.restaurants.find(
      (item) => item.restaurant_id === restaurantId
    );
    if (!r) return null;

    const menus = this.data.menus
      .filter((m) => m.restaurant_id === restaurantId)
      .sort((a, b) =>
        a.category.localeCompare(b.category) || a.menu_id - b.menu_id
      );

    const reviews = this.data.reviews
      .filter((rv) => rv.restaurant_id === restaurantId)
      .map((rv) => {
        const author = this.findUserById(rv.user_id);
        return {
          ...rv,
          full_name: author?.full_name || 'Pengguna CARISAJI',
        };
      })
      .sort((a, b) => b.review_id - a.review_id);

    const avg =
      reviews.length > 0
        ? Number(
            (
              reviews.reduce((sum, rv) => sum + rv.rating, 0) / reviews.length
            ).toFixed(1)
          )
        : 0;

    return {
      ...r,
      avg_rating: avg,
      review_count: reviews.length,
      menus,
      reviews,
    };
  }

  createRestaurant(payload: {
    name: string;
    address: string;
    operating_hours: string;
    latitude: number;
    longitude: number;
  }) {
    const nextId =
      this.data.restaurants.reduce(
        (max, r) => Math.max(max, r.restaurant_id),
        0
      ) + 1;
    const item: StoredRestaurant = {
      restaurant_id: nextId,
      name: payload.name,
      address: payload.address,
      operating_hours: payload.operating_hours,
      latitude: payload.latitude,
      longitude: payload.longitude,
      created_at: new Date().toISOString(),
    };
    this.data.restaurants.push(item);
    this.save();
    return {
      ...item,
      avg_rating: 0,
      review_count: 0,
      menu_count: 0,
    };
  }

  updateRestaurant(
    restaurantId: number,
    payload: {
      name: string;
      address: string;
      operating_hours: string;
      latitude: number;
      longitude: number;
    }
  ) {
    const idx = this.data.restaurants.findIndex(
      (r) => r.restaurant_id === restaurantId
    );
    if (idx === -1) return null;
    this.data.restaurants[idx] = {
      ...this.data.restaurants[idx],
      name: payload.name,
      address: payload.address,
      operating_hours: payload.operating_hours,
      latitude: payload.latitude,
      longitude: payload.longitude,
    };
    this.save();
    return this.data.restaurants[idx];
  }

  deleteRestaurant(restaurantId: number) {
    const idx = this.data.restaurants.findIndex(
      (r) => r.restaurant_id === restaurantId
    );
    if (idx === -1) return false;
    this.data.restaurants.splice(idx, 1);
    this.data.menus = this.data.menus.filter(
      (m) => m.restaurant_id !== restaurantId
    );
    this.data.reviews = this.data.reviews.filter(
      (rv) => rv.restaurant_id !== restaurantId
    );
    this.save();
    return true;
  }

  getMenusByRestaurant(restaurantId: number) {
    return this.data.menus
      .filter((m) => m.restaurant_id === restaurantId)
      .sort((a, b) =>
        a.category.localeCompare(b.category) || a.menu_id - b.menu_id
      );
  }

  createMenu(payload: {
    restaurant_id: number;
    item_name: string;
    price: number;
    category: string;
  }) {
    const exists = this.data.restaurants.some(
      (r) => r.restaurant_id === payload.restaurant_id
    );
    if (!exists) return null;
    const nextId =
      this.data.menus.reduce((max, m) => Math.max(max, m.menu_id), 0) + 1;
    const item: StoredMenu = {
      menu_id: nextId,
      restaurant_id: payload.restaurant_id,
      item_name: payload.item_name,
      price: payload.price,
      category: payload.category,
    };
    this.data.menus.push(item);
    this.save();
    return item;
  }

  deleteMenu(menuId: number) {
    const idx = this.data.menus.findIndex((m) => m.menu_id === menuId);
    if (idx === -1) return false;
    this.data.menus.splice(idx, 1);
    this.save();
    return true;
  }

  createReview(payload: {
    restaurant_id: number;
    user_id: number;
    full_name: string;
    rating: number;
    comment: string;
  }) {
    const exists = this.data.restaurants.some(
      (r) => r.restaurant_id === payload.restaurant_id
    );
    if (!exists) return null;
    const nextId =
      this.data.reviews.reduce((max, rv) => Math.max(max, rv.review_id), 0) + 1;
    const item: StoredReview = {
      review_id: nextId,
      restaurant_id: payload.restaurant_id,
      user_id: payload.user_id,
      rating: payload.rating,
      comment: payload.comment,
      created_at: new Date().toISOString(),
    };
    this.data.reviews.push(item);
    this.save();
    return {
      ...item,
      full_name: payload.full_name,
    };
  }
}

export const localStore = new LocalJsonStore();

export async function createOptionalMysqlPool(): Promise<mysql.Pool | null> {
  if (!process.env.DB_HOST || !process.env.DB_USER) {
    return null;
  }
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'carisaji',
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 2000,
    });
    await pool.query('SELECT 1');
    console.log('Terhubung ke database MySQL 8 CARISAJI.');
    return pool;
  } catch {
    console.log(
      'MySQL lokal tidak terdeteksi, menggunakan penyimpanan data carisaji.sql bawaan.'
    );
    return null;
  }
}
