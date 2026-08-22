import { useMemo, useState } from 'react';
import { BarChart3, CreditCard, Menu, Receipt, Users, Wallet, Smartphone } from 'lucide-react';
import { Order, Settings } from '../types';
import { filterOrdersByRange, getRangeFromPreset, ReportRangePreset } from '../lib/reportUtils';

interface DashboardViewProps {
  orders: Order[];
  settings: Settings;
  canDeleteSales?: boolean;
  onDeleteSale?: (orderId: string) => Promise<void>;
  onMenuClick: () => void;
  onNotify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

const presets: { id: ReportRangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'previousDay', label: 'Previous Day' },
  { id: 'custom', label: 'Custom' }
];

export default function DashboardView({ orders, settings, canDeleteSales = false, onDeleteSale, onMenuClick, onNotify }: DashboardViewProps) {
  const [preset, setPreset] = useState<ReportRangePreset>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const range = useMemo(() => getRangeFromPreset(preset, customStart, customEnd), [preset, customStart, customEnd]);
  const filteredOrders = useMemo(() => filterOrdersByRange(orders, range), [orders, range]);

  const metrics = useMemo(() => {
    const totalSale = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalCustomers = filteredOrders.reduce((sum, order) => sum + order.items.reduce((qty, item) => qty + item.qty, 0), 0);
    const cashSales = filteredOrders.filter(order => order.paymentMode === 'CASH').reduce((sum, order) => sum + order.total, 0);
    const upiSales = filteredOrders.filter(order => order.paymentMode === 'UPI').reduce((sum, order) => sum + order.total, 0);
    const cardSales = filteredOrders.filter(order => order.paymentMode === 'CARD').reduce((sum, order) => sum + order.total, 0);

    return { totalSale, totalCustomers, cashSales, upiSales, cardSales };
  }, [filteredOrders]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 14 }, (_, index) => 10 + index);
    return hours.map(hour => {
      const customers = filteredOrders
        .filter(order => {
          const date = new Date(order.timestamp);
          return date.getHours() === hour;
        })
        .reduce((sum, order) => sum + order.items.reduce((qty, item) => qty + item.qty, 0), 0);

      return {
        hour,
        label: hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`,
        customers
      };
    });
  }, [filteredOrders]);

  const maxCustomers = Math.max(...hourlyData.map(item => item.customers), 1);
  const recentSales = [...filteredOrders].reverse().slice(0, 8);

  const cards = [
    { label: 'Total Sale', value: `${settings.currencySymbol}${metrics.totalSale.toFixed(2)}`, icon: Wallet, tone: 'from-emerald-500 to-teal-500' },
    { label: 'Total Customers', value: `${metrics.totalCustomers}`, icon: Users, tone: 'from-sky-500 to-indigo-500' },
    { label: 'Cash Sales', value: `${settings.currencySymbol}${metrics.cashSales.toFixed(2)}`, icon: Receipt, tone: 'from-amber-500 to-orange-500' },
    { label: 'UPI Sales', value: `${settings.currencySymbol}${metrics.upiSales.toFixed(2)}`, icon: Smartphone, tone: 'from-fuchsia-500 to-pink-500' },
    { label: 'Card Sales', value: `${settings.currencySymbol}${metrics.cardSales.toFixed(2)}`, icon: CreditCard, tone: 'from-violet-500 to-purple-500' }
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {presets.map(option => (
          <button
            key={option.id}
            onClick={() => setPreset(option.id)}
            className={`px-4 py-2 rounded-full font-semibold ${preset === option.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            {option.label}
          </button>
        ))}
        {preset === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="px-4 py-2 rounded-xl bg-white border border-slate-200" />
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="px-4 py-2 rounded-xl bg-white border border-slate-200" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-3xl p-6 text-white bg-gradient-to-br ${card.tone} shadow-lg`}>
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm font-semibold uppercase tracking-wider text-white/80">{card.label}</span>
                <Icon className="w-6 h-6 text-white/80" />
              </div>
              <div className="text-3xl font-black tracking-tight">{card.value}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 lg:p-8 mb-20">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Sales Records</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                  <th className="p-4 border-b border-slate-100">Order ID</th>
                  <th className="p-4 border-b border-slate-100">Customer</th>
                  <th className="p-4 border-b border-slate-100">Phone</th>
                  <th className="p-4 border-b border-slate-100">Payment</th>
                  <th className="p-4 border-b border-slate-100">Total</th>
                  {canDeleteSales && <th className="p-4 border-b border-slate-100">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={canDeleteSales ? 6 : 5} className="p-6 text-center text-slate-400 font-medium">No sales records for this range</td>
                  </tr>
                ) : (
                  recentSales.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-semibold text-slate-800">#{order.id}</td>
                      <td className="p-4 text-slate-600 font-medium">{order.customerName || 'Walk-in'}</td>
                      <td className="p-4 text-slate-600 font-medium">{order.customerPhone || '-'}</td>
                      <td className="p-4 text-slate-600 font-medium">{order.paymentMode}</td>
                      <td className="p-4 font-bold text-indigo-600">{settings.currencySymbol}{order.total.toFixed(2)}</td>
                      {canDeleteSales && (
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await onDeleteSale?.(order.id);
                                onNotify('Sale record deleted successfully', 'success');
                              } catch (error: any) {
                                onNotify(error?.message || 'Unable to delete sale record', 'error');
                              }
                            }}
                            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Customer Flow By Hour</h2>
            <p className="text-sm text-slate-500">10 AM to 11 PM</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-7 xl:grid-cols-14 gap-4 items-end min-h-72">
          {hourlyData.map(item => (
            <div key={item.hour} className="flex flex-col items-center gap-3">
              <div className="w-full bg-slate-100 rounded-t-2xl rounded-b-md relative h-48 flex items-end overflow-hidden">
                <div
                  className="w-full bg-gradient-to-t from-indigo-600 to-sky-400 rounded-t-2xl transition-all"
                  style={{ height: `${(item.customers / maxCustomers) * 100}%` }}
                />
                <span className="absolute top-3 inset-x-0 text-center text-xs font-bold text-slate-700">{item.customers}</span>
              </div>
              <span className="text-xs font-semibold text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
