'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, AppWindow, FolderTree, MousePointerClick, Plus, Settings2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { StatCard } from '@/components/management/stat-card';
import { useMenuStore } from '@/lib/stores/menu-store';
import type { MenuNode } from '@/lib/auth/types';
import {
  fetchAdminApps,
  fetchAdminCategories,
  createApp,
  updateApp,
  deleteApp,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/api/apphub';
import type {
  AdminApp,
  AdminCategory,
  CreateAppInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/lib/apphub/types';
import { cn } from '@/lib/utils';
import { AppCard } from './_components/app-card';
import { AppModal } from './_components/app-modal';
import { CategoryDrawer } from './_components/category-drawer';
import { AppIcon } from '@/components/app-icon';
import { ConfirmDialog } from '@/components/management/confirm-dialog';

function findMenuByPath(nodes: MenuNode[], path: string): MenuNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node;
    const found = findMenuByPath(node.children, path);
    if (found) return found;
  }
}

export default function AppsPage() {
  const menus = useMenuStore(s => s.menus);
  const appsMenu = useMemo(() => findMenuByPath(menus, '/admin/apps'), [menus]);
  const canCreate = appsMenu?.permissions.includes('CREATE') ?? false;
  const canUpdate = appsMenu?.permissions.includes('UPDATE') ?? false;
  const canDelete = appsMenu?.permissions.includes('DELETE') ?? false;

  const [apps, setApps] = useState<AdminApp[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const [appModalOpen, setAppModalOpen] = useState(false);
  const [editApp, setEditApp] = useState<AdminApp | null>(null);
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false);

  const [deleteAppTarget, setDeleteAppTarget] = useState<AdminApp | null>(null);
  const [deleteCatTarget, setDeleteCatTarget] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([fetchAdminApps(), fetchAdminCategories()])
      .then(([a, c]) => { setApps(a); setCategories(c); })
      .catch(() => toast.error('ไม่สามารถโหลดข้อมูลแอปได้'))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const totalClicks = useMemo(() => apps.reduce((s, a) => s + a.clickCount, 0), [apps]);
  const activeCount = useMemo(() => apps.filter(a => a.isActive).length, [apps]);

  const filtered = useMemo(() => {
    let result = apps;
    if (categoryFilter) result = result.filter(a => a.categoryId === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        a =>
          a.name.toLowerCase().includes(q) ||
          (a.description ?? '').toLowerCase().includes(q) ||
          a.url.toLowerCase().includes(q) ||
          a.category.name.toLowerCase().includes(q),
      );
    }
    return result;
  }, [apps, search, categoryFilter]);

  // ── App handlers ──────────────────────────────────────────────────────────────

  const openCreateApp = useCallback(() => { setEditApp(null); setAppModalOpen(true); }, []);
  const openEditApp = useCallback((app: AdminApp) => { setEditApp(app); setAppModalOpen(true); }, []);

  const handleSubmitApp = useCallback(async (input: CreateAppInput) => {
    try {
      if (editApp) {
        const updated = await updateApp(editApp.id, input);
        setApps(prev => prev.map(a => (a.id === updated.id ? updated : a)));
        toast.success('แก้ไขแอปสำเร็จ');
      } else {
        const created = await createApp(input);
        setApps(prev => [...prev, created]);
        toast.success(`เพิ่มแอป "${created.name}" สำเร็จ`);
      }
      // Refresh category counts so the "x แอป" badges stay accurate.
      fetchAdminCategories().then(setCategories).catch(() => {});
    } catch (e) {
      toast.error((e as Error).message || 'บันทึกไม่สำเร็จ');
      throw e;
    }
  }, [editApp]);

  const handleToggleAppActive = useCallback(async (app: AdminApp) => {
    const next = !app.isActive;
    setApps(prev => prev.map(a => (a.id === app.id ? { ...a, isActive: next } : a)));
    try {
      await updateApp(app.id, { isActive: next });
    } catch {
      setApps(prev => prev.map(a => (a.id === app.id ? { ...a, isActive: app.isActive } : a)));
      toast.error('อัปเดตสถานะไม่สำเร็จ');
    }
  }, []);

  const handleDeleteApp = useCallback(async () => {
    if (!deleteAppTarget) return;
    setDeleting(true);
    try {
      await deleteApp(deleteAppTarget.id);
      setApps(prev => prev.filter(a => a.id !== deleteAppTarget.id));
      toast.success(`ลบแอป "${deleteAppTarget.name}" สำเร็จ`);
      setDeleteAppTarget(null);
      fetchAdminCategories().then(setCategories).catch(() => {});
    } catch (e) {
      toast.error((e as Error).message || 'ลบไม่สำเร็จ');
    } finally {
      setDeleting(false);
    }
  }, [deleteAppTarget]);

  // ── Category handlers ─────────────────────────────────────────────────────────

  const handleCreateCategory = useCallback(async (input: CreateCategoryInput) => {
    try {
      const created = await createCategory(input);
      setCategories(prev => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
      toast.success(`เพิ่มหมวด "${created.name}" สำเร็จ`);
    } catch (e) {
      toast.error((e as Error).message || 'เพิ่มหมวดไม่สำเร็จ');
      throw e;
    }
  }, []);

  const handleUpdateCategory = useCallback(async (id: string, input: UpdateCategoryInput) => {
    try {
      const updated = await updateCategory(id, input);
      setCategories(prev => prev.map(c => (c.id === id ? updated : c)));
      // Keep app cards' category name in sync.
      setApps(prev => prev.map(a => (a.categoryId === id ? { ...a, category: { id, name: updated.name } } : a)));
    } catch (e) {
      toast.error((e as Error).message || 'แก้ไขหมวดไม่สำเร็จ');
      throw e;
    }
  }, []);

  const handleDeleteCategory = useCallback(async () => {
    if (!deleteCatTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteCatTarget.id);
      setCategories(prev => prev.filter(c => c.id !== deleteCatTarget.id));
      toast.success(`ลบหมวด "${deleteCatTarget.name}" สำเร็จ`);
      setDeleteCatTarget(null);
    } catch (e) {
      // 409 CATEGORY_HAS_APPS surfaces here.
      toast.error((e as Error).message || 'ลบหมวดไม่สำเร็จ');
    } finally {
      setDeleting(false);
    }
  }, [deleteCatTarget]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">App Hub</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">จัดการแอปพลิเคชันและหมวดหมู่บนหน้า landing</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาแอป…"
              className="w-40 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none sm:w-52"
            />
          </div>
          <button
            type="button"
            onClick={() => setCategoryPanelOpen(true)}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-[12px] font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Settings2 className="h-3.5 w-3.5" />
            หมวดหมู่
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={openCreateApp}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-4 py-2 text-[12px] font-semibold text-white shadow-md shadow-indigo-500/30 transition-shadow hover:shadow-indigo-500/50"
            >
              <Plus className="h-3.5 w-3.5" />
              เพิ่มแอป
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard icon={AppWindow} label="แอปทั้งหมด" value={apps.length} gradient="from-indigo-500 to-violet-500" />
        <StatCard icon={AppWindow} label="เปิดใช้งาน" value={activeCount} gradient="from-emerald-500 to-teal-500" />
        <StatCard icon={FolderTree} label="หมวดหมู่" value={categories.length} gradient="from-violet-500 to-fuchsia-500" />
        <StatCard icon={MousePointerClick} label="คลิกรวม" value={totalClicks} gradient="from-amber-500 to-orange-500" />
      </div>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          {/* All */}
          <button
            type="button"
            onClick={() => setCategoryFilter('')}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors',
              !categoryFilter
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            <span>ทั้งหมด</span>
            <span className={cn(
              'rounded-full px-1.5 text-[10px] font-bold tabular-nums',
              !categoryFilter ? 'bg-background/20' : 'bg-foreground/10 text-muted-foreground',
            )}>
              {apps.length}
            </span>
          </button>

          {/* Per-category */}
          {[...categories].sort((a, b) => a.sortOrder - b.sortOrder).map(cat => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(isSelected ? '' : cat.id)}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all',
                  isSelected
                    ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                  !cat.isActive && !isSelected && 'opacity-40',
                )}
                title={!cat.isActive ? `${cat.name} (ปิดใช้งาน)` : cat.name}
              >
                <AppIcon name={cat.icon} className="h-3 w-3 shrink-0" />
                <span className={cn(!cat.isActive && !isSelected && 'line-through')}>
                  {cat.name}
                </span>
                <span className={cn(
                  'rounded-full px-1.5 text-[10px] font-bold tabular-nums',
                  isSelected ? 'bg-white/20' : 'bg-foreground/10 text-muted-foreground',
                )}>
                  {cat._count.apps}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-muted/40" />
          ))}
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((app, i) => (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
              >
                <AppCard
                  app={app}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  onEdit={openEditApp}
                  onDelete={setDeleteAppTarget}
                  onToggleActive={handleToggleAppActive}
                />
              </motion.div>
            ))}

            {canCreate && !search && !categoryFilter && (
              <motion.button
                key="add-app-card"
                type="button"
                layout
                onClick={openCreateApp}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-transparent text-muted-foreground transition-colors hover:border-indigo-500/40 hover:text-foreground"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-dashed border-border bg-muted">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-[12px] font-semibold">เพิ่มแอปใหม่</span>
              </motion.button>
            )}
          </AnimatePresence>

          {filtered.length === 0 && (search || categoryFilter) && (
            <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
              ไม่พบแอปที่ตรงกับเงื่อนไข
            </div>
          )}
          {apps.length === 0 && !search && !categoryFilter && !canCreate && (
            <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
              ยังไม่มีแอปในระบบ
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AppModal
        open={appModalOpen}
        app={editApp}
        categories={categories}
        onClose={() => setAppModalOpen(false)}
        onSubmit={handleSubmitApp}
      />

      <CategoryDrawer
        open={categoryPanelOpen}
        categories={categories}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onClose={() => setCategoryPanelOpen(false)}
        onCreate={handleCreateCategory}
        onUpdate={handleUpdateCategory}
        onDelete={setDeleteCatTarget}
      />

      <ConfirmDialog
        open={deleteAppTarget !== null}
        title="ลบแอป"
        loading={deleting}
        confirmLabel="ลบแอป"
        message={
          <>ต้องการลบแอป <span className="font-semibold text-foreground">&quot;{deleteAppTarget?.name}&quot;</span> ใช่ไหม? การกระทำนี้ไม่สามารถยกเลิกได้</>
        }
        onConfirm={handleDeleteApp}
        onCancel={() => !deleting && setDeleteAppTarget(null)}
      />

      <ConfirmDialog
        open={deleteCatTarget !== null}
        title="ลบหมวดหมู่"
        loading={deleting}
        confirmLabel="ลบหมวด"
        message={
          <>ต้องการลบหมวด <span className="font-semibold text-foreground">&quot;{deleteCatTarget?.name}&quot;</span> ใช่ไหม? หมวดที่ยังมีแอปอยู่จะลบไม่ได้</>
        }
        onConfirm={handleDeleteCategory}
        onCancel={() => !deleting && setDeleteCatTarget(null)}
      />
    </div>
  );
}
