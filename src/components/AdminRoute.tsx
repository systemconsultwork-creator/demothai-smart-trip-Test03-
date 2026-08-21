import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAdmin, setCurrentView, t, showToast } = useApp();

  useEffect(() => {
    if (!isAdmin) {
      showToast(t('auth.adminOnly'), 'error');
      setCurrentView('home');
    }
  }, [isAdmin, setCurrentView, showToast, t]);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">{t('auth.accessDenied')}</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {t('auth.adminOnly')}
            </p>
          </div>
          <button
            onClick={() => setCurrentView('home')}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('nav.home')}</span>
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">{t('auth.accessDenied')}</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {t('auth.adminOnly')}
            </p>
          </div>
          <button
            onClick={() => setCurrentView('home')}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('nav.home')}</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
