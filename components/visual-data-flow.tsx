'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimationFrame } from 'framer-motion';
import { warpState } from '@/lib/warp-state';
import { useChatUIStore, useLoginUIStore } from '@/lib/store';
import { useMediaQuery } from '@/hooks/use-media-query';

export function VisualDataFlow() {
  const [coords, setCoords] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);
  const isLoginActive = useLoginUIStore((s) => s.isLoginActive);
  const isPromptActive = useChatUIStore((s) => s.isPromptActive);
  // The streaming-data lines are perpetual decorative motion; remove them for
  // reduced-motion users rather than freezing a half-drawn dash.
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const updateCoords = () => {
    const startEl = document.getElementById('cyber-core-zoom');
    const endEl = document.getElementById('ai-prompt-center');

    if (startEl && endEl) {
      const startRect = startEl.getBoundingClientRect();
      const endRect = endEl.getBoundingClientRect();

      const nextStart = { x: startRect.left + startRect.width / 2, y: startRect.top + startRect.height / 2 };
      const nextEnd = { x: endRect.left + endRect.width / 2, y: endRect.top };

      if (!coords || 
          Math.abs(coords.start.x - nextStart.x) > 0.5 || 
          Math.abs(coords.start.y - nextStart.y) > 0.5 ||
          Math.abs(coords.end.x - nextEnd.x) > 0.5 ||
          Math.abs(coords.end.y - nextEnd.y) > 0.5) {
        setCoords({ start: nextStart, end: nextEnd });
      }
    }
  };

  useEffect(() => {
    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords);
    const interval = setInterval(updateCoords, 500);
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
      clearInterval(interval);
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  // Smoothed opacity for the login/chat overlay fade — the warp uses an
  // immediate value (driven by scroll), but overlay open/close needs to
  // glide so the lines don't snap off.
  const overlayOpacityRef = useRef(1);

  useAnimationFrame(() => {
    updateCoords();

    if (containerRef.current) {
      const p = warpState.progress;
      // Fade out and scale up slightly to match the "Warp" effect.
      const warpOpacity = Math.max(0, 1 - p * 3);

      // Glide overlay opacity toward target (0 when login/chat open, else 1).
      const target = isLoginActive || isPromptActive ? 0 : 1;
      overlayOpacityRef.current += (target - overlayOpacityRef.current) * 0.12;
      if (Math.abs(target - overlayOpacityRef.current) < 0.001) {
        overlayOpacityRef.current = target;
      }

      const opacity = Math.min(warpOpacity, overlayOpacityRef.current);
      const scale = 1 + p * 2;

      containerRef.current.style.opacity = opacity.toString();
      containerRef.current.style.transform = `scale(${scale})`;
      containerRef.current.style.display = opacity <= 0.001 ? 'none' : 'block';
    }
  });

  if (reducedMotion || !coords) return null;

  const { start, end } = coords;
  
  // Define 3 paths for variety
  const pathData = [
    `M${start.x} ${start.y} C ${start.x} ${end.y}, ${end.x} ${start.y + (end.y-start.y)*0.4}, ${end.x} ${end.y}`,
    `M${start.x} ${start.y} C ${start.x + 50} ${end.y - 100}, ${end.x + 100} ${start.y + 50}, ${end.x} ${end.y}`,
    `M${start.x} ${start.y} C ${start.x - 50} ${end.y + 50}, ${end.x - 100} ${start.y - 100}, ${end.x} ${end.y}`,
  ];

  return (
    <div 
      ref={containerRef}
      id="visual-data-flow" 
      className="fixed inset-0 pointer-events-none z-10 overflow-hidden"
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="energy-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="energy-grad" x1={start.x} y1={start.y} x2={end.x} y2={end.y} gradientUnits="userSpaceOnUse">
            <stop stopColor="#7c3aed" />
            <stop offset="0.5" stopColor="#9333ea" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        {/* Streaming Data Paths */}
        {pathData.map((d, i) => (
          <g key={i}>
            {/* Background path faint */}
            <path d={d} stroke="url(#energy-grad)" strokeWidth="1" fill="none" className="opacity-10" />
            
            {/* Moving segments (The "Data") */}
            <motion.path
              d={d}
              stroke="url(#energy-grad)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="15 120"
              filter="url(#energy-glow)"
              animate={{ strokeDashoffset: [135, 0] }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.3
              }}
            />

            {/* Smaller, faster pulses */}
            <motion.path
              d={d}
              stroke="white"
              strokeWidth="1"
              fill="none"
              strokeDasharray="2 60"
              animate={{ strokeDashoffset: [62, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.7
              }}
              className="opacity-50"
            />
          </g>
        ))}

        {/* Glow at App Hub */}
        <motion.circle
          cx={end.x}
          cy={end.y}
          r="25"
          fill="url(#impact-glow)"
          animate={{
            opacity: [0.1, 0.4, 0.1],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <defs>
          <radialGradient id="impact-glow">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
