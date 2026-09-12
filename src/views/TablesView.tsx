import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { fetchTables, fetchFloors, createTable, createFloor, updateTableStatus } from "../lib/api";
export default function TablesView({ onMenuClick, onNotify }: { onMenuClick: () => void; onNotify: (m: string, t?: any) => void }) {
  const [tables, setTables] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [floor, setFloor] = useState("");
  const [tableNo, setTableNo] = useState("");
  const load = async () => { try { setTables(await fetchTables()); setFloors(await fetchFloors()); } catch (e: any) { onNotify(e.message || "Load failed", "error"); } };
  useEffect(() => { load(); }, []);
  return (
    <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6"><button onClick={onMenuClick} className="lg:hidden p-2 text-slate-600"><Menu className="w-6 h-6" /></button><h1 className="text-2xl font-bold">Table & Floor Management</h1></div>
      <div className="bg-white rounded-2xl p-4 border mb-6 flex flex-wrap gap-2">
        <input value={floor} onChange={e => setFloor(e.target.value)} placeholder="New floor name" className="px-3 py-2 border rounded-xl" />
        <button onClick={async () => { if (!floor.trim()) return; await createFloor(floor.trim()); setFloor(""); load(); }} className="px-4 py-2 bg-slate-800 text-white rounded-xl">Add Floor</button>
        <input value={tableNo} onChange={e => setTableNo(e.target.value)} placeholder="New table no (e.g. T1)" className="px-3 py-2 border rounded-xl" />
        <button onClick={async () => { if (!tableNo.trim()) return; await createTable({ table_no: tableNo.trim(), floor_id: floors[0]?.id || null }); setTableNo(""); load(); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl">Add Table</button>
      </div>
      {floors.map(f => (
        <div key={f.id} className="mb-6"><h2 className="font-bold mb-3">{f.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tables.filter(t => t.floor_id === f.id).map(t => (
              <div key={t.id} className="bg-white border rounded-2xl p-4">
                <div className="font-bold">{t.table_no}</div>
                <div className="text-sm text-slate-500">{t.status} - {t.seats} seats</div>
                <select value={t.status} onChange={async e => { await updateTableStatus(t.id, e.target.value); load(); }} className="mt-2 w-full border rounded-xl px-2 py-1">
                  <option>FREE</option><option>OCCUPIED</option><option>RESERVED</option><option>BILLED</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}
      {floors.length === 0 && tables.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{tables.map(t => (<div key={t.id} className="bg-white border rounded-2xl p-4"><div className="font-bold">{t.table_no}</div><div className="text-sm">{t.status}</div></div>))}</div>
      )}
    </div>
  );
}
