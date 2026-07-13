'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, MessageSquare, SendHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/user-avatar';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { addComment, deleteComment, fetchComments } from '@/lib/api/project-surveys';
import type { SurveyComment } from '@/lib/project-survey/types';
import { formatDateTime, fullName } from '@/lib/project-survey/labels';

interface CommentsPanelProps {
  surveyId: string;
  /** Comments are closed once the survey is APPROVE. */
  canComment: boolean;
  meId: string;
}

export function CommentsPanel({ surveyId, canComment, meId }: CommentsPanelProps) {
  const [comments, setComments] = useState<SurveyComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchComments(surveyId)
      .then((c) => { if (!cancelled) setComments(c); })
      .catch(() => { if (!cancelled) toast.error('โหลดความคิดเห็นไม่สำเร็จ'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [surveyId]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const created = await addComment(surveyId, text);
      setComments((prev) => [...prev, created]);
      setDraft('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ส่งความคิดเห็นไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    try {
      await deleteComment(surveyId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ลบความคิดเห็นไม่สำเร็จ');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare size={15} className="text-muted-foreground" />
          ความคิดเห็น
          {comments.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {comments.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="size-8 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            ยังไม่มีความคิดเห็น{canComment ? ' — เริ่มการสนทนาได้เลย' : ''}
          </p>
        ) : (
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {comments.map((c) => (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group flex gap-2.5"
                >
                  <UserAvatar
                    avatarUrl={c.commentBy?.avatarUrl}
                    initial={(c.commentBy?.firstName?.[0] ?? '?').toUpperCase()}
                    color={c.role === 'A_DXC' ? 'bg-fuchsia-500' : 'bg-violet-500'}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate text-xs font-medium">{fullName(c.commentBy)}</p>
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-px text-[10px] font-medium',
                          c.role === 'A_DXC'
                            ? 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {c.role === 'A_DXC' ? 'A-DXC' : 'ผู้ขอ'}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatDateTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed">
                      {c.comment}
                    </p>
                  </div>
                  {c.commentById === meId && canComment && (
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      aria-label="ลบความคิดเห็น"
                      className="mt-1 shrink-0 cursor-pointer text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      {deletingId === c.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Trash2 size={13} />}
                    </button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        {canComment ? (
          <div className="space-y-2 border-t border-border/60 pt-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="เขียนความคิดเห็น…"
              rows={2}
              className="min-h-16 text-[13px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">Ctrl+Enter เพื่อส่ง</p>
              <Button size="sm" onClick={handleSend} disabled={!draft.trim() || sending}>
                {sending ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
                ส่ง
              </Button>
            </div>
          </div>
        ) : (
          <p className="border-t border-border/60 pt-3 text-center text-[11px] text-muted-foreground">
            คำร้องอนุมัติแล้ว — ปิดการแสดงความคิดเห็น
          </p>
        )}
      </CardContent>
    </Card>
  );
}
