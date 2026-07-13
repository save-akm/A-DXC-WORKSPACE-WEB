'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MarkdownEditor, type EditorHandle } from './markdown-editor';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Bold, Italic, Heading2, List, ListOrdered, Link2, Code2, Quote,
  Eye, PencilLine, Send, Save, Check, Star, Pin, BadgeCheck, HelpCircle,
  ImagePlus, Loader2,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { createPost, updatePost, publishPost, uploadPostCover, deletePostCover, uploadAttachment } from '@/lib/api/blog';
import { validateCoverImageFile } from '@/lib/blog/cover-validation';
import {
  type Post, type Tag, type PostVisibility, type CreatePostInput, type UpdatePostInput,
  POST_VISIBILITIES, humanizeBlogError,
} from '@/lib/blog/types';
import { VISIBILITY_CONFIG, tagChipStyle } from './blog-meta';
import { Markdown } from './markdown';
import { PostAttachments } from './post-attachments';
import { PostCoverPicker } from './post-cover-picker';
import { ConfirmDialog } from '@/components/management/confirm-dialog';

// No uppercase/tracking on Thai labels — letter-spacing breaks Thai glyph
// clusters and uppercase is a no-op for the script.
const LABEL = 'mb-1.5 block text-xs font-semibold text-muted-foreground';
// Visible keyboard-focus state for the editor's custom controls.
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50';

// ── Read time ────────────────────────────────────────────────────────────────
// Thai is written without spaces, so a whitespace split undercounts a Thai
// article to ~1 word per paragraph. Segment into real words when the runtime
// supports it (all modern browsers + Node 18); fall back to whitespace.
const wordSegmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter('th', { granularity: 'word' })
    : null;

function countWords(text: string): number {
  if (!text) return 0;
  if (wordSegmenter) {
    let n = 0;
    for (const seg of wordSegmenter.segment(text)) {
      if (seg.isWordLike) n++;
    }
    return n;
  }
  return text.split(/\s+/).filter(Boolean).length;
}

// ── Dirty tracking ───────────────────────────────────────────────────────────
interface EditorSnapshot {
  title: string;
  summary: string;
  content: string;
  visibility: PostVisibility;
  tagIds: string[];
  isPinned: boolean;
  isFeatured: boolean;
  isVerified: boolean;
}

/** Order-insensitive on tagIds so reordering never reads as a change. */
const snapshotOf = (s: EditorSnapshot) => JSON.stringify({ ...s, tagIds: [...s.tagIds].sort() });

// ── New-post backup (localStorage) ───────────────────────────────────────────
// A brand-new post has no id to autosave against, so back the form up locally
// and offer recovery when the editor reopens.
const NEW_DRAFT_KEY = 'blog:new-draft-backup';

interface DraftBackup {
  title: string;
  summary: string;
  content: string;
  visibility: PostVisibility;
  tagIds: string[];
  savedAt: string;
}

function readDraftBackup(): DraftBackup | null {
  try {
    const raw = localStorage.getItem(NEW_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftBackup;
    return parsed.title?.trim() || parsed.content?.trim() ? parsed : null;
  } catch {
    return null;
  }
}

function clearDraftBackup() {
  try { localStorage.removeItem(NEW_DRAFT_KEY); } catch { /* ignore */ }
}

const TIME_FMT = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit' });

// ── Entrance motion ──────────────────────────────────────────────────────────
const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
});
// Sidebar cards cascade in one after another via the parent's staggerChildren.
const sidebarList = { show: { transition: { delayChildren: 0.14, staggerChildren: 0.06 } } };
const sidebarItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

interface PostEditorProps {
  initial: Post | null;
  tags: Tag[];
  /** blog:UPDATE holder — may set pin/feature/verify. */
  isAdmin: boolean;
  /** Elevated role (SYSTEM/SUPER_ADMIN/ADMIN) — only these see the admin panel. */
  isElevated: boolean;
}

export function PostEditor({ initial, tags, isAdmin, isElevated }: PostEditorProps) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? '');
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [localCoverPreview, setLocalCoverPreview] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [content, setContent] = useState(initial?.content ?? '');
  const [visibility, setVisibility] = useState<PostVisibility>(initial?.visibility ?? 'PUBLIC');
  const [tagIds, setTagIds] = useState<string[]>(initial?.tags.map((t) => t.id) ?? []);
  const [isPinned, setIsPinned] = useState(initial?.isPinned ?? false);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [isVerified, setIsVerified] = useState(initial?.isVerified ?? false);

  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [busy, setBusy] = useState<null | 'draft' | 'publish'>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const editorRef = useRef<EditorHandle | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // ── Unsaved-changes guard ────────────────────────────────────────────────
  // Snapshot of the last-saved form values; any divergence (or a pending
  // cover file) marks the editor dirty and arms the leave guards below.
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshotOf({
    title: initial?.title ?? '',
    summary: initial?.summary ?? '',
    content: initial?.content ?? '',
    visibility: initial?.visibility ?? 'PUBLIC',
    tagIds: initial?.tags.map((t) => t.id) ?? [],
    isPinned: initial?.isPinned ?? false,
    isFeatured: initial?.isFeatured ?? false,
    isVerified: initial?.isVerified ?? false,
  }));
  const currentSnapshot = useMemo(
    () => snapshotOf({ title, summary, content, visibility, tagIds, isPinned, isFeatured, isVerified }),
    [title, summary, content, visibility, tagIds, isPinned, isFeatured, isVerified],
  );
  const isDirty = pendingCoverFile != null || currentSnapshot !== savedSnapshot;
  const canSave = title.trim().length > 0 && content.trim().length > 0;
  const [leaveOpen, setLeaveOpen] = useState(false);
  const backHref = initial ? `/blog/${initial.slug}` : '/blog';

  // Tab close / refresh / external navigation.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── Autosave ─────────────────────────────────────────────────────────────
  // Existing DRAFT posts autosave silently 3s after the last change. Published
  // posts never autosave — edits there go live only on an explicit save.
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);
  const autoSaveBusy = useRef(false);
  const isDraftPost = isEdit && initial?.status === 'DRAFT';
  useEffect(() => {
    if (!isDraftPost || !initial?.id || !isDirty || !canSave || busy !== null) return;
    const t = setTimeout(async () => {
      if (autoSaveBusy.current) return;
      autoSaveBusy.current = true;
      try {
        await updatePost(initial.id, buildPayload());
        setSavedSnapshot(currentSnapshot);
        setAutoSavedAt(new Date());
      } catch {
        // Silent — the manual save button and leave guards still protect.
      } finally {
        autoSaveBusy.current = false;
      }
    }, 3000);
    return () => clearTimeout(t);
    // currentSnapshot re-arms the timer on any form change; buildPayload reads
    // the same state so it is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraftPost, initial?.id, isDirty, canSave, busy, currentSnapshot]);

  // ── New-post backup + recovery ───────────────────────────────────────────
  const [recoverable, setRecoverable] = useState<DraftBackup | null>(null);
  useEffect(() => {
    if (!isEdit) setRecoverable(readDraftBackup());
  }, [isEdit]);

  useEffect(() => {
    if (isEdit || !isDirty) return;
    const t = setTimeout(() => {
      try {
        const backup: DraftBackup = {
          title, summary, content, visibility, tagIds, savedAt: new Date().toISOString(),
        };
        localStorage.setItem(NEW_DRAFT_KEY, JSON.stringify(backup));
      } catch { /* storage full/unavailable — non-fatal */ }
    }, 1500);
    return () => clearTimeout(t);
  }, [isEdit, isDirty, title, summary, content, visibility, tagIds]);

  function applyRecovery(backup: DraftBackup) {
    setTitle(backup.title);
    setSummary(backup.summary);
    setContent(backup.content);
    setVisibility(backup.visibility);
    setTagIds(backup.tagIds);
    setRecoverable(null);
  }

  const coverPreview = localCoverPreview ?? (coverImageUrl.trim() || null);

  useEffect(() => () => {
    if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);
  }, [localCoverPreview]);

  const alreadyPublished = initial?.status === 'PUBLISHED';
  const readMins = useMemo(() => Math.max(1, Math.round(countWords(content.trim()) / 200)), [content]);

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function handleCoverPick(file: File) {
    const validationError = validateCoverImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (initial?.id) {
      setCoverUploading(true);
      try {
        const result = await uploadPostCover(initial.id, file);
        if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);
        setLocalCoverPreview(null);
        setPendingCoverFile(null);
        setCoverImageUrl(result.coverImageUrl);
      } catch (err) {
        toast.error(humanizeBlogError(err));
      } finally {
        setCoverUploading(false);
      }
      return;
    }

    if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);
    setLocalCoverPreview(URL.createObjectURL(file));
    setPendingCoverFile(file);
    setCoverImageUrl('');
  }

  async function handleCoverRemove() {
    if (localCoverPreview || pendingCoverFile) {
      if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);
      setLocalCoverPreview(null);
      setPendingCoverFile(null);
      return;
    }

    if (!initial?.id || !coverImageUrl.trim()) {
      setCoverImageUrl('');
      return;
    }

    setCoverUploading(true);
    try {
      await deletePostCover(initial.id);
      setCoverImageUrl('');
      toast.success('ลบรูปปกแล้ว');
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleImageInsert(file: File) {
    if (!initial?.id) {
      toast.error('บันทึกฉบับร่างก่อน จึงจะแทรกรูปในเนื้อหาได้');
      return;
    }
    const validationError = validateCoverImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setImgUploading(true);
    try {
      const created = await uploadAttachment(initial.id, file);
      const alt = file.name.replace(/\.[^.]+$/, '');
      editorRef.current?.insert(`\n![${alt}](${created.fileUrl})\n`);
      toast.success('แทรกรูปในเนื้อหาแล้ว');
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setImgUploading(false);
      if (imgInputRef.current) imgInputRef.current.value = '';
    }
  }

  function buildPayload(): CreatePostInput & UpdatePostInput {
    const base: CreatePostInput & UpdatePostInput = {
      title: title.trim(),
      content,
      summary: summary.trim() || null,
      visibility,
      tagIds,
    };
    if (isAdmin && isElevated) {
      base.isPinned = isPinned;
      base.isFeatured = isFeatured;
      base.isVerified = isVerified;
    }
    return base;
  }

  async function save(action: 'draft' | 'publish') {
    if (!canSave) {
      toast.error('กรุณากรอกหัวข้อและเนื้อหา');
      return;
    }
    setBusy(action);
    try {
      const payload = buildPayload();

      let saved = initial
        ? await updatePost(initial.id, payload)
        : await createPost(payload);

      // The post now exists server-side — the local backup has done its job.
      if (!initial) clearDraftBackup();

      if (pendingCoverFile) {
        const result = await uploadPostCover(saved.id, pendingCoverFile);
        saved = result.post;
        if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);
        setLocalCoverPreview(null);
        setPendingCoverFile(null);
        setCoverImageUrl(result.coverImageUrl);
      }

      // Everything the form holds is now persisted — disarm the leave guards.
      setSavedSnapshot(currentSnapshot);

      if (action === 'publish') {
        const published = await publishPost(saved.id);
        toast.success('เผยแพร่บทความแล้ว');
        router.push(`/blog/${published.slug}`);
        return;
      }

      toast.success(isEdit ? 'บันทึกแล้ว' : 'บันทึกฉบับร่างแล้ว');
      if (!isEdit) {
        router.replace(`/blog/${saved.slug}/edit`);
      } else {
        router.refresh();
      }
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setBusy(null);
    }
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  // Ctrl+S anywhere in the editor page saves a draft; B/I/K format inside the
  // content editor. metaKey covers macOS.
  function handleRootKeys(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (canSave && busy === null) save('draft');
    }
  }

  function handleEditorKeys(e: React.KeyboardEvent) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'b') { e.preventDefault(); editorRef.current?.surround('**'); }
    else if (k === 'i') { e.preventDefault(); editorRef.current?.surround('*'); }
    else if (k === 'k') { e.preventDefault(); editorRef.current?.surround('[', '](https://)'); }
  }

  // Paste or drop an image straight into the content (requires a saved draft —
  // handleImageInsert explains that itself).
  function handleEditorPaste(e: React.ClipboardEvent) {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith('image/'));
    if (file) {
      e.preventDefault();
      handleImageInsert(file);
    }
  }

  function handleEditorDrop(e: React.DragEvent) {
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) {
      e.preventDefault();
      handleImageInsert(file);
    }
  }

  const TOOLS = [
    { icon: Bold, label: 'ตัวหนา', run: () => editorRef.current?.surround('**') },
    { icon: Italic, label: 'ตัวเอียง', run: () => editorRef.current?.surround('*') },
    { icon: Heading2, label: 'หัวข้อ', run: () => editorRef.current?.linePrefix('## ') },
    { icon: List, label: 'รายการ', run: () => editorRef.current?.linePrefix('- ') },
    { icon: ListOrdered, label: 'รายการลำดับ', run: () => editorRef.current?.linePrefix('1. ') },
    { icon: Quote, label: 'อ้างอิง', run: () => editorRef.current?.linePrefix('> ') },
    { icon: Code2, label: 'โค้ด', run: () => editorRef.current?.surround('`') },
    { icon: Link2, label: 'ลิงก์', run: () => editorRef.current?.surround('[', '](https://)') },
  ];

  const COLORS = [
    { label: 'แดง',    cls: 'tc-red',    hex: '#ef4444' },
    { label: 'ส้ม',    cls: 'tc-orange', hex: '#f97316' },
    { label: 'เหลือง', cls: 'tc-amber',  hex: '#f59e0b' },
    { label: 'เขียว',  cls: 'tc-green',  hex: '#10b981' },
    { label: 'น้ำเงิน',cls: 'tc-blue',   hex: '#3b82f6' },
    { label: 'ม่วง',   cls: 'tc-violet', hex: '#7c3aed' },
    { label: 'ชมพู',   cls: 'tc-pink',   hex: '#ec4899' },
    { label: 'เทา',    cls: 'tc-muted',  hex: '#94a3b8' },
  ];

  return (
    <div className="page-shell" onKeyDown={handleRootKeys}>
      {/* Top bar */}
      <motion.div {...fadeUp(0)} className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          onClick={(e) => {
            if (isDirty) {
              e.preventDefault();
              setLeaveOpen(true);
            }
          }}
          className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {initial ? 'กลับไปที่บทความ' : 'กลับไปที่คลังความรู้'}
        </Link>
        <div className="flex items-center gap-2">
          {autoSavedAt && !isDirty && (
            <span className="hidden text-[11px] text-muted-foreground sm:inline" aria-live="polite">
              บันทึกอัตโนมัติ {TIME_FMT.format(autoSavedAt)}
            </span>
          )}
          <Button variant="cancel" onClick={() => save('draft')} disabled={busy !== null || !canSave}>
            {busy === 'draft' ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save />
            )}
            บันทึกร่าง
          </Button>
          <Button variant="create" size="lg" onClick={() => save('publish')} disabled={busy !== null || !canSave}>
            {busy === 'publish' ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Send />
            )}
            {alreadyPublished ? 'บันทึกและเผยแพร่' : 'เผยแพร่'}
          </Button>
        </div>
      </motion.div>

      {/* Recovery banner — offered when a previous unsaved new post was backed up */}
      {!isEdit && recoverable && (
        <motion.div
          {...fadeUp(0.02)}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand-muted/40 px-4 py-2.5"
        >
          <p className="text-[13px] text-foreground">
            พบฉบับร่างที่ยังไม่ได้บันทึกจากครั้งก่อน
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({recoverable.title.trim() || 'ไม่มีชื่อ'} · {TIME_FMT.format(new Date(recoverable.savedAt))})
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="cancel" size="sm" onClick={() => { clearDraftBackup(); setRecoverable(null); }}>
              ทิ้ง
            </Button>
            <Button variant="create" size="sm" onClick={() => applyRecovery(recoverable)}>
              กู้คืน
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* ── Main editor ── */}
        <motion.div {...fadeUp(0.08)} className="min-w-0 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ชื่อบทความ…"
            className="w-full bg-transparent text-2xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40 sm:text-3xl"
          />

          {/* Intro / summary — sits right under the title, shows beneath the
              title in the feed list and as the lead paragraph on the read page. */}
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            placeholder="เขียนเกริ่นนำสั้น ๆ — แสดงใต้ชื่อบทความในหน้ารายการ"
            className="w-full resize-none bg-transparent text-base leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/40"
          />

          {/* Editor card */}
          <div
            className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10"
            onKeyDown={handleEditorKeys}
            onPaste={handleEditorPaste}
            onDrop={handleEditorDrop}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes('Files')) e.preventDefault();
            }}
          >
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-muted/30 px-2 py-1.5">
              {TOOLS.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  title={t.label}
                  onClick={t.run}
                  className={cn('flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground', FOCUS_RING)}
                >
                  <t.icon className="size-4" />
                </button>
              ))}

              {/* Insert image — uploads then drops a markdown image at the cursor. */}
              <input
                ref={imgInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageInsert(file);
                }}
              />
              <button
                type="button"
                title={initial?.id ? 'แทรกรูปภาพ' : 'บันทึกฉบับร่างก่อนจึงจะแทรกรูปได้'}
                disabled={imgUploading || !initial?.id}
                onClick={() => imgInputRef.current?.click()}
                className={cn('flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40', FOCUS_RING)}
              >
                {imgUploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              </button>

              {/* Color picker */}
              <div className="mx-1 h-4 w-px bg-border/60" />
              {/* 32px hit area around the 20px swatch */}
              {COLORS.map(({ label, cls, hex }) => (
                <button
                  key={cls}
                  type="button"
                  title={`สี${label}`}
                  onClick={() => editorRef.current?.surround(`<span class="${cls}">`, '</span>')}
                  className={cn('group flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-background', FOCUS_RING)}
                >
                  <span
                    className="size-5 rounded-full ring-1 ring-inset ring-black/10 transition-transform group-hover:scale-110 group-active:scale-95"
                    style={{ backgroundColor: hex }}
                  />
                </button>
              ))}

              <div className="ml-auto flex items-center gap-1.5">
                <div className="flex items-center rounded-lg border border-border/60 bg-background/60 p-0.5">
                  {(['write', 'preview'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTab(v)}
                      className={cn(
                        'flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors',
                        FOCUS_RING,
                        tab === v ? 'bg-accent/70 text-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {v === 'write' ? <PencilLine className="size-3.5" /> : <Eye className="size-3.5" />}
                      {v === 'write' ? 'เขียน' : 'ดูตัวอย่าง'}
                    </button>
                  ))}
                </div>

                <Popover>
                  <PopoverTrigger
                    title="คู่มือการเขียน"
                    className={cn('flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground', FOCUS_RING)}
                  >
                    <HelpCircle className="size-4" />
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-0 text-[12px]">
                    <div className="border-b border-border/60 px-3 py-2">
                      <p className="font-semibold text-foreground">คู่มือ Markdown</p>
                    </div>
                    <div className="space-y-3 px-3 py-3">
                      {/* Syntax */}
                      <div className="space-y-1">
                        {[
                          ['# หัวข้อใหญ่', 'หัวข้อ H1'],
                          ['## หัวข้อรอง', 'หัวข้อ H2'],
                          ['**ตัวหนา**', 'ตัวหนา'],
                          ['*ตัวเอียง*', 'ตัวเอียง'],
                          ['- รายการ', 'bullet list'],
                          ['1. รายการลำดับ', 'ordered list'],
                          ['> อ้างอิง', 'blockquote'],
                          ['`โค้ด`', 'inline code'],
                          ['[ข้อความ](url)', 'ลิงก์'],
                        ].map(([syntax, desc]) => (
                          <div key={syntax} className="flex items-center justify-between gap-2">
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">{syntax}</code>
                            <span className="text-muted-foreground">{desc}</span>
                          </div>
                        ))}
                      </div>

                      {/* Color */}
                      <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                        <p className="mb-1 font-medium text-foreground">เปลี่ยนสีข้อความ</p>
                        <p className="leading-relaxed text-muted-foreground">เลือกข้อความ แล้วกดวงกลมสีในแถบเครื่องมือ</p>
                      </div>

                      {/* Enter rules */}
                      <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                        <p className="mb-1 font-medium text-foreground">ขึ้นบรรทัด / ย่อหน้า</p>
                        <div className="space-y-0.5 text-muted-foreground">
                          <p><kbd className="rounded border border-border px-1 font-mono text-[10px]">Enter</kbd> 1 ครั้ง → ข้อความติดกัน</p>
                          <p><kbd className="rounded border border-border px-1 font-mono text-[10px]">Enter</kbd> 2 ครั้ง → ย่อหน้าใหม่</p>
                        </div>
                      </div>

                      {/* Shortcuts */}
                      <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                        <p className="mb-1 font-medium text-foreground">คีย์ลัด</p>
                        <div className="space-y-0.5 text-muted-foreground">
                          <p><kbd className="rounded border border-border px-1 font-mono text-[10px]">Ctrl+B</kbd> ตัวหนา · <kbd className="rounded border border-border px-1 font-mono text-[10px]">Ctrl+I</kbd> ตัวเอียง · <kbd className="rounded border border-border px-1 font-mono text-[10px]">Ctrl+K</kbd> ลิงก์</p>
                          <p><kbd className="rounded border border-border px-1 font-mono text-[10px]">Ctrl+S</kbd> บันทึกร่าง</p>
                          <p>วางรูปจากคลิปบอร์ด หรือลากไฟล์รูปมาวางในช่องเขียนได้เลย</p>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {tab === 'write' ? (
              <div className="h-[52vh] min-h-80">
                <MarkdownEditor
                  ref={editorRef}
                  value={content}
                  onChange={setContent}
                  placeholder="# หัวข้อหลัก&#10;&#10;เขียนเนื้อหาด้วย Markdown — **ตัวหนา**, - รายการ, > อ้างอิง, `โค้ด`"
                  className="h-full"
                />
              </div>
            ) : (
              <div className="h-[52vh] min-h-80 overflow-y-auto px-4 py-4">
                {content.trim() ? (
                  <Markdown content={content} />
                ) : (
                  <p className="text-sm text-muted-foreground">ยังไม่มีเนื้อหาให้แสดงตัวอย่าง</p>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            รองรับ Markdown (GFM) · เวลาอ่านโดยประมาณ {readMins} นาที
          </p>
        </motion.div>

        {/* ── Settings sidebar ── */}
        <motion.aside
          variants={sidebarList}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {/* Cover */}
          <motion.section variants={sidebarItem} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
            <label className={LABEL}>รูปปก</label>
            <PostCoverPicker
              previewUrl={coverPreview}
              uploading={coverUploading}
              disabled={busy !== null}
              onPick={handleCoverPick}
              onRemove={handleCoverRemove}
            />
            {!initial?.id && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                บันทึกฉบับร่างก่อน แล้วรูปปกจะอัปโหลดอัตโนมัติ
              </p>
            )}
          </motion.section>

          {/* Visibility */}
          <motion.section variants={sidebarItem} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
            <label className={LABEL}>การมองเห็น</label>
            <div className="space-y-1.5">
              {POST_VISIBILITIES.map((v) => {
                const cfg = VISIBILITY_CONFIG[v];
                const Icon = cfg.icon;
                const active = visibility === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors',
                      FOCUS_RING,
                      active
                        ? 'border-brand/50 bg-brand-muted/50'
                        : 'border-border bg-background hover:border-brand/30',
                    )}
                  >
                    <Icon className={cn('size-4 shrink-0', active ? 'text-brand' : 'text-muted-foreground')} />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-[12px] font-semibold', active ? 'text-foreground' : 'text-foreground')}>{cfg.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{cfg.hint}</span>
                    </span>
                    {active && <Check className="size-4 shrink-0 text-brand" />}
                  </button>
                );
              })}
            </div>
          </motion.section>

          {/* Tags */}
          <motion.section variants={sidebarItem} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
            <label className={LABEL}>แท็ก</label>
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground">ยังไม่มีแท็กให้เลือก</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const active = tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      aria-pressed={active}
                      style={active ? tagChipStyle(tag.color) : undefined}
                      className={cn(
                        'inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
                        FOCUS_RING,
                        active ? 'tag-chip' : 'border-border bg-background text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: tag.color || '#7c3aed' }} />
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.section>

          {/* Admin flags */}
          {isAdmin && isElevated && (
            <motion.section variants={sidebarItem} className="space-y-1.5 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
              <label className={LABEL}>ผู้ดูแล</label>
              <FlagToggle icon={Pin} label="ปักหมุด" hint="แสดงเด่นบนสุดของคลัง" checked={isPinned} onChange={setIsPinned} />
              <FlagToggle icon={Star} label="แนะนำ" hint="ยกให้เป็นบทความเด่น" checked={isFeatured} onChange={setIsFeatured} />
              <FlagToggle icon={BadgeCheck} label="รับรองเนื้อหา" hint="ตรวจสอบความถูกต้องแล้ว" checked={isVerified} onChange={setIsVerified} />
            </motion.section>
          )}
        </motion.aside>
      </div>

      {initial && (
        <PostAttachments postId={initial.id} canManage className="mt-5" />
      )}

      <ConfirmDialog
        open={leaveOpen}
        title="ออกโดยไม่บันทึก?"
        confirmLabel="ออกจากหน้านี้"
        message="มีการแก้ไขที่ยังไม่ได้บันทึก หากออกตอนนี้การแก้ไขทั้งหมดจะหายไป"
        onConfirm={() => {
          setLeaveOpen(false);
          router.push(backHref);
        }}
        onCancel={() => setLeaveOpen(false)}
      />
    </div>
  );
}

function FlagToggle({
  icon: Icon, label, hint, checked, onChange,
}: {
  icon: typeof Pin;
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
      className={cn('flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-muted/40', FOCUS_RING)}
    >
      <span className="flex items-center gap-2">
        <Icon className={cn('size-3.5', checked ? 'text-brand' : 'text-muted-foreground')} />
        <span>
          <span className="block text-[12px] font-semibold text-foreground">{label}</span>
          <span className="block text-[11px] text-muted-foreground">{hint}</span>
        </span>
      </span>
      <span className={cn(
        'relative ml-2 h-[18px] w-8 shrink-0 rounded-full ring-1 ring-inset transition-colors duration-200',
        checked ? 'bg-brand ring-brand/25' : 'bg-muted-foreground/20 ring-border/60',
      )}>
        <span className={cn(
          'absolute top-0.5 flex size-3.5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
          checked ? 'translate-x-[14px]' : 'translate-x-0.5',
        )}>
          {checked && <Check className="size-2 text-brand" strokeWidth={3} />}
        </span>
      </span>
    </button>
  );
}
