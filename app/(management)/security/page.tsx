'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { SecurityForm } from './components/security-form';
import type { SecurityPreset } from './components/security-form';

const mockPreset: SecurityPreset = {
  twoFactorEnabled: false,
  loginAlertsEnabled: false,
  loginHistory: [],
  activeSessions: [],
};

export default function SecurityPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/');
  }, [status, router]);

  return (
    <motion.div
      className="w-full px-4 py-2 sm:py-4 lg:py-6 2xl:py-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <header className="mb-6 flex items-center gap-3 sm:mb-6 2xl:mb-8">
        <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/15 to-sky-500/15 ring-1 ring-border/60">
          <ShieldCheck className="size-5 text-emerald-500" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            ความปลอดภัย
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            จัดการรหัสผ่าน การยืนยันตัวตน และเซสชันของบัญชีคุณ
          </p>
        </div>
      </header>

      {user ? (
        <SecurityForm preset={mockPreset} />
      ) : (
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card/40" />
      )}
    </motion.div>
  );
}
