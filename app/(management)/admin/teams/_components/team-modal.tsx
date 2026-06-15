'use client';

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users, Check, ImagePlus, Trash2, ZoomIn, ZoomOut, Crop } from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import type { Team, CreateTeamInput } from '../types';

// ── Constants ────────────────────────────────────────────────────────────────

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

// ── Canvas helpers ───────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/** Downscale to maxPx on longest side so the Cropper never chokes on huge files. */
async function resizeForCropper(src: string, maxPx = 1600): Promise<string> {
  const img = await loadImage(src);
  const { naturalWidth: w, naturalHeight: h } = img;
  if (w <= maxPx && h <= maxPx) return src;

  const scale = maxPx / Math.max(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.92);
}

async function getCroppedImg(src: string, pixels: Area, outputSize = 512): Promise<string> {
  const img = await loadImage(src);

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  canvas.getContext('2d')!.drawImage(img, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, outputSize, outputSize);
  return canvas.toDataURL('image/png');
}

// ── Component ────────────────────────────────────────────────────────────────

interface TeamModalProps {
  open: boolean;
  team?: Team | null;
  onClose: () => void;
  onSubmit: (input: CreateTeamInput) => Promise<void>;
}

type ModalView = 'form' | 'crop';

export function TeamModal({ open, team, onClose, onSubmit }: TeamModalProps) {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [view, setView] = useState<ModalView>('form');
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropping, setCropping] = useState(false);

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
    setView('form');
    setRawImage(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }, [team, open]);

  // Load file → downscale if needed → open crop view
  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const src = e.target?.result as string;
      if (!src) return;
      const resized = await resizeForCropper(src);
      setRawImage(resized);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setView('crop');
    };
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
    e.target.value = '';
  };

  const handleCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function confirmCrop() {
    if (!rawImage || !croppedAreaPixels) return;
    setCropping(true);
    try {
      const result = await getCroppedImg(rawImage, croppedAreaPixels);
      setLogoPreview(result);
      setView('form');
    } finally {
      setCropping(false);
    }
  }

  function cancelCrop() {
    setView('form');
    setRawImage(null);
  }

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
            onClick={view === 'form' ? onClose : undefined}
          />

          {/* Modal */}
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
                    {view === 'crop' ? (
                      <Crop className="h-4 w-4 text-white" />
                    ) : (
                      <Users className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground">
                      {view === 'crop' ? 'ครอปรูป Logo' : isEdit ? 'แก้ไขทีม' : 'สร้างทีมใหม่'}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      {view === 'crop' ? 'ปรับตำแหน่งและขนาดที่ต้องการ' : isEdit ? `แก้ไข ${team?.name}` : 'กรอกข้อมูลทีม'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={view === 'crop' ? cancelCrop : onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── CROP VIEW ── */}
              {view === 'crop' && rawImage && (
                <>
                  {/* Crop area */}
                  <div className="relative h-80 w-full bg-black/90">
                    <Cropper
                      image={rawImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={handleCropComplete}
                      style={{
                        containerStyle: { borderRadius: 0 },
                        cropAreaStyle: { border: '2px solid rgba(99,102,241,0.9)', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' },
                      }}
                    />
                  </div>

                  {/* Zoom slider */}
                  <div className="flex items-center gap-3 border-t border-border/60 bg-background px-6 py-3">
                    <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-indigo-500"
                    />
                    <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="w-8 shrink-0 text-[11px] text-muted-foreground text-right">
                      {zoom.toFixed(1)}×
                    </span>
                  </div>

                  {/* Crop footer */}
                  <div className="flex gap-3 border-t border-border/60 px-6 py-4">
                    <button
                      type="button"
                      onClick={cancelCrop}
                      className="flex-1 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={confirmCrop}
                      disabled={cropping}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {cropping ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          กำลังครอป…
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          ยืนยัน
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* ── FORM VIEW ── */}
              {view === 'form' && (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-0 max-h-[65vh] overflow-y-auto">

                    {/* Left column */}
                    <div className="space-y-4 border-r border-border/60 px-6 py-5">

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

                      {/* Logo dropzone / preview */}
                      <div>
                        <label className={LABEL_CLASS}>Logo ทีม</label>

                        {logoPreview ? (
                          /* Preview state */
                          <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-3">
                            <img
                              src={logoPreview}
                              alt="logo preview"
                              className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-semibold text-foreground">อัปโหลดแล้ว</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">ครอปแล้ว 512×512px</p>
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
                              <p className="mt-0.5 text-[10px] text-muted-foreground">PNG, JPG, WEBP · จะครอปเป็นวงกลม</p>
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

                    {/* Right column: Tags */}
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

                  {/* Form footer */}
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
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
