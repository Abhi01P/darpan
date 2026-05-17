"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Link2,
  Sparkles,
  ShoppingBag,
  Shirt,
  X,
  ArrowLeft,
  ExternalLink,
  Palette,
  Wand2,
  MessageSquare,
} from "lucide-react";
import type {
  ChatMessage,
  ProductAnalysis,
  SuggestedAction,
  ChatAPIResponse,
} from "@/lib/types/ai-chat";
import { Header } from "@/components/home/header";

// ─── Helpers ────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const URL_REGEX = /https?:\/\/[^\s]+/gi;
function containsUrl(text: string): boolean {
  return URL_REGEX.test(text);
}

// ─── Suggestion Chips ───────────────────────────────────────

const STARTER_SUGGESTIONS = [
  {
    label: "What should I wear today?",
    icon: Shirt,
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
  },
  {
    label: "Analyze a product link",
    icon: Link2,
    gradient: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/30",
  },
  {
    label: "Help me build an outfit for a date",
    icon: Sparkles,
    gradient: "from-pink-500/20 to-rose-500/20",
    border: "border-pink-500/30",
  },
  {
    label: "What are the latest fashion trends?",
    icon: Palette,
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
  },
];

// ─── Typing Indicator ───────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 px-4 md:px-0"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-2 h-2 rounded-full bg-blue-400"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-blue-400"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-blue-400"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Product Card ───────────────────────────────────────────

function ProductCard({
  product,
  actions,
}: {
  product: ProductAnalysis;
  actions?: SuggestedAction[];
}) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-3 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-xl overflow-hidden backdrop-blur-md"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Product Image */}
        <div className="sm:w-36 h-40 sm:h-auto overflow-hidden relative flex-shrink-0">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent sm:bg-gradient-to-r" />
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
            <span className="text-[10px] font-semibold tracking-wider uppercase bg-black/60 text-white px-2 py-1 rounded backdrop-blur-sm">
              {product.brand}
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 p-4">
          <h4 className="text-white font-semibold text-sm mb-1">
            {product.name}
          </h4>
          <p className="text-blue-400 font-medium text-sm mb-2">
            {product.price}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.occasions.slice(0, 3).map((occ) => (
              <span
                key={occ}
                className="text-[10px] tracking-wide uppercase text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/10"
              >
                {occ}
              </span>
            ))}
          </div>

          <div className="text-[11px] text-white/40 mb-3 line-clamp-2">
            {product.material} · {product.sizingInfo}
          </div>

          {/* Action Buttons */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    if (action.type === "try-on") {
                      router.push(
                        `/try-on?url=${encodeURIComponent(action.payload.url || product.sourceUrl)}`
                      );
                    }
                  }}
                  className="text-[11px] font-semibold tracking-wide uppercase px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5
                    bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 hover:border-blue-500/40"
                >
                  {action.type === "try-on" && <Wand2 className="w-3 h-3" />}
                  {action.type === "view-similar" && (
                    <ShoppingBag className="w-3 h-3" />
                  )}
                  {action.label}
                </button>
              ))}
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold tracking-wide uppercase px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5
                  bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/60"
              >
                <ExternalLink className="w-3 h-3" />
                Source
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Message Bubble ─────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  // Simple markdown-like formatting for bold text
  function formatContent(content: string) {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex items-start gap-3 px-4 md:px-0 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm shadow-lg shadow-blue-600/20"
              : "bg-white/5 border border-white/10 text-white/80 rounded-tl-sm backdrop-blur-md"
          }`}
        >
          {formatContent(message.content)}
        </div>

        {/* Product Card (AI only) */}
        {!isUser && message.productData && (
          <ProductCard
            product={message.productData}
            actions={message.suggestedActions}
          />
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-white/20 mt-1.5 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
}

// ─── URL Preview Chip ───────────────────────────────────────

function UrlPreviewChip({ url, onRemove }: { url: string; onRemove: () => void }) {
  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = url.slice(0, 30);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 mr-2 mb-2"
    >
      <Link2 className="w-3.5 h-3.5 text-blue-400" />
      <span className="text-[11px] text-blue-300 font-medium max-w-[200px] truncate">
        {domain}
      </span>
      <button
        onClick={onRemove}
        className="text-blue-300/50 hover:text-blue-300 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

// ─── Main Chat Component ────────────────────────────────────

export default function AIChatClient({ userEmail }: { userEmail: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [detectedUrls, setDetectedUrls] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // URL detection in input
  useEffect(() => {
    const urls = inputValue.match(URL_REGEX) || [];
    setDetectedUrls(urls);
  }, [inputValue]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  // ─── Send Message ───────────────────────────────────────────

  const sendMessage = async (content?: string) => {
    const text = (content || inputValue).trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date(),
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
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data: ChatAPIResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
        productData: data.productData,
        suggestedActions: data.suggestedActions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content:
          "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const removeDetectedUrl = (url: string) => {
    setInputValue((prev) => prev.replace(url, "").trim());
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto relative">
        {/* Messages / Empty State */}
        <div className="flex-1 overflow-y-auto py-6 space-y-5">
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full px-4 pt-12 md:pt-24"
            >
              {/* Hero icon */}
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center backdrop-blur-md">
                  <MessageSquare className="w-9 h-9 text-blue-400" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-3 h-3 text-white" />
                </motion.div>
              </div>

              <h1 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight text-center">
                Darpan Style Assistant
              </h1>
              <p className="text-white/40 text-sm md:text-base text-center max-w-md mb-10 leading-relaxed">
                Your AI-powered fashion advisor. Analyze product links, get
                outfit recommendations, and explore the latest trends.
              </p>

              {/* Suggestion Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {STARTER_SUGGESTIONS.map((suggestion, i) => (
                  <motion.button
                    key={suggestion.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    onClick={() => sendMessage(suggestion.label)}
                    className={`group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br ${suggestion.gradient} border ${suggestion.border}
                      hover:scale-[1.02] hover:shadow-lg transition-all duration-200 text-left backdrop-blur-md`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                      <suggestion.icon className="w-4 h-4 text-white/70" />
                    </div>
                    <span className="text-[13px] text-white/70 font-medium leading-tight group-hover:text-white/90 transition-colors">
                      {suggestion.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <AnimatePresence>
                {isLoading && <TypingIndicator />}
              </AnimatePresence>
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4 px-4 md:px-0">
          {/* Detected URL chips */}
          <AnimatePresence>
            {detectedUrls.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2 flex flex-wrap"
              >
                {detectedUrls.map((url) => (
                  <UrlPreviewChip
                    key={url}
                    url={url}
                    onRemove={() => removeDetectedUrl(url)}
                  />
                ))}
                <span className="text-[11px] text-blue-400/60 self-center">
                  Link detected — I&apos;ll analyze this product for you
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3 bg-white/[0.04] border border-white/10 rounded-2xl p-2 pl-4 backdrop-blur-md focus-within:border-blue-500/30 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.08)] transition-all duration-300">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about fashion, paste a product link, or get outfit ideas..."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-white/90 placeholder:text-white/25 resize-none py-2 leading-relaxed max-h-[120px]"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/15 
                text-white flex items-center justify-center flex-shrink-0 transition-all duration-200
                disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 disabled:shadow-none hover:shadow-blue-500/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-[11px] text-white/15 mt-3">
            Darpan AI may produce inaccurate information. Verify product details
            before purchasing.
          </p>
        </div>
      </div>
    </div>
  );
}
