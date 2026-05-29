import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWardrobeStore, WardrobeItem } from '@/store/wardrobeStore';
import { Shirt, Trash2, Plus, Link, Loader2, X } from 'lucide-react';

export default function Wardrobe() {
  const { items, isLoading, fetchWardrobe, addByUrl, removeItem } = useWardrobeStore();
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => { fetchWardrobe(); }, [fetchWardrobe]);

  const handleAddUrl = async () => {
    if (!urlValue.trim()) return;
    setIsAdding(true);
    await addByUrl(urlValue.trim());
    setUrlValue('');
    setShowUrlInput(false);
    setIsAdding(false);
  };

  return (
    <div className="h-full flex flex-col" style={{ height: 'calc(100vh - 112px)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-on-surface">My Wardrobe</h2>
          <p className="text-xs text-on-surface-variant">{items.length} saved items</p>
        </div>
        <button
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* URL input panel */}
      <AnimatePresence>
        {showUrlInput && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2 overflow-hidden">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2 border border-outline-variant/20">
                <Link className="w-4 h-4 text-on-surface-variant shrink-0" />
                <input type="url" placeholder="Paste product URL..." value={urlValue} onChange={(e) => setUrlValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                  className="bg-transparent w-full text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none" />
              </div>
              <button onClick={handleAddUrl} disabled={isAdding || !urlValue.trim()}
                className="px-4 rounded-xl bg-primary text-on-primary text-sm font-medium disabled:opacity-40 transition-all">
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        {isLoading && items.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Shirt className="w-10 h-10 text-on-surface-variant/40" />
            <p className="text-sm text-on-surface-variant">Your wardrobe is empty</p>
            <p className="text-xs text-on-surface-variant/60">Like items in the Fitting Room or add by URL</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {items.map((item, idx) => (
              <motion.div key={item.item_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/15 group relative">
                <div className="aspect-[3/4] bg-surface-lowest overflow-hidden">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-on-surface line-clamp-2">{item.title}</p>
                </div>
                {/* Delete button on hover */}
                <button onClick={() => removeItem(item.item_id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center
                             opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/80">
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
