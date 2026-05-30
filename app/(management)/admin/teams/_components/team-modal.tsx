'use client';

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users, Check, ImagePlus, Trash2 } from 'lucide-react';
import type { Team, CreateTeamInput } from '../types';

const TAG_OPTIONS: { value: string; label: string }[] = [
  { value: 'INFRA',    label: 'Infrastructure' },
  { value: 'DEVELOP',  label: 'Development' },
  { value: 'AS400',    label: 'AS/400 (Midrange)' },
  { value: 'NEW_TECH', label: 'New Technology' },
  { value: 'GENERAL',  label: 'General' },
  { value: 'HELPDESK', label: 'Helpdesk' },
];

const INPUT_CLASS =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors';

const LABEL_CLASS =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

interface TeamModalProps {
  open: boolean;
  team?: Team | null;
  onClose: () => void;
  onSubmit: (input: CreateTeamInput) => Promise<void>;
}

export function TeamModal({ open, team, onClose, onSubmit }: TeamModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // logoFile: local file → stored as data URL in logoUrl on submit
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description ?? '');
      setSelectedTags(team.tags.filter((t) => TAG_OPTIONS.some((o) => o.value === t)));
      setLogoPreview(team.logoUrl ?? null);
    } else {
      setName('');
      setDescription('');
      setSelectedTags([]);
      setLogoPreview(null);
    }
  }, [team, open]);

  // Convert File → data URL and store as preview
  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string ?? null);
    reader.readAsDataURL(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  function toggleTag(value: string) {
    setSelectedTags((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        logoUrl: logoPreview ?? undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const isEdit = Boolean(team);

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal — wider: max-w-2xl */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Accent bar */}
              <div className="h-1 w-full bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30">
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

              {/* Form — 2 column layout */}
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-0 max-h-[65vh] overflow-y-auto">

                  {/* ── Left column ── */}
                  <div className="space-y-4 border-r border-border/60 px-6 py-5">

                    {/* Team name */}
                    <div>
                      <label className={LABEL_CLASS}>
                        ชื่อทีม <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="เช่น Alpha Team"
                        required
                        className={INPUT_CLASS}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className={LABEL_CLASS}>คำอธิบาย</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="อธิบายหน้าที่และความรับผิดชอบของทีม"
                        rows={3}
                        className={`${INPUT_CLASS} resize-none`}
                      />
                    </div>

                    {/* Logo dropzone */}
                    <div>
                      <label className={LABEL_CLASS}>Logo ทีม</label>

                      {logoPreview ? (
                        /* Preview state */
                        <div className="relative flex items-center gap-4 rounded-xl border border-border bg-background p-3">
                          <img
                            src={logoPreview}
                            alt="logo preview"
                            className="h-16 w-16 shrink-0 rounded-xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-foreground">อัปโหลดแล้ว</p>
                            <p className="text-[10px] text-muted-foreground">คลิกเพื่อเปลี่ยนรูป</p>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="mt-1.5 rounded-lg border border-border px-2.5 py-1 text-[10px] font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                              เปลี่ยนรูป
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLogoPreview(null)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                            title="ลบรูป"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        /* Dropzone state */
                        <div
                          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-all duration-200 ${
                            isDragging
                              ? 'border-indigo-500 bg-indigo-500/5'
                              : 'border-border bg-background hover:border-indigo-400/60 hover:bg-muted/30'
                          }`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                            isDragging ? 'bg-indigo-500/15' : 'bg-muted'
                          }`}>
                            <ImagePlus className={`h-5 w-5 ${isDragging ? 'text-indigo-500' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="text-center">
                            <p className="text-[12px] font-semibold text-foreground">
                              {isDragging ? 'วางไฟล์ที่นี่' : 'ลากรูปมาวาง หรือคลิกเพื่อเลือก'}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, WEBP · แนะนำ 512×512px</p>
                          </div>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  {/* ── Right column: Tags ── */}
                  <div className="px-6 py-5">
                    <div className="mb-2.5 flex items-center justify-between">
                      <label className={LABEL_CLASS}>Tags</label>
                      {selectedTags.length > 0 && (
                        <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400">
                          เลือก {selectedTags.length} รายการ
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {TAG_OPTIONS.map((opt) => {
                        const active = selectedTags.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleTag(opt.value)}
                            className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all duration-150 cursor-pointer ${
                              active
                                ? 'border-indigo-500/50 bg-indigo-500/10'
                                : 'border-border bg-background hover:border-indigo-400/40 hover:bg-muted/40'
                            }`}
                          >
                            <div>
                              <div className={`text-[12px] font-semibold ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground'}`}>
                                {opt.value}
                              </div>
                              <div className={`text-[10px] ${active ? 'text-indigo-500/80 dark:text-indigo-400/70' : 'text-muted-foreground'}`}>
                                {opt.label}
                              </div>
                            </div>
                            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                              active ? 'border-indigo-500 bg-indigo-500' : 'border-border bg-background'
                            }`}>
                              {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
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
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
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
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
