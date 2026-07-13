'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, ChevronLeft } from 'lucide-react';
import { useMenuPermission } from '@/lib/hooks/use-menu-permission';
import { PageHeader } from '@/components/management/page-header';
import { Pagination } from '@/components/management/pagination';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { fetchBookmarks } from '@/lib/api/blog';
import { type Bookmark as BookmarkItem, humanizeBlogError } from '@/lib/blog/types';
import { PostRow, RowSkeleton } from '../_components/post-row';

const PAGE_SIZE = 10;

export default function BookmarksPage() {
  const router = useRouter();
  const { canView, canCreate, canUpdate, canDelete } = useMenuPermission('blog');
  const noNode = !canView && !canCreate && !canUpdate && !canDelete;
  const hasView = noNode || canView;

  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchBookmarks({ page, limit: PAGE_SIZE });
      setItems(res.data);
      setTotal(res.total);
    } catch (err) {
      toast.error(humanizeBlogError(err));
      setItems([]);
      setTotal(0);
    } finally {
      setHasLoaded(true);
    }
  }, [page]);

  useEffect(() => {
    if (!hasView) return;
    load();
  }, [hasView, load]);

  // This page *is* the bookmark list — un-bookmarking removes the row rather
  // than leaving a saved item that says "not saved".
  const handleBookmarkToggled = useCallback((postId: string, bookmarked: boolean) => {
    if (bookmarked) return;
    const nextTotal = Math.max(0, total - 1);
    setItems((prev) => prev.filter((b) => b.post.id !== postId));
    setTotal(nextTotal);
    // Removing the last row of a page would strand the user on an empty page.
    const lastPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
    if (page > lastPage) setPage(lastPage);
  }, [page, total]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!hasView) {
    return (
      <div className="page-shell flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        คลังความรู้
      </Link>
      <PageHeader
        icon={Bookmark}
        title="บทความที่บันทึกไว้"
        subtitle="รายการบทความที่คุณบันทึกไว้จากคลังความรู้"
      />

      <div className="mx-auto w-full max-w-3xl">
        <div className="min-h-[40vh]">
          {!hasLoaded && items.length === 0 ? (
            <div className="divide-y divide-border/60">
              {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-muted text-brand">
                <Bookmark className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">ยังไม่มีบทความที่บันทึกไว้</p>
                <p className="mt-0.5 text-xs text-muted-foreground">กดปุ่มบันทึกในหน้าบทความเพื่อเก็บไว้อ่านภายหลัง</p>
              </div>
              <Button variant="create" size="sm" onClick={() => router.push('/blog')}>
                ไปที่คลังความรู้
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {items.map((b) => (
                <PostRow key={b.id} post={b.post} onBookmarkToggled={handleBookmarkToggled} />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && totalPages > 1 && (
          <div className="mt-4 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              onChange={setPage}
              layoutId="bookmarks-page-active-bg"
              itemLabel="รายการ"
            />
          </div>
        )}
      </div>
    </div>
  );
}
