'use client';

import { useEffect, useRef } from 'react';

interface Sparkle {
  x: number;
  y: number;
  r: number;
  color: string;
  baseAlpha: number;
  speed: number;
  phase: number;
}

interface BokehSparklesProps {
  /** Sparkles per pixel². */
  sparkleDensity?: number;
  /** Multiplier on overall alpha in light theme. */
  lightAlphaScale?: number;
  /** Color palette as "r, g, b" triplets. Defaults to warm festive palette. */
  palette?: string[];
  className?: string;
}

// Warm festive palette — rose/pink/amber/fuchsia/gold. Matches the
// Activity section's celebratory mood.
const FESTIVE_PALETTE = [
  '244, 114, 182', // pink-400
  '236, 72, 153',  // pink-500
  '251, 113, 133', // rose-400
  '244, 63, 94',   // rose-500
  '232, 121, 249', // fuchsia-400
  '251, 191, 36',  // amber-400
  '253, 224, 71',  // yellow-300
];

export function BokehSparkles({
  sparkleDensity = 0.00012,
  lightAlphaScale = 0.65,
  palette = FESTIVE_PALETTE,
  className = '',
}: BokehSparklesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let sparkles: Sparkle[] = [];
    let rafId: number | null = null;
    let visible = true;
    const startTime = performance.now();

    const pickColor = () => palette[Math.floor(Math.random() * palette.length)];

    const resize = () => {
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const sparkleCount = Math.max(20, Math.floor(width * height * sparkleDensity));
      sparkles = Array.from({ length: sparkleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.4,
        color: pickColor(),
        baseAlpha: 0.45 + Math.random() * 0.45,
        speed: 1.2 + Math.random() * 2.6,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      const t = (performance.now() - startTime) / 1000;
      const isDark = document.documentElement.classList.contains('dark');
      const alphaScale = isDark ? 1 : lightAlphaScale;
      ctx.clearRect(0, 0, width, height);

      for (const s of sparkles) {
        // Smooth twinkle pulse in [0.2, 1]
        const tw = reduced
          ? 0.6
          : 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.fillStyle = `rgba(${s.color}, ${s.baseAlpha * tw * alphaScale})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (visible && !reduced) rafId = requestAnimationFrame(draw);
      else rafId = null;
    };

    const start = () => {
      if (rafId === null) rafId = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    resize();
    if (reduced) draw();
    else start();

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw();
    });
    ro.observe(parent);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible = entry.isIntersecting;
          if (visible && !reduced) start();
          else stop();
        }
      },
      { threshold: 0 },
    );
    io.observe(parent);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
    };
  }, [sparkleDensity, lightAlphaScale, palette]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  );
}
