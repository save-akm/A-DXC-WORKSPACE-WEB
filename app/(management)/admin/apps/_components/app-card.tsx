'use client';

import { ExternalLink, Frame, MousePointerClick, Pencil, Trash2 } from 'lucide-react';
import { AppIcon } from '@/components/app-icon';
import { cn } from '@/lib/utils';
import type { AdminApp } from '@/lib/apphub/types';
import { ActiveToggle } from './active-toggle';

interface AppCardProps {
  app: AdminApp;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (app: AdminApp) => void;
  onDelete: (app: AdminApp) => void;
  onToggleActive: (app: AdminApp) => void;
}

export function AppCard({ app, canUpdate, canDelete, onEdit, onDelete, onToggleActive }: AppCardProps) {
  return (
    <div
      className={cn(
        'group relative flex h-full flex-col rounded-2xl border bg-card p-4 transition-colors',
        app.isActive ? 'border-border hover:border-indigo-500/40' : 'border-dashed border-border/70 opacity-70',
      )}
    >
      {/* Header: icon + name + category */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
          <AppIcon name={app.icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[14px] font-bold text-foreground">{app.name}</h3>
            {app.embedType === 'IFRAME' ? (
              <Frame className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : (
              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
          </div>
          <p className="truncate text-[11px] text-muted-foreground">{app.category.name}</p>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 line-clamp-2 min-h-8 text-[12px] leading-relaxed text-muted-foreground">
        {app.description || 'ไม่มีคำอธิบาย'}
      </p>

      {/* URL */}
      <a
        href={app.url}
        target="_blank"
        rel="noreferrer"
        onClick={e => e.stopPropagation()}
        className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-indigo-500 hover:underline dark:text-indigo-400"
      >
        <span className="truncate">{app.url}</span>
      </a>

      {/* Footer: status + clicks + actions */}
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <div className="flex items-center gap-3">
          <ActiveToggle
            active={app.isActive}
            disabled={!canUpdate}
            onToggle={() => onToggleActive(app)}
          />
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <MousePointerClick className="h-3 w-3" />
            {app.clickCount.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {canUpdate && (
            <button
              type="button"
              onClick={() => onEdit(app)}
              title="แก้ไข"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(app)}
              title="ลบ"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
