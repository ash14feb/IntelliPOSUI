import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { fetchKot, updateKotStatus } from "../lib/api";
export default function KDSView({ onMenuClick, onNotify }: { onMenuClick: () => void; onNotify: (m: string, t?: any) => void }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const load = async () => { try { setTickets(await fetchKot()); } catch (e: any) { onNotify(e.message || "Load failed", "error"); } };
  useEffect(() => { load(); const i = setInterval(load, 10000); return () => clearInterval(i); }, []);
  return (
    <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6"><button onClick={onMenuClick} className="lg:hidden p-2 text-slate-600"><Menu className="w-6 h-6" /></button><h1 className="text-2xl font-bold">Kitchen Display (KOT)</h1><button onClick={load} className="ml-auto px-4 py-2 bg-slate-800 text-white rounded-xl">Refresh</button></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tickets.map(k => (
          <div key={k.id} className="bg-white border rounded-2xl p-4">
            <div className="font-bold">KOT #{k.id} - {k.order_code}</div>
            <div className="text-sm text-slate-500">{k.status} {k.created_at || ""}</div>
            <ul className="mt-2 text-sm">{k.items?.map((it: any, i: number) => (<li key={i}>{it.quantity} x {it.item_name}</li>))}</ul>
            <div className="flex gap-2 mt-3">
              {(["PREPARING", "READY", "SERVED"] as string[]).map(s => (<button key={s} onClick={async () => { await updateKotStatus(k.id, s); load(); }} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg">{s}</button>))}
            </div>
          </div>
        ))}
      </div>
      {tickets.length === 0 && <div className="text-slate-500">No KOT tickets. Send orders from POS.</div>}
    </div>
  );
}
