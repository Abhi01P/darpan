import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDigitalTwinStore } from '@/store/digitalTwinStore';
import { useAuthStore } from '@/store/authStore';
import {
  Send, Camera, Sparkles, Heart, X,
  Image as ImageIcon, Loader2, ThumbsDown,
} from 'lucide-react';
import { api } from '@/services/api';

export default function FittingRoom() {
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    chatHistory, isLoading,
    recommendedItems, currentCardIndex,
    progress, startWorkflow, swipeCard, cleanup,
  } = useDigitalTwinStore();

  const { user } = useAuthStore();

  const currentItem = recommendedItems[currentCardIndex] ?? null;
  const hasMoreCards = currentCardIndex < recommendedItems.length;
  const cardCount = recommendedItems.length;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, currentCardIndex]);

  useEffect(() => cleanup, [cleanup]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUserImageUrl(res.data.url);
    } catch (err) { console.error('Upload failed:', err); }
    finally { setIsUploading(false); }
  };

  const handleSend = () => {
    const query = inputText.trim();
    if (!query) return;
    setInputText('');
    startWorkflow({
      user_image_url: userImageUrl || '',
      user_query: query,
      user_gender: user?.gender || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="h-full flex flex-col" style={{ height: 'calc(100vh - 112px)' }}>
      {/* Photo upload (when no image) */}
      <AnimatePresence>
        {!userImageUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="px-4 pt-4 pb-2">
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
              className="w-full h-36 rounded-2xl border-2 border-dashed border-outline-variant/40 bg-surface-low
                         flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-all group">
              {isUploading ? <Loader2 className="w-7 h-7 text-primary animate-spin" /> : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs text-on-surface-variant">Upload your photo (optional)</p>
                </>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded thumbnail */}
      {userImageUrl && (
        <div className="px-4 pt-3 pb-1 flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-outline-variant/30 shrink-0">
            <img src={userImageUrl} alt="You" className="w-full h-full object-cover" />
            <button onClick={() => setUserImageUrl(null)}
              className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full flex items-center justify-center">
              <X className="w-2.5 h-2.5 text-on-error" />
            </button>
          </div>
          <p className="text-[10px] text-on-surface-variant">Photo ready — ask me to find something</p>
        </div>
      )}

      {/* Chat + Cards area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
        {/* Empty state */}
        {chatHistory.length === 0 && !hasMoreCards && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-on-surface mb-1">Your AI Stylist</p>
              <p className="text-sm text-on-surface-variant max-w-[260px]">
                Tell me what you're looking for — I'll find real products you can browse.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['Light blue t-shirt', 'Black formal jacket', 'Casual streetwear'].map((s) => (
                <button key={s} onClick={() => setInputText(s)}
                  className="px-3.5 py-1.5 rounded-full bg-surface-container text-xs text-on-surface-variant border border-outline-variant/20
                             hover:border-primary/30 hover:text-primary transition-all">{s}</button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Chat bubbles */}
        {chatHistory.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-on-primary rounded-br-md'
                : 'bg-surface-container text-on-surface border border-outline-variant/15 rounded-bl-md'
            }`}>{msg.content}</div>
          </motion.div>
        ))}

        {/* Loading dots */}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-surface-container rounded-2xl rounded-bl-md px-4 py-3 border border-outline-variant/15">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Card Stack ── */}
        {hasMoreCards && currentItem && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden">
            {/* Counter */}
            <div className="px-4 pt-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {currentCardIndex + 1} / {cardCount}
              </span>
              <span className="text-[10px] text-on-surface-variant">Swipe to browse</span>
            </div>

            {/* Image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentItem.item_id}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.25 }}
                className="aspect-[4/5] relative bg-surface-lowest mx-3 mt-2 rounded-xl overflow-hidden"
              >
                <img
                  src={currentItem.image_url}
                  alt={currentItem.title}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface-container to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* Title + Actions */}
            <div className="p-4">
              <p className="text-sm font-medium text-on-surface mb-3 line-clamp-2">
                {currentItem.title}
              </p>
              <div className="flex gap-3">
                <button onClick={() => swipeCard('dislike')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                             bg-surface-high text-on-surface-variant hover:bg-error/15 hover:text-error transition-all">
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-xs font-medium">Skip</span>
                </button>
                <button onClick={() => swipeCard('like')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                             bg-primary text-on-primary hover:brightness-110 transition-all">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs font-medium">Save</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* All cards swiped message */}
        {recommendedItems.length > 0 && !hasMoreCards && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-6">
            <p className="text-sm text-on-surface-variant">
              You've browsed all {cardCount} items. Ask me for more!
            </p>
          </motion.div>
        )}

        {/* Try-on result */}
        <AnimatePresence>
          {progress.tryonResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container rounded-2xl border border-primary/20 overflow-hidden">
              <div className="aspect-[3/4] bg-surface-lowest relative">
                <img src={progress.tryonResult.result_image_url} alt="Try-on" className="w-full h-full object-contain" />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary/90 text-on-primary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Try-On
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 bg-surface-container/80 backdrop-blur-xl border-t border-outline-variant/15">
        <div className="flex items-end gap-2">
          <button onClick={() => fileInputRef.current?.click()}
            className="shrink-0 p-2.5 rounded-xl bg-surface-high text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors">
            <ImageIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 bg-surface-low rounded-xl border border-outline-variant/20 focus-within:border-primary/40 transition-colors">
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Describe what you're looking for..."
              rows={1} className="w-full bg-transparent px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none resize-none" />
          </div>
          <button onClick={handleSend} disabled={isLoading || !inputText.trim()}
            className="shrink-0 p-2.5 rounded-xl bg-primary text-on-primary hover:brightness-110 transition-all disabled:opacity-40 disabled:pointer-events-none">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {userImageUrl && (
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      )}
    </div>
  );
}
