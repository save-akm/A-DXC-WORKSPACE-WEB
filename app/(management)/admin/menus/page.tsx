'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Menu as MenuIcon, Layers, Plus, Search,
  ChevronRight, ChevronDown,
  Shield, Users, KeyRound, Activity,
  Pencil, Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { PageHeader } from '@/components/management/page-header';
import { StatCard } from '@/components/management/stat-card';
import { ActionMenu } from '@/components/management/action-menu';
import { DeleteConfirmModal } from '../organization/_components/delete-confirm-modal';
import { MenuModal } from './_components/menu-modal';
import {
  fetchAdminMenus, createMenu, updateMenu, deleteMenu,
  type Menu, type CreateMenuBody, type UpdateMenuBody,
} from '@/lib/api/menus';

// ─── Animation helpers ─────────────────────────────────────────────────────────

const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
});

// ─── Tree builder ──────────────────────────────────────────────────────────────

function buildTreeRows(items: Menu[], expanded: Set<string>): { item: Menu; depth: number }[] {
  const byParent = new Map<string | null, Menu[]>();
  for (const item of items) {
    const key = item.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(item);
  }
  for (const children of byParent.values()) {
    children.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  const rows: { item: Menu; depth: number }[] = [];
  for (const root of byParent.get(null) ?? []) {
    rows.push({ item: root, depth: 0 });
    if (root.type === 'GROUP' && expanded.has(root.id)) {
      for (const child of byParent.get(root.id) ?? []) {
        rows.push({ item: child, depth: 1 });
      }
    }
  }
  return rows;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RowSkeleton({ index }: { index: number }) {
  return (
    <tr style={{ animationDelay: `${index * 40}ms` }}>
      <td className="py-3 pl-4"><div className="h-3.5 w-5 animate-pulse rounded bg-muted" /></td>
      <td className="py-3">
        <div className="flex items-center gap-2.5">
          <div className="size-7 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </td>
      <td className="py-3"><div className="h-5 w-14 animate-pulse rounded-full bg-muted" /></td>
      <td className="hidden py-3 md:table-cell"><div className="h-3.5 w-32 animate-pulse rounded bg-muted" /></td>
      <td className="py-3"><div className="h-4 w-14 animate-pulse rounded-full bg-muted" /></td>
      <td className="hidden py-3 sm:table-cell"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
      <td className="py-3 pr-4"><div className="size-6 animate-pulse rounded bg-muted" /></td>
    </tr>
  );
}

// ─── Small display components ──────────────────────────────────────────────────

function TypeBadge({ type }: { type: 'GROUP' | 'MENU' }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
      type === 'GROUP'
        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
        : 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    )}>
      {type === 'GROUP' ? <Layers size={9} /> : <MenuIcon size={9} />}
      {type}
    </span>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn(
        'size-1.5 rounded-full',
        active ? 'bg-emerald-500' : 'bg-muted-foreground/40',
      )} />
      <span className={cn(
        'text-xs font-medium',
        active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
      )}>
        {active ? 'Active' : 'Inactive'}
      </span>
    </span>
  );
}

// ─── Filter options ────────────────────────────────────────────────────────────

const TYPE_OPTS   = ['All', 'GROUP', 'MENU']                  as const;
const STATUS_OPTS = ['All', 'Active', 'Inactive']             as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MenusPage() {
  const [menus,         setMenus]         = useState<Menu[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(false);
  const [search,        setSearch]        = useState('');
  const [typeFilter,    setTypeFilter]    = useState<typeof TYPE_OPTS[number]>('All');
  const [statusFilter,  setStatusFilter]  = useState<typeof STATUS_OPTS[number]>('All');
  const [expanded,      setExpanded]      = useState<Set<string>>(new Set());
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editing,       setEditing]       = useState<Menu | null>(null);
  const [deleting,      setDeleting]      = useState<Menu | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchAdminMenus();
      setMenus(data);
      setExpanded(new Set(data.filter(m => m.type === 'GROUP').map(m => m.id)));
    } catch {
      setError(true);
      toast.error('โหลดเมนูไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const groups = useMemo(() => menus.filter(m => m.type === 'GROUP'), [menus]);

  const stats = useMemo(() => ({
    total:        menus.length,
    groups:       menus.filter(m => m.type === 'GROUP').length,
    active:       menus.filter(m => m.isActive).length,
    roleBindings: menus.reduce((s, m) => s + (m._count?.rolePermissions ?? 0), 0),
  }), [menus]);

  // When any filter is active → show flat sorted list instead of tree
  const isFiltered = !!search || typeFilter !== 'All' || statusFilter !== 'All';

  const filteredFlat = useMemo(() => {
    const q = search.toLowerCase();
    return menus
      .filter((m) => {
        const matchQ = !q || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || (m.path?.toLowerCase().includes(q) ?? false);
        const matchT = typeFilter   === 'All' || m.type === typeFilter;
        const matchS = statusFilter === 'All' || (statusFilter === 'Active') === m.isActive;
        return matchQ && matchT && matchS;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [menus, search, typeFilter, statusFilter]);

  const treeRows   = useMemo(() => buildTreeRows(menus, expanded), [menus, expanded]);
  const displayRows = isFiltered
    ? filteredFlat.map(item => ({ item, depth: 0 }))
    : treeRows;

  function toggleGroup(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSave(body: CreateMenuBody | UpdateMenuBody, isEdit: boolean) {
    try {
      if (isEdit && editing) {
        const updated = await updateMenu(editing.id, body as UpdateMenuBody);
        setMenus(prev => prev.map(m => m.id === editing.id ? updated : m));
        toast.success(`อัปเดต "${updated.name}" สำเร็จ`);
      } else {
        await createMenu(body as CreateMenuBody);
        await reload();
        toast.success('สร้างเมนูสำเร็จ');
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code !== 'CODE_TAKEN') {
        toast.error(e.message || 'บันทึกไม่สำเร็จ');
      }
      throw err;
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteMenu(deleting.id);
      setMenus(prev => prev.filter(m => m.id !== deleting.id));
      toast.success(`ลบ "${deleting.name}" สำเร็จ`);
      setDeleting(null);
    } catch (err) {
      toast.error((err as Error)?.message || 'ลบเมนูไม่สำเร็จ');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="page-shell">

      {/* ── Header ── */}
      <PageHeader
        title="Menu Management"
        subtitle="Configure navigation menus & groups"
        icon={MenuIcon}
        actions={
          <Button
            variant="create" size="lg"
            onClick={() => { setEditing(null); setModalOpen(true); }}
          >
            <Plus />
            <span className="hidden sm:inline">Create Menu</span>
            <span className="sm:hidden">Create</span>
          </Button>
        }
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <motion.div {...fadeUp(0.08)}>
          <StatCard icon={MenuIcon} label="Total Menus"   value={stats.total}        gradient="from-indigo-500 to-violet-500" />
        </motion.div>
        <motion.div {...fadeUp(0.14)}>
          <StatCard icon={Layers}   label="Groups"        value={stats.groups}       gradient="from-sky-500 to-blue-600" />
        </motion.div>
        <motion.div {...fadeUp(0.20)}>
          <StatCard icon={Activity} label="Active"        value={stats.active}       gradient="from-emerald-500 to-teal-500" />
        </motion.div>
        <motion.div {...fadeUp(0.26)}>
          <StatCard icon={KeyRound} label="Role Bindings" value={stats.roleBindings} gradient="from-amber-500 to-orange-500" />
        </motion.div>
      </div>

      {/* ── Toolbar ── */}
      <motion.div {...fadeUp(0.32)} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name, code, path…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Type filter */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
            {TYPE_OPTS.map((opt) => (
              <button
                key={opt}
                onClick={() => setTypeFilter(opt)}
                className={cn(
                  'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  typeFilter === opt ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {typeFilter === opt && (
                  <motion.span
                    layoutId="menu-type-pill"
                    className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {opt}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
            {STATUS_OPTS.map((opt) => (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className={cn(
                  'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  statusFilter === opt ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {statusFilter === opt && (
                  <motion.span
                    layoutId="menu-status-pill"
                    className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {opt}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Table ── */}
      <motion.div {...fadeUp(0.38)}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <TableHeader>
                  <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-10 pl-4 text-xs">#</TableHead>
                    <TableHead className="text-xs">Menu</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="hidden text-xs md:table-cell">Path</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="hidden text-xs sm:table-cell">Permissions</TableHead>
                    <TableHead className="w-10 pr-3 sm:w-12 sm:pr-4" />
                  </TableRow>
                </TableHeader>

                  <tbody>
                    {loading && Array.from({ length: 6 }).map((_, i) => (
                      <RowSkeleton key={i} index={i} />
                    ))}

                    {!loading && error && (
                      <tr>
                        <td colSpan={7} className="py-20 text-center text-sm text-muted-foreground">
                          โหลดข้อมูลไม่สำเร็จ —{' '}
                          <button
                            type="button" onClick={reload}
                            className="font-medium text-indigo-500 hover:underline"
                          >
                            ลองใหม่
                          </button>
                        </td>
                      </tr>
                    )}

                    {!loading && !error && displayRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-20 text-center text-sm text-muted-foreground">
                          ไม่พบเมนู
                        </td>
                      </tr>
                    )}

                    {!loading && !error && displayRows.map(({ item, depth }, i) => {
                      const isGroup    = item.type === 'GROUP';
                      const isExpanded = expanded.has(item.id);

                      return (
                        <TableRow key={item.id} className="group">

                          {/* # */}
                          <TableCell className="pl-4 text-xs text-muted-foreground">
                            {i + 1}
                          </TableCell>

                          {/* Menu name + code */}
                          <TableCell>
                            <div
                              className="flex items-center gap-2"
                              style={{ paddingLeft: depth * 20 }}
                            >
                              {/* Group toggle / child indent */}
                              {isGroup ? (
                                <button
                                  type="button"
                                  onClick={() => toggleGroup(item.id)}
                                  className="flex shrink-0 cursor-pointer items-center justify-center rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                  {isExpanded
                                    ? <ChevronDown size={14} />
                                    : <ChevronRight size={14} />
                                  }
                                </button>
                              ) : depth !== 0 ? (
                                <span className="shrink-0 select-none text-xs text-muted-foreground/40">└</span>
                              ) : null}

                              {/* Icon chip */}
                              <div className={cn(
                                'flex size-7 shrink-0 items-center justify-center rounded-lg',
                                isGroup
                                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                  : 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
                              )}>
                                {isGroup ? <Layers size={13} /> : <MenuIcon size={13} />}
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="truncate text-sm font-medium leading-tight">
                                    {item.name}
                                  </p>
                                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                    {item.code}
                                  </span>
                                </div>
                                {/* Metadata sub-line */}
                                {isGroup && (item._count?.children ?? 0) !== 0 ? (
                                  <p className="text-[10px] text-muted-foreground">
                                    {item._count?.children ?? 0} item{(item._count?.children ?? 0) !== 1 ? 's' : ''}
                                  </p>
                                ) : item.parent ? (
                                  <p className="text-[10px] text-muted-foreground">
                                    in {item.parent.name}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>

                          {/* Type */}
                          <TableCell>
                            <TypeBadge type={item.type} />
                          </TableCell>

                          {/* Path */}
                          <TableCell className="hidden md:table-cell">
                            {item.path ? (
                              <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                {item.path}
                              </code>
                            ) : (
                              <span className="text-xs text-muted-foreground/30">—</span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <StatusDot active={item.isActive} />
                          </TableCell>

                          {/* Permissions (MENU only) */}
                          <TableCell className="hidden sm:table-cell">
                            {item.type === 'MENU' ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  <Shield size={8} />
                                  {item._count?.rolePermissions ?? 0}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  <Users size={8} />
                                  {item._count?.userPermissions ?? 0}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/30">—</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="pr-3 sm:pr-4">
                            <ActionMenu actions={[
                              {
                                label: 'Edit',
                                icon: Pencil,
                                onClick: () => { setEditing(item); setModalOpen(true); },
                              },
                              {
                                label: 'Delete',
                                icon: Trash2,
                                destructive: true,
                                disabled: (item._count?.children ?? 0) !== 0,
                                onClick: () => setDeleting(item),
                              },
                            ]} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Create / Edit Modal ── */}
      <MenuModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        menu={editing}
        groups={groups}
      />

      {/* ── Delete Confirm ── */}
      <DeleteConfirmModal
        itemType="Menu"
        name={deleting?.name ?? ''}
        open={!!deleting}
        deleting={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
