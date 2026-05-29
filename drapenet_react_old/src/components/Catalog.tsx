import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '@/services/api';
import { Search, ShoppingBag, Loader2 } from 'lucide-react';

interface CatalogItem {
  item_id: string;
  title: string;
  image_url: string;
  brand?: string;
  price?: number;
}

export default function Catalog() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/platform/catalog', { params: { limit: 30 } });
        setItems(res.data.items || []);
      } catch (err) {
        console.error('Catalog fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = items.filter((i) =>
    i.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col" style={{ height: 'calc(100vh - 112px)' }}>
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-2.5 border border-outline-variant/20 focus-within:border-primary/40 transition-colors">
          <Search className="w-4 h-4 text-on-surface-variant shrink-0" />
          <input type="text" placeholder="Search catalog..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent w-full text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <ShoppingBag className="w-10 h-10 text-on-surface-variant/40" />
            <p className="text-sm text-on-surface-variant">{search ? 'No matches.' : 'Catalog is empty.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {filtered.map((item, idx) => (
              <motion.div key={item.item_id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/15 hover:border-primary/30 transition-all group">
                <div className="aspect-[3/4] bg-surface-lowest overflow-hidden">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-on-surface line-clamp-2">{item.title}</p>
                  {item.price != null && <p className="text-xs font-semibold text-primary mt-1">₹{item.price.toLocaleString()}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
