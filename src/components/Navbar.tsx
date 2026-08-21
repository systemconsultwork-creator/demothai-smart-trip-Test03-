import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Compass, 
  Heart, 
  PlusCircle, 
  ShieldCheck, 
  User as UserIcon, 
  Globe, 
  Menu, 
  X, 
  Sparkles,
  Search,
  LogOut,
  MapPin
} from 'lucide-react';
import { Language } from '../types';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

export const Navbar: React.FC = () => {
  const { 
    lang, 
    setLang, 
    t, 
    currentView, 
    setCurrentView, 
    user, 
    isAdmin,
    setIsAuthModalOpen, 
    logout,
    favorites
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'zh', label: '中文 (简体)', flag: '🇨🇳' },
  ];

  const handleNav = (view: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 xl:gap-6 h-20 flex-nowrap">
          
          {/* Brand Logo & Name */}
          <div 
            id="nav-brand-logo"
            onClick={() => handleNav('home')} 
            className="flex items-center gap-3 cursor-pointer group shrink-0 flex-nowrap select-none"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Compass className="w-6 h-6 text-white stroke-[2.2]" />
            </div>
            <div className="shrink-0 flex flex-col justify-center">
              <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors whitespace-nowrap">
                Thai Smart Trip
              </span>
              <p className="text-xs text-slate-500 font-normal whitespace-nowrap hidden sm:block">
                {lang === 'th' ? 'คู่มือท่องเที่ยว 4 ภาคทั่วไทย' : lang === 'zh' ? '泰国全境200大胜地智慧指南' : 'Thailand 4-Regions Explorer'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 whitespace-nowrap shrink-0 flex-nowrap">
            <button
              id="nav-btn-home"
              onClick={() => handleNav('home')}
              className={`px-3 xl:px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors shrink-0 whitespace-nowrap ${
                currentView === 'home' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
              }`}
            >
              {t('nav.home')}
            </button>

            <button
              id="nav-btn-discover"
              onClick={() => handleNav('discover')}
              className={`px-3 xl:px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                currentView === 'discover' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('nav.discover')}</span>
            </button>

            <button
              id="nav-btn-submit"
              onClick={() => handleNav('submit_place')}
              className={`px-3 xl:px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                currentView === 'submit_place' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('nav.submit_place')}</span>
            </button>

            <button
              id="nav-btn-favorites"
              onClick={() => handleNav('profile')}
              className={`px-3 xl:px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                currentView === 'profile' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20 shrink-0" />
              <span>{t('nav.favorites')}</span>
              {favorites.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shrink-0 leading-none">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Admin View link (Admin Only) */}
            {isAdmin && (
              <button
                id="nav-btn-admin"
                onClick={() => handleNav('admin')}
                className={`px-3 xl:px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  currentView === 'admin' 
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' 
                    : 'text-amber-800 hover:bg-amber-50 border border-amber-200/80 bg-amber-50/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t('nav.admin')}</span>
              </button>
            )}
          </nav>

          {/* Right Action: Language Switcher + User Profile / Auth */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0 whitespace-nowrap flex-nowrap">
            
            {/* Language Switcher */}
            <div className="relative shrink-0">
              <button
                id="nav-language-selector"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs shrink-0 whitespace-nowrap"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{languages.find(l => l.code === lang)?.flag}</span>
                <span>{languages.find(l => l.code === lang)?.code.toUpperCase()}</span>
              </button>

              {langDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-44 rounded-2xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setLangDropdownOpen(false)}
                >
                  {languages.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setLang(item.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors whitespace-nowrap ${
                        lang === item.code 
                          ? 'bg-emerald-50 text-emerald-700 font-bold' 
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.flag}</span>
                        <span className="whitespace-nowrap">{item.label}</span>
                      </div>
                      {lang === item.code && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile / Auth button */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 shrink-0 whitespace-nowrap">
                <button
                  id="nav-user-profile-btn"
                  onClick={() => handleNav('profile')}
                  className="flex items-center gap-2 px-2.5 xl:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 transition-colors shadow-2xs shrink-0 whitespace-nowrap"
                >
                  <img 
                    src={user.avatar || DEFAULT_AVATAR} 
                    alt={user.name} 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
                    className="w-6 h-6 rounded-full object-cover border border-emerald-500/40 shrink-0"
                  />
                  <span className="max-w-[100px] truncate font-semibold">{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0">Admin</span>
                  )}
                </button>
                <button
                  id="nav-logout-btn"
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                <button
                  id="nav-login-btn"
                  onClick={() => {
                    setIsAuthModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs xl:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white transition-all shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
                >
                  {t('nav.login')}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Quick lang button for mobile */}
            <button
              onClick={() => {
                const nextLang: Language = lang === 'th' ? 'en' : lang === 'en' ? 'zh' : 'th';
                setLang(nextLang);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-emerald-800 font-bold"
            >
              {lang.toUpperCase()}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 rounded-xl bg-slate-100 border border-slate-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-4 duration-150">
          <button
            onClick={() => handleNav('home')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
          >
            <span>{t('nav.home')}</span>
            <Compass className="w-4 h-4 text-emerald-600" />
          </button>
          <button
            onClick={() => handleNav('discover')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
          >
            <span>{t('nav.discover')}</span>
            <Search className="w-4 h-4 text-emerald-600" />
          </button>
          <button
            onClick={() => handleNav('submit_place')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
          >
            <span>{t('nav.submit_place')}</span>
            <PlusCircle className="w-4 h-4 text-emerald-600" />
          </button>
          <button
            onClick={() => handleNav('profile')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
          >
            <span>{t('nav.favorites')} ({favorites.length})</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </button>
          {isAdmin && (
            <button
              onClick={() => handleNav('admin')}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 flex items-center justify-between"
            >
              <span>{t('nav.admin')}</span>
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </button>
          )}

          <div className="pt-4 mt-2 border-t border-slate-200 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <img 
                    src={user.avatar || DEFAULT_AVATAR} 
                    alt={user.name} 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
                    className="w-7 h-7 rounded-full object-cover border border-emerald-500/40 shrink-0" 
                  />
                  <span className="text-xs text-slate-700 font-medium truncate max-w-[150px]">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="text-xs text-rose-600 flex items-center gap-1 font-semibold hover:underline"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="w-full">
                <button
                  id="mobile-nav-login-btn"
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-xs transition-all cursor-pointer"
                >
                  {t('nav.login')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
