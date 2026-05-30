'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Users, ChevronDown } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { fetchUserPermissions, fetchMenuList, patchUserPermissions } from '@/lib/api/permissions';
import { PermissionsHeader } from './permissions-header';
import { UserSectionCard } from './user-section-card';
import type {
  UserMenuPermission,
  MenuItem,
  DirtyKey,
  DirtyEntry,
  UserPermissionPatch,
} from '../types';

const ICON_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #a855f7, #db2777)',
};

export function UserPermissionsTab() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [items, setItems] = useState<UserMenuPermission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Map<DirtyKey, DirtyEntry>>(new Map());
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMenuList()
      .then((list) => {
        setMenus(list);
        if (list.length > 0) setSelectedMenuId(list[0].id);
      })
      .catch(() => toast.error('ไม่สามารถโหลด menu list ได้'));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!selectedMenuId) return;
    setLoading(true);
    setPage(1);
    fetchUserPermissions(selectedMenuId, 1, debouncedSearch)
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .catch(() => toast.error('ไม่สามารถโหลดข้อมูล users ได้'))
      .finally(() => setLoading(false));
  }, [selectedMenuId, debouncedSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMenuDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedMenu = menus.find((m) => m.id === selectedMenuId);
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

  const handleDiscard = useCallback(() => setDirty(new Map()), []);

  const handleMenuChange = useCallback(
    (menuId: string) => {
      if (dirty.size > 0) {
        const ok = window.confirm('มีการเปลี่ยนแปลงที่ยังไม่บันทึก ต้องการออกไหม?');
        if (!ok) return;
        setDirty(new Map());
      }
      setSelectedMenuId(menuId);
      setShowMenuDropdown(false);
    },
    [dirty],
  );

  const handleLoadMore = useCallback(async () => {
    if (!selectedMenuId) return;
    const nextPage = page + 1;
    try {
      const data = await fetchUserPermissions(selectedMenuId, nextPage, debouncedSearch);
      setItems((prev) => [...prev, ...data.items]);
      setPage(nextPage);
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลเพิ่มได้');
    }
  }, [selectedMenuId, page, debouncedSearch]);

  const handleSave = useCallback(async () => {
    if (dirty.size === 0) return;
    setSaving(true);
    const snapshot = new Map(dirty);
    try {
      const changes: UserPermissionPatch[] = Array.from(snapshot.entries()).map(([key, entry]) => {
        const parts = key.split(':');
        return {
          userId: parts[1],
          menuId: parts[3],
          action: parts[5] as UserPermissionPatch['action'],
          value: entry.current,
        };
      });
      await patchUserPermissions(changes);
      setItems((prev) =>
        prev.map((item) => {
          const updatedActions = { ...item.actions };
          (Object.keys(updatedActions) as UserPermissionPatch['action'][]).forEach((action) => {
            const key = `user:${item.userId}:menu:${item.menuId}:action:${action}`;
            const entry = snapshot.get(key);
            if (entry) updatedActions[action] = entry.current;
          });
          return { ...item, actions: updatedActions };
        }),
      );
      setDirty(new Map());
      toast.success('บันทึก User Permissions สำเร็จ');
    } catch {
      toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }, [dirty]);

  return (
    <div>
      <PermissionsHeader
        icon={Users}
        iconStyle={ICON_STYLE}
        title="User Permissions Settings"
        description="Override permissions per individual user"
        dirtyCount={dirtyCount}
        saving={saving}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />

      {/* Search toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex max-w-xs flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาชื่อหรือ role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
        </div>
      </div>

      {/* User section card */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        {/* Header with menu dropdown */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div
              className="h-4.5 w-0.75 shrink-0 rounded-full"
              style={{ background: 'linear-gradient(to bottom, #6366f1, #7c3aed)' }}
            />
            <span className="text-[13px] font-bold text-foreground">
              {selectedMenu?.name ?? '—'}
            </span>
            <span className="text-[10px] text-muted-foreground">{total} users</span>
          </div>

          {/* Menu dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Select Menu:</span>
              <button
                type="button"
                onClick={() => setShowMenuDropdown((v) => !v)}
                className="flex min-w-32.5 items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-[11px] text-foreground cursor-pointer hover:border-border/80 transition-colors"
              >
                <span>{selectedMenu?.name ?? 'เลือก menu'}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            {showMenuDropdown && (
              <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                {menus.map((menu) => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => handleMenuChange(menu.id)}
                    className={`w-full px-4 py-2.5 text-left text-[12px] transition-colors cursor-pointer ${
                      menu.id === selectedMenuId
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {menu.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            กำลังโหลด…
          </div>
        ) : (
          <UserSectionCard
            menuId={selectedMenuId}
            items={items}
            total={total}
            dirty={dirty}
            onToggle={handleToggle}
            onLoadMore={handleLoadMore}
          />
        )}
      </div>
    </div>
  );
}
