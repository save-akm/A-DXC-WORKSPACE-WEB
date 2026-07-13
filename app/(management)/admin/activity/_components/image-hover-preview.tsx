'use client';

import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ImageHoverPreviewProps {
  src: string;
  alt?: string;
  imgClassName?: string;
  className?: string;
  children?: React.ReactNode;
}

/** Thumbnail that shows a large fixed preview on hover (portal, above modal z-index). */
export function ImageHoverPreview({
  src,
  alt = '',
  imgClassName,
  className,
  children,
}: ImageHoverPreviewProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, above: true });

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const previewMaxH = Math.min(window.innerHeight * 0.55, 440);
    const above = rect.top > previewMaxH + 20;
    setCoords({
      x: Math.min(Math.max(rect.left + rect.width / 2, 16), window.innerWidth - 16),
      y: above ? rect.top - 10 : rect.bottom + 10,
      above,
    });
  }, []);

  return (
    <>
      <div
        ref={anchorRef}
        className={cn('relative', className)}
        onMouseEnter={() => {
          updatePosition();
          setShow(true);
        }}
        onMouseLeave={() => setShow(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={cn('cursor-zoom-in', imgClassName)} />
        {children}
      </div>

      {show &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[200] opacity-100 transition-opacity duration-150"
            style={{
              left: coords.x,
              top: coords.y,
              transform: coords.above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="max-h-[min(440px,55vh)] max-w-[min(640px,92vw)] rounded-xl border border-white/15 bg-black/90 object-contain shadow-2xl ring-1 ring-black/20"
            />
          </div>,
          document.body,
        )}
    </>
  );
}
