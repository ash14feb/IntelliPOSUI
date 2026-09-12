import { useEffect, useState } from "react";
import { LoaderCircle, Menu, Plus, Wallet } from "lucide-react";
import { request } from "../lib/api";
export default function ExpensesView({ onMenuClick, onNotify }: { onMenuClick: () => void; onNotify: (m: string, t?: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [amount, setAmount] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [cat, setCat] = useState("General"); const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true); const [isSaving, setIsSaving] = useState(false);
  const load = async () => { try { setIsLoading(true); const m: any = await (request as any)("/api/posexpenses"); setItems(m.data || []); } catch (e: any) { onNotify(e.message || "Unable to load expenses", "error"); } finally { setIsLoading(false); } };
  useEffect(() => { load(); }, []);
  const add = async () => { if (!amount || !date) return; try { setIsSaving(true); await (request as any)("/api/posexpenses", { method: "POST", body: JSON.stringify({ expense_date: date, category: cat, amount, notes }) }); setAmount(""); setNotes(""); await load(); onNotify("Expense added successfully", "success"); } catch (e: any) { onNotify(e.message || "Unable to add expense", "error"); } finally { setIsSaving(false); } };
  const total = items.reduce((s, x) => s + Number(x.amount || 0), 0);
  const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium";
  const labelCls = "block text-sm font-semibold text-slate-700 mb-2";
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8"><button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button><h1 className="text-3xl font-bold text-slate-800 tracking-tight">Expense Record</h1><span className="ml-auto text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-full px-4 py-2">Total: {total}</span></div>
      <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 mb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Add Expense</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 items-end">
          <div><label className={labelCls}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Category</label><input value={cat} onChange={e => setCat(e.target.value)} placeholder="e.g. Rent" className={inputCls} /></div>
          <div><label className={labelCls}>Amount</label><input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0.00" className={inputCls} /></div>
          <div><label className={labelCls}>Notes</label><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional note" className={inputCls} /></div>
          <button onClick={add} disabled={isSaving || !amount || !date} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30">{isSaving ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}Add Expense</button>
        </div>
      </div>
      {isLoading ? (<div className="flex flex-col items-center gap-3 text-slate-500 font-semibold py-20"><LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />Loading expenses...</div>) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-100">{items.map(x => (<div key={x.id} className="p-5 flex items-center gap-3"><div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><Wallet className="w-5 h-5" /></div><div><div className="font-bold text-slate-800">{x.category}</div><div className="text-xs font-medium text-slate-500">{String(x.expense_date).slice(0, 10)}{x.notes ? " - " + x.notes : ""}</div></div><div className="ml-auto font-bold text-slate-800">{x.amount}</div></div>))}
          {items.length === 0 && <p className="p-10 text-center text-slate-500 font-medium">No expenses recorded.</p>}
        </div>
      )}
    </div>
  );
}
