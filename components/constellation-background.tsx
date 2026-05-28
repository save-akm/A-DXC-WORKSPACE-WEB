'use client';

import { useEffect, useRef, useState } from 'react';

interface ConstellationDef {
  id: string;
  name: string;
  nameTh: string;
  /** Star positions in normalized 0-1 space; will be scaled to placement bounds. */
  stars: [number, number][];
  /** Pairs of star indices to connect with lines. */
  edges: [number, number][];
}

const CONSTELLATIONS: ConstellationDef[] = [
  {
    id: 'orion',
    name: 'Orion',
    nameTh: 'นายพราน',
    stars: [
      [0.20, 0.10], // 0 Betelgeuse — L shoulder
      [0.78, 0.18], // 1 Bellatrix — R shoulder
      [0.40, 0.46], // 2 Alnitak — belt L
      [0.50, 0.50], // 3 Alnilam — belt M
      [0.60, 0.54], // 4 Mintaka — belt R
      [0.15, 0.92], // 5 Saiph — L foot
      [0.82, 0.95], // 6 Rigel — R foot
      [0.50, 0.72], // 7 Sword
    ],
    edges: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [3, 7]],
  },
  {
    id: 'ursa_major',
    name: 'Ursa Major',
    nameTh: 'หมีใหญ่ (กระบวยใหญ่)',
    stars: [
      [0.04, 0.55], [0.22, 0.62], [0.40, 0.66], [0.56, 0.58],
      [0.66, 0.38], [0.84, 0.34], [0.98, 0.50],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
  {
    id: 'cassiopeia',
    name: 'Cassiopeia',
    nameTh: 'แคสซิโอเปีย',
    stars: [
      [0.05, 0.72], [0.27, 0.22], [0.50, 0.65],
      [0.74, 0.28], [0.96, 0.70],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    id: 'cygnus',
    name: 'Cygnus',
    nameTh: 'หงส์',
    stars: [
      [0.50, 0.06], // head
      [0.50, 0.50], // center (intersection)
      [0.50, 0.94], // tail
      [0.06, 0.50], // L wing
      [0.94, 0.50], // R wing
    ],
    edges: [[0, 1], [1, 2], [3, 1], [1, 4]],
  },
  {
    id: 'lyra',
    name: 'Lyra',
    nameTh: 'พิณ',
    stars: [
      [0.50, 0.06], // Vega
      [0.25, 0.42], [0.75, 0.42],
      [0.30, 0.88], [0.70, 0.82],
    ],
    edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]],
  },
  {
    id: 'leo',
    name: 'Leo',
    nameTh: 'สิงโต',
    stars: [
      [0.05, 0.45], [0.20, 0.62], [0.36, 0.78], [0.56, 0.72],
      [0.78, 0.62], [0.96, 0.42], [0.55, 0.45], [0.36, 0.28],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [6, 7], [7, 0]],
  },
];

interface PlacedStar {
  x: number;
  y: number;
  phase: number;
  size: number;
}

interface Placement {
  def: ConstellationDef;
  bx: number;
  by: number;
  bw: number;
  bh: number;
  centerX: number;
  starPx: PlacedStar[];
}

interface DustParticle {
  x: number;
  y: number;
  r: number;
  phase: number;
}

interface ConstellationBackgroundProps {
  /** Override constellation count. Default scales with width. */
  count?: number;
  /** Background dust particle density (per px²). */
  dustDensity?: number;
  className?: string;
  colors?: {
    light: { line: string; star: string; glow: string };
    dark: { line: string; star: string; glow: string };
  };
}

const DEFAULT_COLORS = {
  light: { line: '99, 102, 241', star: '67, 56, 202', glow: '129, 140, 248' },
  dark: { line: '165, 180, 252', star: '224, 231, 255', glow: '199, 210, 254' },
};

interface HoverState {
  name: string;
  nameTh: string;
}

export function ConstellationBackground({
  count,
  dustDensity = 0.00005,
  className = '',
  colors = DEFAULT_COLORS,
}: ConstellationBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<HoverState | null>(null);

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
    let placements: Placement[] = [];
    let dust: DustParticle[] = [];
    let rafId: number | null = null;
    let visible = true;
    let mouseX = -1;
    let mouseY = -1;
    let hoveredId: string | null = null;
    const startTime = performance.now();

    const placeConstellations = () => {
      placements = [];
      const targetCount = count ?? (width >= 1280 ? 6 : width >= 768 ? 4 : 3);

      // Grid layout — roughly square zones across the section
      const ratio = width / Math.max(height, 1);
      const cols = Math.max(1, Math.round(Math.sqrt(targetCount * ratio)));
      const rows = Math.max(1, Math.ceil(targetCount / cols));
      const zoneW = width / cols;
      const zoneH = height / rows;

      // Shuffle definitions so layout varies per mount
      const defs = [...CONSTELLATIONS].sort(() => Math.random() - 0.5);
      let placed = 0;

      for (let r = 0; r < rows && placed < targetCount; r++) {
        for (let c = 0; c < cols && placed < targetCount; c++) {
          const def = defs[placed % defs.length];
          const padX = zoneW * 0.18;
          const padY = zoneH * 0.18;
          // Slight random offset within zone for organic feel
          const jitterX = (Math.random() - 0.5) * zoneW * 0.1;
          const jitterY = (Math.random() - 0.5) * zoneH * 0.1;

          const x = c * zoneW + padX + jitterX;
          const y = r * zoneH + padY + jitterY;
          const w = zoneW - padX * 2;
          const h = zoneH - padY * 2;

          const starPx: PlacedStar[] = def.stars.map(([sx, sy], i) => ({
            x: x + sx * w,
            y: y + sy * h,
            phase: Math.random() * Math.PI * 2,
            // First star a bit larger as the "primary" star
            size: (i === 0 ? 2.4 : 1.6) + Math.random() * 0.6,
          }));

          // Bounding box for hit-testing (with padding)
          const xs = starPx.map((s) => s.x);
          const ys = starPx.map((s) => s.y);
          const padHit = 18;
          const bx = Math.min(...xs) - padHit;
          const by = Math.min(...ys) - padHit;
          const bw = Math.max(...xs) - bx + padHit;
          const bh = Math.max(...ys) - by + padHit;

          placements.push({
            def,
            bx,
            by,
            bw,
            bh,
            centerX: bx + bw / 2,
            starPx,
          });
          placed++;
        }
      }
    };

    const resize = () => {
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      placeConstellations();

      const dustCount = Math.floor(width * height * dustDensity);
      dust = Array.from({ length: dustCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 0.8 + 0.3,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const getPalette = () => {
      const isDark = document.documentElement.classList.contains('dark');
      return isDark ? colors.dark : colors.light;
    };

    const draw = () => {
      const palette = getPalette();
      const t = (performance.now() - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      // Hover detection (point-in-bbox)
      let newHoverId: string | null = null;
      if (mouseX >= 0) {
        for (const p of placements) {
          if (
            mouseX >= p.bx &&
            mouseX <= p.bx + p.bw &&
            mouseY >= p.by &&
            mouseY <= p.by + p.bh
          ) {
            newHoverId = p.def.id;
            break;
          }
        }
      }
      if (newHoverId !== hoveredId) {
        hoveredId = newHoverId;
        if (newHoverId) {
          const hp = placements.find((p) => p.def.id === newHoverId)!;
          setHovered({ name: hp.def.name, nameTh: hp.def.nameTh });
        } else {
          setHovered(null);
        }
      }

      // Ambient dust
      ctx.fillStyle = `rgba(${palette.star}, 1)`;
      for (const d of dust) {
        const a = 0.18 + 0.18 * Math.sin(t * 1.2 + d.phase);
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Constellations
      for (const p of placements) {
        const isHover = p.def.id === hoveredId;
        const lineAlpha = isHover ? 0.6 : 0.22;
        const starBoost = isHover ? 1.3 : 1;

        // Edges
        ctx.strokeStyle = `rgba(${palette.line}, ${lineAlpha})`;
        ctx.lineWidth = isHover ? 1.2 : 0.6;
        ctx.beginPath();
        for (const [a, b] of p.def.edges) {
          ctx.moveTo(p.starPx[a].x, p.starPx[a].y);
          ctx.lineTo(p.starPx[b].x, p.starPx[b].y);
        }
        ctx.stroke();

        // Stars (twinkle + radial glow)
        for (const s of p.starPx) {
          const tw = 0.65 + 0.35 * Math.sin(t * 1.4 + s.phase);
          const glowR = s.size * (isHover ? 7 : 4.5);

          const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
          grad.addColorStop(0, `rgba(${palette.glow}, ${0.55 * tw * starBoost})`);
          grad.addColorStop(1, `rgba(${palette.glow}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(${palette.star}, ${Math.min(1, tw * starBoost)})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
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

    const updateTooltipPos = () => {
      const tt = tooltipRef.current;
      if (!tt) return;
      tt.style.left = `${mouseX}px`;
      tt.style.top = `${mouseY}px`;
    };

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      // Move the tooltip imperatively so it follows the cursor without
      // triggering a React re-render on every frame.
      updateTooltipPos();
      // In reduced-motion mode the loop is paused — redraw once for hover feedback
      if (reduced) draw();
    };
    const handleLeave = () => {
      mouseX = -1;
      mouseY = -1;
      if (reduced) draw();
    };

    resize();
    if (reduced) draw();
    else start();

    // Listen on the parent (section) so events bubble up from any child
    // (including cards stacked above the canvas). This way hover detection
    // works even when the cursor is over an opaque-ish card sitting on top
    // of a constellation.
    parent.addEventListener('mousemove', handleMove);
    parent.addEventListener('mouseleave', handleLeave);

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
      parent.removeEventListener('mousemove', handleMove);
      parent.removeEventListener('mouseleave', handleLeave);
    };
  }, [count, dustDensity, colors]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${className}`}
      />
      <div
        ref={tooltipRef}
        aria-hidden={!hovered}
        className="absolute pointer-events-none z-[5] px-3 py-1.5 rounded-lg
          bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md
          border border-indigo-300/60 dark:border-indigo-400/30
          shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10
          whitespace-nowrap select-none transition-opacity duration-150"
        style={{
          left: 0,
          top: 0,
          transform: 'translate(-50%, calc(-100% - 14px))',
          opacity: hovered ? 1 : 0,
        }}
      >
        <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300 leading-none">
          {hovered?.name ?? ''}
        </div>
        <div className="mt-0.5 text-[10px] text-zinc-600 dark:text-zinc-400 leading-none">
          {hovered?.nameTh ?? ''}
        </div>
      </div>
    </>
  );
}
