export type UserRole = 'admin' | 'user';

export interface User {
  user_id: number;
  uid?: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface Restaurant {
  restaurant_id: number;
  name: string;
  address: string;
  operating_hours: string;
  latitude: number;
  longitude: number;
  base_prep_minutes?: number;
  active_queue_count?: number;
  avg_rating: number;
  review_count: number;
  menu_count?: number;
  created_at?: string;
}

export interface MenuItem {
  menu_id: number;
  restaurant_id: number;
  item_name: string;
  price: number;
  category: string;
}

export interface Review {
  review_id: number;
  restaurant_id: number;
  user_id: number;
  full_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface RestaurantDetail extends Restaurant {
  menus: MenuItem[];
  reviews: Review[];
}

export type OrderType = 'dine_in' | 'takeaway';

export type PaymentMethod =
  | 'qris'
  | 'va_bca'
  | 'va_bri'
  | 'va_mandiri'
  | 'va_bni';

export type PaymentStatus = 'menunggu_pembayaran' | 'lunas';

export type OrderStatus =
  | 'menunggu_pembayaran'
  | 'sedang_disiapkan'
  | 'siap_diambil'
  | 'selesai';

export interface CartItem {
  menu_id: number;
  item_name: string;
  price: number;
  quantity: number;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  menu_id: number | null;
  item_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  order_id: number;
  order_code: string;
  user_id: number;
  customer_name?: string;
  restaurant_id: number;
  restaurant_name: string;
  restaurant_address?: string;
  restaurant_latitude?: number;
  restaurant_longitude?: number;
  order_type: OrderType;
  pickup_time: string;
  customer_note: string | null;
  payment_method: PaymentMethod;
  va_number: string | null;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  total_amount: number;
  estimated_prep_minutes?: number;
  created_at: string;
  paid_at: string | null;
  items: OrderItem[];
}

export type BrandFilter =
  | 'Semua'
  | 'KFC'
  | "McDonald's"
  | 'Richeese Factory'
  | 'A&W'
  | 'Almaz Fried Chicken'
  | 'JChicken'
  | 'Karen Chicken'
  | 'Lainnya';

export type ActivePage = 'peta' | 'daftar' | 'terdekat' | 'pesanan' | 'admin';
