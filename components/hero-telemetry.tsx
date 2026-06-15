'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { io } from 'socket.io-client';
import { Users } from 'lucide-react';
import { authConfig } from '@/lib/auth/config';
import { useMediaQuery } from '@/hooks/use-media-query';

function AnimatedCounter({ value }: { value: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(0);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    // Imperative animate() isn't covered by MotionConfig; snap to the value.
    if (reducedMotion) {
      node.textContent = Math.round(value).toLocaleString();
      prevRef.current = value;
      return;
    }

    const controls = animate(prevRef.current, value, {
      duration: 2.5,
      ease: 'easeOut',
      onUpdate(v) {
        node.textContent = Math.round(v).toLocaleString();
      },
    });
    prevRef.current = value;
    return () => controls.stop();
  }, [value, reducedMotion]);

  return <span ref={nodeRef} />;
}

export function HeroTelemetry() {
  const [total, setTotal] = useState(0);

  // Log ก่อน แล้วค่อย count เพื่อให้ยอดรวมตัวเองด้วย
  useEffect(() => {
    fetch('/api/visitor/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrer: document.referrer || undefined }),
    })
      .catch(() => {})
      .finally(() => {
        fetch('/api/visitor/count')
          .then((r) => r.json())
          .then((json) => {
            if (json?.data?.total != null) setTotal(json.data.total);
          })
          .catch(() => {});
      });
  }, []);

  // Connect to public socket for real-time visitor count
  useEffect(() => {
    const socket = io(authConfig.apiUrl, {
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('visitor:new', (data: { visitedAt: string; userAgent?: string; total: number }) => {
      setTotal(data.total);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="inline-flex items-center gap-2 px-3 py-1 2xl:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold tracking-wide"
    >
      <Users className="fill-current w-4 h-4 2xl:w-5 2xl:h-5" />
      <span><AnimatedCounter value={total} /></span>
    </motion.div>
  );
}
