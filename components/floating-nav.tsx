'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Home, ChevronRight, ChevronLeft, Megaphone, Users, Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Configuration for the sections.
 * Order matters! Portal Hub (Hero) is index 0.
 *
 * `domId` points to the actual DOM element used for scroll-to and
 * intersection tracking. `hero` has no domId because it lives inside
 * the pinned warp container — we scroll to scrollY=0 for that one.
 */
type SectionDef = {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  domId?: string;
};

const SECTIONS: SectionDef[] = [
  {
    id: 'hero',
    label: 'Portal Hub',
    icon: <Home size={16} />,
    color: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'app-hub',
    label: 'App Hub',
    icon: <LayoutGrid size={16} />,
    color: 'from-purple-600 to-pink-600',
    domId: 'app-hub-section',
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: <Megaphone size={16} />,
    color: 'from-amber-600 to-rose-600',
    domId: 'announcements-section',
  },
  {
    id: 'meet-it-team',
    label: 'IT Team',
    icon: <Users size={16} />,
    color: 'from-indigo-600 to-violet-600',
    domId: 'meet-it-team-section',
  },
  {
    id: 'activity',
    label: 'Activity',
    icon: <Camera size={16} />,
    color: 'from-rose-500 to-pink-600',
    domId: 'activity-section',
  },
];

const REVEAL_THRESHOLD = 0.85;

export function FloatingNav() {
  const [activeSection, setActiveSection] = useState('hero');
  const [warpDone, setWarpDone] = useState(false);

  // ── Track warp progress to gate hero <-> landing visibility ──
  useEffect(() => {
    const onWarpUpdate = (p: number) => {
      setWarpDone(p >= REVEAL_THRESHOLD);
    };

    const initSync = () => {
      const st = ScrollTrigger.getById('warp-trigger');
      if (!st) return null;
      onWarpUpdate(st.progress);
      return ScrollTrigger.create({
        trigger: st.trigger,
        start: st.start,
        end: st.end,
        onUpdate: (self) => onWarpUpdate(self.progress),
      });
    };

    let observer = initSync();
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (!observer) {
      intervalId = setInterval(() => {
        observer = initSync();
        if (observer && intervalId) clearInterval(intervalId);
      }, 200);
    }

    return () => {
      if (observer) observer.kill();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // ── Track which Landing section is currently in view ──
  useEffect(() => {
    if (!warpDone) return;

    const targets = SECTIONS.filter((s) => s.domId)
      .map((s) => ({ id: s.id, el: document.getElementById(s.domId!) }))
      .filter((t): t is { id: string; el: HTMLElement } => t.el !== null);

    if (targets.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        // Pick the entry most centered in the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const match = targets.find((t) => t.el === visible[0].target);
          if (match) setActiveSection(match.id);
        }
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: '-20% 0px -40% 0px' }
    );

    targets.forEach((t) => io.observe(t.el));
    // Default to first landing section when warp completes.
    setActiveSection((cur) => (cur === 'hero' ? targets[0].id : cur));

    return () => io.disconnect();
  }, [warpDone]);

  // When warp progress drops back below threshold, return to hero.
  useEffect(() => {
    if (!warpDone) setActiveSection('hero');
  }, [warpDone]);

  const currentIndex = SECTIONS.findIndex((s) => s.id === activeSection);
  const portalSec = SECTIONS[0];
  const prevSec = currentIndex > 1 ? SECTIONS[currentIndex - 1] : null;
  const nextSec = currentIndex < SECTIONS.length - 1 ? SECTIONS[currentIndex + 1] : null;

  const scrollToSection = (id: string) => {
    if (id === 'hero') {
      gsap.to(window, {
        scrollTo: 0,
        duration: 1.2,
        ease: 'power4.inOut',
      });
      return;
    }

    const sec = SECTIONS.find((s) => s.id === id);
    if (!sec?.domId) return;
    const target = document.getElementById(sec.domId);
    if (!target) return;

    gsap.to(window, {
      scrollTo: { y: target, offsetY: 0, autoKill: false },
      duration: 1.2,
      ease: 'power4.inOut',
    });
  };

  const isVisible = warpDone && activeSection !== 'hero';

  if (!isVisible) return null;

  return (
    <div className="fixed top-8 right-8 z-[100] pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ y: -50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -50, opacity: 0, scale: 0.95 }}
          className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-full bg-white/70 dark:bg-zinc-950/50 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-black/5 dark:ring-white/5"
        >
          {/* 1. Portal Hub Button */}
          <NavButton
            label={portalSec.label}
            icon={<Home size={14} />}
            onClick={() => scrollToSection('hero')}
            variant="primary"
          />

          {(prevSec || nextSec) && (
            <>
              <div className="h-6 w-px bg-black/10 dark:bg-white/10 mx-1" />
              <div className="flex items-center gap-2">
                {prevSec && (
                  <NavButton
                    label={prevSec.label}
                    icon={<ChevronLeft size={14} />}
                    onClick={() => scrollToSection(prevSec.id)}
                    isPrev
                  />
                )}

                {nextSec && (
                  <NavButton
                    label={nextSec.label}
                    icon={<ChevronRight size={14} />}
                    onClick={() => scrollToSection(nextSec.id)}
                    isNext
                  />
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function NavButton({
  label,
  icon,
  onClick,
  variant = 'ghost',
  isPrev = false,
  isNext = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
  isPrev?: boolean;
  isNext?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer overflow-hidden group
        ${
          variant === 'primary'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
            : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white border border-black/5 dark:border-white/5'
        }
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

      {isPrev && icon}
      {variant === 'primary' && icon}
      <span className="relative z-10">{label}</span>
      {isNext && icon}
    </motion.button>
  );
}
