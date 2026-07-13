'use client';

import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchPosts } from '@/lib/api/blog';
import type { Post } from '@/lib/blog/types';
import { PostCard } from './post-card';

interface RelatedPostsProps {
  /** Current post — excluded from the results. */
  postId: string;
  /** Tag to relate on (the post's first tag). Section hides when absent. */
  tagId: string | undefined;
  className?: string;
}

/**
 * "บทความที่เกี่ยวข้อง" — up to 3 published posts sharing the current post's
 * first tag, closing the reading loop at the end of an article. Renders
 * nothing while loading or when there is nothing to suggest.
 */
export function RelatedPosts({ postId, tagId, className }: RelatedPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!tagId) {
      setPosts([]);
      return;
    }
    let alive = true;
    fetchPosts({ tagId, status: 'PUBLISHED', limit: 4 })
      .then((res) => {
        if (alive) setPosts(res.data.filter((p) => p.id !== postId).slice(0, 3));
      })
      .catch(() => { /* discovery aid — non-fatal */ });
    return () => { alive = false; };
  }, [postId, tagId]);

  if (posts.length === 0) return null;

  return (
    <section className={cn('print:hidden', className)} aria-label="บทความที่เกี่ยวข้อง">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <BookOpen className="size-4 text-brand" />
        บทความที่เกี่ยวข้อง
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}
