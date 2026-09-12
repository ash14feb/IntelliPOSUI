import { useEffect, useState } from "react";
import { LoaderCircle, Menu, Plus, Armchair } from "lucide-react";
import { fetchTables, fetchFloors, createTable, createFloor, updateTableStatus } from "../lib/api";
export default function TablesView({ onMenuClick, onNotify }: { onMenuClick: () => void; onNotify: (m: string, t?: any) => void }) {
  const [tables, setTables] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [floor, setFloor] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [seats, setSeats] = useState(4);
  const [floorId, setFloorId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const load = async () => { try { setIsLoading(true); const [t, f] = await Promise.all([fetchTables(), fetchFloors()]); setTables(t); setFloors(f); } catch (e: any) { onNotify(e.message || "Unable to load tables", "error"); } finally { setIsLoading(false); } };
  useEffect(() => { load(); }, []);
  const handleAddFloor = async () => { if (!floor.trim()) return; try { setIsSaving(true); await createFloor(floor.trim()); setFloor(""); await load(); onNotify("Floor added successfully", "success"); } catch (e: any) { onNotify(e.message || "Unable to add floor", "error"); } finally { setIsSaving(false); } };
  const handleAddTable = async () => { if (!tableNo.trim()) return; try { setIsSaving(true); await createTable({ table_no: tableNo.trim(), floor_id: floorId || floors[0]?.id || null, seats }); setTableNo(""); await load(); onNotify("Table added successfully", "success"); } catch (e: any) { onNotify(e.message || "Unable to add table", "error"); } finally { setIsSaving(false); } };
  const handleStatus = async (id: number, status: string) => { try { setBusyId(id); await updateTableStatus(id, status); await load(); } catch (e: any) { onNotify(e.message || "Unable to update table", "error"); } finally { setBusyId(null); } };
  const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium";
  const labelCls = "block text-sm font-semibold text-slate-700 mb-2";
  if (isLoading) return (<div className="min-h-full flex flex-col items-center justify-center gap-3 text-slate-500 font-semibold p-10"><LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />Loading tables...</div>);
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8"><button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button><h1 className="text-3xl font-bold text-slate-800 tracking-tight">Table & Floor Management</h1></div>
      <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 mb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Add Floor / Table</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 items-end">
          <div><label className={labelCls}>Floor Name</label><input value={floor} onChange={e => setFloor(e.target.value)} placeholder="e.g. Ground Floor" className={inputCls} /></div>
          <div><label className={labelCls}>Table No</label><input value={tableNo} onChange={e => setTableNo(e.target.value)} placeholder="e.g. T1" className={inputCls} /></div>
          <div><label className={labelCls}>Floor</label><select value={floorId} onChange={e => setFloorId(e.target.value)} className={inputCls}><option value="">Select floor</option>{floors.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}</select></div>
          <div><label className={labelCls}>Seats</label><input type="number" value={seats} onChange={e => setSeats(Number(e.target.value) || 0)} className={inputCls} /></div>
          <div className="flex gap-2"><button onClick={handleAddFloor} disabled={isSaving || !floor.trim()} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}Floor</button><button onClick={handleAddTable} disabled={isSaving || !tableNo.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30">{isSaving ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}Table</button></div>
        </div>
      </div>
      {floors.map(f => (
        <div key={f.id} className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Armchair className="w-5 h-5 text-blue-600" />{f.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tables.filter(t => String(t.floor_id) === String(f.id)).map(t => (
              <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="font-bold text-slate-800">{t.table_no}</div>
                <div className="text-sm text-slate-500">{t.seats} seats - <span className="font-semibold">{t.status}</span></div>
                <select value={t.status} disabled={busyId === t.id} onChange={e => handleStatus(t.id, e.target.value)} className="mt-3 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60">
                  <option>FREE</option><option>OCCUPIED</option><option>RESERVED</option><option>BILLED</option>
                </select>
                {busyId === t.id && <div className="mt-2 flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="w-4 h-4 animate-spin" />Updating...</div>}
              </div>
            ))}
            {tables.filter(t => String(t.floor_id) === String(f.id)).length === 0 && <p className="text-sm text-slate-400">No tables on this floor yet.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
