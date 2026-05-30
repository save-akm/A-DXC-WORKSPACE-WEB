'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { fetchRolePermissions, patchRolePermissions } from '@/lib/api/permissions';
import { PermissionsHeader } from './permissions-header';
import { RoleSectionCard } from './role-section-card';
import type { RoleMenuPermission, DirtyKey, DirtyEntry, RolePermissionPatch } from '../types';

const ICON_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
};

export function RolePermissionsTab() {
  const [matrix, setMatrix] = useState<RoleMenuPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Map<DirtyKey, DirtyEntry>>(new Map());

  useEffect(() => {
    fetchRolePermissions()
      .then(setMatrix)
      .catch(() => toast.error('ไม่สามารถโหลดข้อมูล permissions ได้'))
      .finally(() => setLoading(false));
  }, []);

  const sections = useMemo(() => {
    const map = new Map<string, RoleMenuPermission[]>();
    matrix.forEach((row) => {
      if (!map.has(row.menuId)) map.set(row.menuId, []);
      map.get(row.menuId)!.push(row);
    });
    return Array.from(map.values());
  }, [matrix]);

  const dirtyCount = useMemo(() => dirty.size, [dirty]);

  const handleToggle = useCallback(
    (key: DirtyKey, original: boolean, newValue: boolean) => {
      setDirty((prev) => {
        const next = new Map(prev);
        if (newValue === original) {
          next.delete(key);
        } else {
          next.set(key, { original, current: newValue });
        }
        return next;
      });
    },
    [],
  );

  const handleDiscard = useCallback(() => {
    setDirty(new Map());
  }, []);

  const handleSave = useCallback(async () => {
    if (dirty.size === 0) return;
    setSaving(true);
    const snapshot = new Map(dirty);
    try {
      const changes: RolePermissionPatch[] = Array.from(snapshot.entries()).map(([key, entry]) => {
        const parts = key.split(':');
        return {
          roleId: parts[1],
          menuId: parts[3],
          action: parts[5] as RolePermissionPatch['action'],
          value: entry.current,
        };
      });
      await patchRolePermissions(changes);
      setMatrix((prev) =>
        prev.map((row) => {
          const updatedActions = { ...row.actions };
          (Object.keys(updatedActions) as RolePermissionPatch['action'][]).forEach((action) => {
            const key = `role:${row.roleId}:menu:${row.menuId}:action:${action}`;
            const entry = snapshot.get(key);
            if (entry) updatedActions[action] = entry.current;
          });
          return { ...row, actions: updatedActions };
        }),
      );
      setDirty(new Map());
      toast.success('บันทึก Role Permissions สำเร็จ');
    } catch {
      toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }, [dirty]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        กำลังโหลด…
      </div>
    );
  }

  return (
    <div>
      <PermissionsHeader
        icon={LayoutGrid}
        iconStyle={ICON_STYLE}
        title="Role Permissions Settings"
        description="Manage role-based access and permissions across all menus"
        dirtyCount={dirtyCount}
        saving={saving}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />

      <div className="flex flex-col gap-3.5">
        {sections.map((rows, i) => (
          <motion.div
            key={rows[0].menuId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <RoleSectionCard
              rows={rows}
              accentIndex={i}
              dirty={dirty}
              onToggle={handleToggle}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
