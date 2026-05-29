"use client";

import { useEffect, useRef, useState } from "react";
import { type LucideIcon } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 1100;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplayed(Math.round(value * eased));
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value]);

  return <>{displayed.toLocaleString()}</>;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  gradient: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springCfg = { stiffness: 350, damping: 30 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), springCfg);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), springCfg);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mouseX.set((e.clientX - r.left) / r.width - 0.5);
    mouseY.set((e.clientY - r.top) / r.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  }

  return (
    <motion.div
      ref={cardRef}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      whileHover={{ scale: 1.04, y: -4 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="cursor-default"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow duration-300",
          hovered
            ? "border-border shadow-lg shadow-black/10 dark:shadow-black/30"
            : "border-border/70",
        )}
      >
        {/* Gradient background glow */}
        <motion.div
          animate={{ opacity: hovered ? 0.07 : 0 }}
          transition={{ duration: 0.25 }}
          className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none", gradient)}
        />

        {/* Shine sweep */}
        <motion.div
          initial={{ x: "-110%", opacity: 0 }}
          animate={hovered ? { x: "320%", opacity: 0.18 } : { x: "-110%", opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 pointer-events-none"
        />

        {/* Decorative faded background icon */}
        <div className="absolute -right-3 -top-2 pointer-events-none opacity-[0.055] dark:opacity-[0.04]">
          <Icon size={82} strokeWidth={1.25} />
        </div>

        {/* Card body */}
        <div className="relative z-10 p-4 pb-3">
          {/* Label row */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold tracking-wide text-foreground/75">
              {label}
            </p>
            {/* Pulse dot */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={hovered ? { scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] } : {}}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className={cn("absolute size-3 rounded-full bg-gradient-to-br opacity-40", gradient)}
              />
              <div className={cn("size-2 rounded-full bg-gradient-to-br", gradient)} />
            </div>
          </div>

          {/* Icon + Number row */}
          <div className="mt-2.5 flex items-center gap-3">
            <motion.div
              animate={hovered ? { scale: 1.13, rotate: 8 } : { scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br",
                gradient,
              )}
            >
              <Icon size={17} />
            </motion.div>
            <p className="text-3xl font-bold tracking-tight tabular-nums leading-none">
              <AnimatedNumber value={value} />
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <motion.div
          animate={{ scaleX: hovered ? 1 : 0.3, opacity: hovered ? 1 : 0.45 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ originX: 0 }}
          className={cn("h-0.5 bg-gradient-to-r", gradient)}
        />
      </div>
    </motion.div>
  );
}
