import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, UtensilsCrossed, Search } from 'lucide-react';
import { fetchPublicMenu, PublicMenuData } from '../lib/api';
import { formatPrice } from '../lib/currency';

export default function PublicMenuView({ code }: { code: string }) {
  const [data, setData] = useState<PublicMenuData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const menu = await fetchPublicMenu(code);
        if (mounted) {
          setData(menu);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Unable to load menu');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [code]);

  const categories = useMemo(() => {
    if (!data) return ['All'];
    return ['All', ...Array.from(new Set(data.menuItems.map(i => i.category)))];
  }, [data]);

  const items = useMemo(() => {
    if (!data) return [];
    return data.menuItems.filter(i =>
      (category === 'All' || i.category === category) &&
      (!query.trim() || i.name.toLowerCase().includes(query.trim().toLowerCase()))
    );
  }, [data, category, query]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-500 font-semibold p-10">
        <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" /> Loading menu...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center"><UtensilsCrossed className="w-8 h-8" /></div>
        <p className="font-bold text-slate-800 text-lg">Menu link not found</p>
        <p className="text-sm text-slate-500">{error || 'Please ask the staff for a valid QR code or link.'}</p>
      </div>
    );
  }

  const symbol = { currencySymbol: data.currencySymbol } as any;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-5 py-5 sticky top-0 z-10">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">{data.restaurantName}</h1>
        <p className="text-sm text-slate-500 font-medium">Table {data.table.table_no} · {data.table.seats} seats</p>
        <div className="relative mt-3 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search menu..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </header>

      <div className="px-5 py-3 flex gap-2 overflow-x-auto bg-white border-b border-slate-200 sticky top-[129px] z-10">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-semibold text-sm transition-all ${category === c ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-600'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <main className="p-5 max-w-5xl mx-auto">
        {items.length === 0 ? (
          <p className="text-center text-slate-400 font-medium py-16">No items found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="h-28 sm:h-36 bg-slate-100 relative">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><UtensilsCrossed className="w-8 h-8" /></div>
                  )}
                  <div className="absolute bottom-2 left-2 rounded-lg bg-slate-900/85 px-2 py-1 text-sm font-black text-white">
                    {formatPrice(symbol, item.price)}
                  </div>
                </div>
                <div className="px-2.5 py-1.5">
                  <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider truncate">{item.category}</div>
                  <h3 className="font-semibold text-slate-800 uppercase text-[13px] leading-tight truncate">{item.name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
