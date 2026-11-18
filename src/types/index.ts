export type UserRole = 'admin' | 'user';

export interface User {
  user_id: number;
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

export type ActivePage = 'peta' | 'daftar' | 'terdekat' | 'admin';
