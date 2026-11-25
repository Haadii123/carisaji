import type {
  MenuItem,
  Order,
  OrderStatus,
  OrderType,
  PaymentMethod,
  Restaurant,
  RestaurantDetail,
  Review,
  User,
} from '../types';

// Simpan token autentikasi di memori aplikasi
let inMemoryToken: string | null = null;

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = inMemoryToken;
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

  async createOrder(payload: {
    restaurant_id: number;
    order_type: OrderType;
    pickup_time: string;
    customer_note?: string;
    payment_method: PaymentMethod;
    items: Array<{ menu_id: number; quantity: number }>;
  }) {
    return request<{ message: string; order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMyOrders() {
    return request<{ orders: Order[] }>('/api/orders/my');
  },

  async confirmOrderPayment(orderId: number) {
    return request<{ message: string; order: Order }>(
      `/api/orders/${orderId}/pay`,
      {
        method: 'POST',
      }
    );
  },

  async getAllOrders() {
    return request<{ orders: Order[] }>('/api/orders');
  },

  async updateOrderStatus(orderId: number, orderStatus: OrderStatus) {
    return request<{ message: string; order?: Order }>(
      `/api/orders/${orderId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ order_status: orderStatus }),
      }
    );
  },
};
