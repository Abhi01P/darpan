import React, { useState, useRef, useEffect } from 'react';
import { Upload, Bot, X, Heart, Send, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { useDigitalTwinStore } from '../store/digitalTwinStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

export default function FittingRoom() {
  const [inputValue, setInputValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    chatHistory, isLoading,
    recommendedItems, currentCardIndex,
    progress, startWorkflow, swipeCard, cleanup,
  } = useDigitalTwinStore();

  const { user, updateAvatar } = useAuthStore();
  const { pendingTryOn, setPendingTryOn } = useUIStore();
  
  const userImageUrl = user?.digital_twin?.avatar_mesh_url || null;

  const currentItem = recommendedItems[currentCardIndex] ?? null;
  const hasMoreCards = currentCardIndex < recommendedItems.length;
  const cardCount = recommendedItems.length;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, currentCardIndex, isLoading]);

  useEffect(() => cleanup, [cleanup]);

  // Handle pending item try-on from Catalog/Wardrobe
  useEffect(() => {
    if (pendingTryOn) {
      if (!userImageUrl) {
        useDigitalTwinStore.getState().appendChat(
          'assistant', 
          `I'd love to help you try on the ${pendingTryOn.title}! Please upload a photo of yourself first using the upload button.`
        );
        setPendingTryOn(null);
        return;
      }
      const query = `I want to try on this item: ${pendingTryOn.title}`;
      startWorkflow({
        user_image_url: userImageUrl || '',
        garment_image_url: pendingTryOn.image_url,
        user_query: query,
        user_gender: user?.gender || undefined,
      });
      setPendingTryOn(null);
    }
  }, [pendingTryOn, startWorkflow, userImageUrl, user, setPendingTryOn]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await updateAvatar(res.data.url);
    } catch (err) { 
      console.error('Upload failed:', err); 
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleRemoveAvatar = async () => {
    await updateAvatar(null);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const query = inputValue.trim();
    setInputValue('');
    startWorkflow({
      user_image_url: userImageUrl || '',
      user_query: query,
      user_gender: user?.gender || undefined,
    });
  };

  const handleInitiateWorkflow = () => {
    if (inputValue.trim()) {
      handleSend();
    } else {
      startWorkflow({
        user_image_url: userImageUrl || '',
        user_query: "Find me something new to try on.",
        user_gender: user?.gender || undefined,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full md:h-screen w-full">
      {/* Mirror Area */}
      <section className="w-full md:w-[60%] p-4 md:p-6 lg:p-8 h-[60vh] md:h-full flex-shrink-0 relative">
        <div className="w-full h-full rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl bg-surface-container-low flex items-center justify-center group">
          {progress.tryonStatus === 'PROCESSING' ? (
            <div className="flex flex-col items-center justify-center z-10">
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
              <div className="bg-surface-container-high/40 backdrop-blur-md px-4 py-2 rounded-full border border-primary/30">
                 <span className="text-xs font-semibold text-primary tracking-widest uppercase animate-pulse">Synthesizing Try-On...</span>
              </div>
            </div>
          ) : progress.tryonResult?.result_image_url ? (
            <>
              <img 
                src={progress.tryonResult.result_image_url} 
                alt="Virtual Mirror" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-6 left-6 z-30 bg-surface-container-high/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-primary/30">
                 <CheckCircle2 className="w-4 h-4 text-primary animate-pulse" />
                 <span className="text-xs font-semibold text-primary tracking-widest uppercase">Synthesis Successful</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-on-surface-variant/40">
               <Bot className="w-16 h-16 mb-4 opacity-50" />
               <p className="text-sm uppercase tracking-widest font-semibold">Virtual Mirror Standby</p>
               <p className="text-xs mt-2 max-w-[250px] text-center opacity-70">
                 Upload your photo and initiate the try-on workflow. Your AI-generated result will appear here.
               </p>
               {isUploading && (
                 <div className="mt-6 flex items-center gap-2 text-primary">
                   <Loader2 className="w-4 h-4 animate-spin" />
                   <span className="text-xs font-medium">Uploading Photo...</span>
                 </div>
               )}
            </div>
          )}
        </div>
      </section>

      {/* Stylist Area */}
      <section className="w-full md:w-[40%] flex flex-col h-[60vh] md:h-full border-l border-white/5 bg-background">
         {/* Digital Twin Header */}
         <div className="p-6 border-b border-white/5 flex-shrink-0">
           <div className="bg-surface-container-high/40 backdrop-blur-md rounded-xl p-4 flex items-center justify-between border border-white/5">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-primary/40 shrink-0 bg-primary/20 flex justify-center items-center font-bold text-primary group/avatar">
                  {userImageUrl ? (
                    <>
                      <img src={userImageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                      <button 
                        onClick={handleRemoveAvatar}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </>
                  ) : (
                    user?.name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                   <h3 className="text-sm font-medium text-on-surface leading-snug">Digital Twin: Active</h3>
                   <p className="text-xs text-on-surface-variant">Base Model v2.4</p>
                </div>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 text-xs text-on-surface hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {userImageUrl ? 'Replace' : 'Upload'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
           </div>
         </div>

         {/* Chat Area */}
         <div className="flex-[1_1_0%] overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar h-0">
            {chatHistory.length === 0 && !isLoading && (
              <div className="text-center text-sm text-on-surface-variant my-auto opacity-70">
                Tell me what you're looking for, and I'll find the perfect match.
              </div>
            )}
            
            {chatHistory.map((msg, i) => (
              <React.Fragment key={i}>
                {msg.role === 'assistant' ? (
                  <div className="flex gap-3 max-w-[85%]">
                     <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0 border border-white/10 shrink-0">
                       <Bot className="w-4 h-4 text-primary" />
                     </div>
                     <div className="bg-surface-container-low/60 backdrop-blur-md border border-white/5 p-4 rounded-2xl rounded-tl-sm text-sm text-on-surface-variant leading-relaxed shadow-sm whitespace-pre-wrap">
                       {msg.content}
                     </div>
                  </div>
                ) : (
                  <div className="flex gap-3 max-w-[85%] self-end flex-row-reverse">
                    <div className="bg-surface-container-high border border-primary/20 p-4 rounded-2xl rounded-tr-sm text-sm text-on-surface leading-relaxed shadow-sm whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            {hasMoreCards && currentItem && (
              <div className="ml-11 max-w-[80%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="bg-surface-container-low/80 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10">
                   <img src={currentItem.image_url} alt={currentItem.title} className="w-full h-48 object-cover opacity-90" />
                   <div className="p-4 bg-surface/50">
                     <h4 className="text-sm font-medium text-on-surface mb-1 line-clamp-1">{currentItem.title}</h4>
                     <p className="text-xs text-primary mb-4">{currentCardIndex + 1} of {cardCount}</p>
                     <div className="flex gap-3 justify-center">
                       <button 
                         onClick={() => swipeCard('dislike')} 
                         className="w-10 h-10 rounded-full border border-error/50 flex items-center justify-center text-error hover:bg-error/10 transition-colors"
                       >
                         <X className="w-5 h-5" />
                       </button>
                       <button 
                         onClick={() => swipeCard('like')} 
                         className="w-10 h-10 rounded-full border border-primary/50 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                       >
                         <Heart className="w-5 h-5" />
                       </button>
                     </div>
                   </div>
                 </div>
              </div>
            )}

            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                 <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0 border border-white/10 shrink-0">
                   <Loader2 className="w-4 h-4 text-primary animate-spin" />
                 </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
         </div>

         {/* Input Box */}
         <div className="p-6 border-t border-white/5 bg-background/80 backdrop-blur-md flex-shrink-0">
           <div className="relative mb-4">
             <input 
               type="text" 
               placeholder="Tell your stylist..." 
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               onKeyDown={handleKeyDown}
               disabled={isLoading}
               className="w-full bg-surface-container-low border border-white/10 rounded-full py-3.5 pl-4 pr-12 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 placeholder:text-on-surface-variant/50 transition-colors disabled:opacity-50" 
             />
             <button 
               onClick={handleSend} 
               disabled={isLoading || !inputValue.trim()}
               className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
             >
               <Send className="w-4 h-4 ml-[-2px]" />
             </button>
           </div>
           <button 
             onClick={handleInitiateWorkflow}
             disabled={isLoading}
             className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary font-bold text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(192,193,255,0.2)] hover:shadow-[0_0_25px_rgba(192,193,255,0.3)] transition-shadow disabled:opacity-50" 
             style={{ color: 'var(--color-on-primary)' }}
           >
             Initiate Try-On Workflow
           </button>
         </div>
      </section>
    </div>
  );
}
