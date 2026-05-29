"use client";

import React from "react";
import { useAuthStore } from "@/store/authStore";
import { LogOut, Shirt, LayoutDashboard, Database, Sparkles } from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export default function Navbar({ currentTab, setTab }: NavbarProps) {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <nav className="bg-slate-950 border-b border-slate-800 text-slate-100 py-4 px-6 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white">
          <Sparkles className="h-6 w-6 animate-pulse" />
        </div>
        <span className="font-bold text-xl tracking-wider bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">
          DrapeNet
        </span>
      </div>

      <div className="flex items-center space-x-8">
        <button
          onClick={() => setTab("dashboard")}
          className={`flex items-center space-x-2 font-medium text-sm transition-colors ${
            currentTab === "dashboard" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Fitting Room</span>
        </button>

        <button
          onClick={() => setTab("wardrobe")}
          className={`flex items-center space-x-2 font-medium text-sm transition-colors ${
            currentTab === "wardrobe" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shirt className="h-4 w-4" />
          <span>My Wardrobe</span>
        </button>

        <button
          onClick={() => setTab("catalog")}
          className={`flex items-center space-x-2 font-medium text-sm transition-colors ${
            currentTab === "catalog" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Catalog</span>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="font-semibold text-sm">{user.name}</div>
          <div className="text-xs text-slate-500">{user.email}</div>
        </div>
        <button
          onClick={logout}
          className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-400 hover:text-red-400 hover:border-red-950 transition-all"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
}
