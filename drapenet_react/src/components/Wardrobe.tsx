import { useEffect, useState } from 'react';
import { RefreshCw, Link as LinkIcon, Plus, ExternalLink, Box, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { useWardrobeStore } from '../store/wardrobeStore';
import { useUIStore } from '../store/uiStore';

export default function Wardrobe() {
  const { items, isLoading, fetchWardrobe, addByUrl, removeItem } = useWardrobeStore();
  const { setCurrentView, setPendingTryOn } = useUIStore();
  const [urlValue, setUrlValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchWardrobe();
  }, [fetchWardrobe]);

  const handleAddUrl = async () => {
    if (!urlValue.trim()) return;
    setIsAdding(true);
    await addByUrl(urlValue.trim());
    setUrlValue('');
    setIsAdding(false);
  };

  const handleTryOn = (item: any) => {
    setPendingTryOn({ title: item.title, image_url: item.image_url, source_url: item.source_url });
    setCurrentView('fitting-room');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
       <header className="flex justify-between items-end border-b border-white/10 pb-4 mb-8">
         <h1 className="text-4xl md:text-5xl font-bold tracking-tight">My Virtual Closet</h1>
         <button 
           onClick={fetchWardrobe}
           className="p-2.5 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-primary transition-colors group"
         >
           <RefreshCw className={`w-5 h-5 transition-transform duration-500 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
         </button>
       </header>

       <div className="bg-surface-container-low/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-5 mb-8 flex flex-col md:flex-row gap-4 items-center shadow-lg">
         <div className="flex-1 w-full relative flex items-center bg-surface border border-outline-variant/30 rounded-xl overflow-hidden focus-within:border-primary transition-colors">
           <LinkIcon className="absolute left-4 w-5 h-5 text-on-surface-variant" />
           <input 
             type="url" 
             value={urlValue}
             onChange={(e) => setUrlValue(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
             placeholder="Paste UNIQLO, Zara, ASOS link..." 
             className="w-full bg-transparent border-none py-3.5 pl-12 pr-4 text-sm text-on-surface focus:outline-none placeholder:text-on-surface-variant/50" 
           />
         </div>
         <button 
           onClick={handleAddUrl}
           disabled={isAdding || !urlValue.trim()}
           className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] whitespace-nowrap disabled:opacity-50" 
           style={{ color: 'var(--color-on-primary)' }}
         >
           {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
           Add to Wardrobe
         </button>
       </div>

       {isLoading && items.length === 0 ? (
         <div className="flex items-center justify-center h-64">
           <Loader2 className="w-10 h-10 text-primary animate-spin" />
         </div>
       ) : (
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
           {items.map(item => (
             <div key={item.item_id} className="bg-surface-container-low/60 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden group flex flex-col hover:-translate-y-1 transition-transform duration-300 relative">
               
               <button 
                 onClick={() => removeItem(item.item_id)}
                 className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/80 border border-white/10"
               >
                 <Trash2 className="w-4 h-4 text-white" />
               </button>

               <div className="relative w-full aspect-[3/4] bg-surface-container-highest">
                 <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                 <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(11,19,38,0.9)] pointer-events-none" />
               </div>
               <div className="p-4 flex flex-col gap-3 flex-1 bg-surface-container-lowest/50">
                 <div>
                   <h3 className="text-sm font-medium truncate mb-1">{item.title}</h3>
                   <div className="flex items-center justify-between">
                     {item.source_url ? (
                       <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1 transition-colors">
                         <ExternalLink className="w-3 h-3" /> Source
                       </a>
                     ) : (
                       <span className="text-xs text-on-surface-variant">Saved Item</span>
                     )}
                   </div>
                 </div>
                 <button 
                   onClick={() => handleTryOn(item)}
                   className="w-full py-2.5 mt-auto rounded-lg border border-white/20 text-xs font-medium hover:bg-white/5 hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-on-surface"
                 >
                   <Box className="w-4 h-4" /> Interactive Try-On
                 </button>
               </div>
             </div>
           ))}
           
           <div className="bg-surface-container-low/60 backdrop-blur-xl border border-outline-variant/30 rounded-xl overflow-hidden group flex flex-col hover:-translate-y-1 transition-transform duration-300 cursor-pointer min-h-[300px]">
             <div className="w-full h-full flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 m-2 rounded-lg group-hover:border-primary/50 transition-colors bg-surface-container-lowest/30">
                 <ImageIcon className="w-10 h-10 text-on-surface-variant group-hover:text-primary mb-3 transition-colors" />
                 <span className="text-sm font-medium text-on-surface-variant group-hover:text-primary transition-colors">Upload Image</span>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
