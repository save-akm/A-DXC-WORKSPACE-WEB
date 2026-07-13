'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMenuPermission } from '@/lib/hooks/use-menu-permission';
import { useRoleGuard } from '@/lib/hooks/use-role-guard';
import { useAuthStore } from '@/lib/stores/auth-store';
import { fetchPostResolvable, fetchTags } from '@/lib/api/blog';
import { type Post, type Tag, humanizeBlogError } from '@/lib/blog/types';
import { PostEditor } from '../../_components/post-editor';

export default function EditPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { canCreate, canUpdate } = useMenuPermission('blog');
  // Strict (no noNode fail-open) — editing an existing post requires an
  // explicit permission node, same rule as the read page's canEdit.
  const isAdmin = canUpdate;
  const meId = useAuthStore((s) => s.user?.id);
  const { isElevated } = useRoleGuard();

  const [post, setPost] = useState<Post | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    setLoading(true);
    // Same tag visibility rule as the new-post page: only admins see inactive tags.
    Promise.all([fetchPostResolvable(slug), fetchTags(!isAdmin).catch(() => [] as Tag[])])
      .then(([p, t]) => {
        if (!alive) return;
        setPost(p);
        setTags(t);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        const status = (err as { status?: number })?.status;
        setError(status === 404 ? 'ไม่พบบทความนี้' : humanizeBlogError(err));
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug, isAdmin]);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-10 w-2/3 animate-pulse rounded-lg bg-muted" />
        <div className="mt-4 h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  const isOwner = post != null && post.authorId === meId;
  // Admin (canUpdate) can edit any post; regular authors can only edit their own.
  const canEdit = post != null && (isAdmin || (canCreate && isOwner));

  if (error || !post || !canEdit) {
    return (
      <div className="page-shell flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">
          {error ?? (post ? 'คุณไม่มีสิทธิ์แก้ไขบทความนี้' : 'ไม่พบบทความ')}
        </p>
        <Link href="/blog" className="text-sm font-semibold text-brand hover:underline">
          กลับไปที่คลังความรู้
        </Link>
      </div>
    );
  }

  return <PostEditor initial={post} tags={tags} isAdmin={isAdmin} isElevated={isElevated} />;
}
