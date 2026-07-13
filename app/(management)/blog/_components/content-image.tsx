'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, Loader2 } from 'lucide-react';

/** Derive a sensible download filename from the URL (falls back to alt / "image"). */
function fileNameFrom(src: string, alt?: string): string {
  try {
    const path = src.split('?')[0];
    const last = path.substring(path.lastIndexOf('/') + 1);
    if (last && /\.[a-z0-9]+$/i.test(last)) return decodeURIComponent(last);
  } catch { /* ignore */ }
  return (alt?.trim() || 'image');
}

/**
 * A content image that opens a full-screen lightbox on click, with a download
 * button. Used by the markdown renderer for inline `![](…)` images.
 */
export function ContentImage({ src, alt }: { src: string; alt?: string }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Lock body scroll + close on Escape while the lightbox is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      // Same-origin (via /media rewrite) → fetch as blob so the download works
      // even when the browser would otherwise navigate to the image.
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileNameFrom(src, alt);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in a new tab if the fetch/blob path fails.
      window.open(src, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  }, [src, alt]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ''}
        loading="lazy"
        onClick={() => setOpen(true)}
        className="my-5 w-full cursor-zoom-in rounded-xl border border-border/60 transition-opacity hover:opacity-90"
      />

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
              >
                {/* Controls */}
                <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-5 sm:top-5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                    disabled={downloading}
                    title="ดาวน์โหลด"
                    className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-60"
                  >
                    {downloading ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                    title="ปิด"
                    className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Full image */}
                <motion.img
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.94, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  src={src}
                  alt={alt ?? ''}
                  onClick={(e) => e.stopPropagation()}
                  className="max-h-full max-w-full cursor-default rounded-lg object-contain shadow-2xl"
                />

                {alt?.trim() && (
                  <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/80">
                    {alt}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
