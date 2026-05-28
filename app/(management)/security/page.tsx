'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { SecurityForm } from './components/security-form';
import type { SecurityPreset } from './components/security-form';

// TODO: เปลี่ยนเป็นโหลดจาก API จริงเมื่อ backend พร้อม
const mockPreset: SecurityPreset = {
  twoFactorEnabled: false,
  loginAlertsEnabled: true,
  loginHistory: [
    {
      id: 'h1',
      occurredAt: '2023-07-20T14:30:00Z',
      ipAddress: '192.168.1.1',
      location: 'Ayutthaya, TH',
    },
    {
      id: 'h2',
      occurredAt: '2023-07-19T09:15:00Z',
      ipAddress: '10.0.0.1',
      location: 'Prachin buri, TH',
    },
    {
      id: 'h3',
      occurredAt: '2023-07-18T22:45:00Z',
      ipAddress: '172.16.0.1',
      location: 'Prachin buri, TH',
    },
  ],
  activeSessions: [
    {
      id: 's1',
      device: 'laptop',
      browser: 'Chrome',
      os: 'Windows 10',
      current: true,
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 's2',
      device: 'smartphone',
      browser: 'Safari',
      os: 'iOS 15',
      current: false,
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 's3',
      device: 'tablet',
      browser: 'Firefox',
      os: 'Android 12',
      current: false,
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
  ],
};

export default function SecurityPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/');
  }, [status, router]);

  return (
    <div className="w-full px-4 py-2 sm:py-4 lg:py-6 2xl:py-8">
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
    </div>
  );
}
