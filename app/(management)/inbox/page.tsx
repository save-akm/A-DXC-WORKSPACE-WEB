'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { MessageSquareText } from 'lucide-react';
import { chatFadeUp } from '@/lib/chat/motion';

export default function InboxIndexPage() {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-muted/20 via-transparent to-transparent"
      />

      <motion.div
        {...(reduce ? {} : chatFadeUp(0))}
        className="relative flex flex-col items-center gap-4"
      >
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-muted ring-1 ring-brand/15">
          <MessageSquareText className="size-7 text-brand" />
        </div>
        <div>
          <p className="text-base font-semibold">เลือกการสนทนา</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            เลือกแชทจากรายการด้านซ้าย หรือเริ่มแชทใหม่ด้วยปุ่ม +
          </p>
        </div>
      </motion.div>
    </div>
  );
}
