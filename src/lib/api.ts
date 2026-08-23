import {
  AppBootstrap,
  AuthSession,
  AuthUser,
  Category,
  CreateStoreUserPayload,
  LoginPayload,
  MenuItem,
  Order,
  RegisteredStore,
  RegistrationPayload,
  Settings,
  StoreUser,
  UpdateStoreUserPayload
} from '../types';

const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
const API_BASE_URL = (env?.VITE_API_BASE_URL || 'https://intelli-posapi.vercel.app').replace(/\/$/, '');
const AUTH_STORAGE_KEY = 'scannex-pos-auth';

let authToken: string | null = null;

function parseStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed?.user) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getStoredSession(): AuthSession | null {
  const session = parseStoredSession();
  authToken = session?.token ?? null;
  return session;
}

export function persistSession(session: AuthSession | null) {
  authToken = session?.token ?? null;

  if (typeof window === 'undefined') {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      persistSession(null);
    }
    throw new Error(payload?.message || 'Request failed');
  }

  return payload as T;
}

export async function registerTenant(payload: RegistrationPayload): Promise<string> {
  const response = await request<{ success: boolean; message: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      business_name: payload.businessName
    })
  });

  return response.message;
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const response = await request<{ success: boolean; message: string; token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const session = {
    token: response.token,
    user: response.user
  };

  persistSession(session);
  return session;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await request<{ success: boolean; user: AuthUser }>('/api/auth/me');
  return response.user;
}

export function logout() {
  persistSession(null);
}

export async function fetchBootstrap(): Promise<AppBootstrap> {
  const response = await request<{ success: boolean; data: AppBootstrap }>('/api/pos/bootstrap');
  return response.data;
}

export async function savePosSettings(settings: Settings): Promise<Settings> {
  const response = await request<{ success: boolean; data: Settings }>('/api/pos/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  });
  return response.data;
}

export async function createPosMenuItem(menuItem: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  const response = await request<{ success: boolean; data: MenuItem }>('/api/pos/menu-items', {
    method: 'POST',
    body: JSON.stringify(menuItem)
  });
  return response.data;
}

export async function updatePosMenuItem(id: string, menuItem: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  const response = await request<{ success: boolean; data: MenuItem }>(`/api/pos/menu-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(menuItem)
  });
  return response.data;
}

export async function createPosCategory(name: string): Promise<Category> {
  const response = await request<{ success: boolean; data: Category }>('/api/pos/categories', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
  return response.data;
}

export async function updatePosCategory(id: string, name: string): Promise<Category> {
  const response = await request<{ success: boolean; data: Category }>(`/api/pos/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name })
  });
  return response.data;
}

export async function deletePosCategory(id: string): Promise<void> {
  await request<{ success: boolean; message: string }>(`/api/pos/categories/${id}`, {
    method: 'DELETE'
  });
}

export async function deletePosMenuItem(id: string): Promise<void> {
  await request<{ success: boolean; message: string }>(`/api/pos/menu-items/${id}`, {
    method: 'DELETE'
  });
}

export async function createPosOrder(order: Order): Promise<void> {
  await request<{ success: boolean; message: string }>('/api/pos/orders', {
    method: 'POST',
    body: JSON.stringify(order)
  });
}

export async function deletePosOrder(orderId: string): Promise<void> {
  await request<{ success: boolean; message: string }>(`/api/pos/orders/${orderId}`, {
    method: 'DELETE'
  });
}

export async function fetchStoreUsers(): Promise<StoreUser[]> {
  const response = await request<{ success: boolean; users: StoreUser[] }>('/api/auth/users');
  return response.users;
}

export async function createStoreUser(payload: CreateStoreUserPayload): Promise<StoreUser> {
  const response = await request<{ success: boolean; user: StoreUser }>('/api/auth/create-user', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return response.user;
}

export async function updateStoreUser(id: number, payload: UpdateStoreUserPayload): Promise<StoreUser> {
  const response = await request<{ success: boolean; user: StoreUser }>(`/api/auth/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  return response.user;
}

export async function deleteStoreUser(id: number): Promise<void> {
  await request<{ success: boolean; message: string }>(`/api/auth/users/${id}`, {
    method: 'DELETE'
  });
}

export async function resendStoreUserCredentials(id: number): Promise<void> {
  await request<{ success: boolean; message: string }>(`/api/auth/users/${id}/resend-credentials`, {
    method: 'POST'
  });
}

export async function fetchRegisteredStores(): Promise<{ totalStores: number; stores: RegisteredStore[] }> {
  const response = await request<{ success: boolean; totalStores: number; stores: RegisteredStore[] }>('/api/auth/super-admin/stores');
  return { totalStores: response.totalStores, stores: response.stores };
}

export async function resendAdminCredentials(tenantId: number): Promise<void> {
  await request<{ success: boolean; message: string }>(`/api/auth/super-admin/stores/${tenantId}/resend-admin-credentials`, {
    method: 'POST'
  });
}
