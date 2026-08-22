import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, MultiLangString, User } from '../types';
import { db, logout as firebaseLogout } from '../services/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { isAdminEmail } from '../config/admin';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  getLocalized: (obj: MultiLangString | undefined | null) => string;
  currentView: string;
  setCurrentView: (view: string) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  activeRegion: string;
  setActiveRegion: (reg: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedPlaceId: number | null;
  setSelectedPlaceId: (id: number | null) => void;
  user: User | null;
  setUser: (u: User | null) => void;
  isAdmin: boolean;
  favorites: number[];
  toggleFavorite: (placeId: number) => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register' | 'favorite_prompt';
  setAuthModalMode: (mode: 'login' | 'register' | 'favorite_prompt') => void;
  authPromptReason: 'favorite' | 'general' | 'review';
  setAuthPromptReason: (reason: 'favorite' | 'general' | 'review') => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  logout: () => void;
  quickSearch: (term: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('tst_lang');
    return (saved as Language) || 'th';
  });

  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('tst_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Admin is never granted from role alone. The designated admin email must match too.
  const isAdmin = Boolean(user && user.role === 'admin' && isAdminEmail(user.email));

  const [favorites, setFavorites] = useState<number[]>(() => user?.favorites || []);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'favorite_prompt'>('login');
  const [authPromptReason, setAuthPromptReason] = useState<'favorite' | 'general' | 'review'>('general');
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    localStorage.setItem('tst_lang', lang);
    fetch(`/locales/${lang}/translation.json`)
      .then(res => res.json())
      .then(data => setTranslations(data))
      .catch(err => console.error('Failed to load translations', err));
  }, [lang]);

  useEffect(() => {
    if (user) {
      setFavorites(user.favorites || []);
      localStorage.setItem('tst_user', JSON.stringify(user));
      if (!isAdmin && currentView === 'admin') {
        setCurrentView('home');
      }
    } else {
      setFavorites([]);
      localStorage.removeItem('tst_user');
      localStorage.removeItem('tst_favorites');
      if (currentView === 'admin') setCurrentView('home');
    }
  }, [user, currentView, isAdmin]);

  const handleSetCurrentView = (view: string) => {
    if (view === 'admin' && !isAdmin) {
      showToast(
        lang === 'th'
          ? 'บัญชีนี้ไม่มีสิทธิ์ระดับผู้ดูแลระบบ (Admin Only)'
          : lang === 'zh'
          ? '此账号没有管理员访问权限。'
          : 'This account does not have administrator privileges.',
        'error'
      );
      setCurrentView('home');
      return;
    }
    setCurrentView(view);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let val: any = translations;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) val = val[k];
      else return key;
    }
    if (typeof val === 'string' && variables) {
      let formatted = val;
      for (const [vKey, vVal] of Object.entries(variables)) {
        formatted = formatted.replace(new RegExp(`{{${vKey}}}`, 'g'), String(vVal));
      }
      return formatted;
    }
    return typeof val === 'string' ? val : key;
  };

  const getLocalized = (obj: MultiLangString | undefined | null): string => {
    if (!obj) return '';
    return obj[lang] || obj.th || obj.en || obj.zh || '';
  };

  const toggleFavorite = async (placeId: number) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const previousFavorites = [...favorites];
    const isFav = previousFavorites.includes(placeId);
    const newFavs = isFav
      ? previousFavorites.filter(id => id !== placeId)
      : [...previousFavorites, placeId];

    setFavorites(newFavs);
    const updatedUser = { ...user, favorites: newFavs };
    setUser(updatedUser);
    localStorage.setItem('tst_user', JSON.stringify(updatedUser));

    try {
      const userRef = doc(db, 'users', String(user.id));
      await updateDoc(userRef, {
        favorites: isFav ? arrayRemove(placeId) : arrayUnion(placeId)
      });
      showToast(
        isFav
          ? (lang === 'th' ? 'ลบออกจากรายการโปรดแล้ว' : lang === 'zh' ? '已从收藏夹移除' : 'Removed from favorites')
          : (lang === 'th' ? 'บันทึกในรายการโปรดแล้ว' : lang === 'zh' ? '已添加至收藏夹' : 'Added to favorites'),
        'success'
      );
    } catch (err) {
      console.error('Failed to sync favorite on Firebase', err);
      setFavorites(previousFavorites);
      setUser({ ...user, favorites: previousFavorites });
      showToast(
        lang === 'th'
          ? 'ไม่สามารถบันทึกรายการโปรดได้ กรุณาลองใหม่อีกครั้ง'
          : lang === 'zh'
          ? '无法保存收藏，请稍后再试'
          : 'Unable to save favorite. Please try again.',
        'error'
      );
    }
  };

  const logout = async () => {
    try {
      await firebaseLogout();
    } catch (e) {
      console.warn('Firebase logout warning:', e);
    }
    setUser(null);
    setFavorites([]);
    localStorage.removeItem('tst_user');
    localStorage.removeItem('tst_favorites');
    showToast(
      lang === 'th' ? 'ออกจากระบบเรียบร้อยแล้ว' : lang === 'zh' ? '已退出登录' : 'Logged out successfully',
      'info'
    );
    if (currentView === 'admin' || currentView === 'profile') setCurrentView('home');
  };

  const quickSearch = (term: string) => {
    setSearchQuery(term);
    setActiveCategory('all');
    setActiveRegion('all');
    setCurrentView('discover');
  };

  return (
    <AppContext.Provider value={{
      lang,
      setLang,
      t,
      getLocalized,
      currentView,
      setCurrentView: handleSetCurrentView,
      activeCategory,
      setActiveCategory,
      activeRegion,
      setActiveRegion,
      searchQuery,
      setSearchQuery,
      selectedPlaceId,
      setSelectedPlaceId,
      user,
      setUser,
      isAdmin,
      favorites,
      toggleFavorite,
      isAuthModalOpen,
      setIsAuthModalOpen,
      authModalMode,
      setAuthModalMode,
      authPromptReason,
      setAuthPromptReason,
      toasts,
      showToast,
      removeToast,
      logout,
      quickSearch
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
