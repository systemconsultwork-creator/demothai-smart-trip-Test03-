import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Place, PendingPlace } from '../types';
import { PlaceCard } from '../components/PlaceCard';
import { 
  User as UserIcon, 
  Heart, 
  Send, 
  LogOut, 
  ShieldCheck, 
  MapPin, 
  Sparkles,
  Compass,
  ArrowRight
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { 
    user, 
    setUser, 
    favorites, 
    t, 
    lang, 
    getLocalized, 
    setCurrentView, 
    showToast, 
    setIsAuthModalOpen,
    setAuthModalMode,
    setAuthPromptReason
  } = useApp();

  const [favPlaces, setFavPlaces] = useState<Place[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<PendingPlace[]>([]);
  const [activeTab, setActiveTab] = useState<'favorites' | 'submissions'>('favorites');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Fetch all places and filter favorites
    Promise.all([
      api.getPlaces({ limit: 200 }),
      api.getSubmissions()
    ])
      .then(([allPlaces, subs]) => {
        const favs = allPlaces.places.filter(p => favorites.includes(p.id));
        setFavPlaces(favs);
        const mySubs = subs.filter(s => s.submittedBy.userId === user.id || s.submittedBy.email === user.email);
        setUserSubmissions(mySubs);
      })
      .catch(err => console.error('Failed to load profile data', err))
      .finally(() => setLoading(false));
  }, [user, favorites]);

  if (!user) {
    return (
      <div id="profile-unauth" className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <Heart className="w-8 h-8 fill-rose-500 stroke-rose-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            {t('auth.favorite_view_title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            {t('auth.favorite_view_desc')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setAuthPromptReason('favorite');
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{t('auth.login_btn')}</span>
          </button>
          <button
            onClick={() => {
              setAuthPromptReason('favorite');
              setAuthModalMode('register');
              setIsAuthModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-800 border border-slate-300 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <span>{t('auth.register_btn')}</span>
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    api.logout();
    setUser(null);
    showToast('Logged out successfully', 'info');
    setCurrentView('home');
  };

  return (
    <div id="profile-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Profile Card Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <img
            src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
            alt={user.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
            }}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/30 shadow-xs"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              {user.role === 'admin' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold uppercase flex items-center gap-1 shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  Admin
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold uppercase shadow-2xs">
                  Traveler
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{user.email}</p>
            <p className="text-[11px] text-slate-400">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <button
              onClick={() => setCurrentView('admin')}
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-colors shadow-2xs"
            >
              Open Admin Dashboard
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
            activeTab === 'favorites'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>{t('profile.saved_favorites')} ({favPlaces.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
            activeTab === 'submissions'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{t('profile.my_submissions')} ({userSubmissions.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'favorites' ? (
        favPlaces.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 rounded-3xl border border-slate-200 p-8 space-y-4">
            <Heart className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">{t('profile.no_favorites')}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Explore 200 destinations and click the heart icon on any card to save it to your wishlist.
            </p>
            <button
              onClick={() => setCurrentView('discover')}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
            >
              Explore 200 Places
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {favPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )
      ) : (
        userSubmissions.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 rounded-3xl border border-slate-200 p-8 space-y-4">
            <Send className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">{t('profile.no_submissions')}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Have an unseen tourist destination in mind? Share it with our community!
            </p>
            <button
              onClick={() => setCurrentView('submit_place')}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
            >
              {t('nav.submit_place')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {userSubmissions.map((sub) => (
              <div key={sub.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    sub.status === 'pending' ? 'bg-amber-100 text-amber-800' : sub.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {sub.status}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(sub.submittedAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{sub.name.th}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{sub.description.th}</p>
                <div className="text-[11px] text-slate-500 font-medium">
                  {sub.province.th} • {sub.category.th}
                </div>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
};
