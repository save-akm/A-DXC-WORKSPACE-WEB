'use client';

import { useEffect, useRef } from 'react';
import { motion, animate } from 'framer-motion';
import { Users, Activity } from 'lucide-react';

function AnimatedCounter({ from = 0, to }: { from?: number; to: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(from, to, {
      duration: 2.5,
      ease: "easeOut",
      onUpdate(value) {
        node.textContent = Math.round(value).toLocaleString();
      },
    });

    return () => controls.stop();
  }, [from, to]);

  return <span ref={nodeRef} />;
}

export function HeroTelemetry() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="inline-flex items-center gap-2 px-3 py-1 2xl:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold tracking-wide"
    >
      <Users className="fill-current w-4 h-4 2xl:w-5 2xl:h-5" />
      <span><AnimatedCounter to={15482} /></span>
    </motion.div>
  );
}
