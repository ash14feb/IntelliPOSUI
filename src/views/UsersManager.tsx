import { useState } from 'react';
import { LoaderCircle, Mail, Menu, Pencil, RefreshCw, Trash2, UserPlus } from 'lucide-react';
import { CreateStoreUserPayload, StoreUser, UpdateStoreUserPayload } from '../types';

interface UsersManagerProps {
  users: StoreUser[];
  onLoadUsers: () => Promise<void>;
  onCreateUser: (payload: CreateStoreUserPayload) => Promise<void>;
  onUpdateUser: (id: number, payload: UpdateStoreUserPayload) => Promise<void>;
  onDeleteUser: (id: number) => Promise<void>;
  onResendCredentials: (id: number) => Promise<void>;
  onMenuClick: () => void;
  onNotify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

const INITIAL_FORM: CreateStoreUserPayload = {
  username: '',
  email: '',
  full_name: '',
  user_type: 'staff',
  assigned_store: 'all'
};

export default function UsersManager({
  users,
  onLoadUsers,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onResendCredentials,
  onMenuClick,
  onNotify
}: UsersManagerProps) {
  const [form, setForm] = useState<CreateStoreUserPayload>(INITIAL_FORM);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const startEdit = (user: StoreUser) => {
    setEditingUserId(user.user_id);
    setForm({
      username: user.username.includes('.') ? user.username.split('.').slice(1).join('.') : user.username,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type === 'manager' ? 'manager' : 'staff',
      assigned_store: user.assigned_store
    });
  };

  const resetForm = () => {
    setEditingUserId(null);
    setForm(INITIAL_FORM);
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      if (editingUserId) {
        await onUpdateUser(editingUserId, {
          email: form.email,
          full_name: form.full_name,
          user_type: form.user_type,
          assigned_store: form.assigned_store
        });
      } else {
        await onCreateUser(form);
      }
      resetForm();
      onNotify(editingUserId ? 'User updated successfully' : 'User created successfully', 'success');
    } catch (error: any) {
      onNotify(error.message || `Unable to ${editingUserId ? 'update' : 'create'} user`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setBusyUserId(id);
      await onDeleteUser(id);
      onNotify('User deleted successfully', 'success');
    } catch (error: any) {
      onNotify(error.message || 'Unable to delete user', 'error');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleResend = async (id: number) => {
    try {
      setBusyUserId(id);
      await onResendCredentials(id);
      onNotify('Credentials resent successfully', 'success');
    } catch (error: any) {
      onNotify(error.message || 'Unable to resend credentials', 'error');
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">User Management</h1>
      </div>

      <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 mb-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-800">{editingUserId ? 'Edit User' : 'Create User'}</h2>
          {editingUserId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 items-end">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              placeholder="User full name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Username Suffix</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              disabled={editingUserId !== null}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium disabled:opacity-60"
              placeholder="john"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
            <select
              value={form.user_type}
              onChange={(e) => setForm((prev) => ({ ...prev, user_type: e.target.value as 'manager' | 'staff' }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!form.full_name || !form.email || (!editingUserId && !form.username) || isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
          >
            {isSaving ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            {editingUserId ? 'Update User' : 'Create User'}
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          New usernames are automatically prefixed with the admin store login. Credentials are emailed when a new user is created.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-20">
        <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Store Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                <th className="p-5 lg:p-6 border-b border-slate-100">Name</th>
                <th className="p-5 lg:p-6 border-b border-slate-100">Email</th>
                <th className="p-5 lg:p-6 border-b border-slate-100">Username</th>
                <th className="p-5 lg:p-6 border-b border-slate-100">Role</th>
                <th className="p-5 lg:p-6 border-b border-slate-100">Status</th>
                <th className="p-5 lg:p-6 border-b border-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.filter((user) => user.user_type !== 'admin').length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 font-medium">No store users created yet</td>
                </tr>
              ) : (
                users
                  .filter((user) => user.user_type !== 'admin')
                  .map((user) => (
                    <tr key={user.user_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-5 lg:p-6 font-semibold text-slate-800">{user.full_name}</td>
                      <td className="p-5 lg:p-6 text-slate-600 font-medium">{user.email}</td>
                      <td className="p-5 lg:p-6 text-slate-600 font-medium">{user.username}</td>
                      <td className="p-5 lg:p-6 text-slate-600 font-medium capitalize">{user.user_type}</td>
                      <td className="p-5 lg:p-6">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-5 lg:p-6">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(user)}
                            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResend(user.user_id)}
                            disabled={busyUserId === user.user_id}
                            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(user.user_id)}
                            disabled={busyUserId === user.user_id}
                            className="rounded-xl border border-red-200 bg-white p-2.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {busyUserId === user.user_id ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => onLoadUsers().catch(() => undefined)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Users
          </button>
        </div>
      </div>
    </div>
  );
}
