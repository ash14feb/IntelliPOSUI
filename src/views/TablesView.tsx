import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Menu, Plus, Armchair, Link2, Copy, Check, ExternalLink, Trash2, QrCode, Download, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { fetchTables, createTable, updateTableStatus, deleteTable } from "../lib/api";

export function tableMenuUrl(menuCode: string): string {
  return `${window.location.origin}${window.location.pathname}#/menu/${menuCode}`;
}

export default function TablesView({ onMenuClick, onNotify }: { onMenuClick: () => void; onNotify: (m: string, t?: any) => void }) {
  const [tables, setTables] = useState<any[]>([]);
  const [tableName, setTableName] = useState("");
  const [seats, setSeats] = useState(4);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [qrTable, setQrTable] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setTables(await fetchTables());
    } catch (e: any) {
      onNotify(e.message || "Unable to load tables", "error");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const handleAddTable = async () => {
    if (!tableName.trim()) return;
    try {
      setIsSaving(true);
      await createTable({ table_no: tableName.trim(), seats });
      setTableName("");
      await load();
      onNotify("Table added successfully", "success");
    } catch (e: any) {
      onNotify(e.message || "Unable to add table", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatus = async (id: number, status: string) => {
    try {
      setBusyId(id);
      await updateTableStatus(id, status);
      await load();
    } catch (e: any) {
      onNotify(e.message || "Unable to update table", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this table?")) return;
    try {
      setBusyId(id);
      await deleteTable(id);
      await load();
      onNotify("Table deleted successfully", "success");
    } catch (e: any) {
      onNotify(e.message || "Unable to delete table", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleCopyLink = async (t: any) => {
    if (!t.menu_code) {
      onNotify("Menu link is not ready for this table yet", "error");
      return;
    }
    const url = tableMenuUrl(t.menu_code);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(t.id);
    onNotify("Menu link copied", "success");
    setTimeout(() => setCopiedId(cur => (cur === t.id ? null : cur)), 2000);
  };

  const handleDownloadQr = async () => {
    if (!qrTable?.menu_code || !qrRef.current) return;
    try {
      setIsDownloading(true);
      const svg = qrRef.current.querySelector('svg');
      if (!svg) throw new Error('QR code not ready');
      const xml = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Unable to render QR code'));
          img.src = svgUrl;
        });
        const size = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Unable to render QR code');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `table-${qrTable.table_no}-qr.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        onNotify('QR code downloaded', 'success');
      } finally {
        URL.revokeObjectURL(svgUrl);
      }
    } catch (e: any) {
      onNotify(e?.message || 'Unable to download QR code', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium";
  const labelCls = "block text-sm font-semibold text-slate-700 mb-2";

  if (isLoading) return (<div className="min-h-full flex flex-col items-center justify-center gap-3 text-slate-500 font-semibold p-10"><LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />Loading tables...</div>);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8"><button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button><h1 className="text-3xl font-bold text-slate-800 tracking-tight">Table Management</h1></div>

      <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100 mb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Add Table</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          <div><label className={labelCls}>Table Name</label><input value={tableName} onChange={e => setTableName(e.target.value)} placeholder="e.g. T1" className={inputCls} /></div>
          <div><label className={labelCls}>Seats</label><input type="number" min={1} value={seats} onChange={e => setSeats(Math.max(1, Number(e.target.value) || 0))} className={inputCls} /></div>
          <div><button onClick={handleAddTable} disabled={isSaving || !tableName.trim()} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30">{isSaving ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}Add Table</button></div>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center text-slate-400 font-medium">No tables yet. Add your first table above.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
          {tables.map(t => (
            <div key={t.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Armchair className="w-5 h-5" /></div>
                  <div>
                    <div className="font-bold text-slate-800 text-lg leading-tight">{t.table_no}</div>
                    <div className="text-sm text-slate-500">{t.seats} seats · <span className="font-semibold">{t.status}</span></div>
                  </div>
                </div>
                <button onClick={() => handleDelete(t.id)} disabled={busyId === t.id} title="Delete table" className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <select value={t.status} disabled={busyId === t.id} onChange={e => handleStatus(t.id, e.target.value)} className="mt-4 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60">
                <option>FREE</option><option>OCCUPIED</option><option>RESERVED</option><option>BILLED</option>
              </select>

              <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Link2 className="w-3.5 h-3.5" /> Menu link
                </div>
                {t.menu_code ? (
                  <>
                    <div className="truncate text-xs font-medium text-blue-600">{tableMenuUrl(t.menu_code)}</div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => handleCopyLink(t)} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-xs font-bold transition-colors">
                        {copiedId === t.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedId === t.id ? 'Copied' : 'Copy Link'}
                      </button>
                      <button onClick={() => setQrTable(t)} title="Show QR code" className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 text-xs font-bold transition-colors">
                        <QrCode className="w-4 h-4" /> QR Code
                      </button>
                      <a href={tableMenuUrl(t.menu_code)} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100">
                        <ExternalLink className="w-4 h-4" /> Open
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400">Link will appear after the next refresh.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {qrTable?.menu_code && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm" onClick={() => setQrTable(null)}>
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-black text-slate-800">Table {qrTable.table_no}</h3>
              <button onClick={() => setQrTable(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Scan to open this table's menu</p>
            <div ref={qrRef} className="flex justify-center rounded-2xl border border-slate-200 bg-white p-4">
              <QRCodeSVG value={tableMenuUrl(qrTable.menu_code)} size={220} level="M" />
            </div>
            <button
              onClick={handleDownloadQr}
              disabled={isDownloading}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 text-sm font-bold transition-colors disabled:opacity-60"
            >
              {isDownloading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isDownloading ? 'Preparing...' : 'Download QR Code'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
