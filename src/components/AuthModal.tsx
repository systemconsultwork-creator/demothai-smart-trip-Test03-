import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { loginWithGoogle } from '../services/firebase';
import { User } from '../types';
import { 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  Sparkles, 
  Heart,
  ArrowLeft,
  LogIn,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GoogleIcon: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authModalMode, 
    setAuthModalMode, 
    authPromptReason,
    setAuthPromptReason,
    setUser, 
    t, 
    lang,
    showToast 
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('');
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
      if (firebaseUser) {
        // Inspect token claims for real admin role assignment
        const tokenResult = await firebaseUser.getIdTokenResult().catch(() => null);
        const hasAdminClaim = Boolean(tokenResult?.claims?.role === 'admin');

        let verifiedRole: 'admin' | 'user' = hasAdminClaim ? 'admin' : 'user';

        // Check backend database for existing verified user role
        try {
          if (firebaseUser.email) {
            const backendRes = await api.login(firebaseUser.email).catch(() => null);
            if (backendRes?.user?.role) {
              verifiedRole = backendRes.user.role;
            }
          }
        } catch {
          // Graceful fallback
        }

        const appUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Explorer',
          email: firebaseUser.email || '',
          role: verifiedRole,
          avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          createdAt: new Date().toISOString(),
          favorites: []
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
      }
    } catch (error: any) {
      const errorCode = error?.code || error?.message || '';
      if (
        errorCode.includes('auth/popup-closed-by-user') ||
        errorCode.includes('auth/cancelled-popup-request')
      ) {
        showToast(t('auth.googleLoginCancelled'), 'info');
      } else if (
        errorCode.includes('auth/api-key-not-valid') ||
        errorCode.includes('auth/invalid-api-key') ||
        errorCode.includes('auth/unauthorized-domain')
      ) {
        showToast(
          lang === 'th'
            ? 'ระบบ Firebase ยังไม่ได้ตั้งค่า API Key หรือโดเมนที่ถูกต้อง สามารถเข้าสู่ระบบด้วยอีเมลแทนได้'
            : lang === 'zh'
            ? 'Firebase API Key 尚未配置或域名未授权，您可以先使用邮箱登录。'
            : 'Google Sign-in is not configured with a valid API key yet. Please use email sign in.',
          'error'
        );
      } else if (errorCode.includes('auth/popup-blocked')) {
        showToast(
          lang === 'th'
            ? 'หน้าต่างป็อปอัปถูกบล็อก กรุณาอนุญาตป็อปอัปบนเบราว์เซอร์'
            : lang === 'zh'
            ? '登录弹窗被拦截，请在浏览器中允许弹窗。'
            : 'Popup blocked. Please allow popups for this site.',
          'error'
        );
      } else if (errorCode.includes('auth/network-request-failed')) {
        showToast(
          lang === 'th'
            ? 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ต'
            : lang === 'zh'
            ? '网络连接失败，请检查网络设置。'
            : 'Network error. Please check your connection.',
          'error'
        );
      } else {
        showToast(t('auth.googleLoginFailed'), 'error');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      if (authModalMode === 'login') {
        const res = await api.login(email);
        setUser(res.user);
        showToast(
          lang === 'th' ? `ยินดีต้อนรับกลับ, ${res.user.name}!` : lang === 'zh' ? `欢迎回来，${res.user.name}！` : `Welcome back, ${res.user.name}!`,
          'success'
        );
      } else {
        const res = await api.register(name || email.split('@')[0], email);
        setUser(res.user);
        showToast(
          lang === 'th' ? `สร้างบัญชีสำเร็จ! ยินดีต้อนรับคุณ ${res.user.name}` : lang === 'zh' ? `账号创建成功！欢迎您，${res.user.name}` : `Account created! Welcome, ${res.user.name}!`,
          'success'
        );
      }
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Auth error', err);
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminMode = async () => {
    setLoading(true);
    try {
      const res = await api.login('admin@thaismarttrip.com');
      setUser(res.user);
      showToast(
        lang === 'th' 
          ? 'เข้าสู่ระบบสำเร็จในฐานะผู้ดูแลระบบ (Admin Mode)'
          : lang === 'zh'
          ? '已进入管理员模式 (Admin Mode)'
          : 'Logged in as Administrator (Admin Mode)',
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

  const isFavoritePrompt = authModalMode === 'favorite_prompt';

  return (
    <AnimatePresence>
      <div 
        id="auth-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 space-y-6"
        >
          {/* Close Button [ × ] */}
          <button
            id="auth-modal-close-btn"
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* VIEW MODE 1: FAVORITE REQUIREMENT PROMPT */}
          {isFavoritePrompt ? (
            <div id="favorite-auth-prompt" className="space-y-6 text-center pt-2">
              {/* Heart Icon Badge */}
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <Heart className="w-8 h-8 fill-rose-500 stroke-rose-600" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 id="favorite-modal-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {t('auth.favorite_modal_title')}
                </h2>
                <p id="favorite-modal-desc" className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                  {t('auth.favorite_modal_desc')}
                </p>
              </div>

              {/* Action Buttons: Login & Register & Close */}
              <div className="space-y-3 pt-2">
                <button
                  id="favorite-prompt-login-btn"
                  type="button"
                  onClick={() => setAuthModalMode('login')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('auth.login_btn')}</span>
                </button>

                <button
                  id="favorite-prompt-register-btn"
                  type="button"
                  onClick={() => setAuthModalMode('register')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-800 border border-slate-300 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>{t('auth.register_btn')}</span>
                </button>

                <button
                  id="favorite-prompt-close-btn"
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 px-6 rounded-2xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium text-xs transition-colors"
                >
                  {t('auth.close_btn')}
                </button>
              </div>

              {/* Developer Admin Mode */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  id="favorite-prompt-admin-btn"
                  type="button"
                  onClick={handleAdminMode}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Admin Mode</span>
                </button>
              </div>
            </div>
          ) : (
            /* VIEW MODE 2: LOGIN / REGISTER FORMS */
            <>
              {/* Back Button if navigated from favorite prompt */}
              {authPromptReason === 'favorite' && (
                <button
                  type="button"
                  onClick={() => setAuthModalMode('favorite_prompt')}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-semibold transition-colors -mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('auth.back_to_prompt')}</span>
                </button>
              )}

              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Thai Smart Trip Explorer</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {authModalMode === 'login' ? t('auth.login_title') : t('auth.register_title')}
                </h2>
                <p className="text-xs text-slate-500">
                  {authModalMode === 'login' 
                    ? (lang === 'th' ? 'เข้าสู่ระบบเพื่อบันทึกสถานที่โปรดและร่วมเขียนรีวิว' : lang === 'zh' ? '登录以保存收藏景点并发表真实评价' : 'Sign in to save favorite destinations and write reviews')
                    : (lang === 'th' ? 'สร้างบัญชีเพื่อเข้าร่วมชุมชนท่องเที่ยวไทย' : lang === 'zh' ? '注册账号加入泰国旅游社区' : 'Create an account to join the Thai travel community')}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {authModalMode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">{t('auth.name')}</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Somchai Explorer"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t('auth.password')}</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('auth.loggingIn')}</span>
                    </>
                  ) : (
                    authModalMode === 'login' ? t('auth.login_btn') : t('auth.register_btn')
                  )}
                </button>
              </form>

              {/* ─────── OR Divider ─────── */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-200"></div>
                <span className="bg-white px-3 text-xs font-semibold text-slate-400 tracking-wider uppercase shrink-0 select-none">
                  {t('auth.or')}
                </span>
                <div className="w-full border-t border-slate-200"></div>
              </div>

              {/* ─── Sign in with Google Button ─── */}
              <button
                id="google-signin-btn"
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {googleLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div>
                    <span>{t('auth.loggingIn')}</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon />
                    <span>{t('auth.loginWithGoogle')}</span>
                  </>
                )}
              </button>

              {/* Toggle Mode */}
              <div className="text-center pt-2 border-t border-slate-100">
                {authModalMode === 'login' ? (
                  <p className="text-xs text-slate-500">
                    {t('auth.no_account')}{' '}
                    <button
                      type="button"
                      onClick={() => setAuthModalMode('register')}
                      className="text-emerald-700 hover:underline font-bold"
                    >
                      {t('auth.register_title')}
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    {t('auth.have_account')}{' '}
                    <button
                      type="button"
                      onClick={() => setAuthModalMode('login')}
                      className="text-emerald-700 hover:underline font-bold"
                    >
                      {t('auth.login_title')}
                    </button>
                  </p>
                )}
              </div>

              {/* ──────────────── Developer Admin Mode ──────────────── */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  id="auth-admin-mode-btn"
                  type="button"
                  onClick={handleAdminMode}
                  disabled={loading || googleLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Admin Mode</span>
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
