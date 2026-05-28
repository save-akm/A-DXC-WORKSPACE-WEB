'use client';

import { Clock, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectItem } from '@/lib/management/types';

interface ProjectPreviewCardProps {
  project: ProjectItem;
}

export function ProjectPreviewCard({ project }: ProjectPreviewCardProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className={cn('size-2.5 shrink-0 rounded-full', project.color)} />
        <span className="flex-1 truncate font-semibold">{project.title}</span>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {project.badge}
        </span>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Progress</span>
          <span className="font-semibold tabular-nums text-foreground">{project.progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <GitBranch className="size-3" />
          <span className="tabular-nums">{project.openIssues}</span> open
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          {project.dueLabel}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-2">
        <div className="flex -space-x-1.5">
          {project.members.map((m, i) => (
            <span
              key={i}
              className={cn(
                'inline-flex size-6 items-center justify-center rounded-full border-2 border-popover text-[10px] font-semibold text-white',
                m.color,
              )}
            >
              {m.initial}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">{project.members.length} members</span>
      </div>
    </div>
  );
}
