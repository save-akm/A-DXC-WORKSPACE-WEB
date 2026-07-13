'use client';

import Link from 'next/link';
import { FileText, FolderOpen, Pencil, Trash2, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ActionMenu } from '@/components/management/action-menu';
import type { CollectionSummary } from '../types';
import { RoleBadge, avatarColorForId, displayPersonName } from './doc-meta';

interface CollectionCardProps {
  collection: CollectionSummary;
  onEdit: (c: CollectionSummary) => void;
  onDelete: (c: CollectionSummary) => void;
}

/** การ์ด collection ในหน้ารวมเอกสาร — คลิกเพื่อเข้าไปดูข้างใน */
export function CollectionCard({ collection: c, onEdit, onDelete }: CollectionCardProps) {
  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 transition-colors group-hover:bg-indigo-500/15 dark:text-indigo-400">
          <FolderOpen className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/documents/${c.id}`}
              className="min-w-0 truncate text-sm font-semibold leading-tight hover:underline"
            >
              {/* ขยาย hit area ให้คลิกได้ทั้งการ์ด */}
              <span className="absolute inset-0" aria-hidden />
              {c.name}
            </Link>
            <RoleBadge role={c.role} />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {c.description || 'ไม่มีคำอธิบาย'}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {c.owner && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="relative z-10 inline-flex shrink-0 rounded-full" />
                  }
                >
                  <UserAvatar
                    avatarUrl={c.owner.avatarUrl}
                    initial={(c.owner.nickname || c.owner.firstName || c.owner.email || '?').charAt(0)}
                    color={avatarColorForId(c.owner.id)}
                    size="xs"
                  />
                </TooltipTrigger>
                <TooltipContent side="top">{displayPersonName(c.owner)}</TooltipContent>
              </Tooltip>
            )}
            <span className="inline-flex items-center gap-1">
              <FileText className="size-3" />
              {c.documentCount} เอกสาร
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" />
              {c.memberCount} คน
            </span>
          </div>
        </div>

        {c.role === 'OWNER' && (
          <div className="relative z-10 shrink-0">
            <ActionMenu
              actions={[
                { label: 'แก้ไข', icon: Pencil, onClick: () => onEdit(c) },
                { label: 'ลบ collection', icon: Trash2, destructive: true, onClick: () => onDelete(c) },
              ]}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
