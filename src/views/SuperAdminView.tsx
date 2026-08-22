import { useState } from 'react';
import { Building2, LoaderCircle, Mail, Menu, RefreshCw } from 'lucide-react';
import { RegisteredStore } from '../types';

interface SuperAdminViewProps {
  stores: RegisteredStore[];
  totalStores: number;
  onLoadStores: () => Promise<void>;
  onResendAdminCredentials: (tenantId: number) => Promise<void>;
  onMenuClick: () => void;
  onNotify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

export default function SuperAdminView({
  stores,
  totalStores,
  onLoadStores,
  onResendAdminCredentials,
  onMenuClick,
  onNotify
}: SuperAdminViewProps) {
  const [busyTenantId, setBusyTenantId] = useState<number | null>(null);

  const handleResend = async (tenantId: number) => {
    try {
      setBusyTenantId(tenantId);
      await onResendAdminCredentials(tenantId);
      onNotify('Admin credentials resent successfully', 'success');
    } catch (error: any) {
      onNotify(error.message || 'Unable to resend admin credentials', 'error');
    } finally {
      setBusyTenantId(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Super Admin</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-500 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-white/80">Registered Stores</span>
            <Building2 className="w-6 h-6 text-white/80" />
          </div>
          <div className="mt-5 text-4xl font-black tracking-tight">{totalStores}</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-20">
        <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Store Registrations</h2>
          <button
            type="button"
            onClick={() => onLoadStores().catch(() => undefined)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                <th className="p-5 lg:p-6 border-b border-slate-100">Store Name</th>
                <th className="p-5 lg:p-6 border-b border-slate-100">Owner</th>
                <th className="p-5 lg:p-6 border-b border-slate-100">Email</th>
                <th className="p-5 lg:p-6 border-b border-slate-100">Admin Login</th>
                <th className="p-5 lg:p-6 border-b border-slate-100">Registered On</th>
                <th className="p-5 lg:p-6 border-b border-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 font-medium">No stores registered yet</td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.tenant_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 lg:p-6 font-semibold text-slate-800">{store.business_name}</td>
                    <td className="p-5 lg:p-6 text-slate-600 font-medium">{store.owner_name}</td>
                    <td className="p-5 lg:p-6 text-slate-600 font-medium">{store.owner_email}</td>
                    <td className="p-5 lg:p-6 text-slate-600 font-medium">{store.admin_username}</td>
                    <td className="p-5 lg:p-6 text-slate-600 font-medium">{new Date(store.created_at).toLocaleString()}</td>
                    <td className="p-5 lg:p-6">
                      <button
                        type="button"
                        onClick={() => handleResend(store.tenant_id)}
                        disabled={busyTenantId === store.tenant_id}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        {busyTenantId === store.tenant_id ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Resend Admin Credentials
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
