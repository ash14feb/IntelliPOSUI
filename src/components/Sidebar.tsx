import { useState } from 'react';
import { Award, Calendar, ChevronDown, FileText, FolderTree, Key, LayoutDashboard, LoaderCircle, LogOut, Package, Package2, PieChart, Settings as SettingsIcon, ShoppingCart, TrendingUp, Users, X } from 'lucide-react';
import { AuthUser, Settings } from '../types';
import { changePassword } from '../lib/api';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: AuthUser;
  settings: Settings;
  onLogout: () => void;
  onNotify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, user, settings, onLogout, onNotify }: SidebarProps) {
  const [isReportsOpen, setIsReportsOpen] = useState(activeTab.startsWith('reports'));
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const isAdmin = user.user_type === 'admin';
  const isSuperAdmin = user.user_type === 'super_admin';

  const navItems = isSuperAdmin
    ? [{ id: 'super-admin', label: 'Stores', icon: LayoutDashboard }]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'pos', label: 'POS', icon: ShoppingCart },
        ...(isAdmin ? [{ id: 'inventory', label: 'Inventory', icon: Package2 }] : []),
        ...(isAdmin ? [{ id: 'categories', label: 'Categories', icon: FolderTree }] : []),
        ...(isAdmin ? [{ id: 'users', label: 'Users', icon: Users }] : []),
        ...(isAdmin ? [{ id: 'settings', label: 'Settings', icon: SettingsIcon }] : [])
      ];

  const reportItems = [
    { id: 'reports-sales', label: 'Sales Report', icon: TrendingUp },
    { id: 'reports-customers', label: 'Customer Report', icon: Users },
    { id: 'reports-calendar', label: 'Sales Calendar', icon: Calendar },
    { id: 'reports-items', label: 'Sales by Item', icon: Package },
    { id: 'reports-payment', label: 'Sales by Payment', icon: PieChart },
    { id: 'reports-topCustomers', label: 'Top Customers', icon: Award }
  ];

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      onNotify('Please fill in all fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      onNotify('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      onNotify('New password must be at least 6 characters', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      onNotify('Password changed successfully', 'success');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      onNotify(err?.message || 'Failed to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 text-slate-300 flex flex-col h-full transition-transform duration-300 shadow-2xl sidebar-gradient
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="p-4 lg:p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white tracking-tight leading-tight">{settings.restaurantName}</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">Powered by Intelli Billing</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive ? 'bg-white/20 text-white shadow-md backdrop-blur-sm' : 'hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                <span className={`ml-3 font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>{item.label}</span>
              </button>
            );
          })}

          {!isSuperAdmin && (
            <div className="pt-2">
              <button
                onClick={() => setIsReportsOpen(prev => !prev)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  activeTab.startsWith('reports') ? 'bg-white/20 text-white shadow-md backdrop-blur-sm' : 'hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <FileText className={`w-5 h-5 shrink-0 ${activeTab.startsWith('reports') ? 'text-white' : 'text-slate-300'}`} />
                  <span className={`ml-3 font-medium ${activeTab.startsWith('reports') ? 'text-white' : 'text-slate-300'}`}>Reports</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isReportsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isReportsOpen && (
                <div className="mt-2 ml-4 space-y-1 border-l border-white/20 pl-3">
                  {reportItems.map(item => {
                    const ReportIcon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                          activeTab === item.id ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <ReportIcon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">{user.full_name}</span>
              <span className="text-xs text-slate-500 truncate">{user.username}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowChangePassword(true)}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Change Password"
              >
                <Key className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <Key className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Change Password</h3>
            <p className="mt-2 text-sm text-slate-600">Enter your current password and set a new one.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isChangingPassword ? <><LoaderCircle className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
