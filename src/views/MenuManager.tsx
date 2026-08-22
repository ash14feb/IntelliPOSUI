import { useState } from 'react';
import { Category, MenuItem, Settings } from '../types';
import { Plus, Trash2, Image as ImageIcon, Menu, Upload, LoaderCircle, Pencil } from 'lucide-react';
import { uploadToImgBB, UploadStatus } from '../lib/imgbb';

interface MenuManagerProps {
  menuItems: MenuItem[];
  categories: Category[];
  onAddItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  onUpdateItem: (id: string, item: Omit<MenuItem, 'id'>) => Promise<void>;
  onAddCategory: (name: string) => Promise<Category>;
  onRemoveItem: (id: string) => Promise<void>;
  settings: Settings;
  onMenuClick: () => void;
  onNotify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

export default function MenuManager({ menuItems, categories, onAddItem, onUpdateItem, onAddCategory, onRemoveItem, settings, onMenuClick, onNotify }: MenuManagerProps) {
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    image: '',
    category: categories[0]?.name || 'General'
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleCategoryCreate = async () => {
    if (!newCategory.trim()) return;

    try {
      setIsSaving(true);
      const created = await onAddCategory(newCategory.trim());
      setNewItem(prev => ({ ...prev, category: created.name }));
      setNewCategory('');
      onNotify('Category added successfully', 'success');
    } catch (error: any) {
      onNotify(error.message || 'Unable to add category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file?: File | null) => {
    if (!file) return;

    try {
      setIsSaving(true);
      const base64 = await readFileAsDataUrl(file);
      const url = await uploadToImgBB(base64, setUploadStatus);
      setNewItem(prev => ({ ...prev, image: url }));
      onNotify('Image uploaded successfully', 'success');
    } catch (error: any) {
      onNotify(error.message || 'Unable to upload image', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newItem.name || !newItem.price) return;

    try {
      setIsSaving(true);
      await onAddItem({
        name: newItem.name,
        price: Number(newItem.price),
        image: newItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
        category: newItem.category || 'General'
      });
      setNewItem({ name: '', price: 0, image: '', category: categories[0]?.name || 'General' });
      setUploadStatus(null);
    } catch (error: any) {
      alert(error.message || 'Unable to add item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditStart = (item: MenuItem) => {
    setEditingItemId(item.id);
    setNewItem({
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category
    });
    setUploadStatus(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setNewItem({ name: '', price: 0, image: '', category: categories[0]?.name || 'General' });
    setUploadStatus(null);
  };

  const handleSaveItem = async () => {
    if (!newItem.name || !newItem.price) return;

    try {
      setIsSaving(true);
      const payload = {
        name: newItem.name,
        price: Number(newItem.price),
        image: newItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
        category: newItem.category || 'General'
      };

      if (editingItemId) {
        await onUpdateItem(editingItemId, payload);
        onNotify('Inventory item updated successfully', 'success');
      } else {
        await onAddItem(payload);
        onNotify('Inventory item added successfully', 'success');
      }

      handleCancelEdit();
    } catch (error: any) {
      onNotify(error.message || `Unable to ${editingItemId ? 'update' : 'add'} item`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      setIsSaving(true);
      await onRemoveItem(id);
      onNotify('Inventory item deleted successfully', 'success');
    } catch (error: any) {
      onNotify(error.message || 'Unable to remove item', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Inventory Management</h1>
      </div>

      <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_auto] gap-4 mb-8">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Add Category</label>
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="e.g. Burgers, Combos, Beverages"
            />
          </div>
          <div className="flex items-end">
            <div className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600">
              {categories.length} categories available
            </div>
          </div>
          <button
            onClick={handleCategoryCreate}
            disabled={!newCategory.trim() || isSaving}
            className="self-end bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Category
          </button>
        </div>

        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800">{editingItemId ? 'Edit Item' : 'Add New Item'}</h2>
          {editingItemId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 items-end">
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Item Name</label>
            <input
              type="text"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="e.g. Spicy Chicken Burger"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Price ({settings.currencySymbol})</label>
            <input
              type="number"
              value={newItem.price || ''}
              onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
            <select
              value={newItem.category}
              onChange={e => setNewItem({ ...newItem, category: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
            >
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Item Image</label>
            <label className="flex items-center gap-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-all font-medium text-slate-700">
              {isSaving && uploadStatus?.step === 'uploading' ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span className="truncate">{newItem.image ? 'Image uploaded' : 'Upload image'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFileUpload(e.target.files?.[0])}
              />
            </label>
            {uploadStatus && (
              <p className={`mt-2 text-xs font-medium ${uploadStatus.step === 'error' ? 'text-red-500' : 'text-slate-500'}`}>
                {uploadStatus.message}
              </p>
            )}
          </div>
          <button
            onClick={handleSaveItem}
            disabled={!newItem.name || !newItem.price || isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
          >
            <Plus className="w-5 h-5" />
            {isSaving ? 'Saving...' : editingItemId ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {menuItems.map(item => (
          <div key={item.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-all">
            <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-12 h-12 opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <button
                onClick={() => handleEditStart(item)}
                disabled={isSaving}
                className="absolute top-4 left-4 p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-indigo-600 hover:text-white rounded-xl shadow-lg transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleRemove(item.id)}
                disabled={isSaving}
                className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm text-red-500 hover:bg-red-500 hover:text-white rounded-xl shadow-lg transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">{item.category}</div>
              <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
              <p className="text-indigo-600 font-black mt-2 text-xl">{settings.currencySymbol}{item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
