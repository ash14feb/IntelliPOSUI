import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Menu, Package, PieChart, Receipt, TrendingUp, Users } from 'lucide-react';
import { Order, Settings } from '../types';
import { filterOrdersByRange, getRangeFromPreset, getRangeLabel, ReportRangePreset } from '../lib/reportUtils';

interface ReportsProps {
  orders: Order[];
  settings: Settings;
  mode?: 'sales' | 'customers' | 'calendar' | 'items' | 'payment' | 'topCustomers';
  canDeleteSales?: boolean;
  onDeleteSale?: (orderId: string) => Promise<void>;
  onMenuClick: () => void;
  onNotify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

const presets: { id: ReportRangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'previousMonth', label: 'Previous Month' },
  { id: 'custom', label: 'Custom' }
];

export default function Reports({ orders, settings, mode = 'sales', canDeleteSales = false, onDeleteSale, onMenuClick, onNotify }: ReportsProps) {
  const [preset, setPreset] = useState<ReportRangePreset>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [showOnlyRepeatCustomers, setShowOnlyRepeatCustomers] = useState(false);

  const range = useMemo(() => getRangeFromPreset(preset, customStart, customEnd), [preset, customStart, customEnd]);
  const filteredOrders = useMemo(() => filterOrdersByRange(orders, range), [orders, range]);

  const salesSummary = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const totalTax = filteredOrders.reduce((sum, order) => sum + order.cgst + order.sgst, 0);
    const totalItems = filteredOrders.reduce((sum, order) => sum + order.items.reduce((qty, item) => qty + item.qty, 0), 0);
    return { totalRevenue, totalOrders, totalTax, totalItems };
  }, [filteredOrders]);

  const customers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; visits: number; totalSpent: number; lastVisit: number }>();

    filteredOrders.forEach(order => {
      const phone = order.customerPhone?.trim();
      if (!phone) return;
      const key = phone;
      const existing = map.get(key) || {
        name: order.customerName?.trim() || 'Walk-in Customer',
        phone,
        visits: 0,
        totalSpent: 0,
        lastVisit: 0
      };
      existing.visits += 1;
      existing.totalSpent += order.total;
      existing.lastVisit = Math.max(existing.lastVisit, order.timestamp);
      if (order.customerName?.trim()) {
        existing.name = order.customerName.trim();
      }
      map.set(key, existing);
    });

    let results = Array.from(map.values()).sort((a, b) => b.visits - a.visits || b.totalSpent - a.totalSpent);
    if (showOnlyRepeatCustomers) {
      results = results.filter(customer => customer.visits > 1);
    }
    return results;
  }, [filteredOrders, showOnlyRepeatCustomers]);

  const salesByItem = useMemo(() => {
    const map = new Map<string, { name: string; category: string; qty: number; revenue: number }>();
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = map.get(item.id) || { name: item.name, category: item.category, qty: 0, revenue: 0 };
        existing.qty += item.qty;
        existing.revenue += item.lineTotal ?? item.price * item.qty;
        map.set(item.id, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  const salesByPayment = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    const modes = ['CASH', 'UPI', 'CARD'] as const;
    modes.forEach(m => map.set(m, { count: 0, revenue: 0 }));
    filteredOrders.forEach(order => {
      const existing = map.get(order.paymentMode) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += order.total;
      map.set(order.paymentMode, existing);
    });
    return Array.from(map.entries()).map(([mode, data]) => ({ mode, ...data })).filter(d => d.count > 0).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; visits: number; totalSpent: number; lastVisit: number }>();
    filteredOrders.forEach(order => {
      const phone = order.customerPhone?.trim();
      if (!phone) return;
      const existing = map.get(phone) || {
        name: order.customerName?.trim() || 'Walk-in Customer',
        phone,
        visits: 0,
        totalSpent: 0,
        lastVisit: 0
      };
      existing.visits += 1;
      existing.totalSpent += order.total;
      existing.lastVisit = Math.max(existing.lastVisit, order.timestamp);
      if (order.customerName?.trim()) existing.name = order.customerName.trim();
      map.set(phone, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [filteredOrders]);

  const salesByDay = useMemo(() => {
    return orders.reduce<Record<string, { total: number; orders: number }>>((acc, order) => {
      const key = format(order.timestamp, 'yyyy-MM-dd');
      if (!acc[key]) {
        acc[key] = { total: 0, orders: 0 };
      }
      acc[key].total += order.total;
      acc[key].orders += 1;
      return acc;
    }, {});
  }, [orders]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const monthSales = useMemo(() => {
    return calendarDays
      .map(day => salesByDay[format(day, 'yyyy-MM-dd')]?.total || 0)
      .filter(Boolean);
  }, [calendarDays, salesByDay]);

  const maxDailySales = Math.max(...monthSales, 1);

  const exportToCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (mode === 'sales') {
      headers = ['Order ID', 'Date & Time', 'Customer Name', 'Phone', 'Payment', 'Total'];
      rows = [...filteredOrders].reverse().map(order => [
        `#${order.id}`,
        format(order.timestamp, 'MMM dd, yyyy HH:mm'),
        order.customerName || 'Walk-in',
        order.customerPhone || '-',
        order.paymentMode,
        `${settings.currencySymbol}${order.total.toFixed(2)}`
      ]);
    } else if (mode === 'customers') {
      headers = ['Name', 'Phone', 'Visits', 'Total Spent', 'Last Visit'];
      rows = customers.map(customer => [
        customer.name,
        customer.phone,
        String(customer.visits),
        `${settings.currencySymbol}${customer.totalSpent.toFixed(2)}`,
        format(customer.lastVisit, 'MMM dd, yyyy HH:mm')
      ]);
    } else if (mode === 'items') {
      headers = ['Item Name', 'Category', 'Quantity Sold', 'Revenue'];
      rows = salesByItem.map(item => [
        item.name,
        item.category,
        String(item.qty),
        `${settings.currencySymbol}${item.revenue.toFixed(2)}`
      ]);
    } else if (mode === 'payment') {
      headers = ['Payment Mode', 'Orders', 'Revenue'];
      rows = salesByPayment.map(d => [
        d.mode,
        String(d.count),
        `${settings.currencySymbol}${d.revenue.toFixed(2)}`
      ]);
    } else if (mode === 'topCustomers') {
      headers = ['Name', 'Phone', 'Visits', 'Total Spent', 'Last Visit'];
      rows = topCustomers.map(c => [
        c.name,
        c.phone,
        String(c.visits),
        `${settings.currencySymbol}${c.totalSpent.toFixed(2)}`,
        format(c.lastVisit, 'MMM dd, yyyy HH:mm')
      ]);
    } else {
      return;
    }

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mode === 'sales' ? 'sales-report' : mode === 'customers' ? 'customer-report' : mode === 'items' ? 'items-report' : mode === 'payment' ? 'payment-report' : 'top-customers'}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderRangeFilter = () => (
    <div className="flex flex-wrap gap-3 mb-6">
      {presets.map(option => (
        <button
          key={option.id}
          onClick={() => setPreset(option.id)}
          className={`px-4 py-2 rounded-full font-semibold ${preset === option.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
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
  );

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex-1">
          {mode === 'sales' ? 'Sales Report' : mode === 'customers' ? 'Customer Report' : mode === 'items' ? 'Sales by Item' : mode === 'payment' ? 'Sales by Payment' : mode === 'topCustomers' ? 'Top Customers' : 'Sales Calendar'}
        </h1>
        {mode !== 'calendar' && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {mode !== 'calendar' && renderRangeFilter()}

      {mode === 'sales' && (
        <>
          <div className="text-sm font-medium text-slate-500 mb-6">{getRangeLabel(range)}</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <MetricCard icon={TrendingUp} label="Revenue" value={`${settings.currencySymbol}${salesSummary.totalRevenue.toFixed(2)}`} tone="blue" />
            <MetricCard icon={Receipt} label="Orders" value={`${salesSummary.totalOrders}`} tone="emerald" />
            <MetricCard icon={Users} label="Items Sold" value={`${salesSummary.totalItems}`} tone="sky" />
            <MetricCard icon={PieChart} label="Tax" value={`${settings.currencySymbol}${salesSummary.totalTax.toFixed(2)}`} tone="amber" />
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-20">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                    <th className="p-5 lg:p-6 border-b border-slate-100">Order ID</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Date & Time</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Customer Name</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Phone</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Payment</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Total</th>
                    {canDeleteSales && <th className="p-5 lg:p-6 border-b border-slate-100">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={canDeleteSales ? 7 : 6} className="p-10 text-center text-slate-400 font-medium">No orders for this range</td>
                    </tr>
                  ) : (
                    [...filteredOrders].reverse().map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-5 lg:p-6 font-bold text-slate-800">#{order.id}</td>
                        <td className="p-5 lg:p-6 text-slate-600 font-medium">{format(order.timestamp, 'MMM dd, yyyy HH:mm')}</td>
                        <td className="p-5 lg:p-6 text-slate-600 font-medium">{order.customerName || 'Walk-in'}</td>
                        <td className="p-5 lg:p-6 text-slate-600 font-medium">{order.customerPhone || '-'}</td>
                        <td className="p-5 lg:p-6 text-slate-600 font-medium">{order.paymentMode}</td>
                        <td className="p-5 lg:p-6 font-black text-blue-600 text-lg">{settings.currencySymbol}{order.total.toFixed(2)}</td>
                        {canDeleteSales && (
                          <td className="p-5 lg:p-6">
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
        </>
      )}

      {mode === 'customers' && (
        <>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="text-sm font-medium text-slate-500">{getRangeLabel(range)}</div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={showOnlyRepeatCustomers} onChange={e => setShowOnlyRepeatCustomers(e.target.checked)} />
              Show only repeat customers
            </label>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-20">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Customer Visits</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                    <th className="p-5 lg:p-6 border-b border-slate-100">Name</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Phone</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Visits</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Total Spent</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Last Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400 font-medium">No customer data for this range</td>
                    </tr>
                  ) : (
                    customers.map(customer => (
                      <tr key={customer.phone} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-5 lg:p-6 font-semibold text-slate-800">{customer.name}</td>
                        <td className="p-5 lg:p-6 text-slate-600 font-medium">{customer.phone}</td>
                        <td className="p-5 lg:p-6">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${customer.visits > 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                            {customer.visits}
                          </span>
                        </td>
                        <td className="p-5 lg:p-6 font-bold text-blue-600">{settings.currencySymbol}{customer.totalSpent.toFixed(2)}</td>
                        <td className="p-5 lg:p-6 text-slate-600 font-medium">{format(customer.lastVisit, 'MMM dd, yyyy HH:mm')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {mode === 'items' && (
        <>
          <div className="text-sm font-medium text-slate-500 mb-6">{getRangeLabel(range)}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <MetricCard icon={Package} label="Unique Items" value={`${salesByItem.length}`} tone="blue" />
            <MetricCard icon={Receipt} label="Total Items Sold" value={`${salesByItem.reduce((s, i) => s + i.qty, 0)}`} tone="emerald" />
            <MetricCard icon={TrendingUp} label="Total Revenue" value={`${settings.currencySymbol}${salesByItem.reduce((s, i) => s + i.revenue, 0).toFixed(2)}`} tone="sky" />
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-20">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Sales by Item</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                    <th className="p-5 lg:p-6 border-b border-slate-100">#</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Item Name</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Category</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Qty Sold</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesByItem.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium">No item data for this range</td></tr>
                  ) : (
                    salesByItem.map((item, idx) => (
                      <tr key={item.name} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-5 lg:p-6 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-5 lg:p-6 font-bold text-slate-800">{item.name}</td>
                        <td className="p-5 lg:p-6 text-slate-600 font-medium">{item.category}</td>
                        <td className="p-5 lg:p-6">
                          <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">{item.qty}</span>
                        </td>
                        <td className="p-5 lg:p-6 font-black text-blue-600 text-lg">{settings.currencySymbol}{item.revenue.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {mode === 'payment' && (
        <>
          <div className="text-sm font-medium text-slate-500 mb-6">{getRangeLabel(range)}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {salesByPayment.map(d => (
              <MetricCard
                key={d.mode}
                icon={d.mode === 'CASH' ? Receipt : d.mode === 'UPI' ? TrendingUp : PieChart}
                label={d.mode}
                value={`${settings.currencySymbol}${d.revenue.toFixed(2)}`}
                tone={d.mode === 'CASH' ? 'emerald' : d.mode === 'UPI' ? 'blue' : 'amber'}
              />
            ))}
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-20">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Sales by Payment Mode</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                    <th className="p-5 lg:p-6 border-b border-slate-100">Payment Mode</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Orders</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Revenue</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesByPayment.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium">No payment data for this range</td></tr>
                  ) : (
                    (() => {
                      const totalRev = salesByPayment.reduce((s, d) => s + d.revenue, 0);
                      return salesByPayment.map(d => (
                        <tr key={d.mode} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-5 lg:p-6">
                            <span className={`inline-flex px-4 py-1.5 rounded-full text-sm font-bold ${d.mode === 'CASH' ? 'bg-emerald-50 text-emerald-700' : d.mode === 'UPI' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{d.mode}</span>
                          </td>
                          <td className="p-5 lg:p-6 font-bold text-slate-800">{d.count}</td>
                          <td className="p-5 lg:p-6 font-black text-blue-600 text-lg">{settings.currencySymbol}{d.revenue.toFixed(2)}</td>
                          <td className="p-5 lg:p-6 font-semibold text-slate-600">{totalRev > 0 ? ((d.revenue / totalRev) * 100).toFixed(1) : '0'}%</td>
                        </tr>
                      ));
                    })()
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {mode === 'topCustomers' && (
        <>
          <div className="text-sm font-medium text-slate-500 mb-6">{getRangeLabel(range)}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <MetricCard icon={Users} label="Total Customers" value={`${topCustomers.length}`} tone="blue" />
            <MetricCard icon={TrendingUp} label="Total Revenue" value={`${settings.currencySymbol}${topCustomers.reduce((s, c) => s + c.totalSpent, 0).toFixed(2)}`} tone="emerald" />
            <MetricCard icon={Receipt} label="Avg Spend / Customer" value={`${settings.currencySymbol}${topCustomers.length > 0 ? (topCustomers.reduce((s, c) => s + c.totalSpent, 0) / topCustomers.length).toFixed(2) : '0.00'}`} tone="amber" />
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-20">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Top Customers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                    <th className="p-5 lg:p-6 border-b border-slate-100">Rank</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Name</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Phone</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Visits</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Total Spent</th>
                    <th className="p-5 lg:p-6 border-b border-slate-100">Last Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topCustomers.length === 0 ? (
                    <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium">No customer data for this range</td></tr>
                  ) : (
                    topCustomers.map((c, idx) => (
                      <tr key={c.phone} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-5 lg:p-6 font-black text-slate-800 text-lg">{idx + 1}</td>
                        <td className="p-5 lg:p-6 font-bold text-slate-800">{c.name}</td>
                        <td className="p-5 lg:p-6 text-slate-600 font-medium">{c.phone}</td>
                        <td className="p-5 lg:p-6">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${c.visits > 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{c.visits}</span>
                        </td>
                        <td className="p-5 lg:p-6 font-black text-blue-600 text-lg">{settings.currencySymbol}{c.totalSpent.toFixed(2)}</td>
                        <td className="p-5 lg:p-6 text-slate-600 font-medium">{format(c.lastVisit, 'MMM dd, yyyy HH:mm')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {mode === 'calendar' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-20">
          <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-white text-slate-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-white text-slate-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const sales = salesByDay[key];
              const intensity = sales ? sales.total / maxDailySales : 0;
              const bgClass = intensity > 0.75 ? 'bg-emerald-500 text-white' : intensity > 0.45 ? 'bg-emerald-200 text-emerald-950' : intensity > 0.15 ? 'bg-emerald-50 text-emerald-800' : !isSameMonth(day, currentMonth) ? 'bg-slate-50 text-slate-300' : 'bg-white text-slate-800';

              return (
                <div key={key} className={`min-h-32 border-b border-r border-slate-100 p-3 ${bgClass} ${isToday(day) ? 'ring-2 ring-blue-300 ring-inset' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold">{format(day, 'd')}</span>
                    {sales && (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${intensity > 0.75 ? 'bg-white/20 text-white' : 'bg-white/70 text-emerald-800'}`}>
                        {sales.orders} sale{sales.orders > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className={`text-xs ${intensity > 0.75 ? 'text-white/80' : 'text-slate-500'}`}>Revenue</div>
                    <div className="text-sm font-black">
                      {sales ? `${settings.currencySymbol}${sales.total.toFixed(2)}` : `${settings.currencySymbol}0.00`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  tone: 'blue' | 'emerald' | 'sky' | 'amber';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 transition-all hover:shadow-md">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${tones[tone]}`}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
