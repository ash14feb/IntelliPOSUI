export interface Settings {
  restaurantName: string;
  currencySymbol: string;
  cgstPercent: number;
  sgstPercent: number;
  taxInclusive: boolean;
  enableKot: boolean;
  printerConnectionType: 'bluetooth' | 'usb';
  paperWidth: '2inch' | '3inch';
  receiptHeader: string;
  receiptFooter: string;
  orderAfterBill: boolean;
}

export interface Category {
  id: string;
  name: string;
  sortOrder?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export interface CartItem extends MenuItem {
  qty: number;
  lineTotal?: number;
}

export type PaymentMode = 'CASH' | 'UPI' | 'CARD';

export interface Order {
  id: string;
  timestamp: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  total: number;
  paymentMode: PaymentMode;
  customerName?: string;
  customerPhone?: string;
}

export interface AppBootstrap {
  settings: Settings;
  menuItems: MenuItem[];
  orders: Order[];
  categories: Category[];
}

export interface AuthUser {
  user_id: number;
  tenant_id: number;
  username: string;
  email?: string;
  full_name: string;
  user_type: string;
  assigned_store: string;
  is_active?: number;
  created_at?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface RegistrationPayload {
  name: string;
  email: string;
  businessName: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface StoreUser {
  user_id: number;
  tenant_id: number;
  username: string;
  email: string;
  full_name: string;
  user_type: 'admin' | 'manager' | 'staff';
  assigned_store: string;
  is_active: number;
  created_at?: string;
}

export interface CreateStoreUserPayload {
  username: string;
  email: string;
  full_name: string;
  user_type: 'manager' | 'staff';
  assigned_store: string;
}

export interface UpdateStoreUserPayload {
  email?: string;
  full_name?: string;
  user_type?: 'manager' | 'staff';
  assigned_store?: string;
  is_active?: boolean;
}

export interface RegisteredStore {
  tenant_id: number;
  business_name: string;
  owner_name: string;
  owner_email: string;
  admin_username: string;
  admin_email: string;
  created_at: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}
