import { useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { AuthSession, Category, MenuItem, Order, RegisteredStore, Settings, StoreUser } from './types';
import Sidebar from './components/Sidebar';
import NotificationToast, { NotificationToastState } from './components/NotificationToast';
import POS from './views/POS';
import SettingsView from './views/SettingsView';
import MenuManager from './views/MenuManager';
import Reports from './views/Reports';
import CategoriesManager from './views/CategoriesManager';
import DashboardView from './views/DashboardView';
import AuthView from './views/AuthView';
import UsersManager from './views/UsersManager';
import SuperAdminView from './views/SuperAdminView';
import { PrinterManager } from './lib/printerManager';
import {
  createPosCategory,
  createPosMenuItem,
  createPosOrder,
  createStoreUser,
  deletePosCategory,
  deletePosMenuItem,
  deletePosOrder,
  deleteStoreUser,
  fetchBootstrap,
  fetchCurrentUser,
  fetchRegisteredStores,
  fetchStoreUsers,
  getStoredSession,
  logout,
  persistSession,
  resendAdminCredentials,
  resendStoreUserCredentials,
  savePosSettings,
  updatePosMenuItem,
  updatePosCategory,
  updateStoreUser
} from './lib/api';

const DEFAULT_SETTINGS: Settings = {
  restaurantName: 'Intelli Billing Software',
  currencySymbol: 'Rs.',
  cgstPercent: 2.5,
  sgstPercent: 2.5,
  taxInclusive: false,
  enableKot: true,
  printerConnectionType: 'bluetooth',
  paperWidth: '3inch',
  receiptHeader: 'Welcome to Intelli Billing!',
  receiptFooter: 'Thank you for visiting!',
  orderAfterBill: false
};

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeUsers, setStoreUsers] = useState<StoreUser[]>([]);
  const [registeredStores, setRegisteredStores] = useState<RegisteredStore[]>([]);
  const [totalStores, setTotalStores] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [printer] = useState(() => new PrinterManager());
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [notification, setNotification] = useState<NotificationToastState | null>(null);
  const isConnectingPrinterRef = useRef(false);

  const isSuperAdmin = session?.user.user_type === 'super_admin';
  const isAdmin = session?.user.user_type === 'admin';
  const nextInvoiceNumber = useMemo(() => {
    const maxInvoice = orders.reduce((max, order) => {
      const numericId = Number.parseInt(order.id, 10);
      if (Number.isNaN(numericId)) {
        return max;
      }
      return Math.max(max, numericId);
    }, 0);

    return String(maxInvoice + 1);
  }, [orders]);

  const notify = (message: string, tone: NotificationToastState['tone'] = 'info') => {
    setNotification({ message, tone });
  };

  useEffect(() => {
    printer.syncSettings(settings);
  }, [printer, settings]);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNotification(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuthenticatedUser = async () => {
      if (!session) {
        if (isMounted) {
          setIsLoading(false);
          setLoadError(null);
        }
        return;
      }

      try {
        setIsLoading(true);
        const currentUser = await fetchCurrentUser();
        if (!isMounted) return;

        const refreshedSession = { ...session, user: currentUser };
        setSession(refreshedSession);
        persistSession(refreshedSession);

        if (currentUser.user_type === 'super_admin') {
          const storesPayload = await fetchRegisteredStores();
          if (!isMounted) return;
          setRegisteredStores(storesPayload.stores);
          setTotalStores(storesPayload.totalStores);
          setActiveTab('super-admin');
          setLoadError(null);
          return;
        }

        const bootstrap = await fetchBootstrap();
        if (!isMounted) return;

        setSettings(bootstrap.settings);
        setMenuItems(bootstrap.menuItems);
        setOrders(bootstrap.orders);
        setCategories(bootstrap.categories);
        if (currentUser.user_type !== 'admin') {
          setActiveTab((prev) => (prev === 'settings' || prev === 'inventory' || prev === 'categories' || prev === 'users' ? 'pos' : prev));
        }
        setLoadError(null);
      } catch (error: any) {
        if (!isMounted) return;

        console.error('Failed to load authenticated data', error);
        logout();
        setSession(null);
        setLoadError(error?.message || 'Your session has expired. Please login again.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrapAuthenticatedUser();

    return () => {
      isMounted = false;
    };
  }, [session?.token]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(settings.printerConnectionType === 'usb' ? true : printer.isConnected());
    }, 1000);

    return () => clearInterval(interval);
  }, [printer, settings.printerConnectionType]);

  useEffect(() => {
    if (!session) {
      return;
    }

    if (activeTab === 'users' && isAdmin) {
      loadUsers().catch((error) => {
        console.error('Unable to load users', error);
        setLoadError(error?.message || 'Unable to load users right now.');
      });
    }

    if (activeTab === 'super-admin' && isSuperAdmin) {
      loadStores().catch((error) => {
        console.error('Unable to load stores', error);
        setLoadError(error?.message || 'Unable to load stores right now.');
      });
    }
  }, [activeTab, isAdmin, isSuperAdmin, session]);

  const loadUsers = async () => {
    const users = await fetchStoreUsers();
    setStoreUsers(users);
  };

  const loadStores = async () => {
    const response = await fetchRegisteredStores();
    setRegisteredStores(response.stores);
    setTotalStores(response.totalStores);
  };

  const handleAuthenticated = (nextSession: AuthSession) => {
    setSession(nextSession);
    setActiveTab(nextSession.user.user_type === 'super_admin' ? 'super-admin' : 'pos');
    setLoadError(null);
  };

  const handleLogout = () => {
    logout();
    printer.disconnect();
    setIsConnected(false);
    setSession(null);
    setMenuItems([]);
    setOrders([]);
    setCategories([]);
    setStoreUsers([]);
    setRegisteredStores([]);
    setTotalStores(0);
    setSettings(DEFAULT_SETTINGS);
    setActiveTab('pos');
  };

  const handleConnect = async () => {
    if (isConnectingPrinterRef.current) {
      return;
    }

    if (settings.printerConnectionType === 'usb') {
      setIsConnected(true);
      return;
    }

    try {
      isConnectingPrinterRef.current = true;
      await printer.connect(settings);
      setIsConnected(true);
    } catch (err: any) {
      console.error('Connection failed', err);
      const message = err?.message || `Failed to connect to ${settings.printerConnectionType.toUpperCase()} printer.`;
      notify(message, 'error');
      throw new Error(message);
    } finally {
      isConnectingPrinterRef.current = false;
    }
  };

  const handleDisconnect = () => {
    printer.disconnect();
    setIsConnected(false);
  };

  const handleOrderComplete = async (order: Order) => {
    try {
      setIsSavingOrder(true);
      await createPosOrder(order);
      setOrders((prev) => [...prev, order]);
      setLoadError(null);
    } catch (error) {
      setLoadError('Unable to save the order right now.');
      throw error;
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDeleteSale = async (orderId: string) => {
    try {
      await deletePosOrder(orderId);
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      setLoadError(null);
    } catch (error) {
      setLoadError('Unable to delete the sale record right now.');
      throw error;
    }
  };

  const handleSaveSettings = async (nextSettings: Settings) => {
    try {
      setIsSavingSettings(true);
      const savedSettings = await savePosSettings(nextSettings);
      setSettings(savedSettings);
      printer.syncSettings(savedSettings);
      setLoadError(null);
    } catch (error) {
      setLoadError('Unable to save settings right now.');
      throw error;
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      const created = await createPosMenuItem(item);
      setMenuItems((prev) => [...prev, created]);
      setLoadError(null);
    } catch (error) {
      setLoadError('Unable to save the inventory item right now.');
      throw error;
    }
  };

  const handleUpdateMenuItem = async (id: string, item: Omit<MenuItem, 'id'>) => {
    try {
      const updated = await updatePosMenuItem(id, item);
      setMenuItems((prev) => prev.map((menuItem) => (menuItem.id === id ? updated : menuItem)));
      setLoadError(null);
    } catch (error) {
      setLoadError('Unable to update the inventory item right now.');
      throw error;
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      const created = await createPosCategory(name);
      setCategories((prev) => {
        if (prev.some((category) => category.name.toLowerCase() === created.name.toLowerCase())) {
          return prev;
        }
        return [...prev, created].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name));
      });
      setLoadError(null);
      return created;
    } catch (error) {
      setLoadError('Unable to save the category right now.');
      throw error;
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    const existingCategory = categories.find((category) => category.id === id);
    const updated = await updatePosCategory(id, name);
    setCategories((prev) => prev.map((category) => (category.id === id ? updated : category)));
    if (existingCategory) {
      setMenuItems((prev) => prev.map((item) => (item.category === existingCategory.name ? { ...item, category: updated.name } : item)));
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await deletePosCategory(id);
    setCategories((prev) => prev.filter((category) => category.id !== id));
  };

  const handleRemoveMenuItem = async (id: string) => {
    try {
      await deletePosMenuItem(id);
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
      setLoadError(null);
    } catch (error) {
      setLoadError('Unable to delete the inventory item right now.');
      throw error;
    }
  };

  const handleCreateUser = async (payload: any) => {
    const created = await createStoreUser(payload);
    setStoreUsers((prev) => [created, ...prev]);
  };

  const handleUpdateUser = async (id: number, payload: any) => {
    const updated = await updateStoreUser(id, payload);
    setStoreUsers((prev) => prev.map((user) => (user.user_id === id ? updated : user)));
  };

  const handleDeleteUser = async (id: number) => {
    await deleteStoreUser(id);
    setStoreUsers((prev) => prev.filter((user) => user.user_id !== id));
  };

  if (!session) {
    return <AuthView onAuthenticated={handleAuthenticated} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-3 text-slate-600 font-semibold">
        <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
        Loading data...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={session.user} settings={settings} onLogout={handleLogout} onNotify={notify} />
      <main className="flex-1 overflow-hidden relative">
        <div className="pointer-events-none absolute right-4 top-20 z-40 w-full max-w-sm">
          <NotificationToast notification={notification} />
        </div>

        {loadError && (
          <div className="absolute top-4 left-4 right-28 z-20 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-sm">
            {loadError}
          </div>
        )}

        {isSuperAdmin && activeTab === 'super-admin' && (
          <SuperAdminView
            stores={registeredStores}
            totalStores={totalStores}
            onLoadStores={loadStores}
            onResendAdminCredentials={resendAdminCredentials}
            onMenuClick={() => setIsSidebarOpen(true)}
            onNotify={notify}
          />
        )}

        {!isSuperAdmin && activeTab === 'pos' && (
          <POS
            menuItems={menuItems}
            nextInvoiceNumber={nextInvoiceNumber}
            settings={settings}
            printer={printer}
            isConnected={settings.printerConnectionType === 'usb' ? true : isConnected}
            isSavingOrder={isSavingOrder}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onOrderComplete={handleOrderComplete}
            onMenuClick={() => setIsSidebarOpen(true)}
            onNotify={notify}
          />
        )}
        {!isSuperAdmin && activeTab === 'dashboard' && (
          <DashboardView
            orders={orders}
            settings={settings}
            canDeleteSales={isAdmin}
            onDeleteSale={handleDeleteSale}
            onMenuClick={() => setIsSidebarOpen(true)}
            onNotify={notify}
          />
        )}
        {!isSuperAdmin && isAdmin && activeTab === 'inventory' && (
          <MenuManager
            menuItems={menuItems}
            categories={categories}
            onAddItem={handleAddMenuItem}
            onUpdateItem={handleUpdateMenuItem}
            onAddCategory={handleAddCategory}
            onRemoveItem={handleRemoveMenuItem}
            settings={settings}
            onMenuClick={() => setIsSidebarOpen(true)}
            onNotify={notify}
          />
        )}
        {!isSuperAdmin && isAdmin && activeTab === 'categories' && (
          <CategoriesManager
            categories={categories}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onMenuClick={() => setIsSidebarOpen(true)}
            onNotify={notify}
          />
        )}
        {!isSuperAdmin && isAdmin && activeTab === 'users' && (
          <UsersManager
            users={storeUsers}
            onLoadUsers={loadUsers}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onResendCredentials={resendStoreUserCredentials}
            onMenuClick={() => setIsSidebarOpen(true)}
            onNotify={notify}
          />
        )}
        {!isSuperAdmin && (activeTab === 'reports-sales' || activeTab === 'reports-customers' || activeTab === 'reports-calendar') && (
          <Reports
            orders={orders}
            settings={settings}
            mode={activeTab === 'reports-calendar' ? 'calendar' : activeTab === 'reports-customers' ? 'customers' : 'sales'}
            canDeleteSales={isAdmin}
            onDeleteSale={handleDeleteSale}
            onMenuClick={() => setIsSidebarOpen(true)}
            onNotify={notify}
          />
        )}
        {!isSuperAdmin && isAdmin && activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            setSettings={setSettings}
            onSave={handleSaveSettings}
            isSaving={isSavingSettings}
            onMenuClick={() => setIsSidebarOpen(true)}
            onNotify={notify}
          />
        )}
      </main>
    </div>
  );
}
