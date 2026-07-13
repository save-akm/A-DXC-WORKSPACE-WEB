'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Menu as MenuIcon, Layers, Check, Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  checkMenuCode,
  type Menu, type CreateMenuBody, type UpdateMenuBody,
} from '@/lib/api/menus';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  type:      z.enum(['GROUP', 'MENU']),
  code:      z.string().min(1, 'Required').max(50).regex(/^[a-z0-9_-]+$/, 'a-z, 0-9, - and _ only'),
  name:      z.string().min(1, 'Required').max(100),
  parentId:  z.string().nullable(),
  path:      z.string().nullable(),
  icon:      z.string().nullable(),
  sortOrder: z.number().int().min(0),
  isActive:  z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface MenuModalProps {
  open:    boolean;
  onClose: () => void;
  onSave:  (body: CreateMenuBody | UpdateMenuBody, isEdit: boolean) => Promise<void>;
  menu?:   Menu | null;
  groups:  Menu[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MenuModal({ open, onClose, onSave, menu, groups }: MenuModalProps) {
  const [mounted,   setMounted]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [codeState, setCodeState] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const isEdit = !!menu;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'MENU', code: '', name: '',
      parentId: null, path: null, icon: null,
      sortOrder: 0, isActive: true,
    },
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    setCodeState('idle');
    form.reset({
      type:      menu?.type      ?? 'MENU',
      code:      menu?.code      ?? '',
      name:      menu?.name      ?? '',
      parentId:  menu?.parentId  ?? null,
      path:      menu?.path      ?? null,
      icon:      menu?.icon      ?? null,
      sortOrder: menu?.sortOrder ?? 0,
      isActive:  menu?.isActive  ?? true,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, menu]);

  // Live code availability check (create only)
  const codeValue = form.watch('code');
  useEffect(() => {
    if (isEdit || !codeValue) { setCodeState('idle'); return; }
    setCodeState('checking');
    const timer = setTimeout(async () => {
      try {
        const available = await checkMenuCode(codeValue);
        setCodeState(available ? 'ok' : 'taken');
        if (!available) form.setError('code', { message: 'Code already taken' });
        else form.clearErrors('code');
      } catch {
        setCodeState('idle');
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [codeValue, isEdit, form]);

  const menuType = form.watch('type');

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      if (isEdit) {
        const body: UpdateMenuBody = {
          name:      values.name,
          parentId:  values.type === 'MENU' ? (values.parentId || null) : undefined,
          path:      values.type === 'MENU' ? (values.path || null) : null,
          icon:      values.icon || null,
          sortOrder: values.sortOrder,
          isActive:  values.isActive,
        };
        await onSave(body, true);
      } else {
        const body: CreateMenuBody = {
          code:      values.code,
          name:      values.name,
          type:      values.type,
          parentId:  values.type === 'MENU' ? (values.parentId || null) : null,
          path:      values.type === 'MENU' ? (values.path || null) : null,
          icon:      values.icon || null,
          sortOrder: values.sortOrder,
          isActive:  values.isActive,
        };
        await onSave(body, false);
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'CODE_TAKEN') {
        form.setError('code', { message: 'Code already taken' });
      }
    } finally {
      setSaving(false);
    }
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => !saving && onClose()}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Accent bar */}
              <div className="h-1 w-full bg-linear-to-r from-indigo-500 to-violet-500" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30">
                    <MenuIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground">
                      {isEdit ? `Edit "${menu?.name}"` : 'Create Menu'}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      {isEdit
                        ? `${menu?.type} · code: ${menu?.code}`
                        : 'Configure menu item or group'}
                    </p>
                  </div>
                </div>
                <button
                  type="button" onClick={onClose}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
                    <div className="space-y-4">

                      {/* Type — card radio (create) or readonly badge (edit) */}
                      {!isEdit ? (
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
                              <div className="grid grid-cols-2 gap-2">
                                {(['MENU', 'GROUP'] as const).map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                      field.onChange(t);
                                      if (t === 'GROUP') {
                                        form.setValue('parentId', null);
                                        form.setValue('path', null);
                                      }
                                    }}
                                    className={cn(
                                      "flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-left transition-all",
                                      field.value === t
                                        ? t === 'MENU'
                                          ? "border-violet-500 bg-violet-500/5"
                                          : "border-sky-500 bg-sky-500/5"
                                        : "border-border/60 hover:border-border",
                                    )}
                                  >
                                    <div className={cn(
                                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                                      field.value === t
                                        ? t === 'MENU'
                                          ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                                          : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                                        : "bg-muted text-muted-foreground",
                                    )}>
                                      {t === 'MENU' ? <MenuIcon size={14} /> : <Layers size={14} />}
                                    </div>
                                    <div>
                                      <p className="text-[13px] font-semibold">{t === 'MENU' ? 'Menu Item' : 'Group'}</p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {t === 'MENU' ? 'Navigation link with path' : 'Container for menu items'}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-muted-foreground">Type:</span>
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                            menu?.type === 'GROUP'
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                              : "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                          )}>
                            {menu?.type === 'GROUP' ? <Layers size={10} /> : <MenuIcon size={10} />}
                            {menu?.type}
                          </span>
                        </div>
                      )}

                      {/* Code */}
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Code {!isEdit && <span className="text-destructive">*</span>}
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="e.g. admin-users"
                                  readOnly={isEdit}
                                  disabled={isEdit}
                                  className={cn('pr-8 font-mono', isEdit && 'cursor-default bg-muted/50')}
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                                />
                                {!isEdit && codeValue && (
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                    {codeState === 'checking' && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
                                    {codeState === 'ok'       && <Check size={13} className="text-emerald-500" />}
                                    {codeState === 'taken'    && <AlertCircle size={13} className="text-destructive" />}
                                  </span>
                                )}
                              </div>
                            </FormControl>
                            {!isEdit && (
                              <p className="text-[11px] text-muted-foreground">
                                Lowercase, numbers, - and _ only. Cannot be changed after creation.
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Name */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. จัดการผู้ใช้" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Parent + Path — MENU type only */}
                      {menuType === 'MENU' && (
                        <>
                          <FormField
                            control={form.control}
                            name="parentId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Parent Group</FormLabel>
                                <Select
                                  value={field.value ?? '__none__'}
                                  onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="None (root level)" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="__none__">None (root level)</SelectItem>
                                    {groups.map((g) => (
                                      <SelectItem key={g.id} value={g.id}>
                                        {g.name}{' '}
                                        <span className="font-mono text-[10px] text-muted-foreground">
                                          ({g.code})
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="path"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Path</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. /admin/users"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.value || null)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      {/* Icon */}
                      <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Icon</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Users, LayoutDashboard, Settings"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <p className="text-[11px] text-muted-foreground">Lucide icon name (PascalCase)</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Sort Order + Is Active */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="sortOrder"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sort Order</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <div className="flex h-9 items-center gap-2.5">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={field.value}
                                  onClick={() => field.onChange(!field.value)}
                                  className={cn(
                                    'relative h-[18px] w-8 shrink-0 cursor-pointer rounded-full ring-1 ring-inset transition-colors duration-200',
                                    field.value
                                      ? 'bg-emerald-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] ring-emerald-600/25'
                                      : 'bg-muted-foreground/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] ring-border/60',
                                  )}
                                >
                                  <span className={cn(
                                    'absolute top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
                                    field.value ? 'translate-x-[14px]' : 'translate-x-0.5',
                                  )}>
                                    {field.value && <Check className="h-2 w-2 text-emerald-600" strokeWidth={3} />}
                                  </span>
                                </button>
                                <span className={cn(
                                  'text-[12px] font-medium',
                                  field.value
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-muted-foreground',
                                )}>
                                  {field.value ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3 border-t border-border/60 px-5 py-4">
                    <button
                      type="button" onClick={onClose} disabled={saving}
                      className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || (!isEdit && codeState === 'taken')}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Saving…
                        </>
                      ) : (
                        isEdit ? 'Save Changes' : 'Create Menu'
                      )}
                    </button>
                  </div>
                </form>
              </Form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
