'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { PageHeader } from '@/components/management/page-header';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/');
  }, [status, router]);

  return (
    <div className="page-shell">
      <PageHeader
        title="Dashboard"
        subtitle={`ยินดีต้อนรับ${user ? ` ${user.firstName} ${user.lastName}` : ''}`}
      />
    </div>
  );
}
