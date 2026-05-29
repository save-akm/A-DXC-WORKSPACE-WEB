'use client';

import { useActionState, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Rocket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useMenuStore } from '@/lib/stores/menu-store';
import { loginAction } from '@/lib/auth/actions';
import { UpdatePasswordForm } from './update-password-form';
import type { LoginActionState, SessionData } from '@/lib/auth/types';

const initialState: LoginActionState = { status: 'idle' };

const CARD_CLASS =
  'relative rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 shadow-2xl shadow-indigo-500/20 overflow-hidden';

const CARD_GLOW = (
  <div
    aria-hidden
    className="absolute inset-0 pointer-events-none opacity-70"
    style={{
      background:
        'radial-gradient(circle at 50% -20%, rgba(129,140,248,0.35) 0%, rgba(168,85,247,0.15) 35%, transparent 70%)',
    }}
  />
);

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const setMenus = useMenuStore((s) => s.setMenus);

  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [view, setView] = useState<'login' | 'update-password'>('login');
  const [pendingSession, setPendingSession] = useState<SessionData | null>(null);

  const resolveTarget = useCallback(() => {
    const next = searchParams.get('next');
    return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
  }, [searchParams]);

  useEffect(() => {
    if (state.status !== 'success') return;
    if (state.data.mustChangePassword) {
      setPendingSession(state.data);
      setView('update-password');
    } else {
      setSession({
        user: state.data.user,
        accessToken: state.data.accessToken,
        expiresAt: state.data.expiresAt,
      });
      setMenus(state.data.menus);
      router.push(resolveTarget());
    }
  }, [state, setSession, setMenus, router, resolveTarget]);

  const handlePasswordUpdated = useCallback(() => {
    if (!pendingSession) return;
    setSession({
      user: pendingSession.user,
      accessToken: pendingSession.accessToken,
      expiresAt: pendingSession.expiresAt,
    });
    setMenus(pendingSession.menus);
    router.push(resolveTarget());
  }, [pendingSession, setSession, setMenus, router, resolveTarget]);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Ambient gradient background */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(99,102,241,0.18) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(236,72,153,0.12) 0%, transparent 55%)',
        }}
      />

      {/* Back to home — only on login view */}
      {view === 'login' && (
        <button
          type="button"
          onClick={() => router.push('/')}
          className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าแรก
        </button>
      )}

      <AnimatePresence mode="wait">
        {view === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ x: -80, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className={CARD_CLASS}>
              {CARD_GLOW}
              <div className="relative p-7 sm:p-9">
                <div className="flex flex-col items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      ยินดีต้อนรับกลับมา
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                      เข้าสู่{' '}
                      <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent font-semibold">
                        A-DXC WorkSpace Center
                      </span>
                    </p>
                  </div>
                </div>

                <form action={formAction} className="space-y-4">
                  <div>
                    <label
                      htmlFor="login-identifier"
                      className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5"
                    >
                      อีเมล
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <input
                        id="login-identifier"
                        name="identifier"
                        type="text"
                        placeholder="name@a-dxc.com"
                        required
                        autoComplete="username"
                        autoFocus
                        disabled={pending}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm
                          bg-zinc-100/70 dark:bg-white/5
                          border border-zinc-200 dark:border-white/10
                          text-foreground placeholder:text-muted-foreground/50
                          outline-none focus:border-indigo-400/60 focus:bg-white dark:focus:bg-white/[0.07]
                          transition-colors disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5"
                    >
                      รหัสผ่าน
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        disabled={pending}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm
                          bg-zinc-100/70 dark:bg-white/5
                          border border-zinc-200 dark:border-white/10
                          text-foreground placeholder:text-muted-foreground/50
                          outline-none focus:border-indigo-400/60 focus:bg-white dark:focus:bg-white/[0.07]
                          transition-colors disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
                      <input
                        type="checkbox"
                        name="remember"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-white/20 accent-indigo-600"
                      />
                      จดจำการเข้าสู่ระบบ
                    </label>
                    <button
                      type="button"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  </div>

                  {state.status === 'error' && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs
                        bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300"
                    >
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{state.error}</span>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={pending}
                    whileHover={pending ? undefined : { scale: 1.02 }}
                    whileTap={pending ? undefined : { scale: 0.97 }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold
                      bg-indigo-600 hover:bg-indigo-700 text-white
                      shadow-lg shadow-indigo-500/30
                      transition-colors cursor-pointer
                      disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        กำลังเข้าสู่ระบบ…
                      </>
                    ) : (
                      <>
                        เข้าสู่ระบบ
                        <Rocket className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    การเชื่อมต่อปลอดภัยด้วย SSO ของ A-DXC
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ยังไม่มีบัญชี?{' '}
                    <button
                      type="button"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-semibold"
                    >
                      ติดต่อทีม IT
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="update-password"
            initial={{ x: 80, opacity: 0, scale: 0.97 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -80, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className={CARD_CLASS}>
              {CARD_GLOW}
              <div className="relative p-7 sm:p-9">
                {pendingSession && (
                  <UpdatePasswordForm
                    accessToken={pendingSession.accessToken}
                    refreshToken={pendingSession.pendingRefreshToken!}
                    onSuccess={handlePasswordUpdated}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
