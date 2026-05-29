import { ReactNode } from 'react';
import { Shirt, LayoutGrid, Settings, Camera, Search, User, Sparkles, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const { user, logout } = useAuthStore();
  
  const navItems = [
    { id: 'fitting-room', label: 'Fitting Room', icon: <Shirt className="w-5 h-5" /> },
    { id: 'wardrobe', label: 'My Wardrobe', icon: <Shirt className="w-5 h-5" /> },
    { id: 'catalog', label: 'Catalog', icon: <LayoutGrid className="w-5 h-5" /> },
    // { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 w-full h-16 bg-surface/80 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            DrapeNet
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <button onClick={logout} className="text-on-surface-variant hover:text-error">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-surface-container-low/90 backdrop-blur-2xl border-r border-white/10 z-40 py-8 shadow-2xl">
        <div className="px-6 mb-8 border-b border-white/10 pb-8 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full border border-white/20 overflow-hidden shrink-0 bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
             {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
           </div>
           <div className="flex-1 overflow-hidden">
             <h2 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary leading-tight truncate">{user?.name || 'DrapeNet'}</h2>
             <p className="text-xs text-on-surface-variant mt-0.5 truncate">{user?.email || 'Premium Stylist'}</p>
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-l-2 border-primary font-medium'
                    : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all text-on-surface-variant hover:bg-white/5 hover:text-error"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </nav>

        <div className="px-6 mt-auto">
          <button 
            onClick={() => onViewChange('fitting-room')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-secondary rounded-lg font-bold transition-all hover:opacity-90 mt-4 shadow-[0_0_15px_rgba(192,193,255,0.2)] hover:shadow-[0_0_25px_rgba(192,193,255,0.3)]" style={{ color: 'var(--color-on-primary)' }}>
            <Camera className="w-5 h-5" />
            Try-On Lens
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 bg-surface-container-high/90 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around px-2 pb-safe">
        {[
          { id: 'fitting-room', icon: <Camera className="w-6 h-6" />, label: 'Mirror' },
          { id: 'wardrobe', icon: <Shirt className="w-6 h-6" />, label: 'Wardrobe' },
          { id: 'catalog', icon: <Search className="w-6 h-6" />, label: 'Explore' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
              currentView === item.id ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium mt-1">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
