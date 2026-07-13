'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMenuPermission } from '@/lib/hooks/use-menu-permission';
import { useRoleGuard } from '@/lib/hooks/use-role-guard';
import { fetchTags } from '@/lib/api/blog';
import type { Tag } from '@/lib/blog/types';
import { PostEditor } from '../_components/post-editor';

export default function NewPostPage() {
  const { canView, canCreate, canUpdate, canDelete } = useMenuPermission('blog');
  const noNode = !canView && !canCreate && !canUpdate && !canDelete;
  // Create stays fail-open when no permission node is configured; admin
  // capabilities (pin/feature/verify, inactive tags) are strict.
  const hasCreate = noNode || canCreate;
  const isAdmin = canUpdate;
  const { isElevated } = useRoleGuard();

  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (!hasCreate) return;
    fetchTags(!isAdmin)
      .then(setTags)
      .catch(() => { /* editor still works without tags */ });
  }, [hasCreate, isAdmin]);

  if (!hasCreate) {
    return (
      <div className="page-shell flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">คุณไม่มีสิทธิ์เขียนบทความ</p>
        <Link href="/blog" className="text-sm font-semibold text-brand hover:underline">
          กลับไปที่คลังความรู้
        </Link>
      </div>
    );
  }

  return <PostEditor initial={null} tags={tags} isAdmin={isAdmin} isElevated={isElevated} />;
}
