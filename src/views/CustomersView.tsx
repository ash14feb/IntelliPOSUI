import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { fetchCustomers, createCustomer } from "../lib/api";
export default function CustomersView({ onMenuClick, onNotify }: { onMenuClick: () => void; onNotify: (m: string, t?: any) => void }) {
  const [list, setList] = useState<any[]>([]);
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const load = async () => { try { setList(await fetchCustomers()); } catch (e: any) { onNotify(e.message || "Load failed", "error"); } };
  useEffect(() => { load(); }, []);
  return (
    <div className="p-6 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6"><button onClick={onMenuClick} className="lg:hidden p-2 text-slate-600"><Menu className="w-6 h-6" /></button><h1 className="text-2xl font-bold">Customer CRM & Loyalty</h1></div>
      <div className="bg-white border rounded-2xl p-4 mb-4 flex flex-wrap gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="px-3 py-2 border rounded-xl" />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="px-3 py-2 border rounded-xl" />
        <button onClick={async () => { if (!name.trim()) return; await createCustomer({ name: name.trim(), phone: phone.trim() }); setName(""); setPhone(""); load(); onNotify("Customer added", "success"); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl">Add</button>
      </div>
      <div className="bg-white border rounded-2xl divide-y">{list.map(cu => (<div key={cu.id} className="p-4 flex justify-between"><div><div className="font-bold">{cu.name}</div><div className="text-xs text-slate-500">{cu.phone} - {cu.loyalty_points} pts - {cu.total_orders} orders</div></div></div>))}</div>
    </div>
  );
}
