import { useEffect, useState } from "react";
import { LoaderCircle, Menu, RefreshCw, ChefHat } from "lucide-react";
import { fetchKot, updateKotStatus } from "../lib/api";
export default function KDSView({ onMenuClick, onNotify }: { onMenuClick: () => void; onNotify: (m: string, t?: any) => void }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const load = async (silent = false) => { try { if (!silent) setIsLoading(true); setTickets(await fetchKot()); } catch (e: any) { onNotify(e.message || "Unable to load KOT", "error"); } finally { setIsLoading(false); } };
  useEffect(() => { load(); const i = setInterval(() => load(true), 10000); return () => clearInterval(i); }, []);
  const setStatus = async (id: number, s: string) => { try { setBusyId(id); await updateKotStatus(id, s); await load(true); onNotify("KOT " + s.toLowerCase(), "success"); } catch (e: any) { onNotify(e.message || "Unable to update KOT", "error"); } finally { setBusyId(null); } };
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8"><button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button><h1 className="text-3xl font-bold text-slate-800 tracking-tight">Kitchen Display</h1><button onClick={() => load()} disabled={isLoading} className="ml-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50">{isLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}Refresh</button></div>
      {isLoading && tickets.length === 0 ? (<div className="flex flex-col items-center justify-center gap-3 text-slate-500 font-semibold py-20"><LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />Loading KOT tickets...</div>) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tickets.map(k => (
            <div key={k.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-800"><ChefHat className="w-5 h-5 text-orange-500" />KOT #{k.id} - {k.order_code}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">{k.status}</div>
              <ul className="mt-4 space-y-1 text-sm font-medium text-slate-700">{k.items?.map((it: any, i: number) => (<li key={i} className="flex justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2"><span>{it.item_name}</span><span>x{it.quantity}</span></li>))}</ul>
              <div className="flex gap-2 mt-4">{["PREPARING", "READY", "SERVED"].map(s => (<button key={s} disabled={busyId === k.id} onClick={() => setStatus(k.id, s)} className="flex-1 px-3 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-1">{busyId === k.id ? <LoaderCircle className="w-4 h-4 animate-spin" /> : s}</button>))}</div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && tickets.length === 0 && <div className="bg-white p-10 rounded-3xl border text-center text-slate-500 font-medium">No KOT tickets. Send orders from POS.</div>}
    </div>
  );
}
