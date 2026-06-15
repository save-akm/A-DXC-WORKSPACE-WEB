'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { themePresets } from '@/lib/management/themes';
import { useThemePresetStore } from '@/lib/stores/theme-preset-store';
import { cn } from '@/lib/utils';

export function ThemePicker() {
  const { theme, resolvedTheme } = useTheme();
  const lightPresetId = useThemePresetStore((s) => s.lightPresetId);
  const darkPresetId = useThemePresetStore((s) => s.darkPresetId);
  const setPreset = useThemePresetStore((s) => s.setPreset);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const currentTheme = mounted
    ? theme === 'system'
      ? resolvedTheme ?? 'light'
      : theme
    : 'light';
  const currentMode: 'light' | 'dark' = currentTheme === 'dark' ? 'dark' : 'light';
  const activePresetId = currentMode === 'dark' ? darkPresetId : lightPresetId;

  const visiblePresets = themePresets.filter((preset) => preset.mode === currentMode);
  const activePreset = themePresets.find((p) => p.id === activePresetId) ?? visiblePresets[0] ?? themePresets[0];

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Theme preset"
        aria-expanded={open}
        className="relative cursor-pointer inline-flex size-7 items-center justify-center overflow-hidden rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground 2xl:size-8"
      >
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-90',
            activePreset.preview,
          )}
        />
        <Palette className="relative size-4 text-white drop-shadow" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl"
          >
            <div className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {currentTheme === 'dark' ? 'Dark themes' : 'Light themes'}
            </div>
            <div className="flex flex-col gap-0.5">
              {visiblePresets.map((preset) => {
                const isActive = preset.id === activePresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setPreset(currentMode, preset.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'group/preset flex items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors',
                      isActive ? 'bg-accent/70' : 'hover:bg-accent/50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-base shadow-inner ring-1 ring-white/15',
                        preset.preview,
                      )}
                    >
                      <span aria-hidden>{preset.emoji}</span>
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {preset.name}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {preset.id}
                      </span>
                    </div>
                    {isActive ? <Check className="size-4 text-brand" /> : null}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
