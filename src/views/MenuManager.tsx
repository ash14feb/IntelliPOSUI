import { useState } from 'react';
import { Category, MenuItem, Settings } from '../types';
import { Plus, Trash2, Image as ImageIcon, Menu, Upload, LoaderCircle, Pencil, ScanLine, Package, ArrowLeft } from 'lucide-react';
import { uploadToImgBB, UploadStatus } from '../lib/imgbb';
import BarcodeScanner from '../components/BarcodeScanner';
import { formatPrice } from '../lib/currency';

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
    category: categories[0]?.name || 'General',
    barcode: '',
    stock: 0
  });
  const [showScanner, setShowScanner] = useState(false);
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
        category: newItem.category || 'General',
        ...(settings.enableBarcode ? { barcode: newItem.barcode?.trim() || '' } : {}),
        ...(settings.enableStock ? { stock: Number(newItem.stock ?? 0) } : {})
      });
      setNewItem({ name: '', price: 0, image: '', category: categories[0]?.name || 'General', barcode: '', stock: 0 });
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
      category: item.category,
      barcode: item.barcode || '',
      stock: item.stock ?? 0
    });
    setUploadStatus(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setNewItem({ name: '', price: 0, image: '', category: categories[0]?.name || 'General', barcode: '', stock: 0 });
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
        category: newItem.category || 'General',
        ...(settings.enableBarcode ? { barcode: newItem.barcode?.trim() || '' } : {}),
        ...(settings.enableStock ? { stock: Number(newItem.stock ?? 0) } : {})
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
        {editingItemId && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="mb-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to inventory
          </button>
        )}
        {!editingItemId && (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_auto] gap-4 mb-8">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Add Category</label>
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
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
        )}

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
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              placeholder="e.g. Spicy Chicken Burger"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Price ({settings.currencySymbol})</label>
            <input
              type="number"
              value={newItem.price || ''}
              onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
            <select
              value={newItem.category}
              onChange={e => setNewItem({ ...newItem, category: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
            >
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {settings.enableBarcode && (
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Barcode</label>
              <div className="relative">
                <input
                  type="text"
                  value={newItem.barcode || ''}
                  onChange={e => setNewItem({ ...newItem, barcode: e.target.value })}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  placeholder="Scan or type barcode"
                />
                <button
                  type="button"
                  title="Scan barcode with camera"
                  onClick={() => setShowScanner(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <ScanLine className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          {settings.enableStock && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Stock Qty</label>
              <input
                type="number"
                min={0}
                value={newItem.stock ?? ''}
                onChange={e => setNewItem({ ...newItem, stock: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                placeholder="0"
              />
            </div>
          )}
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-5 h-5" />
            {isSaving ? 'Saving...' : editingItemId ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </div>

      {!editingItemId && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {menuItems.map(item => {
          const outOfStock = settings.enableStock && !settings.allowSaleWhenOutOfStock && (item.stock ?? 0) <= 0;
          return (
          <div key={item.id} className={`bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-all ${outOfStock ? 'opacity-50 grayscale' : ''}`}>
            <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-12 h-12 opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-3 left-3 rounded-lg bg-slate-900/85 px-2 py-1 text-sm font-black text-white backdrop-blur-sm">
                {formatPrice(settings, item.price)}
              </div>
              <button
                onClick={() => handleEditStart(item)}
                disabled={isSaving}
                title="Edit item"
                className="absolute top-4 left-4 p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-blue-600 hover:text-white rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleRemove(item.id)}
                disabled={isSaving}
                title="Delete item"
                className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm text-red-500 hover:bg-red-500 hover:text-white rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-2">
              <div className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">{item.category}</div>
              <div className="flex items-center justify-between gap-1.5">
                <h3 className="font-bold text-slate-800 uppercase text-sm leading-tight truncate flex-1">{item.name}</h3>
                {settings.enableStock && (
                  <span title={`Stock: ${item.stock ?? 0}`} className={`flex shrink-0 items-center gap-1 text-[11px] font-bold ${(item.stock ?? 0) <= 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    <Package className="h-3.5 w-3.5" />
                    {item.stock ?? 0}
                  </span>
                )}
              </div>
              {settings.enableBarcode && item.barcode && (
                <p className="text-[11px] font-medium text-slate-500">Barcode: {item.barcode}</p>
              )}
            </div>
          </div>
          );
        })}
      </div>
      )}
      {showScanner && (
        <BarcodeScanner
          onDetected={(code) => { setNewItem(prev => ({ ...prev, barcode: code })); setShowScanner(false); onNotify(`Barcode scanned: ${code}`, 'success'); }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
