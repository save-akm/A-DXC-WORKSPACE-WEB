'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Key, Globe, CalendarDays, Wrench, Send } from 'lucide-react';
import { useChatStore, useChatUIStore } from '@/lib/store';

const MIN_QUESTION_LENGTH = 3;



const suggestedPrompts = [
  { label: 'รีเซ็ตรหัสผ่าน', icon: Key },
  { label: 'ตั้งค่า VPN', icon: Globe },
  { label: 'ขอลางาน', icon: CalendarDays },
  { label: 'แจ้งปัญหา IT', icon: Wrench },
];

export function AiPromptBox() {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const setPromptActive = useChatUIStore((s) => s.setPromptActive);
  const isPromptActive = useChatUIStore((s) => s.isPromptActive);
  const pushMessage = useChatStore((s) => s.pushMessage);

  const trimmedLength = value.trim().length;
  const canSubmit = trimmedLength > MIN_QUESTION_LENGTH;

  // Open the chat panel on a "rising edge" of canSubmit (false -> true).
  // Never auto-close — closing is only via the X button inside ChatInterface.
  // This means clicks outside the panel don't dismiss it anymore.
  useEffect(() => {
    if (canSubmit) {
      setPromptActive(true);
    }
  }, [canSubmit, setPromptActive]);

  // When the panel closes (X button), clear any leftover text in the input.
  useEffect(() => {
    if (!isPromptActive) {
      setValue('');
    }
  }, [isPromptActive]);

  useEffect(() => {
    return () => {
      useChatUIStore.getState().setPromptActive(false);
    };
  }, []);

  const handleSubmit = () => {
    const text = value.trim();
    if (text.length <= MIN_QUESTION_LENGTH) return;
    pushMessage({ role: 'user', content: text });
    setValue('');
    setPromptActive(true);
    inputRef.current?.focus();
  };

  const handleChipClick = (label: string) => {
    setValue(label);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full flex flex-col items-center gap-2 sm:gap-3">
      {/* Status Badge — outer wrapper carries the GSAP target id; inner motion.div
          handles enter/exit. They're separate elements so GSAP's transform/opacity
          (warp) doesn't fight framer-motion's animate prop, which would otherwise
          re-apply opacity:1 on every React render and override the warp fade. */}
      <div id="ai-status-badge" className="flex justify-center">
        <AnimatePresence initial={false}>
          {!isPromptActive && (
            <motion.div
              key="ai-status-badge-inner"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full
                bg-brand/10 border border-brand/25
                text-brand"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
              </span>
              <span className="text-xs font-semibold tracking-wide uppercase">
                AI Support พร้อมช่วยคุณ
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Single centered prompt — one feature, no decorative side panels. */}
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-5">

        <div id="ai-prompt-center" className="w-full flex">
          {/* Prompt Input Card — h-full + flex-col so chips dock to the bottom
              when the row is stretched taller than the card's natural height. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6, ease: 'easeOut' }}
            className={`
              w-full h-full flex flex-col rounded-2xl overflow-hidden transition-all duration-300
              bg-white/95 dark:bg-white/5 backdrop-blur-sm dark:backdrop-blur-xl
              border
              ${isFocused
                ? 'border-brand/50'
                : 'border-border'
              }
            `}
          >
            {/* Input Row */}
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4">
              <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-brand-foreground" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  // Guard against IME composition (Thai input) — Enter mid-compose
                  // would submit a partial syllable.
                  if (
                    e.key === 'Enter' &&
                    !e.nativeEvent.isComposing &&
                    canSubmit
                  ) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="ถาม AI Support ได้เลย…"
                className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/50 outline-none font-medium"
              />
              <motion.button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                whileHover={canSubmit ? { scale: 1.1 } : undefined}
                whileTap={canSubmit ? { scale: 0.92 } : undefined}
                className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground transition-all ${
                  canSubmit
                    ? 'bg-primary hover:bg-primary/90 cursor-pointer'
                    : 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed opacity-60'
                }`}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Divider + Chips — pushed to the bottom of the card via mt-auto so
                a stretched card stays balanced (input top, chips bottom). */}
            <div className="mt-auto">
              <div className="mx-3 sm:mx-5 border-t border-zinc-200/50 dark:border-white/5" />
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3">
                {suggestedPrompts.map((prompt, i) => {
                  const Icon = prompt.icon;
                  return (
                    <motion.button
                      key={prompt.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.06, duration: 0.3 }}
                      onClick={() => handleChipClick(prompt.label)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                        bg-zinc-100 dark:bg-white/5
                        text-zinc-600 dark:text-zinc-300
                        border border-zinc-200/80 dark:border-white/10
                        hover:bg-brand/10 dark:hover:bg-brand/15
                        hover:text-brand
                        hover:border-brand/30
                        transition-all cursor-pointer select-none"
                    >
                      <Icon className="w-3 h-3" />
                      {prompt.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
