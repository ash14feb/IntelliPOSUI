import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { request } from "../lib/api";
async function list(): Promise<any[]> { const m: any = await (request as any)("/api/posexpenses"); return m.data; }
export default function ExpensesView({ onMenuClick, onNotify }: { onMenuClick: () => void; onNotify: (m: string, t?: any) => void }) {
  const [list2, setList2] = useState<any[]>([]);
  const [amount, setAmount] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [cat, setCat] = useState("General"); const [notes, setNotes] = useState("");
  const load = async () => { try { setList2(await list()); } catch (e: any) { onNotify(e.message || "Load failed", "error"); } };
  useEffect(() => { load(); }, []);
  const total = list2.reduce((s, e) => s + Number(e.amount || 0), 0);
  return (
    <div className="p-6 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6"><button onClick={onMenuClick} className="lg:hidden p-2 text-slate-600"><Menu className="w-6 h-6" /></button><h1 className="text-2xl font-bold">Expense Record (Total: {total})</h1></div>
      <div className="bg-white border rounded-2xl p-4 mb-4 flex flex-wrap gap-2">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 border rounded-xl" />
        <input value={cat} onChange={e => setCat(e.target.value)} placeholder="Category" className="px-3 py-2 border rounded-xl" />
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" type="number" className="px-3 py-2 border rounded-xl" />
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" className="px-3 py-2 border rounded-xl" />
        <button onClick={async () => { await (request as any)("/api/posexpenses", { method: "POST", body: JSON.stringify({ expense_date: date, category: cat, amount, notes }) }); setAmount(""); setNotes(""); load(); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl">Add</button>
      </div>
      <div className="bg-white border rounded-2xl divide-y">{list2.map(e => (<div key={e.id} className="p-3 flex justify-between text-sm"><span>{e.expense_date?.slice?.(0, 10)} - {e.category}</span><span className="font-bold">{e.amount}</span></div>))}</div>
    </div>
  );
}
