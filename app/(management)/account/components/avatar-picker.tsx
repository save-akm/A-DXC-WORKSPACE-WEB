'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, ImagePlus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const presetAvatars = [
  'child0.png',
  'child8.jpg',
  'childm0.png',
  'child9.jpg',
  'childm7.png',
  'child7.jpg',
  'child3.jpg',
  'child5.jpg',
  'child6.jpg',
  'child1.jpg',
  'child2.jpg',
  'child10.jpg',
  'child11.jpg',
  'child12.jpg',
  'child13.jpg',
  'female1.jpg',
  'female2.jpg',
  'female3.jpg',
  'male1.jpg',
  'male2.jpg',
];

interface AvatarPickerProps {
  /** Selected preset filename (e.g. "child1.jpg") — null if custom upload is active or nothing chosen. */
  selectedPreset: string | null;
  onSelectPreset: (filename: string) => void;
  /** Local preview URL for an uploaded file (object URL). */
  customPreview: string | null;
  onUpload: (file: File) => void;
  onClearCustom: () => void;
}

const tileSize = 'h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-36 lg:w-36';

export function AvatarPicker({
  selectedPreset,
  onSelectPreset,
  customPreview,
  onUpload,
  onClearCustom,
}: AvatarPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  const [isReady, setIsReady] = useState(false);

  const x = useMotionValue(0);
  // fade only appears once the track has scrolled away from each edge
  const leftFadeOpacity = useTransform(x, [-16, 0], [1, 0]);
  const rightFadeOpacity = useTransform(
    x,
    [dragConstraints.left, dragConstraints.left + 16],
    [0, 1],
  );

  useLayoutEffect(() => {
    const update = () => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;
      const containerW = container.offsetWidth;
      const totalW = track.scrollWidth;
      if (totalW <= containerW) {
        setDragConstraints({ left: 0, right: 0 });
      } else {
        setDragConstraints({ left: containerW - totalW, right: 0 });
      }
      setIsReady(true);
    };

    const t = setTimeout(update, 30);
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', update);
    };
  }, []);

  const customSelected = !!customPreview;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">เลือก Avatar</label>
        <span className="text-sm text-muted-foreground">ลากซ้าย-ขวาเพื่อเลื่อนดู</span>
      </div>

      <div className="relative w-full rounded-xl border border-border bg-background/50 p-3 sm:p-4 backdrop-blur-sm">
        <motion.div
          aria-hidden
          style={{ opacity: leftFadeOpacity }}
          className="pointer-events-none absolute inset-y-3 left-3 z-10 w-6 rounded-l-xl bg-gradient-to-r from-background to-transparent sm:inset-y-4 sm:left-4"
        />
        <motion.div
          aria-hidden
          style={{ opacity: rightFadeOpacity }}
          className="pointer-events-none absolute inset-y-3 right-3 z-10 w-6 rounded-r-xl bg-gradient-to-l from-background to-transparent sm:inset-y-4 sm:right-4"
        />

        <motion.div ref={containerRef} className="overflow-hidden">
          <motion.div
            ref={trackRef}
            drag={isReady ? 'x' : false}
            dragConstraints={dragConstraints}
            dragElastic={0.05}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 40 }}
            whileTap={{ cursor: 'grabbing' }}
            style={{ x }}
            className="flex w-max cursor-grab gap-3 active:cursor-grabbing sm:gap-4 md:gap-5"
          >
            {/* Upload tile */}
            <div
              className={cn(
                'group relative flex-shrink-0 overflow-hidden rounded-2xl border-4 transition-all',
                tileSize,
                customSelected
                  ? 'border-primary shadow-xl shadow-primary/20'
                  : 'border-dashed border-muted-foreground/30 hover:border-muted-foreground/60',
              )}
            >
              {customSelected ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={customPreview ?? ''}
                    alt="Custom avatar preview"
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="xs"
                      variant="secondary"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="shadow-lg"
                    >
                      <Upload className="size-3" />
                      เปลี่ยน
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      type="button"
                      onClick={onClearCustom}
                      className="shadow-lg"
                    >
                      <Trash2 className="size-3" />
                      ลบ
                    </Button>
                  </div>
                  <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                    <Check className="size-3" />
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <ImagePlus className="size-6 sm:size-7" />
                  <span className="text-[10px] font-medium sm:text-xs">อัพโหลดรูป</span>
                </button>
              )}
            </div>

            {/* Preset tiles */}
            {presetAvatars.map((avatar) => {
              const isSelected = !customSelected && selectedPreset === avatar;
              return (
                <motion.div
                  key={avatar}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'group relative flex-shrink-0 overflow-hidden rounded-2xl border-4',
                    tileSize,
                    isSelected
                      ? 'border-primary shadow-xl shadow-primary/20'
                      : 'border-transparent hover:border-muted-foreground/30',
                  )}
                >
                  <Image
                    src={`/avatars/${avatar}`}
                    alt={avatar}
                    fill
                    sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, (max-width: 1024px) 128px, 144px"
                    className="object-cover"
                    draggable={false}
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="xs"
                      variant={isSelected ? 'secondary' : 'default'}
                      type="button"
                      onClick={() => onSelectPreset(avatar)}
                      className="shadow-lg"
                    >
                      {isSelected ? 'Selected' : 'Pick'}
                    </Button>
                  </div>
                  {isSelected ? (
                    <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                      <Check className="size-3" />
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {(customSelected || selectedPreset) ? (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-foreground">
          <span>เลือกแล้ว:</span>
          <span className="rounded bg-muted/60 px-2 py-0.5 font-medium text-foreground">
            {customSelected ? 'ไฟล์อัพโหลด' : selectedPreset}
          </span>
        </div>
      ) : null}
    </div>
  );
}
