import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ensureFirestoreUser, loginWithGoogle } from '../services/firebase';
import { User } from '../types';
import { X, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ADMIN_EMAIL, isAdminEmail } from '../config/admin';

const GoogleIcon: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, setUser, t, lang, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    if (googleLoading || loading) return;
    setIsAuthModalOpen(false);
  };

  const handleGoogleLogin = async () => {
    if (googleLoading || loading) return;
    setGoogleLoading(true);
    try {
      const firebaseUser = await loginWithGoogle();
      if (!firebaseUser) return;

      // Keep backend users.json in sync, but never trust its client-supplied role as the source of admin truth.
      if (firebaseUser.email) {
        await api.login(firebaseUser.email).catch(() => null);
      }

      // Admin is determined only by the designated Firebase account email.
      const firestoreProfile = await ensureFirestoreUser(firebaseUser);
      const verifiedRole: 'admin' | 'user' = isAdminEmail(firebaseUser.email) ? 'admin' : 'user';

      const appUser: User = {
        id: firebaseUser.uid,
        name: firestoreProfile.name,
        email: firestoreProfile.email,
        role: verifiedRole,
        avatar: firestoreProfile.avatar,
        createdAt: firestoreProfile.createdAt,
        favorites: firestoreProfile.favorites
      };

      setUser(appUser);
      showToast(
        lang === 'th'
          ? `ยินดีต้อนรับ, ${appUser.name}!`
          : lang === 'zh'
          ? `欢迎，${appUser.name}！`
          : `Welcome, ${appUser.name}!`,
        'success'
      );
      setIsAuthModalOpen(false);
    } catch (error: any) {
      const errorCode = error?.code || error?.message || '';
      if (errorCode.includes('auth/popup-closed-by-user') || errorCode.includes('auth/cancelled-popup-request')) {
        showToast(t('auth.googleLoginCancelled'), 'info');
      } else if (errorCode.includes('auth/api-key-not-valid') || errorCode.includes('auth/invalid-api-key') || errorCode.includes('auth/unauthorized-domain')) {
        showToast(
          lang === 'th'
            ? 'ระบบ Firebase ยังไม่ได้ตั้งค่า API Key หรือโดเมนที่ถูกต้อง'
            : lang === 'zh'
            ? 'Firebase API Key 尚未配置或域名未授权。'
            : 'Google Sign-in is not configured correctly yet.',
          'error'
        );
      } else if (errorCode.includes('auth/popup-blocked')) {
        showToast(
          lang === 'th' ? 'หน้าต่างป็อปอัปถูกบล็อก กรุณาอนุญาตป็อปอัปบนเบราว์เซอร์' : lang === 'zh' ? '登录弹窗被拦截，请在浏览器中允许弹窗。' : 'Popup blocked. Please allow popups for this site.',
          'error'
        );
      } else if (errorCode.includes('auth/network-request-failed')) {
        showToast(
          lang === 'th' ? 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ต' : lang === 'zh' ? '网络连接失败，请检查网络设置。' : 'Network error. Please check your connection.',
          'error'
        );
      } else {
        showToast(t('auth.googleLoginFailed'), 'error');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAdminMode = async () => {
    setLoading(true);
    try {
      // Temporary local admin shortcut. The real admin identity is still the exact designated email.
      const res = await api.login(ADMIN_EMAIL);
      if (res.user.email !== ADMIN_EMAIL || res.user.role !== 'admin') {
        throw new Error('Designated admin account is not configured correctly.');
      }
      setUser(res.user);
      showToast(
        lang === 'th' ? 'เข้าสู่ระบบสำเร็จในฐานะผู้ดูแลระบบ (Admin Mode)' : lang === 'zh' ? '已进入管理员模式 (Admin Mode)' : 'Logged in as Administrator (Admin Mode)',
        'success'
      );
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Admin mode auth failed', err);
      showToast(err?.message || 'Admin mode login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getSubtitle = () => {
    if (lang === 'th') return 'เข้าสู่ระบบเพื่อเข้าถึงฟีเจอร์การท่องเที่ยวส่วนตัวของคุณ';
    if (lang === 'zh') return '登录以获取您的个性化旅游功能。';
    return 'Sign in to access your personalized travel features.';
  };

  return (
    <AnimatePresence>
      <div id="auth-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" onClick={handleClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()} className="relative w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 space-y-6">
          <button id="auth-modal-close-btn" onClick={handleClose} className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold uppercase tracking-wider"><Sparkles className="w-4 h-4 text-emerald-600" /><span>Thai Smart Trip Explorer</span></div>
            <h2 id="auth-modal-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{t('auth.login_title')}</h2>
            <p id="auth-modal-desc" className="text-xs sm:text-sm text-slate-500 leading-relaxed">{getSubtitle()}</p>
          </div>

          <div className="space-y-4 pt-1">
            <button id="google-signin-btn" type="button" onClick={handleGoogleLogin} disabled={googleLoading || loading} className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-sm sm:text-base shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {googleLoading ? <><div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" /><span>{t('auth.loggingIn')}</span></> : <><GoogleIcon /><span>{t('auth.loginWithGoogle')}</span></>}
            </button>

            <div className="relative flex items-center justify-center py-1"><div className="w-full border-t border-slate-200" /><span className="bg-white px-3 text-xs font-medium text-slate-400 select-none">{t('auth.or')}</span><div className="w-full border-t border-slate-200" /></div>

            <button id="auth-admin-mode-btn" type="button" onClick={handleAdminMode} disabled={loading || googleLoading} className="w-full py-3 px-5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 active:scale-[0.99] border border-amber-300 hover:border-amber-400 text-amber-900 font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <><div className="w-4 h-4 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin" /><span>{t('auth.loggingIn')}</span></> : <><ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" /><span>{t('auth.admin_mode')}</span></>}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
