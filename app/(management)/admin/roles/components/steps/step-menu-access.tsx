'use client';

import { useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useMenuStore } from '@/lib/stores/menu-store';
import { MenuTransferList } from '../menu-transfer-list';
import { flattenMenus, DEFAULT_PERMS, type RoleFormState, type ActionPerms } from '../create-role-shared';

interface StepProps {
  state: RoleFormState;
  patch: (next: Partial<RoleFormState>) => void;
}

export function StepMenuAccess({ state, patch }: StepProps) {
  const menus = useMenuStore((s) => s.menus);
  const items = useMemo(() => flattenMenus(menus), [menus]);

  const selected = useMemo(() => Object.keys(state.permissions), [state.permissions]);

  function handleChange(ids: string[]) {
    // Rebuild the permissions map: keep existing action flags, default-grant new menus.
    const next: Record<string, ActionPerms> = {};
    for (const id of ids) {
      next[id] = state.permissions[id] ?? { ...DEFAULT_PERMS };
    }
    patch({ permissions: next });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-3.5 py-2.5">
        <LayoutGrid size={15} className="mt-0.5 shrink-0 text-indigo-500" />
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          เลือกเมนูที่ role นี้เข้าถึงได้ — คลิกเพื่อย้ายไป-มาระหว่าง <span className="font-medium text-foreground">Available</span> และ{' '}
          <span className="font-medium text-foreground">Assigned</span>. รายละเอียดสิทธิ์ (view/create/…) ตั้งในขั้นถัดไป
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground">
          <LayoutGrid size={22} />
          <span className="text-[12px]">ไม่พบเมนูในระบบ</span>
        </div>
      ) : (
        <MenuTransferList items={items} selected={selected} onChange={handleChange} />
      )}
    </div>
  );
}
