'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Key, Globe, CalendarDays, Wrench, Send, Bell, ShieldCheck, Activity, Users, Trophy, Clock, Target, TrendingUp, MessageSquare, Info } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useChatStore, useChatUIStore } from '@/lib/store';

const MIN_QUESTION_LENGTH = 3;



const suggestedPrompts = [
  { label: 'รีเซ็ตรหัสผ่าน', icon: Key },
  { label: 'ตั้งค่า VPN', icon: Globe },
  { label: 'ขอลางาน', icon: CalendarDays },
  { label: 'แจ้งปัญหา IT', icon: Wrench },
];

function SideWidget({ title, icon: Icon, children, delay = 0, id }: { title: string; icon: LucideIcon; children: React.ReactNode; delay?: number, id?: string }) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay, duration: 0.5 }}
      className="hidden xl:flex flex-col gap-2 w-64 h-full p-4 rounded-2xl bg-white/95 dark:bg-white/5 backdrop-blur-sm dark:backdrop-blur-md border border-zinc-200 dark:border-white/10"
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
        <Icon size={14} className="text-indigo-500" />
        {title}
      </div>
      <div className="flex flex-col gap-2 mt-1">
        {children}
      </div>
    </motion.div>
  );
}

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
                bg-indigo-500/10 border border-indigo-500/20
                text-indigo-600 dark:text-indigo-300"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              <span className="text-xs font-semibold tracking-wide uppercase">
                AI Support พร้อมช่วยคุณ
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Equal-height row: left widget · chat box · right widget */}
      <div className="flex flex-col xl:flex-row items-stretch justify-center gap-3 xl:gap-6 w-full max-w-[1600px] mx-auto px-3 sm:px-5">

        {/* ── Left Side: My Progress ── */}
        <div id="ai-widget-left">
          <SideWidget title="My Progress" icon={Trophy} delay={0.9}>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 dark:bg-white/5">
                <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 mb-1">
                  <Target size={12} />
                  <span className="text-[10px] uppercase font-bold tracking-tight">AI Tasks</span>
                </div>
                <span className="text-sm font-bold">42</span>
              </div>
              <div className="relative group flex flex-col p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 dark:bg-white/5">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
                  <Clock size={12} />
                  <span className="text-[10px] uppercase font-bold tracking-tight">Saved</span>
                  <Info size={10} className="ml-auto opacity-40 hover:opacity-100" />
                </div>
                <span className="text-sm font-bold">12.5h</span>
              </div>
            </div>
          </SideWidget>
        </div>

        {/* ── Center: Main Prompt Area ── */}
        <div id="ai-prompt-center" className="flex-1 w-full flex">
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
                ? 'border-indigo-400/50 dark:border-indigo-500/30 shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)] dark:shadow-[0_0_40px_-5px_rgba(99,102,241,0.12)]'
                : 'border-zinc-200 dark:border-white/10 shadow-lg shadow-zinc-200/20 dark:shadow-none'
              }
            `}
          >
            {/* Input Row */}
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4">
              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all ${
                  canSubmit
                    ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 cursor-pointer shadow-md shadow-indigo-500/30'
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
                        hover:bg-indigo-50 dark:hover:bg-indigo-500/10
                        hover:text-indigo-600 dark:hover:text-indigo-300
                        hover:border-indigo-300/60 dark:hover:border-indigo-500/20
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

        {/* ── Right Side: Trending Topics ── */}
        <div id="ai-widget-right">
          <SideWidget title="Trending Topics" icon={TrendingUp} delay={1}>
            <div className="space-y-2.5 p-1 mt-1">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-6 h-6 rounded-md bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:bg-pink-500 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(236,72,153,0.5)] transition-all duration-300">
                  <MessageSquare size={12} />
                </div>
                <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">#VPN_Setup_Issue</span>
              </div>
              
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(99,102,241,0.5)] transition-all duration-300">
                  <MessageSquare size={12} />
                </div>
                <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">#Claim_Policy</span>
              </div>

              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(245,158,11,0.5)] transition-all duration-300">
                  <MessageSquare size={12} />
                </div>
                <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">#Holiday_Calendar</span>
              </div>
            </div>
          </SideWidget>
        </div>
      </div>
    </div>
  );
}
