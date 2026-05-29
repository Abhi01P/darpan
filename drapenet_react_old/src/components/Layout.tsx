import React from 'react';
import { motion } from 'motion/react';
import { useAuthStore } from '@/store/authStore';
import { Sparkles, Scissors, ShoppingBag, Shirt, LogOut } from 'lucide-react';

interface LayoutProps {
  currentView: string;
  onViewChange: (view: string) => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { key: 'fitting-room', label: 'Fitting Room', icon: Scissors },
  { key: 'catalog', label: 'Catalog', icon: ShoppingBag },
  { key: 'wardrobe', label: 'Wardrobe', icon: Shirt },
] as const;

export default function Layout({ currentView, onViewChange, children }: LayoutProps) {
  const { logout, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* Top bar */}
      <header className="bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/20 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">DrapeNet</h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-xs text-on-surface-variant hidden sm:block">
              {user.name || user.email}
            </span>
          )}
          <button
            onClick={logout}
            className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="bg-surface-container/90 backdrop-blur-xl border-t border-outline-variant/20 pb-safe">
        <div className="flex items-center justify-around max-w-md mx-auto py-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = currentView === key;
            return (
              <button
                key={key}
                onClick={() => onViewChange(key)}
                className="flex flex-col items-center gap-0.5 py-2 px-4 relative group"
              >
                {/* Active indicator pill */}
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute top-1 w-16 h-8 bg-primary/15 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                    active ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium relative z-10 transition-colors duration-200 ${
                    active ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
