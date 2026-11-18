import type { MenuItem, Restaurant, RestaurantDetail, Review, User } from '../types';

const TOKEN_KEY = 'carisaji_token';
const USER_KEY = 'carisaji_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { message?: string }).message ||
        'Terjadi kesalahan saat menghubungi server.'
    );
  }
  return data as T;
}

export const api = {
  async login(email: string, password: string) {
    return request<{ message: string; token: string; user: User }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  },

  async register(full_name: string, email: string, password: string) {
    return request<{ message: string; token: string; user: User }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ full_name, email, password }),
      }
    );
  },

  async getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  async getRestaurants() {
    return request<{ restaurants: Restaurant[] }>('/api/restaurants');
  },

  async getRestaurantDetail(id: number) {
    return request<{ restaurant: RestaurantDetail }>(`/api/restaurants/${id}`);
  },

  async createRestaurant(payload: {
    name: string;
    address: string;
    operating_hours: string;
    latitude: number;
    longitude: number;
  }) {
    return request<{ message: string; restaurant: Restaurant }>(
      '/api/restaurants',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  async updateRestaurant(
    id: number,
    payload: {
      name: string;
      address: string;
      operating_hours: string;
      latitude: number;
      longitude: number;
    }
  ) {
    return request<{ message: string; restaurant: Restaurant }>(
      `/api/restaurants/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  },

  async deleteRestaurant(id: number) {
    return request<{ message: string }>(`/api/restaurants/${id}`, {
      method: 'DELETE',
    });
  },

  async getMenusByRestaurant(restaurantId: number) {
    return request<{ menus: MenuItem[] }>(
      `/api/menus/restaurant/${restaurantId}`
    );
  },

  async createMenu(payload: {
    restaurant_id: number;
    item_name: string;
    price: number;
    category: string;
  }) {
    return request<{ message: string; menu: MenuItem }>('/api/menus', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteMenu(menuId: number) {
    return request<{ message: string }>(`/api/menus/${menuId}`, {
      method: 'DELETE',
    });
  },

  async createReview(
    restaurantId: number,
    payload: { rating: number; comment: string }
  ) {
    return request<{ message: string; review: Review }>(
      `/api/restaurants/${restaurantId}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },
};
