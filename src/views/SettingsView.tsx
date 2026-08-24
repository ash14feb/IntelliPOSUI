import React, { useState } from 'react';
import { Settings } from '../types';
import { LoaderCircle, Menu } from 'lucide-react';

interface SettingsViewProps {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  onSave: (settings: Settings) => Promise<void>;
  isSaving: boolean;
  onMenuClick: () => void;
  onNotify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

type SettingsTab = 'restaurant' | 'tax' | 'receipt' | 'printer';

export default function SettingsView({ settings, setSettings, onSave, isSaving, onMenuClick, onNotify }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('restaurant');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'restaurant', label: 'Store Details' },
    { id: 'tax', label: 'Tax Configuration' },
    { id: 'receipt', label: 'Receipt Settings' },
    { id: 'printer', label: 'Printer Setup' }
  ];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">System Settings</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full font-semibold ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'restaurant' && (
        <section className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Store Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Store Name</label>
              <input type="text" name="restaurantName" value={settings.restaurantName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Currency Symbol</label>
              <input type="text" name="currencySymbol" value={settings.currencySymbol} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" placeholder="e.g. Rs., $, EUR" />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'tax' && (
        <section className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Tax Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">CGST Percentage (%)</label>
              <input type="number" name="cgstPercent" value={settings.cgstPercent} onChange={handleChange} step="0.1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">SGST Percentage (%)</label>
              <input type="number" name="sgstPercent" value={settings.sgstPercent} onChange={handleChange} step="0.1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                <input type="checkbox" className="h-4 w-4" checked={settings.taxInclusive} onChange={e => setSettings({ ...settings, taxInclusive: e.target.checked })} />
                <div>
                  <div className="font-semibold text-slate-800">Prices Include Tax</div>
                  <div className="text-sm text-slate-500">If enabled, tax is calculated backwards from the item price.</div>
                </div>
              </label>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'receipt' && (
        <section className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Receipt Settings</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Receipt Header Message</label>
              <input type="text" name="receiptHeader" value={settings.receiptHeader} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Receipt Footer Message</label>
              <input type="text" name="receiptFooter" value={settings.receiptFooter} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
              <input type="checkbox" className="h-4 w-4" checked={settings.enableKot} onChange={e => setSettings({ ...settings, enableKot: e.target.checked })} />
              <div>
                <div className="font-semibold text-slate-800">Enable KOT Printing</div>
                <div className="text-sm text-slate-500">Show the KOT button only when this is enabled.</div>
              </div>
            </label>
          </div>
        </section>
      )}

      {activeTab === 'printer' && (
        <section className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Printer Setup</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Connection Type</label>
              <select name="printerConnectionType" value={settings.printerConnectionType} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium">
                <option value="bluetooth">Bluetooth</option>
                <option value="usb">USB</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Paper Width</label>
              <select name="paperWidth" value={settings.paperWidth} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium">
                <option value="2inch">2 Inch</option>
                <option value="3inch">3 Inch</option>
              </select>
            </div>
            <div className="md:col-span-2 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
              Browser-based printing support:
              Bluetooth uses Web Bluetooth.
              USB uses the system print dialog for Windows-installed printers like POS-80C.
            </div>
          </div>
        </section>
      )}

      <div className="flex justify-end mt-8">
        <button
          onClick={async () => {
            try {
              await onSave(settings);
              onNotify('Settings saved successfully', 'success');
            } catch (error: any) {
              onNotify(error.message || 'Unable to save settings', 'error');
            }
          }}
          disabled={isSaving}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          {isSaving ? <><LoaderCircle className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
