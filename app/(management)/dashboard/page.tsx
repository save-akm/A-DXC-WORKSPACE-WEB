'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/');
  }, [status, router]);

  return (
    <div className="p-6">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          ยินดีต้อนรับ{user ? ` ${user.firstName} ${user.lastName}` : ''}
        </p>
      </div>
  );
}
