"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Send, Link2, Sparkles, Shirt, X,
  Palette, Wand2, MessageSquare, ImagePlus, ChevronLeft, ChevronRight,
  Plus, ThumbsDown, Check,
} from "lucide-react";
import type {
  ChatMessage, RecommendedItemData, ChatAPIResponse,
} from "@/lib/types/ai-chat";
import Navbar from "@/components/wardrobe/Navbar";
import "@/styles/darpan-nav.css";
import Image from "next/image";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const URL_REGEX = /https?:\/\/[^\s]+/gi;

const STARTER_SUGGESTIONS = [
  { label: "Find me a casual summer shirt", icon: Shirt, gradient: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/30" },
  { label: "Analyze a product link", icon: Link2, gradient: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/30" },
  { label: "Help me build an outfit for a date", icon: Sparkles, gradient: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/30" },
  { label: "What are the latest fashion trends?", icon: Palette, gradient: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30" },
];

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-start gap-3 px-4 md:px-0">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div key={i} className="w-2 h-2 rounded-full bg-indigo-400"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Product Card Deck ──────────────────────────────────────

function ProductCardDeck({ items, onTryOn }: { items: RecommendedItemData[]; onTryOn: (item: RecommendedItemData) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  if (!items.length) return null;
  const item = items[currentIndex];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 w-full max-w-sm">
      <div className="relative bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
        <div className="relative w-full h-64 bg-black/20">
          <Image src={item.imageUrl} alt={item.title} fill className="object-contain" unoptimized />
          {items.length > 1 && (
            <div className="absolute top-2 right-2 text-[10px] font-semibold bg-black/60 text-white/70 px-2 py-1 rounded-full backdrop-blur-sm">
              {currentIndex + 1} / {items.length}
            </div>
          )}
        </div>
        <div className="p-4">
          <h4 className="text-white font-semibold text-sm mb-3 line-clamp-2">{item.title}</h4>
          <div className="flex gap-2">
            <button onClick={() => onTryOn(item)}
              className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase px-3 py-2.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all">
              <Wand2 className="w-3.5 h-3.5" /> Try On
            </button>
          </div>
        </div>
        {items.length > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-2 pointer-events-none">
            <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}
              className="pointer-events-auto w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition-all backdrop-blur-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrentIndex((i) => Math.min(items.length - 1, i + 1))} disabled={currentIndex === items.length - 1}
              className="pointer-events-auto w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition-all backdrop-blur-sm">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Try-On Result Display ──────────────────────────────────

function TryOnResult({ imageUrl, onAddToWardrobe, onNotHelpful }: {
  imageUrl: string;
  onAddToWardrobe: (imageUrl: string) => void;
  onNotHelpful: (imageUrl: string) => void;
}) {
  const [wardrobeStatus, setWardrobeStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[12px] text-white/40 max-w-sm">
        Result dismissed. Try another garment!
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 w-full max-w-sm">
      <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
          <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-indigo-300">Virtual Mirror</span>
        </div>
        <div className="relative w-full h-80 bg-black/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Virtual try-on result" className="w-full h-full object-contain" />
        </div>
        {/* Action buttons */}
        <div className="flex gap-2 p-3 border-t border-white/5">
          <button
            onClick={async () => {
              setWardrobeStatus("saving");
              await onAddToWardrobe(imageUrl);
              setWardrobeStatus("saved");
            }}
            disabled={wardrobeStatus !== "idle"}
            className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase px-3 py-2.5 rounded-lg transition-all ${
              wardrobeStatus === "saved"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : wardrobeStatus === "saving"
                ? "bg-white/5 text-white/30 border border-white/10 cursor-wait"
                : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30"
            }`}
          >
            {wardrobeStatus === "saved" ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {wardrobeStatus === "saved" ? "Added!" : wardrobeStatus === "saving" ? "Saving..." : "Add to Wardrobe"}
          </button>
          <button
            onClick={() => {
              onNotHelpful(imageUrl);
              setDismissed(true);
            }}
            className="flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase px-3 py-2.5 rounded-lg bg-white/5 text-white/40 border border-white/10 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/20 transition-all"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Message Bubble ─────────────────────────────────────────

function MessageBubble({ message, onTryOn, onAddToWardrobe, onNotHelpful }: {
  message: ChatMessage;
  onTryOn: (item: RecommendedItemData) => void;
  onAddToWardrobe: (imageUrl: string) => void;
  onNotHelpful: (imageUrl: string) => void;
}) {
  const isUser = message.role === "user";

  function formatContent(content: string) {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 px-4 md:px-0 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words ${isUser ? "bg-indigo-600 text-white rounded-tr-sm shadow-lg shadow-indigo-600/20"
          : "bg-white/5 border border-white/10 text-white/80 rounded-tl-sm backdrop-blur-md"}`}>
          {formatContent(message.content)}
        </div>

        {!isUser && message.recommendedItems && message.recommendedItems.length > 0 && (
          <ProductCardDeck items={message.recommendedItems} onTryOn={onTryOn} />
        )}

        {!isUser && message.tryOnResultUrl && (
          <TryOnResult imageUrl={message.tryOnResultUrl} onAddToWardrobe={onAddToWardrobe} onNotHelpful={onNotHelpful} />
        )}

        <span className="text-[10px] text-white/20 mt-1.5 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
}

// ─── URL Preview Chip ───────────────────────────────────────

function UrlPreviewChip({ url, onRemove }: { url: string; onRemove: () => void }) {
  let domain = "";
  try { domain = new URL(url).hostname; } catch { domain = url.slice(0, 30); }
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
      className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1.5 mr-2 mb-2">
      <Link2 className="w-3.5 h-3.5 text-indigo-400" />
      <span className="text-[11px] text-indigo-300 font-medium max-w-[200px] truncate">{domain}</span>
      <button onClick={onRemove} className="text-indigo-300/50 hover:text-indigo-300 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

// ─── Main Chat Component ────────────────────────────────────

export default function AIChatClient({ initialGender, initialUserImageUrl }: { initialGender?: string, initialUserImageUrl?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [detectedUrls, setDetectedUrls] = useState<string[]>([]);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(initialUserImageUrl || null);
  const router = useRouter();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, scrollToBottom]);
  useEffect(() => { setDetectedUrls(inputValue.match(URL_REGEX) || []); }, [inputValue]);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  // Handle user photo upload for try-on context (with client-side resize)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setUserImageUrl(canvas.toDataURL("image/jpeg", 0.8));
        } else {
          setUserImageUrl(event.target?.result as string); // Fallback
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle "Add to Wardrobe" from try-on result
  const handleAddToWardrobe = async (imageUrl: string) => {
    try {
      const res = await fetch("/api/wardrobe/add-tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, title: "AI Try-On Look" }),
      });
      const data = await res.json();
      if (data.error) {
        console.warn("Failed to add to wardrobe:", data.error);
      } else {
        const msg: ChatMessage = {
          id: generateId(), role: "assistant",
          content: "\u2705 Saved to your wardrobe! You can find it in your collection.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, msg]);
      }
    } catch {
      console.error("Failed to add to wardrobe");
    }
  };

  // Handle "Not Helpful" feedback
  const handleNotHelpful = (imageUrl: string) => {
    console.log("[Feedback] Not helpful:", imageUrl.slice(0, 50));
    const msg: ChatMessage = {
      id: generateId(), role: "assistant",
      content: "Got it, I'll try to do better next time! \ud83d\ude4f Would you like to try a different garment?",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  // Handle "Try On" from product card (intercepted by Gatekeeper)
  const handleTryOn = async (item: RecommendedItemData) => {
    if (!userImageUrl) {
      // Prompt to upload photo first
      const msg: ChatMessage = {
        id: generateId(), role: "assistant",
        content: "To try on this garment virtually, I need your photo first! Please upload a photo of yourself using the 📷 button next to the chat input, then tap \"Try On\" again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg]);
      return;
    }

    // Send a message to the AI Chat API so it is processed by the pipeline and kept in history
    await sendMessage(`I want to try on this item: ${item.title}`, item.imageUrl);
  };

  // Send message through the pipeline
  const sendMessage = async (content?: string, overrideGarmentImage?: string) => {
    const text = (content || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(), role: "user", content: text, timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setDetectedUrls([]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          context: {
            userImageUrl: userImageUrl || undefined,
            garmentPageUrl: detectedUrls[0] || undefined,
            garmentImageUrl: overrideGarmentImage || undefined,
            userGender: initialGender as "male" | "female" | "non-binary" | undefined,
          },
        }),
      });

      const data: ChatAPIResponse = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response");

      const assistantMessage: ChatMessage = {
        id: generateId(), role: "assistant", content: data.reply, timestamp: new Date(),
        recommendedItems: data.recommendedItems,
        tryOnResultUrl: data.tryOnResultUrl,
        intentType: data.intentType,
        suggestedActions: data.suggestedActions,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [...prev, {
        id: generateId(), role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const removeDetectedUrl = (url: string) => {
    setInputValue((prev) => prev.replace(url, "").trim());
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="dw-root min-h-screen flex flex-col" style={{ background: "var(--bg, #b8a8b0)", fontFamily: "'Jost', sans-serif" }}>
      <Navbar activePage="AI Chat" />
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto relative">
        <div className="flex-1 overflow-y-auto py-6 space-y-5">
          {isEmpty ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full px-4 pt-12 md:pt-24">
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center backdrop-blur-md">
                  <MessageSquare className="w-9 h-9 text-indigo-400" />
                </div>
                <motion.div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center"
                  animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Sparkles className="w-3 h-3 text-white" />
                </motion.div>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight text-center">
                Darpan AI Stylist
              </h1>
              <p className="text-white/40 text-sm md:text-base text-center max-w-md mb-10 leading-relaxed">
                Powered by Gemini. Search live products, get styling advice, and try on any garment virtually with AI.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {STARTER_SUGGESTIONS.map((s, i) => (
                  <motion.button key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                    onClick={() => sendMessage(s.label)}
                    className={`group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br ${s.gradient} border ${s.border}
                      hover:scale-[1.02] hover:shadow-lg transition-all duration-200 text-left backdrop-blur-md`}>
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                      <s.icon className="w-4 h-4 text-white/70" />
                    </div>
                    <span className="text-[13px] text-white/70 font-medium leading-tight group-hover:text-white/90 transition-colors">{s.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onTryOn={handleTryOn} onAddToWardrobe={handleAddToWardrobe} onNotHelpful={handleNotHelpful} />
              ))}
              <AnimatePresence>{isLoading && <TypingIndicator />}</AnimatePresence>
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4 px-4 md:px-0">
          {/* User image indicator */}
          {userImageUrl && (
            <div className="mb-2 flex items-center gap-2 text-[11px] text-emerald-400">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-emerald-500/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={userImageUrl} alt="Your photo" className="w-full h-full object-cover" />
              </div>
              <span>Your photo is ready for virtual try-on</span>
              <button onClick={() => setUserImageUrl(null)} className="text-white/30 hover:text-white/60"><X className="w-3 h-3" /></button>
            </div>
          )}

          {/* URL chips */}
          <AnimatePresence>
            {detectedUrls.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-2 flex flex-wrap">
                {detectedUrls.map((url) => (
                  <UrlPreviewChip key={url} url={url} onRemove={() => removeDetectedUrl(url)} />
                ))}
                <span className="text-[11px] text-indigo-400/60 self-center">Link detected — I&apos;ll analyze this product</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3 bg-white/[0.04] border border-white/10 rounded-2xl p-2 pl-4 backdrop-blur-md focus-within:border-indigo-500/30 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.08)] transition-all duration-300">
            {/* Image upload button */}
            <button onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 flex items-center justify-center flex-shrink-0 transition-all"
              title="Upload your photo for virtual try-on">
              <ImagePlus className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

            <textarea ref={inputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Ask about fashion, paste a product link, or search for clothes..."
              rows={1} disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-white/90 placeholder:text-white/25 resize-none py-2 leading-relaxed max-h-[120px]" />

            <button onClick={() => sendMessage()} disabled={!inputValue.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-white/15 text-white flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 disabled:shadow-none">
              <Send className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-[11px] text-white/15 mt-3">
            Powered by Gemini AI · Results may vary · Verify product details before purchasing
          </p>
        </div>
      </div>
    </div>
  );
}
