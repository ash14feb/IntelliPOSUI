import { useEffect, useState } from "react";
import { LoaderCircle, Menu, UserPlus, Users } from "lucide-react";
import { fetchCustomers, createCustomer } from "../lib/api";
export default function CustomersView({ onMenuClick, onNotify }: { onMenuClick: () => void; onNotify: (m: string, t?: any) => void }) {
  const [list, setList] = useState<any[]>([]);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true); const [isSaving, setIsSaving] = useState(false);
  const load = async () => { try { setIsLoading(true); setList(await fetchCustomers()); } catch (e: any) { onNotify(e.message || "Unable to load customers", "error"); } finally { setIsLoading(false); } };
  useEffect(() => { load(); }, []);
  const add = async () => { if (!name.trim()) return; try { setIsSaving(true); await createCustomer({ name: name.trim(), phone: phone.trim(), email: email.trim() }); setName(""); setPhone(""); setEmail(""); await load(); onNotify("Customer added successfully", "success"); } catch (e: any) { onNotify(e.message || "Unable to add customer", "error"); } finally { setIsSaving(false); } };
  const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium";
  const labelCls = "block text-sm font-semibold text-slate-700 mb-2";
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8"><button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button><h1 className="text-3xl font-bold text-slate-800 tracking-tight">Customer CRM</h1></div>
      <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 mb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Add Customer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-end">
          <div><label className={labelCls}>Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Customer name" className={inputCls} /></div>
          <div><label className={labelCls}>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" className={inputCls} /></div>
          <div><label className={labelCls}>Email</label><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" className={inputCls} /></div>
          <button onClick={add} disabled={isSaving || !name.trim()} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30">{isSaving ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}Add Customer</button>
        </div>
      </div>
      {isLoading ? (<div className="flex flex-col items-center gap-3 text-slate-500 font-semibold py-20"><LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />Loading customers...</div>) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-100">{list.map(c => (
          <div key={c.id} className="p-5 flex items-center gap-3"><div className="h-11 w-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center"><Users className="w-5 h-5" /></div><div><div className="font-bold text-slate-800">{c.name}</div><div className="text-xs font-medium text-slate-500">{c.phone || "No phone"} - {c.loyalty_points} pts - {c.total_orders} orders</div></div></div>))}
          {list.length === 0 && <p className="p-10 text-center text-slate-500 font-medium">No customers yet.</p>}
        </div>
      )}
    </div>
  );
}
