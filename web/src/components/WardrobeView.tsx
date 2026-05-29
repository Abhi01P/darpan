"use client";

import React, { useState, useEffect } from "react";
import { useWardrobeStore } from "@/store/wardrobeStore";
import { Link2, Trash2, Plus, RefreshCw, Shirt, ArrowRight } from "lucide-react";

interface WardrobeViewProps {
  onSelectTryOn: (imageUrl: string) => void;
}

export default function WardrobeView({ onSelectTryOn }: WardrobeViewProps) {
  const { items, isLoading, error, fetchWardrobe, addByUrl, removeItem } = useWardrobeStore();
  const [inputUrl, setInputUrl] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    fetchWardrobe();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;

    setLocalLoading(true);
    const addedItem = await addByUrl(inputUrl);
    setLocalLoading(false);
    
    if (addedItem) {
      setInputUrl("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 text-slate-100 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center space-x-3">
            <Shirt className="h-8 w-8 text-indigo-500" />
            <span>My Virtual Closet</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse and manage your saved garments. Paste external store links to instantly extract them.
          </p>
        </div>
        
        {/* Refresh button */}
        <button
          onClick={fetchWardrobe}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl transition-all text-slate-400 hover:text-slate-100"
          title="Refresh Closet"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* The Product Adder (URL Ingest Bar) */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
        <h3 className="font-semibold text-lg flex items-center space-x-2">
          <Link2 className="h-5 w-5 text-indigo-500" />
          <span>E-Commerce Product Adder</span>
        </h3>
        <p className="text-slate-400 text-xs">
          Supports links from UNIQLO, Zara, and most major fashion retailers utilizing standard Open Graph tagging.
        </p>

        <form onSubmit={handleAddProduct} className="flex flex-col md:flex-row gap-3">
          <input
            type="url"
            required
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://www.uniqlo.com/in/en/products/..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={localLoading || isLoading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-indigo-500/10 flex items-center justify-center space-x-2 whitespace-nowrap"
          >
            {localLoading ? (
              <span className="border-2 border-white/20 border-t-white rounded-full w-5 h-5 animate-spin"></span>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span>Add to Wardrobe</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="text-red-400 text-xs mt-2 bg-red-950/20 border border-red-900/50 p-2 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Wardrobe Grid */}
      {isLoading && items.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <span className="border-4 border-indigo-500/20 border-t-indigo-500 rounded-full w-12 h-12 animate-spin"></span>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl py-20 text-center flex flex-col items-center justify-center space-y-4">
          <Shirt className="h-16 w-16 text-slate-700" />
          <h3 className="font-semibold text-xl text-slate-400">Your wardrobe is empty</h3>
          <p className="text-slate-500 text-sm max-w-sm">
            Add garments to your closet by pasting a product URL above to begin trying them on your digital twin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.item_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
            >
              {/* Image Box */}
              <div className="relative aspect-[3/4] bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Delete button (floating, hidden by default) */}
                <button
                  onClick={() => removeItem(item.item_id)}
                  className="absolute top-3 right-3 bg-slate-950/80 hover:bg-red-950 border border-slate-800 hover:border-red-900 p-2 rounded-xl text-slate-400 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                  title="Remove from Wardrobe"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Text / Actions */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-sm line-clamp-2 leading-tight" title={item.title}>
                    {item.title}
                  </h4>
                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:underline mt-1 inline-block truncate max-w-full"
                    >
                      View Source
                    </a>
                  )}
                  
                  {/* Price Comparisons */}
                  {item.price_comparisons && item.price_comparisons.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-slate-800 pt-2">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Compare Prices</div>
                      {item.price_comparisons.map((comp, idx) => (
                        <a 
                          key={idx} 
                          href={comp.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex justify-between items-center bg-slate-950 hover:bg-indigo-950/50 p-1.5 rounded-lg border border-slate-800 hover:border-indigo-900 transition-colors"
                        >
                          <span className="text-[11px] font-medium text-slate-300">{comp.retailer}</span>
                          <span className="text-xs font-bold text-green-400">${comp.price.toFixed(2)}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSelectTryOn(item.image_url)}
                  className="w-full bg-slate-950 hover:bg-indigo-600 hover:text-white border border-slate-800 hover:border-indigo-500 rounded-xl py-2 px-3 text-sm font-medium text-slate-300 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Interactive Try-On</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
