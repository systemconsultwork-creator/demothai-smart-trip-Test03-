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
import { ProfileView } from './views/ProfileView';

function AppContent() {
  const { 
    currentView, 
    setCurrentView,
    isAdmin,
    selectedPlaceId, 
    setSelectedPlaceId,
    showToast,
    t
  } = useApp();

  // Check URL query param and path for direct navigation e.g. /admin, /?view=admin or /?placeId=12
  useEffect(() => {
    const pathname = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    const pId = urlParams.get('placeId');

    if (pId) {
      const parsed = parseInt(pId, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setSelectedPlaceId(parsed);
      }
    }

    if (pathname === '/admin' || viewParam === 'admin') {
      if (isAdmin) {
        setCurrentView('admin');
      } else {
        setCurrentView('home');
        showToast(t('auth.adminOnly'), 'error');
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, '', '/');
        }
      }
    }
  }, [isAdmin, setCurrentView, setSelectedPlaceId, showToast, t]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9] text-[#172033] font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* Global Top Navbar */}
      <Navbar />

      {/* Dynamic View Router */}
      <main className="flex-1">
        {currentView === 'home' && <HomeView />}
        {currentView === 'discover' && <DiscoverView />}
        {currentView === 'submit_place' && <SubmitPlaceView />}
        {currentView === 'admin' && (
          <AdminRoute>
            <AdminDashboardView />
          </AdminRoute>
        )}
        {currentView === 'profile' && <ProfileView />}
      </main>

      {/* Destination Detail Modal */}
      <PlaceDetailModal
        placeId={selectedPlaceId}
        onClose={() => setSelectedPlaceId(null)}
      />

      {/* Authentication Modal */}
      <AuthModal />

      {/* Global Toast Notifications */}
      <ToastContainer />

      {/* Global Bottom Footer */}
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