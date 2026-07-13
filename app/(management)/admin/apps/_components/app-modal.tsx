'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AppWindow, ExternalLink, Frame, Check, Search, ChevronDown } from 'lucide-react';
import { AppIcon } from '@/components/app-icon';
import { cn } from '@/lib/utils';
import { IconPicker } from './icon-picker';
import type { AdminApp, AdminCategory, CreateAppInput, EmbedType } from '@/lib/apphub/types';

// ── Shared styles ──────────────────────────────────────────────────────────────

const INPUT_CLASS =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors';
const LABEL_CLASS =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

// ── CategorySelect ─────────────────────────────────────────────────────────────

interface CategorySelectProps {
  categories: AdminCategory[];
  value: string;
  onChange: (id: string) => void;
}

function CategorySelect({ categories, value, onChange }: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0, left: 0, width: 0,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const selected = categories.find(c => c.id === value);
  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const filtered = search.trim()
    ? sorted.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : sorted;

  function openDropdown() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropH = Math.min(filtered.length * 44 + 48, 240);
    setCoords({
      top: spaceBelow >= dropH ? rect.bottom + 4 : rect.top - dropH - 4,
      left: rect.left,
      width: rect.width,
    });
    setSearch('');
    setOpen(true);
  }

  const dropdown = open && mounted && createPortal(
    <>
      <div className="fixed inset-0 z-9998" onClick={() => setOpen(false)} />
      <div
        className="fixed z-9999 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
        style={{ top: coords.top, left: coords.left, width: coords.width }}
      >
        {/* Search */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาหมวดหมู่…"
            className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
        </div>

        {/* Options */}
        <ul className="max-h-[200px] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-center text-[12px] text-muted-foreground">ไม่พบหมวดหมู่</li>
          )}
          {filtered.map(cat => {
            const isSelected = cat.id === value;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => { onChange(cat.id); setOpen(false); }}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors',
                    isSelected
                      ? 'bg-indigo-500/8 text-indigo-600 dark:text-indigo-400'
                      : 'text-foreground hover:bg-muted',
                    !cat.isActive && 'opacity-50',
                  )}
                >
                  {/* Category icon */}
                  <span className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    isSelected
                      ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                      : 'bg-muted text-muted-foreground',
                  )}>
                    <AppIcon name={cat.icon} className="h-3.5 w-3.5" />
                  </span>

                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[12px] font-medium">{cat.name}</span>
                    {!cat.isActive && (
                      <span className="text-[10px] text-muted-foreground">ปิดใช้งาน</span>
                    )}
                  </span>

                  {/* App count */}
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {cat._count.apps}
                  </span>

                  {/* Selected check */}
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-500" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>,
    document.body,
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={openDropdown}
        className={cn(
          INPUT_CLASS,
          'flex cursor-pointer items-center gap-2.5 text-left',
          open && 'border-indigo-400/60 ring-2 ring-indigo-500/20',
        )}
      >
        {selected ? (
          <>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <AppIcon name={selected.icon} className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
              {selected.name}
              {!selected.isActive && (
                <span className="ml-1.5 text-[11px] text-muted-foreground">(ปิดใช้งาน)</span>
              )}
            </span>
          </>
        ) : (
          <span className="flex-1 text-[13px] text-muted-foreground/50">เลือกหมวดหมู่</span>
        )}
        <ChevronDown className={cn(
          'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150',
          open && 'rotate-180',
        )} />
      </button>
      {dropdown}
    </>
  );
}

// ── ToggleRow ──────────────────────────────────────────────────────────────────

function ToggleRow({ label, hint, checked, onChange }: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
    >
      <div>
        <div className="text-[12px] font-semibold text-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground">{hint}</div>
      </div>
      {/* Switch — same visual as ActiveToggle */}
      <span className={cn(
        'relative ml-3 h-[18px] w-8 shrink-0 rounded-full ring-1 ring-inset transition-colors duration-200',
        checked
          ? 'bg-emerald-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] ring-emerald-600/25'
          : 'bg-muted-foreground/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] ring-border/60',
      )}>
        <span className={cn(
          'absolute top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
          checked ? 'translate-x-[14px]' : 'translate-x-0.5',
        )}>
          {checked && <Check className="h-2 w-2 text-emerald-600" strokeWidth={3} />}
        </span>
      </span>
    </button>
  );
}

// ── AppModal ───────────────────────────────────────────────────────────────────

interface AppModalProps {
  open: boolean;
  app?: AdminApp | null;
  categories: AdminCategory[];
  onClose: () => void;
  onSubmit: (input: CreateAppInput) => Promise<void>;
}

export function AppModal({ open, app, categories, onClose, onSubmit }: AppModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [embedType, setEmbedType] = useState<EmbedType>('LINK');
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (app) {
      setName(app.name);
      setUrl(app.url);
      setCategoryId(app.categoryId);
      setIcon(app.icon ?? null);
      setDescription(app.description ?? '');
      setEmbedType(app.embedType);
      setOpenInNewTab(app.openInNewTab);
      setIsActive(app.isActive);
      setSortOrder(app.sortOrder);
    } else {
      setName('');
      setUrl('');
      setCategoryId(categories[0]?.id ?? '');
      setIcon(null);
      setDescription('');
      setEmbedType('LINK');
      setOpenInNewTab(true);
      setIsActive(true);
      setSortOrder(0);
    }
  }, [app, open, categories]);

  const isEdit = Boolean(app);
  const canSubmit = name.trim() && url.trim() && categoryId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        url: url.trim(),
        categoryId,
        icon: icon || null,
        description: description.trim() || null,
        embedType,
        openInNewTab,
        isActive,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="app-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="app-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Gradient stripe */}
              <div className="h-1 w-full bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30">
                    <AppWindow className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground">
                      {isEdit ? 'แก้ไขแอป' : 'เพิ่มแอปใหม่'}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      {isEdit ? `แก้ไข "${app?.name}"` : 'กรอกรายละเอียดแอปพลิเคชัน'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid max-h-[65vh] grid-cols-2 gap-0 overflow-y-auto">

                  {/* ── Left column ── */}
                  <div className="space-y-4 border-r border-border/60 px-6 py-5">
                    {/* Name */}
                    <div>
                      <label className={LABEL_CLASS}>
                        ชื่อแอป <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="เช่น ระบบลางาน"
                        required
                        className={INPUT_CLASS}
                      />
                    </div>

                    {/* URL */}
                    <div>
                      <label className={LABEL_CLASS}>
                        URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://leave.dxc.com"
                        required
                        className={INPUT_CLASS}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className={LABEL_CLASS}>
                        หมวดหมู่ <span className="text-red-500">*</span>
                      </label>
                      {categories.length === 0 ? (
                        <div className={cn(INPUT_CLASS, 'text-muted-foreground/60')}>
                          — ยังไม่มีหมวดหมู่ —
                        </div>
                      ) : (
                        <CategorySelect
                          categories={categories}
                          value={categoryId}
                          onChange={setCategoryId}
                        />
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className={LABEL_CLASS}>คำอธิบาย</label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="ยื่นใบลาออนไลน์"
                        rows={3}
                        className={cn(INPUT_CLASS, 'resize-none leading-relaxed')}
                      />
                    </div>
                  </div>

                  {/* ── Right column ── */}
                  <div className="space-y-4 px-6 py-5">

                    {/* Icon — mini app-card preview + picker */}
                    <div>
                      <label className={LABEL_CLASS}>ไอคอน</label>
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                        {/* Live preview — same gradient as AppCard */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
                          <AppIcon name={icon} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-foreground">
                            {name.trim() || 'ชื่อแอป'}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            ตัวอย่างไอคอนบน App Card
                          </p>
                        </div>
                        <IconPicker value={icon} onChange={setIcon} size="sm" />
                      </div>
                    </div>

                    {/* Embed type */}
                    <div>
                      <label className={LABEL_CLASS}>รูปแบบการเปิด</label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          ['LINK', ExternalLink, 'เปิดลิงก์'],
                          ['IFRAME', Frame, 'ฝังในหน้า'],
                        ] as const).map(([val, Icon, label]) => {
                          const active = embedType === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setEmbedType(val)}
                              className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-[12px] font-semibold transition-all',
                                active
                                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                  : 'border-border bg-background text-foreground hover:border-indigo-400/40',
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2">
                      <ToggleRow
                        label="เปิดในแท็บใหม่"
                        hint="เฉพาะรูปแบบเปิดลิงก์"
                        checked={openInNewTab}
                        onChange={setOpenInNewTab}
                      />
                      <ToggleRow
                        label="เปิดใช้งาน"
                        hint="แสดงบนหน้า landing"
                        checked={isActive}
                        onChange={setIsActive}
                      />
                    </div>

                    {/* Sort order */}
                    <div>
                      <label className={LABEL_CLASS}>ลำดับการแสดง</label>
                      <input
                        type="number"
                        min={0}
                        value={sortOrder}
                        onChange={e => setSortOrder(parseInt(e.target.value, 10) || 0)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 border-t border-border/60 px-6 py-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !canSubmit}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        กำลังบันทึก…
                      </>
                    ) : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มแอป'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
