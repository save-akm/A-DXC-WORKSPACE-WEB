'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Check, Copy, FileSearch, Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { askChat, streamChat } from '@/lib/api/documents';
import type { ChatSource } from '../types';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  sources?: ChatSource[];
  notFound?: boolean;
  error?: boolean;
  streaming?: boolean;
}

interface AskAiPanelProps {
  open: boolean;
  collectionId: string;
  collectionName: string;
  onClose: () => void;
}

let nextId = 1;

/** แผงถาม AI จากเอกสารใน collection — สตรีมคำตอบแบบ SSE, fallback เป็นถามรอบเดียว */
export function AskAiPanel({ open, collectionId, collectionName, onClose }: AskAiPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // ปิด panel = ยกเลิก stream ที่ค้างอยู่
  useEffect(() => {
    if (!open) abortRef.current?.abort();
  }, [open]);
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const patchMessage = useCallback((id: number, patch: Partial<ChatMessage> | ((m: ChatMessage) => Partial<ChatMessage>)) => {
    setMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)),
    );
  }, []);

  const handleCopy = useCallback((id: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(prev => (prev === id ? null : prev)), 1500);
    });
  }, []);

  const handleSend = useCallback(async () => {
    const question = input.trim();
    if (!question || busy) return;
    setInput('');
    setBusy(true);

    const userMsg: ChatMessage = { id: nextId++, role: 'user', text: question };
    const aiMsg: ChatMessage = { id: nextId++, role: 'assistant', text: '', streaming: true };
    setMessages(prev => [...prev, userMsg, aiMsg]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(
        { question, collectionId },
        {
          onSources: sources => patchMessage(aiMsg.id, { sources }),
          onToken: text => patchMessage(aiMsg.id, m => ({ text: m.text + text })),
          onDone: notFound => patchMessage(aiMsg.id, { notFound, streaming: false }),
        },
        controller.signal,
      );
      patchMessage(aiMsg.id, { streaming: false });
    } catch (e) {
      if (controller.signal.aborted) return;
      // stream ใช้ไม่ได้ (เช่น proxy บัฟเฟอร์) → ถามแบบรอคำตอบทีเดียว
      try {
        const res = await askChat({ question, collectionId });
        patchMessage(aiMsg.id, {
          text: res.answer,
          sources: res.sources,
          notFound: res.notFound,
          streaming: false,
        });
      } catch {
        patchMessage(aiMsg.id, {
          text: (e as Error).message || 'AI ตอบไม่สำเร็จ กรุณาลองใหม่',
          error: true,
          streaming: false,
        });
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [input, busy, collectionId, patchMessage]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="ai-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:bg-black/10"
            onClick={onClose}
          />
          <motion.aside
            key="ai-panel"
            role="dialog"
            aria-label={`ถาม AI จากเอกสารใน ${collectionName}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-border/60 px-4 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[13px] font-bold">ถาม AI จากเอกสาร</h2>
                <p className="truncate text-[11px] text-muted-foreground">
                  ค้นเฉพาะใน &quot;{collectionName}&quot;
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="ปิด"
                className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                    <FileSearch className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">ถามอะไรก็ได้จากเอกสารในกล่องนี้</p>
                    <p className="mx-auto mt-1 max-w-64 text-xs leading-relaxed text-muted-foreground">
                      เช่น &quot;สรุป TOR โปรเจกต์นี้ให้หน่อย&quot; — AI จะอ้างอิงเฉพาะไฟล์ที่อัปโหลดไว้
                      (ลิงก์ภายนอกไม่ถูกค้น)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map(m =>
                    m.role === 'user' ? (
                      <div key={m.id} className="flex justify-end">
                        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-linear-to-r from-indigo-500 to-violet-600 px-3.5 py-2 text-[13px] leading-relaxed text-white">
                          {m.text}
                        </p>
                      </div>
                    ) : (
                      <div key={m.id} className="flex flex-col gap-1.5">
                        <div
                          className={cn(
                            'max-w-[92%] rounded-2xl rounded-bl-md px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-wrap',
                            m.error
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted text-foreground',
                          )}
                        >
                          {m.text || (
                            <span className="inline-flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="size-3.5 animate-spin" />
                              กำลังค้นเอกสาร…
                            </span>
                          )}
                          {m.streaming && m.text && (
                            <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-indigo-500 align-middle" />
                          )}
                        </div>
                        {m.notFound && !m.error && (
                          <p className="text-[11px] text-muted-foreground">
                            ไม่พบเนื้อหาที่เกี่ยวข้องในเอกสาร — คำตอบนี้เป็นความรู้ทั่วไปของ AI
                          </p>
                        )}
                        {m.sources && m.sources.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {m.sources.map((s, i) => (
                              <span
                                key={`${s.documentId}-${s.chunkIndex}-${i}`}
                                title={`ความใกล้เคียง ${(s.similarity * 100).toFixed(0)}%`}
                                className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400"
                              >
                                <FileSearch className="size-2.5" />
                                {s.source}
                              </span>
                            ))}
                          </div>
                        )}
                        {m.text && !m.streaming && (
                          <button
                            type="button"
                            onClick={() => handleCopy(m.id, m.text)}
                            className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="size-3 text-emerald-500" />
                                คัดลอกแล้ว
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                คัดลอกคำตอบ
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/60 p-3">
              <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
                <textarea
                  value={input}
                  rows={1}
                  disabled={busy}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="พิมพ์คำถาม… (Enter เพื่อส่ง)"
                  className="max-h-28 min-h-6 flex-1 resize-none bg-transparent text-[13px] leading-6 outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={!input.trim() || busy}
                  onClick={handleSend}
                  aria-label="ส่งคำถาม"
                  className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-linear-to-r from-indigo-500 to-violet-600 text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUp className="size-3.5" />}
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
