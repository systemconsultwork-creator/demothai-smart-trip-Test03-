import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { PlaceDetailModal } from './components/PlaceDetailModal';
import { AuthModal } from './components/AuthModal';
import { AdminRoute } from './components/AdminRoute';

import { HomeView } from './views/HomeView';
import { DiscoverView } from './views/DiscoverView';
import { SubmitPlaceView } from './views/SubmitPlaceView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminLoginView } from './views/AdminLoginView';
import { ProfileView } from './views/ProfileView';

function AppContent() {
  const {
    currentView,
    setCurrentView,
    isAdmin,
    selectedPlaceId,
    setSelectedPlaceId,
  } = useApp();

  useEffect(() => {
    const pathname = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    const pId = urlParams.get('placeId');

    if (pId) {
      const parsed = parseInt(pId, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setSelectedPlaceId(parsed);
      }
    }

    // /admin is now the single Admin shell.
    // Keep the old /admin/places URL backward-compatible by normalizing it
    // to /admin without a full page navigation.
    if (pathname === '/admin/places') {
      window.history.replaceState({}, '', '/admin');
      setCurrentView(isAdmin ? 'admin' : 'admin_login');
      return;
    }

    if (pathname === '/admin' || pathname === '/admin/login' || viewParam === 'admin') {
      setCurrentView(isAdmin ? 'admin' : 'admin_login');
    }
  }, [isAdmin, setCurrentView, setSelectedPlaceId]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9] text-[#172033] font-sans selection:bg-emerald-600 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {currentView === 'home' && <HomeView />}
        {currentView === 'discover' && <DiscoverView />}
        {currentView === 'submit_place' && <SubmitPlaceView />}
        {currentView === 'admin_login' && <AdminLoginView />}
        {currentView === 'admin' && (
          <AdminRoute>
            <AdminDashboardView />
          </AdminRoute>
        )}
        {currentView === 'profile' && <ProfileView />}
      </main>

      <PlaceDetailModal
        placeId={selectedPlaceId}
        onClose={() => setSelectedPlaceId(null)}
      />
      <AuthModal />
      <ToastContainer />
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
