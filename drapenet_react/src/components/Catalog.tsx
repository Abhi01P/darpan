import { useState, useEffect } from 'react';
import { Search, Eye, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useUIStore } from '../store/uiStore';

interface CatalogItem {
  item_id: string;
  title: string;
  image_url: string;
  brand?: string;
  price?: number;
  desc?: string;
}

export default function Catalog() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { setCurrentView, setPendingTryOn } = useUIStore();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/platform/catalog', { params: { limit: 30 } });
        setItems(res.data || []);
      } catch (err) {
        console.error('Catalog fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = items.filter((i) =>
    i.title.toLowerCase().includes(search.toLowerCase()) || 
    (i.brand && i.brand.toLowerCase().includes(search.toLowerCase()))
  );

  const handleTryOn = (item: CatalogItem) => {
    setPendingTryOn({ title: item.title, image_url: item.image_url });
    setCurrentView('fitting-room');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
       <header className="mb-10">
         <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Discover Catalog</h1>
         <p className="text-on-surface-variant max-w-2xl mb-8">Explore our curated collection of high-fashion pieces, optimized for virtual try-on and personalized styling.</p>
         
         <div className="relative w-full max-w-3xl">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
           <input 
             type="text" 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             placeholder="Search brands, styles, or categories..." 
             className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary transition-colors shadow-inner"
           />
         </div>
       </header>

       <div className="flex gap-3 overflow-x-auto pb-4 mb-8 custom-scrollbar">
         {['All Items', 'Haute Couture', 'Streetwear', 'Avant-Garde', 'Minimalist'].map((cat, i) => (
           <button key={cat} className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${i === 0 ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-container border border-outline/10 text-on-surface-variant hover:bg-surface-container-high'}`}>
             {cat}
           </button>
         ))}
       </div>

       {isLoading ? (
         <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
       ) : filtered.length === 0 ? (
         <div className="flex flex-col items-center justify-center h-64 gap-3 text-on-surface-variant">
           <Search className="w-12 h-12 opacity-50" />
           <p>No matches found.</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {filtered.map(p => (
             <article key={p.item_id} className="bg-surface-container-low/60 backdrop-blur-xl border border-outline/10 rounded-xl overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300">
               <div className="relative h-72 w-full overflow-hidden bg-surface-container-lowest">
                 <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-surface/80 backdrop-blur-md rounded border border-outline/20 text-xs font-semibold tracking-wider text-on-surface">
                   {p.brand || 'Designer'}
                 </div>
                 <img src={p.image_url} alt={p.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" loading="lazy" />
                 <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-80" />
               </div>
               
               <div className="p-5 flex flex-col flex-1 divide-y divide-outline/10">
                 <div className="pb-4">
                   <div className="flex justify-between items-start mb-2 gap-4">
                     <h3 className="text-xl font-medium leading-tight text-on-surface">{p.title}</h3>
                     {p.price != null && <span className="text-xl font-semibold text-tertiary">₹{p.price.toLocaleString()}</span>}
                   </div>
                   <p className="text-sm text-on-surface-variant line-clamp-2 opacity-80 leading-relaxed">{p.desc || 'Optimized for digital try-on.'}</p>
                 </div>
                 <div className="pt-4 mt-auto">
                   <button 
                     onClick={() => handleTryOn(p)}
                     className="w-full py-3 rounded-lg border border-primary/40 bg-surface/50 text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors"
                   >
                     <Eye className="w-4 h-4" />
                     Interactive Try-On
                   </button>
                 </div>
               </div>
             </article>
           ))}
         </div>
       )}
    </div>
  );
}
