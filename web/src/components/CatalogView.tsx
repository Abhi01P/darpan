"use client";

import React, { useState } from "react";
import { Search, Eye, Database } from "lucide-react";

interface CatalogItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  brand: string;
  price: number;
}

const STATIC_CATALOG: CatalogItem[] = [
  {
    id: "item_linen_01",
    title: "AIRism Cotton Oversized T-Shirt",
    description: "Breathable, lightweight cotton with a beautiful relaxed silhouette. Perfect for layering and hot climates.",
    image_url: "https://image.uniqlo.com/UQ/ST3/in/imagesgoods/484508/item/ingoods_04_484508_3x4.jpg",
    brand: "UNIQLO",
    price: 19.90
  },
  {
    id: "item_denim_02",
    title: "Classic Selvedge Denim Jacket",
    description: "Premium heavyweight raw denim that breaks in uniquely to your body shape. Features copper rivets.",
    image_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=600&auto=format&fit=crop",
    brand: "Levi's",
    price: 98.00
  },
  {
    id: "item_dress_03",
    title: "Viscose Flowy Floral Dress",
    description: "A gorgeous, light Viscose print dress. Flowing lines designed to drape elegantly for summer events.",
    image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop",
    brand: "ZARA",
    price: 59.90
  },
  {
    id: "item_knit_04",
    title: "Cashmere Crewneck Knit Sweater",
    description: "100% fine Inner Mongolian cashmere. Unbelievably soft, insulating, and tailored with a luxury drape.",
    image_url: "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?q=80&w=600&auto=format&fit=crop",
    brand: "UNIQLO",
    price: 120.00
  }
];

interface CatalogViewProps {
  onSelectTryOn: (imageUrl: string) => void;
}

export default function CatalogView({ onSelectTryOn }: CatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = STATIC_CATALOG.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 text-slate-100 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold flex items-center space-x-3">
          <Database className="h-8 w-8 text-indigo-500" />
          <span>Discover Catalog</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Explore curated garments across major brands ready for interactive multi-modal try-on.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items, brands, or descriptions (e.g. 'Airism', 'Denim')..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
          >
            {/* Image Container */}
            <div className="relative aspect-[3/4] bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              <div className="absolute top-3 left-3 bg-slate-950/85 border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400">
                {item.brand}
              </div>
            </div>

            {/* Details Box */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm line-clamp-1 flex-1 pr-2" title={item.title}>
                    {item.title}
                  </h4>
                  <div className="text-sm font-extrabold text-indigo-400">
                    ${item.price.toFixed(2)}
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onSelectTryOn(item.image_url)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                >
                  <Eye className="h-4 w-4" />
                  <span>Interactive Try-On</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
