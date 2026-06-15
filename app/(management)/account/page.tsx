'use client';

import { Settings2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { PageHeader } from '@/components/management/page-header';
import { AccountForm } from './components/account-form';

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="page-shell">
      <PageHeader
        icon={Settings2}
        title="ตั้งค่าบัญชี"
        subtitle="จัดการข้อมูลส่วนตัวและรูปประจำตัวของคุณ"
      />

      {user ? (
        <AccountForm user={user} />
      ) : (
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card/40" />
      )}
    </div>
  );
}
