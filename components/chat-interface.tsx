'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, Plus, History, X } from 'lucide-react';
import { useChatStore, useChatUIStore } from '@/lib/store';

export function ChatInterface() {
  const messages = useChatStore((s) => s.messages);
  const setPromptActive = useChatUIStore((s) => s.setPromptActive);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-x-0 top-3 bottom-0 z-30 col-span-full pointer-events-none"
    >
      <div className="w-full h-full rounded-3xl bg-white/95 dark:bg-white/5 backdrop-blur-sm dark:backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col pointer-events-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-200/80 dark:border-white/10 shrink-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight">ด็อกซี่ (Doxy)</span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              AI Assistant · DXC Workspace Center
            </span>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            พร้อมใช้งาน
          </span>
          <button
            type="button"
            onClick={() => setPromptActive(false)}
            aria-label="ปิดแชท"
            className="ml-2 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: history sidebar (left) + main chat (right) */}
        <div className="flex-1 flex min-h-0">
          {/* ── History Panel ── */}
          <aside className="hidden md:flex w-64 lg:w-72 flex-col border-r border-zinc-200/80 dark:border-white/10 shrink-0">
            <div className="px-3 py-3 border-b border-zinc-200/60 dark:border-white/5">
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold
                  bg-indigo-600 hover:bg-indigo-700 text-white
                  shadow-md shadow-indigo-500/20
                  transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                บทสนทนาใหม่
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                <History className="w-3 h-3" />
                ประวัติการสนทนา
              </div>
              <div className="px-3 py-6 text-center text-xs text-muted-foreground/70">
                ยังไม่มีประวัติการสนทนา
              </div>
            </div>
          </aside>

          {/* ── Main Chat Area ── */}
          <main className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto px-5 md:px-8 py-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <MessageSquare className="w-9 h-9 opacity-30" />
                  <p className="text-sm">เริ่มต้นบทสนทนาได้ที่ช่องด้านล่าง</p>
                  <p className="text-xs opacity-70">
                    ด็อกซี่จะตอบจากเอกสารภายในที่ทีมอัปโหลดไว้เท่านั้น
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-w-3xl mx-auto w-full">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-md shadow-md shadow-indigo-500/20'
                            : 'bg-zinc-100 dark:bg-white/5 text-foreground rounded-bl-md border border-zinc-200/60 dark:border-white/10'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </motion.div>
  );
}
