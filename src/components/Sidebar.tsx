import { useState } from 'react';
import { ChevronDown, FileText, FolderTree, LayoutGrid, Package2, Settings as SettingsIcon, X } from 'lucide-react';
import { AuthUser } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: AuthUser;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, user }: SidebarProps) {
  const [isReportsOpen, setIsReportsOpen] = useState(activeTab.startsWith('reports'));
  const isAdmin = user.user_type === 'admin';
  const isSuperAdmin = user.user_type === 'super_admin';

  const navItems = isSuperAdmin
    ? [{ id: 'super-admin', label: 'Stores', icon: LayoutGrid }]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
        { id: 'pos', label: 'POS', icon: LayoutGrid },
        ...(isAdmin ? [{ id: 'inventory', label: 'Inventory', icon: Package2 }] : []),
        ...(isAdmin ? [{ id: 'categories', label: 'Categories', icon: FolderTree }] : []),
        ...(isAdmin ? [{ id: 'users', label: 'Users', icon: FolderTree }] : []),
        ...(isAdmin ? [{ id: 'settings', label: 'Settings', icon: SettingsIcon }] : [])
      ];

  const reportItems = [
    { id: 'reports-sales', label: 'Sales Report' },
    { id: 'reports-customers', label: 'Customer Report' },
    { id: 'reports-calendar', label: 'Sales Calendar' }
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col h-full transition-transform duration-300 shadow-2xl
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="p-4 lg:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg shadow-indigo-500/30">S</div>
            <div className="ml-3">
              <span className="font-black text-white text-lg tracking-tight block leading-tight">SCANEX</span>
              <span className="text-indigo-400 font-bold text-xs tracking-widest block leading-tight">ULTRA POS</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white">
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
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className={`ml-3 font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>{item.label}</span>
              </button>
            );
          })}

          {!isSuperAdmin && (
            <div className="pt-2">
              <button
                onClick={() => setIsReportsOpen(prev => !prev)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                  activeTab.startsWith('reports') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <FileText className={`w-6 h-6 shrink-0 ${activeTab.startsWith('reports') ? 'text-white' : 'text-slate-400'}`} />
                  <span className={`ml-3 font-medium ${activeTab.startsWith('reports') ? 'text-white' : 'text-slate-300'}`}>Reports</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isReportsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isReportsOpen && (
                <div className="mt-2 ml-4 space-y-1 border-l border-slate-800 pl-3">
                  {reportItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === item.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
