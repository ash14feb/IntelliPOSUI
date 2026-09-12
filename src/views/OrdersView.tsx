import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { fetchDineOrders, updateDineOrderStatus } from "../lib/api";
export default function OrdersView({ onMenuClick, onNotify }: { onMenuClick: () => void; onNotify: (m: string, t?: any) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const load = async () => { try { setOrders(await fetchDineOrders(filter || undefined)); } catch (e: any) { onNotify(e.message || "Load failed", "error"); } };
  useEffect(() => { load(); }, [filter]);
  return (
    <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6"><button onClick={onMenuClick} className="lg:hidden p-2 text-slate-600"><Menu className="w-6 h-6" /></button><h1 className="text-2xl font-bold">Order Management (Dine-In / Takeaway)</h1></div>
      <div className="flex gap-2 mb-4">
        {(["", "PENDING", "PREPARING", "READY", "COMPLETED"] as string[]).map(s => (<button key={s} onClick={() => setFilter(s)} className={"px-3 py-1 rounded-full text-sm " + (filter === s ? "bg-blue-600 text-white" : "bg-white border")}>{s || "All"}</button>))}
      </div>
      <div className="space-y-2">{orders.map(od => (
        <div key={od.id} className="bg-white border rounded-2xl p-4 flex items-center gap-3">
          <div><div className="font-bold">{od.order_code}</div><div className="text-xs text-slate-500">{od.order_type} - {od.order_status} - {od.total_amount}</div></div>
          <select value={od.order_status} onChange={async e => { await updateDineOrderStatus(od.order_code, e.target.value); load(); }} className="ml-auto border rounded-xl px-2 py-1">
            <option>PENDING</option><option>PREPARING</option><option>READY</option><option>SERVED</option><option>COMPLETED</option><option>CANCELLED</option>
          </select>
        </div>))}
      </div>
    </div>
  );
}
