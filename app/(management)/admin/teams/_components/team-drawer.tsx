'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users } from 'lucide-react';
import type { Team, CreateTeamInput } from '../types';

interface TeamDrawerProps {
  open: boolean;
  team?: Team | null;
  onClose: () => void;
  onSubmit: (input: CreateTeamInput) => Promise<void>;
}

export function TeamDrawer({ open, team, onClose, onSubmit }: TeamDrawerProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description ?? '');
      setTagsRaw(team.tags.join(', '));
      setLogoUrl(team.logoUrl ?? '');
    } else {
      setName('');
      setDescription('');
      setTagsRaw('');
      setLogoUrl('');
    }
  }, [team, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const tags = tagsRaw.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        logoUrl: logoUrl.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const isEdit = Boolean(team);

  const drawer = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
          >
            <div className="h-1.5 w-full shrink-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-foreground">
                    {isEdit ? 'แก้ไขทีม' : 'สร้างทีมใหม่'}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {isEdit ? `แก้ไข ${team?.name}` : 'กรอกข้อมูลทีม'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex-1 space-y-5 px-6 py-5">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    ชื่อทีม <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น Alpha Team"
                    required
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    คำอธิบาย
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="อธิบายหน้าที่และความรับผิดชอบของทีม"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tagsRaw}
                    onChange={(e) => setTagsRaw(e.target.value)}
                    placeholder="DEVELOP, INFRA, QA (คั่นด้วย comma)"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground/60">แยกหลาย tag ด้วยเครื่องหมาย comma</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 border-t border-border/60 px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      กำลังบันทึก…
                    </>
                  ) : isEdit ? 'บันทึกการแก้ไข' : 'สร้างทีม'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(drawer, document.body);
}
