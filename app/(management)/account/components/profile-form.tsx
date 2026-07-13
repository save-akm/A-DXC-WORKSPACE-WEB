'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ImagePlus, Loader2, Quote, Save, Smile, Sparkles, Tag, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  upsertProfileRequest,
  uploadCoverRequest,
  deleteCoverRequest,
  saveSkillsRequest,
  deleteSkillRequest,
} from '@/lib/api/profile';
import type { UserProfileData, UserSkill } from '@/lib/api/profile';

const MAX_COVER_BYTES = 5 * 1024 * 1024;

const SKILL_PALETTE = [
  'bg-violet-500/10 text-violet-600 border-violet-200/60 dark:text-violet-400 dark:border-violet-500/20',
  'bg-sky-500/10 text-sky-600 border-sky-200/60 dark:text-sky-400 dark:border-sky-500/20',
  'bg-emerald-500/10 text-emerald-600 border-emerald-200/60 dark:text-emerald-400 dark:border-emerald-500/20',
  'bg-amber-500/10 text-amber-600 border-amber-200/60 dark:text-amber-400 dark:border-amber-500/20',
  'bg-rose-500/10 text-rose-600 border-rose-200/60 dark:text-rose-400 dark:border-rose-500/20',
  'bg-orange-500/10 text-orange-600 border-orange-200/60 dark:text-orange-400 dark:border-orange-500/20',
  'bg-teal-500/10 text-teal-600 border-teal-200/60 dark:text-teal-400 dark:border-teal-500/20',
  'bg-pink-500/10 text-pink-600 border-pink-200/60 dark:text-pink-400 dark:border-pink-500/20',
];

function skillBadgeCls(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return SKILL_PALETTE[h % SKILL_PALETTE.length];
}

const HIGHLIGHT_TYPES = ['QUOTE', 'TIP', 'GOAL', 'ACHIEVEMENT'] as const;
type HighlightType = typeof HIGHLIGHT_TYPES[number];

const HIGHLIGHT_CONFIG: Record<HighlightType, {
  label: string;
  placeholder: string;
  activeCls: string;
  idleCls: string;
}> = {
  QUOTE: {
    label: 'Quote',
    placeholder: 'Code is poetry...',
    activeCls: 'bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-500/30',
    idleCls: 'border-violet-200 text-violet-600 hover:border-violet-400 dark:border-violet-500/30 dark:text-violet-400',
  },
  TIP: {
    label: 'Tip',
    placeholder: 'เคล็ดลับที่อยากแชร์กับทีม...',
    activeCls: 'bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-500/30',
    idleCls: 'border-sky-200 text-sky-600 hover:border-sky-400 dark:border-sky-500/30 dark:text-sky-400',
  },
  GOAL: {
    label: 'Goal',
    placeholder: 'เป้าหมายที่กำลังมุ่งสู่...',
    activeCls: 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30',
    idleCls: 'border-emerald-200 text-emerald-600 hover:border-emerald-400 dark:border-emerald-500/30 dark:text-emerald-400',
  },
  ACHIEVEMENT: {
    label: 'Achievement',
    placeholder: 'ความสำเร็จที่ภาคภูมิใจ...',
    activeCls: 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30',
    idleCls: 'border-amber-200 text-amber-600 hover:border-amber-400 dark:border-amber-500/30 dark:text-amber-400',
  },
};

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        checked
          ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/30'
          : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-background shadow ring-1 ring-border/40 transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

interface ProfileFormProps {
  userId: string;
  profile: UserProfileData | null;
  skills: UserSkill[];
  onSaved: (res: UserProfileData) => void;
  onCoverUploaded?: (coverUrl: string) => void;
  onCoverDeleted?: () => void;
  onSkillsSaved?: (skills: UserSkill[]) => void;
}

export function ProfileForm({ userId, profile, skills: initialSkills, onSaved, onCoverUploaded, onCoverDeleted, onSkillsSaved }: ProfileFormProps) {
  const accessToken = useAuthStore((s) => s.accessToken);

  // Text / skill fields
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [highlightType, setHighlightType] = useState<HighlightType | null>(
    HIGHLIGHT_TYPES.includes(profile?.highlight?.type as HighlightType)
      ? (profile!.highlight!.type as HighlightType)
      : null,
  );
  const [highlightContent, setHighlightContent] = useState(profile?.highlight?.content ?? '');
  const [isActive, setIsActive] = useState(profile?.isActive ?? true);
  const [skills, setSkills] = useState<UserSkill[]>(initialSkills);
  const [skillInput, setSkillInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [skillsSaving, setSkillsSaving] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [savedRevision, setSavedRevision] = useState(0);

  // Cover — managed independently of the save button
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [coverDeleting, setCoverDeleting] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const bioTextareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [bioPickerOpen, setBioPickerOpen] = useState(false);
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);
  const bioPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bioPickerRef.current && !bioPickerRef.current.contains(e.target as Node)) setBioPickerOpen(false);
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(e.target as Node)) setHighlightPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    return () => { if (coverPreview) URL.revokeObjectURL(coverPreview) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync form state when profile first loads (props arrive after API call)
  useEffect(() => {
    if (!profile) return;
    setBio(profile.bio ?? '');
    setHighlightType(
      HIGHLIGHT_TYPES.includes(profile.highlight?.type as HighlightType)
        ? (profile.highlight!.type as HighlightType)
        : null,
    );
    setHighlightContent(profile.highlight?.content ?? '');
    setIsActive(profile.isActive ?? true);
    setSkills(initialSkills);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Re-anchors after each successful save (savedRevision bump) or first profile load
  const initialValues = useMemo(() => ({
    bio: profile?.bio ?? '',
    highlightType: (HIGHLIGHT_TYPES.includes(profile?.highlight?.type as HighlightType)
      ? profile!.highlight!.type as HighlightType
      : null) as HighlightType | null,
    highlightContent: profile?.highlight?.content ?? '',
    isActive: profile?.isActive ?? true,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [profile?.id, savedRevision]);

  const isDirty =
    bio !== initialValues.bio ||
    highlightType !== initialValues.highlightType ||
    highlightContent !== initialValues.highlightContent ||
    isActive !== initialValues.isActive;

  // pending = newly typed skills that haven't been POSTed yet (id is empty)
  const skillsDirty = skills.some((s) => !s.id);

  // ── Cover ──────────────────────────────────────────────────────────────────

  const handleCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_COVER_BYTES) {
      toast.error('ไฟล์ใหญ่เกินไป', { description: `ขนาดสูงสุด 5 MB (ไฟล์นี้ ${(file.size / 1024 / 1024).toFixed(1)} MB)` });
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleClearCoverSelection = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleCoverUpload = async () => {
    if (!coverFile || !accessToken || coverUploading) return;
    setCoverUploading(true);
    try {
      const res = await uploadCoverRequest(accessToken, userId, coverFile);
      onCoverUploaded?.(res.coverUrl);
      toast.success('อัพโหลดภาพปกเรียบร้อย');
      handleClearCoverSelection();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'อัพโหลดไม่สำเร็จ');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!accessToken || coverDeleting) return;
    setCoverDeleting(true);
    try {
      await deleteCoverRequest(accessToken, userId);
      onCoverDeleted?.();
      toast.success('ลบภาพปกเรียบร้อย');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ลบไม่สำเร็จ');
    } finally {
      setCoverDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // ── Skills ─────────────────────────────────────────────────────────────────

  const handleAddSkill = useCallback(() => {
    const name = skillInput.trim();
    if (!name || skills.some((s) => s.name === name)) return;
    setSkills((prev) => [...prev, { id: '', name, sortOrder: 0, createdAt: '' }]);
    setSkillInput('');
  }, [skillInput, skills]);

  const handleRemoveSkill = async (skill: UserSkill) => {
    if (!skill.id) {
      // pending (not yet saved) — remove locally only
      setSkills((prev) => prev.filter((s) => s.name !== skill.name));
      return;
    }
    setDeletingSkillId(skill.id);
    try {
      await deleteSkillRequest(userId, skill.id);
      setSkills((prev) => prev.filter((s) => s.id !== skill.id));
      onSkillsSaved?.(skills.filter((s) => s.id !== skill.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ลบ Skill ไม่สำเร็จ');
    } finally {
      setDeletingSkillId(null);
    }
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); }
    if (e.key === 'Backspace' && !skillInput && skills.length > 0) {
      void handleRemoveSkill(skills[skills.length - 1]);
    }
  };

  // ── Skills save (pending new skills only) ──────────────────────────────────

  const handleSaveSkills = async () => {
    if (!accessToken || skillsSaving) return;
    setSkillsSaving(true);
    const work = (async () => {
      const updated = await saveSkillsRequest(userId, skills.map((s) => s.name));
      setSkills(updated);
      onSkillsSaved?.(updated);
    })();
    toast.promise(work, {
      loading: 'กำลังบันทึก...',
      success: 'บันทึก Skills เรียบร้อย',
      error: (e) => (e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'),
    });
    try { await work } catch { /* toast already shows error */ } finally { setSkillsSaving(false) }
  };

  // ── Profile text save ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!accessToken || submitting) return;
    setSubmitting(true);

    const work = (async () => {
      const body = {
        bio: bio.trim() || null,
        type: highlightType,
        content: highlightType ? highlightContent.trim() || null : null,
        isActive,
      };

      const res = await upsertProfileRequest(userId, body);

      const savedType = HIGHLIGHT_TYPES.includes(res.highlight?.type as HighlightType)
        ? res.highlight!.type as HighlightType
        : null;
      setBio(res.bio ?? '');
      setHighlightType(savedType);
      setHighlightContent(res.highlight?.content ?? '');
      setIsActive(res.isActive ?? true);
      setSavedRevision((v) => v + 1);
      onSaved(res);
    })();

    toast.promise(work, {
      loading: 'กำลังบันทึก...',
      success: 'บันทึก Profile เรียบร้อย',
      error: (e) => (e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'),
    });

    try { await work } catch { /* toast already shows error */ } finally { setSubmitting(false) }
  };

  const insertEmoji = (
    emoji: string,
    ref: React.RefObject<HTMLTextAreaElement | null>,
    value: string,
    setter: (v: string) => void,
    max: number,
  ) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);
    if (next.length <= max) {
      setter(next);
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(start + emoji.length, start + emoji.length);
      });
    }
  };

  const sectionCls = 'rounded-2xl border border-border bg-card/60 p-4 shadow-sm sm:p-5';

  // Displayed cover: optimistic preview during upload, else saved URL
  const displayCover = coverPreview ?? profile?.coverUrl ?? null;

  return (
    <>
      <div className="space-y-4">

        {/* ── Banner + Skills — 2 column at 2xl ── */}
        <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2 2xl:gap-4">

          {/* Banner */}
          <section className={sectionCls}>
            <div className="flex items-start justify-between gap-2">
              <SectionHeader icon={ImagePlus} title="Banner" subtitle="แนะนำขนาด 1200×300 px" />
              <div className="flex shrink-0 items-center gap-1.5">
                {coverFile ? (
                  <>
                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={handleClearCoverSelection} disabled={coverUploading}>
                      <X className="size-3.5" />
                    </Button>
                    <Button type="button" size="sm" className="h-7 gap-1.5 bg-emerald-500 text-xs text-white shadow-sm hover:bg-emerald-600" onClick={handleCoverUpload} disabled={coverUploading}>
                      {coverUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                      อัพโหลด
                    </Button>
                  </>
                ) : (
                  <>
                    {profile?.coverUrl && (
                      <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setShowDeleteConfirm(true)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => coverInputRef.current?.click()}>
                      <ImagePlus className="size-3.5" />
                      {profile?.coverUrl ? 'เปลี่ยน' : 'เลือกรูป'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="relative mt-3 h-28 w-full overflow-hidden rounded-xl border border-border bg-muted">
              {displayCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayCover} alt="cover" className={cn('h-full w-full object-cover transition-opacity', coverUploading && 'opacity-60')} />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">ยังไม่มีภาพปก</div>
              )}
              {coverUploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-white drop-shadow" />
                </div>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPick} />
          </section>

          {/* Skills */}
          <section className={cn(sectionCls, 'flex flex-col')}>
            <div className="flex items-start justify-between gap-2">
              <SectionHeader icon={Tag} title="Skills & Expertise" subtitle="กด Enter เพื่อเพิ่ม · Backspace เพื่อลบ" />
              <Button type="button" variant="save" size="sm" disabled={!skillsDirty || skillsSaving} onClick={handleSaveSkills} className="h-7 shrink-0 cursor-pointer text-xs">
                <Save className="size-3.5" />
                บันทึก
              </Button>
            </div>
            <div className="mt-3 flex flex-1 flex-wrap content-start gap-1.5 rounded-lg border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring min-h-[42px] cursor-text" onClick={() => skillInputRef.current?.focus()}>
              {skills.map((s) => {
                const isDeleting = deletingSkillId === s.id && !!s.id;
                return (
                  <span key={s.id || s.name} className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', skillBadgeCls(s.name))}>
                    {s.name}
                    <button
                      type="button"
                      onClick={() => void handleRemoveSkill(s)}
                      disabled={isDeleting || !!deletingSkillId}
                      className="ml-0.5 cursor-pointer rounded-full text-muted-foreground hover:text-foreground disabled:opacity-40"
                      aria-label={`ลบ ${s.name}`}
                    >
                      {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
                    </button>
                  </span>
                );
              })}
              <input
                ref={skillInputRef}
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                onBlur={handleAddSkill}
                placeholder={skills.length === 0 ? 'TypeScript, React, Node.js...' : ''}
                className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </section>

        </div>

        {/* ── Bio ── */}
        <section className={sectionCls}>
          <div className="flex items-start justify-between gap-2">
            <SectionHeader icon={Quote} title="Bio" subtitle="ประโยคสั้น ๆ เกี่ยวกับคุณ (ไม่เกิน 200 ตัวอักษร)" />
            <div ref={bioPickerRef} className="relative shrink-0">
              <motion.button
                type="button"
                onClick={() => setBioPickerOpen((v) => !v)}
                animate={{ rotate: [0, -14, 14, -10, 10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.4 }}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-rose-200/80 bg-gradient-to-br from-rose-50 to-pink-50 text-rose-400 shadow-sm transition-colors hover:border-rose-400 hover:from-rose-100 hover:to-pink-100 hover:text-rose-500 hover:shadow-md hover:shadow-rose-200/50 dark:border-rose-500/20 dark:from-rose-500/10 dark:to-pink-500/10 dark:text-rose-400 dark:hover:border-rose-500/40 dark:hover:from-rose-500/15 dark:hover:to-pink-500/15"
                aria-label="เลือก Emoji"
              >
                <Smile className="size-4" />
              </motion.button>
              {bioPickerOpen && (
                <div className="absolute right-0 top-9 z-50">
                  <EmojiPicker
                    lazyLoadEmojis
                    searchPlaceholder="ค้นหา Emoji..."
                    onEmojiClick={(data) => {
                      insertEmoji(data.emoji, bioTextareaRef, bio, setBio, 200);
                      setBioPickerOpen(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <Textarea
            ref={bioTextareaRef}
            className="mt-3 resize-none text-sm"
            rows={3}
            placeholder="Full-stack developer ที่ชอบ..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{bio.length}/200</p>
        </section>

        {/* ── Highlight ── */}
        <section className={sectionCls}>
          <SectionHeader icon={Sparkles} title="Highlight" subtitle="เลือกประเภทก่อน แล้วพิมพ์ข้อความที่อยากแสดงบน Profile" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {HIGHLIGHT_TYPES.map((type) => {
              const cfg = HIGHLIGHT_CONFIG[type];
              const isSelected = highlightType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setHighlightType(isSelected ? null : type)}
                  className={cn(
                    'cursor-pointer rounded-full border px-3.5 py-1 text-xs font-semibold transition-all',
                    isSelected ? cfg.activeCls : cfg.idleCls,
                  )}
                >
                  {cfg.label}
                </button>
              );
            })}
            {/* Emoji button — ต่อท้าย tags */}
            <div ref={highlightPickerRef} className="relative ml-auto shrink-0">
              <motion.button
                type="button"
                onClick={() => setHighlightPickerOpen((v) => !v)}
                animate={{ rotate: [0, -14, 14, -10, 10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.4 }}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-rose-200/80 bg-gradient-to-br from-rose-50 to-pink-50 text-rose-400 shadow-sm transition-colors hover:border-rose-400 hover:from-rose-100 hover:to-pink-100 hover:text-rose-500 hover:shadow-md hover:shadow-rose-200/50 dark:border-rose-500/20 dark:from-rose-500/10 dark:to-pink-500/10 dark:text-rose-400 dark:hover:border-rose-500/40 dark:hover:from-rose-500/15 dark:hover:to-pink-500/15"
                aria-label="เลือก Emoji"
              >
                <Smile className="size-4" />
              </motion.button>
              {highlightPickerOpen && (
                <div className="absolute right-0 top-9 z-50">
                  <EmojiPicker
                    lazyLoadEmojis
                    searchPlaceholder="ค้นหา Emoji..."
                    onEmojiClick={(data) => {
                      insertEmoji(data.emoji, highlightTextareaRef, highlightContent, setHighlightContent, 120);
                      setHighlightPickerOpen(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          {highlightType && (
            <Textarea
              ref={highlightTextareaRef}
              className="mt-3 resize-none text-sm"
              rows={2}
              placeholder={HIGHLIGHT_CONFIG[highlightType].placeholder}
              value={highlightContent}
              onChange={(e) => setHighlightContent(e.target.value)}
              maxLength={120}
            />
          )}
        </section>

        {/* ── Profile visibility ── */}
        <section className={cn(sectionCls, 'flex items-center justify-between')}>
          <div>
            <p className="text-sm font-medium text-foreground">แสดง Profile สาธารณะ</p>
            <p className="text-xs text-muted-foreground">เพื่อนร่วมงานจะเห็น Profile และให้รีวิวคุณได้</p>
          </div>
          <Switch
            checked={isActive}
            onChange={setIsActive}
            label="แสดง Profile สาธารณะ"
          />
        </section>

        {/* ── Save (text/skills only) ── */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="save"
            disabled={!isDirty || submitting}
            onClick={handleSave}
            className="cursor-pointer"
          >
            <Save />
            บันทึก Profile
          </Button>
        </div>
      </div>

      {/* ── Delete cover confirmation modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">ลบภาพปก</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  ต้องการลบภาพปกหรือไม่? ภาพจะถูกลบทันทีและไม่สามารถย้อนกลับได้
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={coverDeleting}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={coverDeleting}
              >
                {coverDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    กำลังลบ...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    ลบภาพปก
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: typeof ImagePlus; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
        <Icon className="size-4 text-violet-500" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
