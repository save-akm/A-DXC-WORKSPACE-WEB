'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Pencil, Trash2, Send, Eye, Clock, Loader2, BadgeCheck, Link2, Archive, Undo2, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { toast } from '@/components/ui/toast';
import { ActionMenu, type ActionItem } from '@/components/management/action-menu';
import { useMenuPermission } from '@/lib/hooks/use-menu-permission';
import { useRoleGuard } from '@/lib/hooks/use-role-guard';
import { useAuthStore } from '@/lib/stores/auth-store';
import { ConfirmDialog } from '@/components/management/confirm-dialog';
import {
  fetchPostResolvable, recordPostView, publishPost, deletePost, updatePost,
  archivePost, unpublishPost, unarchivePost,
} from '@/lib/api/blog';
import {
  type Post, authorDisplayName, authorInitials, avatarColorFor, humanizeBlogError,
} from '@/lib/blog/types';
import { cn } from '@/lib/utils';
import { Markdown } from '../_components/markdown';
import { useToc, TableOfContents, MobileToc } from '../_components/table-of-contents';
import { PostReactions } from '../_components/post-reactions';
import { PostBookmarkButton } from '../_components/post-bookmark-button';
import { PostComments } from '../_components/post-comments';
import { PostAttachments } from '../_components/post-attachments';
import { RelatedPosts } from '../_components/related-posts';
import {
  TagChip, StatusBadge, VisibilityBadge, fmtDateFull, fmtCount,
} from '../_components/blog-meta';

// Status transitions offered from the read-page overflow menu.
const STATUS_ACTIONS = {
  archive:   { call: archivePost,   done: 'เก็บบทความเข้าคลังถาวรแล้ว' },
  unpublish: { call: unpublishPost, done: 'ยกเลิกการเผยแพร่แล้ว' },
  unarchive: { call: unarchivePost, done: 'นำบทความกลับมาเป็นฉบับร่างแล้ว' },
} as const;
type StatusAction = keyof typeof STATUS_ACTIONS;

export default function BlogReadPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { canView, canCreate, canUpdate, canDelete } = useMenuPermission('blog');
  const noNode = !canView && !canCreate && !canUpdate && !canDelete;
  const hasView = noNode || canView;
  const meId = useAuthStore((s) => s.user?.id);

  const { isElevated } = useRoleGuard();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const viewedRef = useRef<string | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  const toc = useToc(articleRef, post?.content);
  const hasToc = toc.items.length >= 2;

  useEffect(() => {
    if (!hasView || !slug) return;
    let alive = true;
    setLoading(true);
    fetchPostResolvable(slug)
      .then((p) => {
        if (!alive) return;
        setPost(p);
        setFetchError(null);
        // Record a view once per mounted post (backend dedups per 24h).
        if (viewedRef.current !== p.id) {
          viewedRef.current = p.id;
          recordPostView(p.id)
            .then((r) => { if (alive && r.recorded) setPost((cur) => (cur ? { ...cur, viewCount: r.viewCount } : cur)); })
            .catch(() => { /* view tracking is best-effort */ });
        }
      })
      .catch((err) => {
        if (!alive) return;
        const status = (err as { status?: number })?.status;
        setFetchError(status === 404 ? 'ไม่พบบทความนี้ หรือถูกลบไปแล้ว' : humanizeBlogError(err));
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug, hasView]);

  const isOwner = post != null && post.authorId === meId;
  // Strict — never fail-open via noNode. Admin (UPDATE) or post owner with CREATE only.
  const canEdit = post != null && (canUpdate || (canCreate && isOwner));
  const canDeleteThis = canEdit && canDelete;
  // Same rule as the editor's admin panel: blog:UPDATE + elevated role.
  const canVerify = post != null && canUpdate && isElevated;

  const handlePublish = useCallback(async () => {
    if (!post) return;
    setPublishing(true);
    try {
      const updated = await publishPost(post.id);
      setPost((cur) => (cur ? { ...cur, ...updated } : cur));
      toast.success('เผยแพร่บทความแล้ว');
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setPublishing(false);
    }
  }, [post]);

  const handleCopyLink = useCallback(async () => {
    if (!post) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/blog/${post.slug}`);
      toast.success('คัดลอกลิงก์แล้ว');
    } catch {
      toast.error('คัดลอกลิงก์ไม่สำเร็จ');
    }
  }, [post]);

  const handleToggleVerify = useCallback(async () => {
    if (!post) return;
    setVerifying(true);
    try {
      const updated = await updatePost(post.id, { isVerified: !post.isVerified });
      setPost((cur) => (cur ? { ...cur, ...updated } : cur));
      toast.success(updated.isVerified ? 'รับรองเนื้อหาแล้ว' : 'ยกเลิกการรับรองแล้ว');
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setVerifying(false);
    }
  }, [post]);

  const handleStatusChange = useCallback(async (action: StatusAction) => {
    if (!post) return;
    setStatusBusy(true);
    try {
      const { call, done } = STATUS_ACTIONS[action];
      const updated = await call(post.id);
      setPost((cur) => (cur ? { ...cur, ...updated } : cur));
      toast.success(done);
    } catch (err) {
      toast.error(humanizeBlogError(err));
    } finally {
      setStatusBusy(false);
    }
  }, [post]);

  const handleDelete = useCallback(async () => {
    if (!post) return;
    setDeleting(true);
    try {
      await deletePost(post.id);
      toast.success('ลบบทความแล้ว');
      router.push('/blog');
    } catch (err) {
      toast.error(humanizeBlogError(err));
      setDeleting(false);
    }
  }, [post, router]);

  if (!hasView) {
    return (
      <div className="page-shell flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-shell mx-auto w-full max-w-3xl">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-6 aspect-[21/9] animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 h-8 w-3/4 animate-pulse rounded-lg bg-muted" />
        <div className="mt-3 h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />)}
        </div>
      </div>
    );
  }

  if (fetchError || !post) {
    return (
      <div className="page-shell flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">{fetchError ?? 'ไม่พบบทความ'}</p>
        <Link href="/blog" className="text-sm font-semibold text-brand hover:underline">
          กลับไปที่คลังความรู้
        </Link>
      </div>
    );
  }

  const author = post.author;
  const editor = post.updatedBy?.id !== post.authorId ? post.updatedBy : undefined;
  const verifier = post.isVerified ? post.verifiedBy : undefined;

  // Less-common lifecycle actions live in an overflow menu so the toolbar's
  // primary buttons (edit/publish/delete) stay uncrowded.
  const lifecycleActions: ActionItem[] = [];
  if (canEdit) {
    if (post.status === 'PUBLISHED') {
      lifecycleActions.push({
        label: statusBusy ? 'กำลังดำเนินการ…' : 'ยกเลิกเผยแพร่',
        icon: Undo2,
        disabled: statusBusy,
        onClick: () => handleStatusChange('unpublish'),
      });
    }
    if (post.status === 'ARCHIVED') {
      // ARCHIVED → DRAFT. Publish still rejects archived posts, so restoring
      // means unarchive → edit → publish.
      lifecycleActions.push({
        label: statusBusy ? 'กำลังดำเนินการ…' : 'นำกลับมาแก้ไข',
        icon: ArchiveRestore,
        disabled: statusBusy,
        onClick: () => handleStatusChange('unarchive'),
      });
    } else {
      lifecycleActions.push({
        label: statusBusy ? 'กำลังดำเนินการ…' : 'เก็บถาวร',
        icon: Archive,
        disabled: statusBusy,
        onClick: () => handleStatusChange('archive'),
      });
    }
  }

  return (
    <div className="page-shell mx-auto w-full max-w-5xl !pt-2 sm:!pt-3">
      {/* Sticky toolbar — top-0 = flush with main scrollport (already below app topbar) */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-border/50 bg-background/90 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 print:hidden">
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" size="lg" onClick={() => router.push('/blog')}>
            <BookOpen />
            คลังความรู้
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Link2 className="size-3.5" />
              <span className="hidden sm:inline">คัดลอกลิงก์</span>
            </Button>
            {canVerify && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleVerify}
                disabled={verifying}
                className={cn(post.isVerified && 'text-sky-600 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-400')}
              >
                {verifying ? <Loader2 className="animate-spin" /> : <BadgeCheck className={cn('size-3.5', post.isVerified && 'fill-sky-500 text-white')} />}
                <span className="hidden sm:inline">{post.isVerified ? 'ยกเลิกรับรอง' : 'รับรอง'}</span>
              </Button>
            )}
            {canEdit && (
              <>
                {post.status === 'DRAFT' && (
                  <Button variant="create" size="sm" onClick={handlePublish} disabled={publishing}>
                    {publishing ? <Loader2 className="animate-spin" /> : <Send />}
                    เผยแพร่
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => router.push(`/blog/${post.slug}/edit`)}>
                  <Pencil className="size-3.5" />
                  แก้ไข
                </Button>
                {canDeleteThis && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="hidden sm:inline">ลบ</span>
                  </Button>
                )}
                {lifecycleActions.length > 0 && <ActionMenu actions={lifecycleActions} />}
              </>
            )}
          </div>
        </div>
      </div>

      {post.status === 'DRAFT' && canEdit && (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[13px] text-amber-800 dark:text-amber-300 print:hidden">
          บทความนี้ยังเป็น<strong className="font-semibold">ฉบับร่าง</strong> — เฉพาะคุณและผู้ดูแลเท่านั้นที่เห็น กด &quot;เผยแพร่&quot; เพื่อให้ทุกคนเข้าถึงได้
        </div>
      )}

      {post.status === 'ARCHIVED' && canEdit && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-[13px] text-muted-foreground print:hidden">
          <p>
            บทความนี้ถูก<strong className="font-semibold text-foreground">เก็บถาวร</strong> — ไม่แสดงในคลังความรู้
            กด &quot;นำกลับมาแก้ไข&quot; เพื่อกลับเป็นฉบับร่าง แล้วเผยแพร่ใหม่อีกครั้ง
          </p>
          <Button variant="outline" size="sm" disabled={statusBusy} onClick={() => handleStatusChange('unarchive')}>
            {statusBusy ? <Loader2 className="animate-spin" /> : <ArchiveRestore className="size-3.5" />}
            นำกลับมาแก้ไข
          </Button>
        </div>
      )}

      <div className={cn(hasToc && 'lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10', 'mt-4')}>
      <motion.article
        ref={articleRef}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={cn('min-w-0 w-full max-w-3xl', hasToc ? 'lg:mx-0' : 'mx-auto')}
      >
        {/* Mobile TOC */}
        {hasToc && <MobileToc items={toc.items} activeId={toc.activeId} progress={toc.progress} />}

        {/* Cover */}
        {post.coverImageUrl && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-border/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImageUrl} alt="" className="aspect-[21/9] w-full object-cover" />
          </div>
        )}

        {/* Tags + state */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {post.status !== 'PUBLISHED' && <StatusBadge status={post.status} />}
          {post.tags.map((t) => <TagChip key={t.id} tag={t} />)}
        </div>

        {/* Title */}
        <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-[2.5rem] sm:leading-[1.1]">
          {post.title}
        </h1>

        {/* Summary */}
        {post.summary && (
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{post.summary}</p>
        )}

        {/* Byline */}
        <div className="mt-5 border-b border-border/60 pb-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2.5">
              <UserAvatar
                avatarUrl={author.avatarUrl}
                initial={authorInitials(author)}
                color={avatarColorFor(author.id)}
                size="sm"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">{authorDisplayName(author)}</p>
                <p className="text-xs text-muted-foreground">{author.employeeId}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="tabular-nums">{fmtDateFull(post.publishedAt ?? post.createdAt)}</span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1"><Clock className="size-3" />{post.readTimeMinutes} นาที</span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1"><Eye className="size-3" />{fmtCount(post.viewCount)} ครั้ง</span>
              <span className="text-border">·</span>
              <VisibilityBadge visibility={post.visibility} />
            </div>
          </div>
          {editor && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Pencil className="size-3 shrink-0" />
              <span>แก้ไขล่าสุดโดย</span>
              <span className="font-medium text-foreground">{authorDisplayName(editor)}</span>
              <span className="text-border">·</span>
              <span className="tabular-nums">{fmtDateFull(post.updatedAt)}</span>
            </div>
          )}
          {post.isVerified && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400">
              <BadgeCheck className="size-4 shrink-0 fill-sky-500 text-white" />
              <span>รับรองเนื้อหาโดย</span>
              <span className="font-semibold">{verifier ? authorDisplayName(verifier) : 'ผู้ดูแล'}</span>
              {post.verifiedAt && (
                <>
                  <span className="text-border">·</span>
                  <span className="tabular-nums">{fmtDateFull(post.verifiedAt)}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-6">
          {post.content?.trim() ? (
            <Markdown content={post.content} />
          ) : (
            <p className="text-sm text-muted-foreground">บทความนี้ยังไม่มีเนื้อหา</p>
          )}
        </div>

        {/* Engagement */}
        <div className="mt-8 space-y-6 border-t border-border/60 pt-6 print:hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <PostReactions postId={post.id} />
            <PostBookmarkButton postId={post.id} initialBookmarked={post.isBookmarked} />
          </div>
          <PostAttachments postId={post.id} canManage={canEdit} />
          <PostComments postId={post.id} isAdmin={canUpdate} />
        </div>

        {/* Related reading — same first tag, excludes this post */}
        <RelatedPosts postId={post.id} tagId={post.tags[0]?.id} className="mt-8" />
      </motion.article>

        {hasToc && (
          <aside className="hidden lg:block print:hidden">
            <TableOfContents items={toc.items} activeId={toc.activeId} progress={toc.progress} />
          </aside>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="ลบบทความ"
        loading={deleting}
        message={<>ลบ <span className="font-semibold text-foreground">{post.title}</span> ออกจากคลังความรู้?</>}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

