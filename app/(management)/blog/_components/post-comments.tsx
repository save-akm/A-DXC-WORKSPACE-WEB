'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Reply, Pencil, Trash2, Send, Loader2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { toast } from '@/components/ui/toast';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  fetchComments, createComment, updateComment, deleteComment,
} from '@/lib/api/blog';
import {
  type Comment, type FlatComment,
  authorDisplayName, authorInitials, avatarColorFor, humanizeBlogError,
} from '@/lib/blog/types';
import { fmtDateFull } from './blog-meta';
import { ConfirmDialog } from '@/components/management/confirm-dialog';

function toComment(flat: FlatComment): Comment {
  return { ...flat, replies: [] };
}

function insertReply(tree: Comment[], parentId: string, reply: FlatComment): Comment[] {
  return tree.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...c.replies, toComment(reply)] };
    }
    if (c.replies.length > 0) {
      return { ...c, replies: insertReply(c.replies, parentId, reply) };
    }
    return c;
  });
}

function updateInTree(tree: Comment[], id: string, patch: Partial<Comment>): Comment[] {
  return tree.map((c) => {
    if (c.id === id) return { ...c, ...patch };
    if (c.replies.length > 0) {
      return { ...c, replies: updateInTree(c.replies, id, patch) };
    }
    return c;
  });
}

function removeFromTree(tree: Comment[], id: string): Comment[] {
  return tree
    .filter((c) => c.id !== id)
    .map((c) => ({ ...c, replies: removeFromTree(c.replies, id) }));
}

interface PostCommentsProps {
  postId: string;
  isAdmin: boolean;
  className?: string;
}

export function PostComments({ postId, isAdmin, className }: PostCommentsProps) {
  const meId = useAuthStore((s) => s.user?.id);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchComments(postId)
      .then(setComments)
      .catch((err) => toast.error(humanizeBlogError(err)))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const submitComment = useCallback(async (content: string, parentId?: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const created = await createComment(postId, { content: trimmed, parentId });
      if (parentId) {
        setComments((prev) => insertReply(prev, parentId, created));
        setReplyTo(null);
        setReplyDraft('');
      } else {
        setComments((prev) => [...prev, toComment(created)]);
        setDraft('');
      }
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setSubmitting(false);
    }
  }, [postId]);

  const totalCount = comments.reduce(
    (n, c) => n + 1 + c.replies.reduce((m, r) => m + 1 + countReplies(r), 0),
    0,
  );

  return (
    <section className={cn('rounded-2xl bg-card p-5 ring-1 ring-foreground/10', className)}>
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="size-4 text-brand" />
        <h2 className="text-sm font-semibold text-foreground">
          ความคิดเห็น{totalCount > 0 && <span className="ml-1.5 font-normal text-muted-foreground">({totalCount})</span>}
        </h2>
      </div>

      {/* New comment */}
      <div className="mb-6 flex gap-3">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && draft.trim() && !submitting) {
              e.preventDefault();
              submitComment(draft);
            }
          }}
          placeholder="แสดงความคิดเห็น… (Ctrl+Enter เพื่อส่ง)"
          rows={2}
          className="min-h-[72px] flex-1 resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
        />
        <Button
          variant="create"
          size="sm"
          className="self-end"
          disabled={submitting || !draft.trim()}
          onClick={() => submitComment(draft)}
        >
          {submitting && !replyTo ? <Loader2 className="animate-spin" /> : <Send className="size-3.5" />}
          ส่ง
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีความคิดเห็น — เป็นคนแรกที่แสดงความคิดเห็น</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              depth={0}
              meId={meId}
              isAdmin={isAdmin}
              replyTo={replyTo}
              replyDraft={replyDraft}
              submitting={submitting}
              onReply={(id) => { setReplyTo(id); setReplyDraft(''); }}
              onCancelReply={() => { setReplyTo(null); setReplyDraft(''); }}
              onReplyDraftChange={setReplyDraft}
              onSubmitReply={(parentId, content) => submitComment(content, parentId)}
              onUpdate={(id, content) => {
                updateComment(id, { content })
                  .then((updated) => {
                    setComments((prev) => updateInTree(prev, id, { ...updated, isEdited: true }));
                  })
                  .catch((err) => toast.error(humanizeBlogError(err)));
              }}
              onDelete={(id) => setDeleteTarget(id)}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="ลบความคิดเห็น"
        loading={deleting}
        message="ลบความคิดเห็นนี้ (รวมถึงการตอบกลับทั้งหมด)? การกระทำนี้ไม่สามารถยกเลิกได้"
        onConfirm={() => {
          if (!deleteTarget) return;
          setDeleting(true);
          deleteComment(deleteTarget)
            .then(() => {
              setComments((prev) => removeFromTree(prev, deleteTarget));
              setDeleteTarget(null);
            })
            .catch((err) => toast.error(humanizeBlogError(err)))
            .finally(() => setDeleting(false));
        }}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </section>
  );
}

function countReplies(c: Comment): number {
  return c.replies.reduce((n, r) => n + 1 + countReplies(r), 0);
}

interface CommentItemProps {
  comment: Comment;
  depth: number;
  meId?: string;
  isAdmin: boolean;
  replyTo: string | null;
  replyDraft: string;
  submitting: boolean;
  onReply: (id: string) => void;
  onCancelReply: () => void;
  onReplyDraftChange: (v: string) => void;
  onSubmitReply: (parentId: string, content: string) => void;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

function CommentItem({
  comment, depth, meId, isAdmin,
  replyTo, replyDraft, submitting,
  onReply, onCancelReply, onReplyDraftChange, onSubmitReply,
  onUpdate, onDelete,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.content);
  const canModify = comment.userId === meId || isAdmin;
  const isReplying = replyTo === comment.id;
  const user = comment.user;

  return (
    <li className={cn(depth > 0 && 'ml-6 border-l border-border/60 pl-4')}>
      <div className="flex gap-3">
        <UserAvatar
          avatarUrl={user.avatarUrl}
          initial={authorInitials(user)}
          color={avatarColorFor(user.id)}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[13px] font-semibold text-foreground">{authorDisplayName(user)}</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {fmtDateFull(comment.createdAt)}
              {comment.isEdited && ' · แก้ไขแล้ว'}
            </span>
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                rows={2}
                className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="create" disabled={!editDraft.trim()} onClick={() => {
                  onUpdate(comment.id, editDraft.trim());
                  setEditing(false);
                }}>
                  <Check className="size-3.5" /> บันทึก
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setEditDraft(comment.content); }}>
                  <X className="size-3.5" /> ยกเลิก
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{comment.content}</p>
          )}

          {!editing && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {depth < 2 && (
                <button
                  type="button"
                  onClick={() => isReplying ? onCancelReply() : onReply(comment.id)}
                  className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Reply className="size-3" />
                  {isReplying ? 'ยกเลิก' : 'ตอบกลับ'}
                </button>
              )}
              {canModify && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Pencil className="size-3" /> แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(comment.id)}
                    className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-destructive/80 transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-3" /> ลบ
                  </button>
                </>
              )}
            </div>
          )}

          {isReplying && (
            <div className="mt-3 flex gap-2">
              <textarea
                value={replyDraft}
                onChange={(e) => onReplyDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && replyDraft.trim() && !submitting) {
                    e.preventDefault();
                    onSubmitReply(comment.id, replyDraft);
                  }
                }}
                placeholder="เขียนตอบกลับ…"
                rows={2}
                autoFocus
                className="min-h-[60px] flex-1 resize-y rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
              />
              <Button
                variant="create"
                size="sm"
                className="self-end"
                disabled={submitting || !replyDraft.trim()}
                onClick={() => onSubmitReply(comment.id, replyDraft)}
              >
                {submitting ? <Loader2 className="animate-spin" /> : <Send className="size-3.5" />}
              </Button>
            </div>
          )}

          {comment.replies.length > 0 && (
            <ul className="mt-4 space-y-4">
              {comment.replies.map((r) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  depth={depth + 1}
                  meId={meId}
                  isAdmin={isAdmin}
                  replyTo={replyTo}
                  replyDraft={replyDraft}
                  submitting={submitting}
                  onReply={onReply}
                  onCancelReply={onCancelReply}
                  onReplyDraftChange={onReplyDraftChange}
                  onSubmitReply={onSubmitReply}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
