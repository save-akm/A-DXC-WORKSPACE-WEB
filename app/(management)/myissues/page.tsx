'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CircleDot,
  Search,
  Timer,
  Eye,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  ListTodo,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/management/page-header';
import { StatCard } from '@/components/management/stat-card';
import { ActionMenu } from '@/components/management/action-menu';
import { Pagination } from '@/components/management/pagination';
import { cn } from '@/lib/utils';
import { projects } from '@/lib/management/nav-config';

import type { IssuePriority, IssueStatus, MyIssue } from './types';
import { mockIssues } from './_mocks/mock-data';

// ─── Display maps ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  IssueStatus,
  { dot: string; text: string; label: string }
> = {
  todo:        { dot: 'bg-muted-foreground/40', text: 'text-muted-foreground', label: 'Todo' },
  in_progress: { dot: 'bg-sky-500',     text: 'text-sky-600 dark:text-sky-400',     label: 'In Progress' },
  in_review:   { dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400', label: 'In Review' },
  done:        { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: 'Done' },
};

const PRIORITY_STYLES: Record<IssuePriority, { badge: string; label: string }> = {
  urgent: { badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',       label: 'Urgent' },
  high:   { badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', label: 'High' },
  medium: { badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',          label: 'Medium' },
  low:    { badge: 'bg-muted text-muted-foreground',                        label: 'Low' },
};

const PRIORITY_OPTIONS = ['All', 'Urgent', 'High', 'Medium', 'Low'] as const;

type StatusTile = 'all' | 'in_progress' | 'in_review' | 'overdue';

// mock วันนี้ให้ตรงกับ mock data — ต่อ API จริงแล้วเปลี่ยนเป็น new Date()
const TODAY = new Date('2026-07-14');

const dueFormat = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' });

function isOverdue(issue: MyIssue) {
  return !!issue.dueDate && issue.status !== 'done' && new Date(issue.dueDate) < TODAY;
}

const projectById = new Map(projects.map((p) => [p.id, p]));

// ─── Animation ────────────────────────────────────────────────────────────────

const EASE = [0.4, 0, 0.2, 1] as const;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE },
});

const MotionTableRow = motion.create(TableRow);

const PAGE_SIZE = 10;

// ─── Cells ────────────────────────────────────────────────────────────────────

function ProjectChip({ projectId }: { projectId: string }) {
  const project = projectById.get(projectId);
  if (!project) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <span className={cn('size-1.5 rounded-full', project.color)} />
      {project.title}
    </span>
  );
}

function StatusBadge({ status }: { status: IssueStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      <span className={cn('text-xs font-medium', s.text)}>{s.label}</span>
    </span>
  );
}

function PriorityBadge({ priority }: { priority: IssuePriority }) {
  const p = PRIORITY_STYLES[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        p.badge,
      )}
    >
      {p.label}
    </span>
  );
}

function DueCell({ issue }: { issue: MyIssue }) {
  if (!issue.dueDate) {
    return <span className="text-xs text-muted-foreground/70">—</span>;
  }
  const overdue = isOverdue(issue);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs tabular-nums',
        overdue ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-muted-foreground',
      )}
    >
      <CalendarClock size={12} />
      {dueFormat.format(new Date(issue.dueDate))}
      {overdue && <span className="font-normal">· เกินกำหนด</span>}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyIssuesPage() {
  const router = useRouter();

  const [issues, setIssues] = useState<MyIssue[]>(mockIssues);
  const [search, setSearch] = useState('');
  const [statusTile, setStatusTile] = useState<StatusTile>('all');
  const [priorityFilter, setPriorityFilter] = useState<(typeof PRIORITY_OPTIONS)[number]>('All');
  const [page, setPage] = useState(1);

  const stats = useMemo(
    () => ({
      assigned: issues.filter((i) => i.status !== 'done').length,
      inProgress: issues.filter((i) => i.status === 'in_progress').length,
      inReview: issues.filter((i) => i.status === 'in_review').length,
      overdue: issues.filter(isOverdue).length,
    }),
    [issues],
  );

  const filtered = useMemo(() => {
    let list = issues;

    if (statusTile === 'overdue') list = list.filter(isOverdue);
    else if (statusTile !== 'all') list = list.filter((i) => i.status === statusTile);

    if (priorityFilter !== 'All') {
      list = list.filter((i) => i.priority === priorityFilter.toLowerCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.key.toLowerCase().includes(q) ||
          (projectById.get(i.projectId)?.title.toLowerCase().includes(q) ?? false),
      );
    }

    // งานค้างมาก่อนงานเสร็จ แล้วไล่ตามวันครบกำหนดที่ใกล้ที่สุด
    return [...list].sort((a, b) => {
      if ((a.status === 'done') !== (b.status === 'done')) {
        return a.status === 'done' ? 1 : -1;
      }
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [issues, statusTile, priorityFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, statusTile, priorityFilter]);

  const toggleTile = (tile: StatusTile) =>
    setStatusTile((cur) => (cur === tile ? 'all' : tile));

  const markDone = (id: string) =>
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'done' as const } : i)),
    );

  const openInProject = (issue: MyIssue) => {
    const project = projectById.get(issue.projectId);
    if (project) router.push(project.href);
  };

  const hasFilter = !!search || statusTile !== 'all' || priorityFilter !== 'All';

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <PageHeader
        icon={CircleDot}
        title="My Issues"
        subtitle="งานทั้งหมดที่มอบหมายให้คุณ จากทุกโปรเจกต์"
      />

      {/* Stats — กดเพื่อกรองตามสถานะ กดซ้ำเพื่อล้าง */}
      <motion.div {...fadeUp(0.08)} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={ListTodo}
          label="งานค้างของฉัน"
          value={stats.assigned}
          gradient="from-violet-500 to-fuchsia-500"
          onClick={() => setStatusTile('all')}
          active={statusTile === 'all'}
        />
        <StatCard
          icon={Timer}
          label="In Progress"
          value={stats.inProgress}
          gradient="from-sky-500 to-blue-600"
          onClick={() => toggleTile('in_progress')}
          active={statusTile === 'in_progress'}
        />
        <StatCard
          icon={Eye}
          label="In Review"
          value={stats.inReview}
          gradient="from-amber-500 to-orange-500"
          onClick={() => toggleTile('in_review')}
          active={statusTile === 'in_review'}
        />
        <StatCard
          icon={CalendarClock}
          label="เกินกำหนด"
          value={stats.overdue}
          gradient="from-rose-500 to-red-500"
          onClick={() => toggleTile('overdue')}
          active={statusTile === 'overdue'}
        />
      </motion.div>

      {/* Toolbar */}
      <motion.div
        {...fadeUp(0.16)}
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="relative w-full sm:max-w-72">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="pl-8"
            placeholder="ค้นหา issue, รหัส, โปรเจกต์…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setPriorityFilter(opt)}
              className={cn(
                'relative z-10 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                priorityFilter === opt
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {priorityFilter === opt && (
                <motion.span
                  layoutId="myissues-priority-bg"
                  className="absolute inset-0 -z-10 rounded-md bg-accent/70"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              {opt}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div {...fadeUp(0.24)}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-10 pl-4 text-xs">#</TableHead>
                  <TableHead className="text-xs">Issue</TableHead>
                  <TableHead className="hidden text-xs sm:table-cell">Project</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="hidden text-xs md:table-cell">Status</TableHead>
                  <TableHead className="hidden text-xs md:table-cell">Due</TableHead>
                  <TableHead className="w-10 pr-4" />
                </TableRow>
              </TableHeader>
              <AnimatePresence mode="wait" initial={false}>
                <motion.tbody
                  key={`${page}-${statusTile}-${priorityFilter}-${search}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {paged.map((issue, i) => (
                    <MotionTableRow
                      key={issue.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04, ease: EASE }}
                      onClick={() => openInProject(issue)}
                      className={cn(
                        'cursor-pointer',
                        issue.status === 'done' && 'opacity-55',
                      )}
                    >
                      <TableCell className="pl-4 text-xs tabular-nums text-muted-foreground">
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              'max-w-104 truncate text-sm font-medium leading-tight',
                              issue.status === 'done' &&
                                'line-through decoration-muted-foreground/50',
                            )}
                          >
                            {issue.title}
                          </p>
                          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                            {issue.key}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <ProjectChip projectId={issue.projectId} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={issue.priority} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <StatusBadge status={issue.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <DueCell issue={issue} />
                      </TableCell>
                      <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          actions={[
                            {
                              label: 'เปิดในโปรเจกต์',
                              icon: ExternalLink,
                              onClick: () => openInProject(issue),
                            },
                            {
                              label: 'ทำเสร็จแล้ว',
                              icon: CheckCircle2,
                              disabled: issue.status === 'done',
                              onClick: () => markDone(issue.id),
                            },
                          ]}
                        />
                      </TableCell>
                    </MotionTableRow>
                  ))}

                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-20">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                            <CheckCircle2 size={20} className="text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {hasFilter
                                ? 'ไม่พบ issue ที่ตรงกับตัวกรอง'
                                : 'ไม่มีงานค้าง — เคลียร์หมดแล้ว'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {hasFilter
                                ? 'ลองล้างตัวกรองหรือเปลี่ยนคำค้นหา'
                                : 'งานใหม่ที่ถูกมอบหมายให้คุณจะแสดงที่นี่'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </motion.tbody>
              </AnimatePresence>
            </Table>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
              layoutId="myissues-page-active-bg"
              itemLabel="issue"
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
