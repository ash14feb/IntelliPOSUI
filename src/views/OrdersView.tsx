import { useEffect, useState } from "react";
import { LoaderCircle, Menu, ClipboardList } from "lucide-react";
import { fetchDineOrders, updateDineOrderStatus } from "../lib/api";
export default function OrdersView({ onMenuClick, onNotify }: { onMenuClick: () => void; onNotify: (m: string, t?: any) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const load = async () => { try { setIsLoading(true); setOrders(await fetchDineOrders(filter || undefined)); } catch (e: any) { onNotify(e.message || "Unable to load orders", "error"); } finally { setIsLoading(false); } };
  useEffect(() => { load(); }, [filter]);
  const change = async (code: string, s: string) => { try { setBusyCode(code); await updateDineOrderStatus(code, s); await load(); onNotify("Order " + s.toLowerCase(), "success"); } catch (e: any) { onNotify(e.message || "Unable to update order", "error"); } finally { setBusyCode(null); } };
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8"><button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button><h1 className="text-3xl font-bold text-slate-800 tracking-tight">Order Management</h1></div>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-wrap gap-2">{["", "PENDING", "PREPARING", "READY", "COMPLETED"].map(s => (<button key={s} onClick={() => setFilter(s)} className={"px-4 py-2 rounded-full text-sm font-bold " + (filter === s ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100")}>{s || "All"}</button>))}</div>
      </div>
      {isLoading ? (<div className="flex flex-col items-center gap-3 text-slate-500 font-semibold py-20"><LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />Loading orders...</div>) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-100">{orders.map(od => (
          <div key={od.id} className="p-5 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3"><div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><ClipboardList className="w-5 h-5" /></div><div><div className="font-bold text-slate-800">{od.order_code}</div><div className="text-xs font-medium text-slate-500">{od.order_type} - {od.order_status} - {od.total_amount}</div></div></div>
            <div className="ml-auto flex items-center gap-2">{busyCode === od.order_code && <LoaderCircle className="w-5 h-5 animate-spin text-blue-600" />}<select value={od.order_status} disabled={busyCode === od.order_code} onChange={e => change(od.order_code, e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60"><option>PENDING</option><option>PREPARING</option><option>READY</option><option>SERVED</option><option>COMPLETED</option><option>CANCELLED</option></select></div>
          </div>))}
          {orders.length === 0 && <p className="p-10 text-center text-slate-500 font-medium">No orders found.</p>}
        </div>
      )}
    </div>
  );
}
