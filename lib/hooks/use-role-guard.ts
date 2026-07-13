'use client';

import { useAuthStore } from '@/lib/stores/auth-store';

const ELEVATED_ROLES = ['SYSTEM', 'SUPER_ADMIN', 'ADMIN'] as const;

export function useRoleGuard() {
  const role = useAuthStore((s) => s.user?.role ?? '');
  const isElevated = ELEVATED_ROLES.includes(role as (typeof ELEVATED_ROLES)[number]);

  return { isElevated, role };
}
