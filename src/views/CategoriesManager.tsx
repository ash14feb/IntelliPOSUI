import { useState } from 'react';
import { Category } from '../types';
import { Menu, Pencil, Plus, Trash2 } from 'lucide-react';

interface CategoriesManagerProps {
  categories: Category[];
  onAddCategory: (name: string) => Promise<Category>;
  onUpdateCategory: (id: string, name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onMenuClick: () => void;
  onNotify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

export default function CategoriesManager({ categories, onAddCategory, onUpdateCategory, onDeleteCategory, onMenuClick, onNotify }: CategoriesManagerProps) {
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    try {
      setIsSaving(true);
      await onAddCategory(newCategory.trim());
      setNewCategory('');
      onNotify('Category added successfully', 'success');
    } catch (error: any) {
      onNotify(error.message || 'Unable to add category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !editingName.trim()) return;
    try {
      setIsSaving(true);
      await onUpdateCategory(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
      onNotify('Category updated successfully', 'success');
    } catch (error: any) {
      onNotify(error.message || 'Unable to update category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsSaving(true);
      await onDeleteCategory(id);
      onNotify('Category deleted successfully', 'success');
    } catch (error: any) {
      onNotify(error.message || 'Unable to delete category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Category Management</h1>
      </div>

      <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Add Category</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder="Enter category name"
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
          />
          <button
            onClick={handleAdd}
            disabled={!newCategory.trim() || isSaving}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Existing Categories</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {categories.map(category => (
            <div key={category.id} className="p-5 flex items-center justify-between gap-4">
              <div className="flex-1">
                {editingId === category.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  />
                ) : (
                  <div className="font-semibold text-slate-800">{category.name}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editingId === category.id ? (
                  <button onClick={handleUpdate} disabled={isSaving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50">
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(category.id);
                      setEditingName(category.name);
                    }}
                    className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(category.id)}
                  disabled={isSaving}
                  className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="p-10 text-center text-slate-400 font-medium">No categories yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
