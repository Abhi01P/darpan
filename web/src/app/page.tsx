"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import AuthView from "@/components/AuthView";
import DashboardView from "@/components/DashboardView";
import WardrobeView from "@/components/WardrobeView";
import CatalogView from "@/components/CatalogView";

export default function Home() {
  const { user, initialize, isLoading } = useAuthStore();
  const [tab, setTab] = useState<string>("dashboard");
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  // Handle active wardrobe select triggering fitting room
  const handleSelectTryOn = (imageUrl: string) => {
    setSelectedGarment(imageUrl);
    setTab("dashboard");
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-100 font-sans">
        <span className="border-4 border-indigo-500/20 border-t-indigo-500 rounded-full w-12 h-12 animate-spin mb-4"></span>
        <div className="text-xs uppercase tracking-widest font-mono text-slate-500">Connecting Digital Twin...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar currentTab={tab} setTab={setTab} />
      
      <main className="flex-1 bg-slate-950">
        {tab === "dashboard" && (
          <DashboardView initialGarmentImage={selectedGarment} />
        )}
        
        {tab === "wardrobe" && (
          <WardrobeView onSelectTryOn={handleSelectTryOn} />
        )}
        
        {tab === "catalog" && (
          <CatalogView onSelectTryOn={handleSelectTryOn} />
        )}
      </main>
    </div>
  );
}
