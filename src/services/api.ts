import { Restaurant, RestaurantUser, Order, RestaurantFormData, Customer } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'admin_token';

export function saveAdminToken(token: string) { localStorage.setItem(TOKEN_KEY, token); }
export function getAdminToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
export function removeAdminToken() { localStorage.removeItem(TOKEN_KEY); }

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

// ─── Admin Auth ───────────────────────────────────────────────────────────────

export async function adminLogin(email: string, password: string) {
  return apiFetch<{ token: string; admin: { id: string; name: string; email: string; role: string } }>(
    '/api/admin/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );
}

export async function getAdminMe() {
  return apiFetch<{ admin: { id: string; name: string; email: string; role: string } }>('/api/admin/me');
}

// ─── Restaurants ──────────────────────────────────────────────────────────────

export async function fetchRestaurants() {
  return apiFetch<{ restaurants: Restaurant[] }>('/api/admin/restaurants');
}

export async function fetchRestaurant(id: string) {
  return apiFetch<{ restaurant: Restaurant }>(`/api/admin/restaurants/${id}`);
}

export async function createRestaurant(data: RestaurantFormData) {
  return apiFetch<{ restaurant: Restaurant }>('/api/admin/restaurants', {
    method: 'POST', body: JSON.stringify(data),
  });
}

export async function updateRestaurant(id: string, data: Partial<RestaurantFormData>) {
  return apiFetch<{ restaurant: Restaurant }>(`/api/admin/restaurants/${id}`, {
    method: 'PATCH', body: JSON.stringify(data),
  });
}

export async function deleteRestaurant(id: string) {
  return apiFetch<{ message: string }>(`/api/admin/restaurants/${id}`, { method: 'DELETE' });
}

// ─── Restaurant Users ─────────────────────────────────────────────────────────

export async function fetchRestaurantUsers(restaurantId: string) {
  return apiFetch<{ users: RestaurantUser[] }>(`/api/admin/restaurants/${restaurantId}/users`);
}

export async function createRestaurantUser(
  restaurantId: string,
  data: { name: string; loginId?: string; email?: string; password: string; isActive?: boolean }
) {
  return apiFetch<{ user: RestaurantUser }>(`/api/admin/restaurants/${restaurantId}/users`, {
    method: 'POST', body: JSON.stringify(data),
  });
}

export async function updateRestaurantUser(
  userId: string,
  data: { name?: string; loginId?: string; email?: string; isActive?: boolean }
) {
  return apiFetch<{ user: RestaurantUser }>(`/api/admin/users/${userId}`, {
    method: 'PATCH', body: JSON.stringify(data),
  });
}

export async function changeUserPassword(userId: string, password: string) {
  return apiFetch<{ message: string }>(`/api/admin/users/${userId}/password`, {
    method: 'PATCH', body: JSON.stringify({ password }),
  });
}

export async function deleteRestaurantUser(userId: string) {
  return apiFetch<{ message: string }>(`/api/admin/users/${userId}`, { method: 'DELETE' });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function fetchAllOrders(params?: {
  limit?: number;
  restaurantId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.restaurantId) q.set('restaurantId', params.restaurantId);
  if (params?.search) q.set('search', params.search);
  if (params?.fromDate) q.set('fromDate', params.fromDate);
  if (params?.toDate) q.set('toDate', params.toDate);
  return apiFetch<{ orders: Order[]; total: number }>(`/api/admin/orders?${q.toString()}`);
}

export async function fetchRestaurantOrders(restaurantId: string, limit = 100) {
  return apiFetch<{ orders: Order[]; total: number }>(
    `/api/admin/restaurants/${restaurantId}/orders?limit=${limit}`
  );
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function fetchRestaurantCustomers(restaurantId: string) {
  return apiFetch<{ customers: Customer[]; total: number; restaurantName: string }>(
    `/api/admin/restaurants/${restaurantId}/customers`
  );
}

export function getCustomerExportUrl(restaurantId: string): string {
  const token = getAdminToken();
  return `${BASE_URL}/api/admin/restaurants/${restaurantId}/customers/export.csv?token=${token}`;
}

// ─── Debug ────────────────────────────────────────────────────────────────────

export async function sendTestNotification(restaurantId: string, title?: string, body?: string) {
  return apiFetch<{ success: boolean; results: unknown[] }>('/api/debug/send-test-notification', {
    method: 'POST',
    body: JSON.stringify({ restaurantId, title, body }),
  });
}
