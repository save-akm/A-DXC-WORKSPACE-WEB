'use client';

import { motion } from 'framer-motion';
import { Settings2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { AccountForm } from './components/account-form';

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <motion.div
      className="w-full px-4 py-2 sm:py-4 lg:py-6 2xl:py-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <header className="mb-6 flex items-center gap-3 sm:mb-6 2xl:mb-8">
        <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 via-fuchsia-500/15 to-pink-500/15 ring-1 ring-border/60">
          <Settings2 className="size-5 text-violet-500" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            ตั้งค่าบัญชี
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            จัดการข้อมูลส่วนตัวและรูปประจำตัวของคุณ
          </p>
        </div>
      </header>

      {user ? (
        <AccountForm user={user} />
      ) : (
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card/40" />
      )}
    </motion.div>
  );
}
