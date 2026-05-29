import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Layout from './components/Layout';
import FittingRoom from './components/FittingRoom';
import Catalog from './components/Catalog';
import Wardrobe from './components/Wardrobe';
import { useAuthStore } from './store/authStore';

export default function App() {
  const { user, initialize, isLoading } = useAuthStore();
  const [currentView, setCurrentView] = useState('fitting-room');

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-on-surface font-sans">
        <span className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></span>
      </div>
    );
  }

  if (!user) return <Auth onLogin={() => {}} />;

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === 'fitting-room' && <FittingRoom />}
      {currentView === 'catalog' && <Catalog />}
      {currentView === 'wardrobe' && <Wardrobe />}
    </Layout>
  );
}
