# Teams Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/admin/teams` placeholder with a full banner-card grid page showing all teams, with create/edit/delete via a side drawer.

**Architecture:** Client component page fetches all teams once on mount via `apiFetch` (falling back to mock data), then filters client-side. Dirty state and drawer state live in `page.tsx`. Three sub-components — `TeamCard`, `TeamDrawer`, `TeamCardSkeleton` — each own their rendering. No Zustand store needed.

**Tech Stack:** Next.js app router, React `useState`/`useEffect`/`useMemo`, Framer Motion v12, Tailwind CSS v4, Lucide React, `apiFetch` from `lib/auth/client`, existing `UserAvatar`/`StatCard`/`ActionMenu` components, `toast` from `components/ui/toast`.

> **Note:** No test framework configured — verification is manual (browser) unless noted otherwise.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `app/(management)/admin/teams/types.ts` | Create | Team + TeamMember TypeScript interfaces |
| `app/(management)/admin/teams/_mocks/mock-data.ts` | Create | Fallback mock teams |
| `lib/api/teams.ts` | Create | fetchTeams, createTeam, updateTeam, deleteTeam |
| `app/(management)/admin/teams/_components/team-card.tsx` | Create | Banner card with logo, tags, avatars, action menu |
| `app/(management)/admin/teams/_components/team-card-skeleton.tsx` | Create | Loading skeleton card |
| `app/(management)/admin/teams/_components/team-drawer.tsx` | Create | Create/edit side drawer |
| `app/(management)/admin/teams/page.tsx` | Modify | Replace placeholder with full page |

---

## Task 1: Types

**Files:**
- Create: `app/(management)/admin/teams/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// app/(management)/admin/teams/types.ts

export interface TeamUser {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  roleInTeam: 'LEAD' | 'MEMBER';
  addedById: string;
  joinedAt: string;
  user: TeamUser;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  tags: string[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count: { projects: number };
  members: TeamMember[];
}

export interface TeamsApiResponse {
  status: string;
  message: string;
  timestamp: string;
  data: Team[];
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  tags?: string[];
  logoUrl?: string;
}

export type UpdateTeamInput = Partial<CreateTeamInput>;
```

- [ ] **Step 2: Commit**

```bash
git add "app/(management)/admin/teams/types.ts"
git commit -m "feat(teams): add TypeScript types"
```

---

## Task 2: Mock Data

**Files:**
- Create: `app/(management)/admin/teams/_mocks/mock-data.ts`

- [ ] **Step 1: Create mock data**

```typescript
// app/(management)/admin/teams/_mocks/mock-data.ts
import type { Team } from '../types';

export const MOCK_TEAMS: Team[] = [
  {
    id: 'team-alpha',
    name: 'Alpha Team',
    description: 'ทีม Backend ดูแลระบบ API และ Infrastructure ของโปรเจค',
    logoUrl: null,
    tags: ['DEVELOP', 'INFRA'],
    createdById: 'user-001',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-05-30T09:00:00.000Z',
    deletedAt: null,
    _count: { projects: 3 },
    members: [
      {
        id: 'mem-001', teamId: 'team-alpha', userId: 'user-001',
        roleInTeam: 'LEAD', addedById: 'user-000',
        joinedAt: '2026-01-15T08:00:00.000Z',
        user: { id: 'user-001', firstName: 'สมชาย', lastName: 'ใจดี', nickname: 'ชาย', avatarUrl: null },
      },
      {
        id: 'mem-002', teamId: 'team-alpha', userId: 'user-002',
        roleInTeam: 'MEMBER', addedById: 'user-001',
        joinedAt: '2026-02-01T08:00:00.000Z',
        user: { id: 'user-002', firstName: 'สมหญิง', lastName: 'รักดี', nickname: null, avatarUrl: null },
      },
      {
        id: 'mem-003', teamId: 'team-alpha', userId: 'user-003',
        roleInTeam: 'MEMBER', addedById: 'user-001',
        joinedAt: '2026-02-10T08:00:00.000Z',
        user: { id: 'user-003', firstName: 'กมล', lastName: 'สวัสดี', nickname: 'มล', avatarUrl: null },
      },
      {
        id: 'mem-004', teamId: 'team-alpha', userId: 'user-004',
        roleInTeam: 'MEMBER', addedById: 'user-001',
        joinedAt: '2026-03-01T08:00:00.000Z',
        user: { id: 'user-004', firstName: 'วิชัย', lastName: 'ดีใจ', nickname: null, avatarUrl: null },
      },
    ],
  },
  {
    id: 'team-beta',
    name: 'Beta Team',
    description: 'ทีม Frontend รับผิดชอบ UI/UX และ Component Library',
    logoUrl: null,
    tags: ['DESIGN', 'UI/UX'],
    createdById: 'user-010',
    createdAt: '2026-01-20T08:00:00.000Z',
    updatedAt: '2026-05-28T10:00:00.000Z',
    deletedAt: null,
    _count: { projects: 5 },
    members: [
      {
        id: 'mem-010', teamId: 'team-beta', userId: 'user-010',
        roleInTeam: 'LEAD', addedById: 'user-000',
        joinedAt: '2026-01-20T08:00:00.000Z',
        user: { id: 'user-010', firstName: 'นารี', lastName: 'สดใส', nickname: 'นา', avatarUrl: null },
      },
      {
        id: 'mem-011', teamId: 'team-beta', userId: 'user-011',
        roleInTeam: 'MEMBER', addedById: 'user-010',
        joinedAt: '2026-02-05T08:00:00.000Z',
        user: { id: 'user-011', firstName: 'มานะ', lastName: 'ขยัน', nickname: null, avatarUrl: null },
      },
      {
        id: 'mem-012', teamId: 'team-beta', userId: 'user-012',
        roleInTeam: 'MEMBER', addedById: 'user-010',
        joinedAt: '2026-02-15T08:00:00.000Z',
        user: { id: 'user-012', firstName: 'พิมพ์', lastName: 'สวย', nickname: 'พิม', avatarUrl: null },
      },
    ],
  },
  {
    id: 'team-gamma',
    name: 'Gamma Team',
    description: 'ทีม QA Testing ดูแลคุณภาพซอฟต์แวร์และ Automation Test',
    logoUrl: null,
    tags: ['QA', 'TESTING'],
    createdById: 'user-020',
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-05-25T08:00:00.000Z',
    deletedAt: null,
    _count: { projects: 2 },
    members: [
      {
        id: 'mem-020', teamId: 'team-gamma', userId: 'user-020',
        roleInTeam: 'LEAD', addedById: 'user-000',
        joinedAt: '2026-02-01T08:00:00.000Z',
        user: { id: 'user-020', firstName: 'สุภา', lastName: 'พิทักษ์', nickname: 'ภา', avatarUrl: null },
      },
      {
        id: 'mem-021', teamId: 'team-gamma', userId: 'user-021',
        roleInTeam: 'MEMBER', addedById: 'user-020',
        joinedAt: '2026-03-01T08:00:00.000Z',
        user: { id: 'user-021', firstName: 'เพชร', lastName: 'แก้ว', nickname: null, avatarUrl: null },
      },
    ],
  },
  {
    id: 'team-delta',
    name: 'Delta Team',
    description: 'ทีม DevOps จัดการ CI/CD Pipeline และ Cloud Infrastructure',
    logoUrl: null,
    tags: ['DEVOPS', 'CLOUD'],
    createdById: 'user-030',
    createdAt: '2026-02-10T08:00:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
    deletedAt: null,
    _count: { projects: 4 },
    members: [
      {
        id: 'mem-030', teamId: 'team-delta', userId: 'user-030',
        roleInTeam: 'LEAD', addedById: 'user-000',
        joinedAt: '2026-02-10T08:00:00.000Z',
        user: { id: 'user-030', firstName: 'วรุณ', lastName: 'มั่นคง', nickname: 'วรุณ', avatarUrl: null },
      },
      {
        id: 'mem-031', teamId: 'team-delta', userId: 'user-031',
        roleInTeam: 'MEMBER', addedById: 'user-030',
        joinedAt: '2026-03-15T08:00:00.000Z',
        user: { id: 'user-031', firstName: 'รัตนา', lastName: 'ใสสะอาด', nickname: 'รัต', avatarUrl: null },
      },
    ],
  },
  {
    id: 'team-epsilon',
    name: 'Epsilon Team',
    description: 'ทีม Data Science และ AI วิเคราะห์ข้อมูลและพัฒนา Model',
    logoUrl: null,
    tags: ['DATA', 'AI'],
    createdById: 'user-040',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-05-15T08:00:00.000Z',
    deletedAt: null,
    _count: { projects: 2 },
    members: [
      {
        id: 'mem-040', teamId: 'team-epsilon', userId: 'user-040',
        roleInTeam: 'LEAD', addedById: 'user-000',
        joinedAt: '2026-03-01T08:00:00.000Z',
        user: { id: 'user-040', firstName: 'อรุณ', lastName: 'สว่าง', nickname: 'อรุณ', avatarUrl: null },
      },
      {
        id: 'mem-041', teamId: 'team-epsilon', userId: 'user-041',
        roleInTeam: 'MEMBER', addedById: 'user-040',
        joinedAt: '2026-03-20T08:00:00.000Z',
        user: { id: 'user-041', firstName: 'มุก', lastName: 'ทะเล', nickname: 'มุก', avatarUrl: null },
      },
    ],
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add "app/(management)/admin/teams/_mocks/mock-data.ts"
git commit -m "feat(teams): add mock team data"
```

---

## Task 3: API Layer

**Files:**
- Create: `lib/api/teams.ts`

- [ ] **Step 1: Create API helpers**

```typescript
// lib/api/teams.ts
import { apiFetch } from '@/lib/auth/client';
import type { Team, TeamsApiResponse, CreateTeamInput, UpdateTeamInput } from '@/app/(management)/admin/teams/types';
import { MOCK_TEAMS } from '@/app/(management)/admin/teams/_mocks/mock-data';

export async function fetchTeams(): Promise<Team[]> {
  try {
    const res = await apiFetch<TeamsApiResponse>('/teams');
    return res.data;
  } catch {
    return MOCK_TEAMS;
  }
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const res = await apiFetch<{ status: string; data: Team }>('/teams', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateTeam(id: string, input: UpdateTeamInput): Promise<Team> {
  const res = await apiFetch<{ status: string; data: Team }>(`/teams/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deleteTeam(id: string): Promise<void> {
  await apiFetch<void>(`/teams/${id}`, { method: 'DELETE' });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/api/teams.ts
git commit -m "feat(teams): add API layer with mock fallback"
```

---

## Task 4: TeamCard Component

**Files:**
- Create: `app/(management)/admin/teams/_components/team-card.tsx`

- [ ] **Step 1: Create the team card**

```tsx
// app/(management)/admin/teams/_components/team-card.tsx
'use client';

import type React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ActionMenu } from '@/components/management/action-menu';
import type { Team } from '../types';

// 6 cycling banner gradients (inline style — dynamic, can't use Tailwind class)
const BANNER_GRADIENTS: string[] = [
  'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
  'linear-gradient(135deg, #14b8a6, #06b6d4, #0ea5e9)',
  'linear-gradient(135deg, #a855f7, #ec4899, #f97316)',
  'linear-gradient(135deg, #f59e0b, #ef4444, #ec4899)',
  'linear-gradient(135deg, #10b981, #14b8a6, #06b6d4)',
  'linear-gradient(135deg, #0ea5e9, #3b82f6, #6366f1)',
];

// Project badge accent — matches banner index
const PROJECT_BADGE_CLASSES: string[] = [
  'bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400',
  'bg-teal-500/10 border border-teal-500/25 text-teal-600 dark:text-teal-400',
  'bg-violet-500/10 border border-violet-500/25 text-violet-600 dark:text-violet-400',
  'bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400',
  'bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400',
  'bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400',
];

// Tag color — hash tag string to one of 6 palettes
const TAG_COLORS: string[] = [
  'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
];

function tagColorClass(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_COLORS[hash % TAG_COLORS.length];
}

function avatarColor(seed: string): string {
  const COLORS = [
    'bg-indigo-600', 'bg-violet-600', 'bg-sky-600', 'bg-teal-600',
    'bg-emerald-600', 'bg-pink-600', 'bg-rose-600', 'bg-amber-600',
    'bg-cyan-600', 'bg-fuchsia-600',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

interface TeamCardProps {
  team: Team;
  index: number;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

export function TeamCard({ team, index, onEdit, onDelete }: TeamCardProps) {
  const accentIdx = index % BANNER_GRADIENTS.length;
  const bannerStyle: React.CSSProperties = { background: BANNER_GRADIENTS[accentIdx] };

  // Sort: LEAD first, then MEMBER; show max 3 avatars
  const sorted = [...team.members].sort((a, b) =>
    a.roleInTeam === 'LEAD' ? -1 : b.roleInTeam === 'LEAD' ? 1 : 0,
  );
  const shown = sorted.slice(0, 3);
  const overflow = team.members.length - shown.length;

  const logoInitial = team.name.charAt(0).toUpperCase();

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:border-indigo-500/30 hover:shadow-lg">
      {/* Banner */}
      <div className="relative h-[72px] shrink-0" style={bannerStyle}>
        <ActionMenu
          trigger={
            <button
              type="button"
              className="absolute right-2 top-2 rounded-md px-2 py-0.5 text-[11px] text-white/80 backdrop-blur-sm transition-colors cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.25)' }}
            >
              ⋯
            </button>
          }
          items={[
            { icon: Pencil, label: 'แก้ไขทีม', onClick: () => onEdit(team) },
            { icon: Trash2, label: 'ลบทีม', destructive: true, onClick: () => onDelete(team) },
          ]}
        />
        {/* Logo overlapping banner */}
        <div
          className="absolute -bottom-[18px] left-[14px] flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border-[3px] border-card"
          style={{ background: BANNER_GRADIENTS[accentIdx] }}
        >
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[15px] font-extrabold text-white">{logoInitial}</span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col px-[14px] pb-[14px] pt-6">
        {/* Name + Tags */}
        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] font-bold text-foreground">{team.name}</span>
          {team.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide ${tagColorClass(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Description — vertically centered in remaining space */}
        <div className="flex flex-1 items-center">
          <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            {team.description ?? '—'}
          </p>
        </div>

        {/* Divider */}
        <div className="my-2.5 h-px bg-border" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Member avatars */}
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {shown.map((member, i) => (
                <div key={member.id} className={i > 0 ? '-ml-2' : ''}>
                  <UserAvatar
                    initial={`${member.user.firstName.charAt(0)}${member.user.lastName.charAt(0)}`}
                    color={avatarColor(member.userId)}
                    avatarUrl={member.user.avatarUrl}
                    size="xs"
                    className="border-2 border-card"
                  />
                </div>
              ))}
              {overflow > 0 && (
                <div className="-ml-2 flex size-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[8px] font-semibold text-muted-foreground">
                  +{overflow}
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground/70">{team.members.length} คน</span>
          </div>

          {/* Project badge */}
          <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${PROJECT_BADGE_CLASSES[accentIdx]}`}>
            <span>📁</span>
            <span>{team._count.projects} projects</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify** — Check that `ActionMenu` from `components/management/action-menu.tsx` accepts a `trigger` prop and `items: ActionItem[]`. If the actual interface differs, adapt the call accordingly before committing.

- [ ] **Step 3: Commit**

```bash
git add "app/(management)/admin/teams/_components/team-card.tsx"
git commit -m "feat(teams): add TeamCard with banner, tags, avatars, action menu"
```

---

## Task 5: TeamCardSkeleton

**Files:**
- Create: `app/(management)/admin/teams/_components/team-card-skeleton.tsx`

- [ ] **Step 1: Create skeleton**

```tsx
// app/(management)/admin/teams/_components/team-card-skeleton.tsx

export function TeamCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      {/* Banner skeleton */}
      <div className="h-[72px] shrink-0 animate-pulse bg-muted" />
      <div className="flex flex-1 flex-col px-[14px] pb-[14px] pt-6">
        {/* Name row skeleton */}
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-14 animate-pulse rounded-full bg-muted" />
        </div>
        {/* Description skeleton */}
        <div className="flex flex-1 flex-col justify-center gap-1.5">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
        </div>
        {/* Divider */}
        <div className="my-2.5 h-px bg-border" />
        {/* Footer skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
            <div className="ml-1.5 h-3 w-10 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(management)/admin/teams/_components/team-card-skeleton.tsx"
git commit -m "feat(teams): add TeamCardSkeleton"
```

---

## Task 6: TeamDrawer

**Files:**
- Create: `app/(management)/admin/teams/_components/team-drawer.tsx`

- [ ] **Step 1: Create the drawer**

```tsx
// app/(management)/admin/teams/_components/team-drawer.tsx
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users } from 'lucide-react';
import type { Team, CreateTeamInput } from '../types';

interface TeamDrawerProps {
  open: boolean;
  team?: Team | null;  // null = create mode
  onClose: () => void;
  onSubmit: (input: CreateTeamInput) => Promise<void>;
}

export function TeamDrawer({ open, team, onClose, onSubmit }: TeamDrawerProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');  // comma-separated string
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Pre-fill when editing
  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description ?? '');
      setTagsRaw(team.tags.join(', '));
      setLogoUrl(team.logoUrl ?? '');
    } else {
      setName('');
      setDescription('');
      setTagsRaw('');
      setLogoUrl('');
    }
  }, [team, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const tags = tagsRaw
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        logoUrl: logoUrl.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const isEdit = Boolean(team);

  const drawer = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer panel */}
          <motion.div
            key="drawer"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
          >
            {/* Gradient header bar */}
            <div className="h-1.5 w-full shrink-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-foreground">
                    {isEdit ? 'แก้ไขทีม' : 'สร้างทีมใหม่'}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {isEdit ? `แก้ไข ${team?.name}` : 'กรอกข้อมูลทีม'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex-1 space-y-5 px-6 py-5">
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    ชื่อทีม <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น Alpha Team"
                    required
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    คำอธิบาย
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="อธิบายหน้าที่และความรับผิดชอบของทีม"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tagsRaw}
                    onChange={(e) => setTagsRaw(e.target.value)}
                    placeholder="DEVELOP, INFRA, QA (คั่นด้วย comma)"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground/60">แยกหลาย tag ด้วยเครื่องหมาย comma</p>
                </div>

                {/* Logo URL */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex gap-3 border-t border-border/60 px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      กำลังบันทึก…
                    </>
                  ) : isEdit ? (
                    'บันทึกการแก้ไข'
                  ) : (
                    'สร้างทีม'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(drawer, document.body);
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(management)/admin/teams/_components/team-drawer.tsx"
git commit -m "feat(teams): add TeamDrawer for create/edit"
```

---

## Task 7: Main Page

**Files:**
- Modify: `app/(management)/admin/teams/page.tsx`

- [ ] **Step 1: Replace placeholder with full page**

```tsx
// app/(management)/admin/teams/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Users, FolderOpen, BarChart3, Plus } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { StatCard } from '@/components/management/stat-card';
import { fetchTeams, createTeam, updateTeam, deleteTeam } from '@/lib/api/teams';
import { TeamCard } from './_components/team-card';
import { TeamCardSkeleton } from './_components/team-card-skeleton';
import { TeamDrawer } from './_components/team-drawer';
import type { Team, CreateTeamInput } from './types';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch(() => toast.error('ไม่สามารถโหลดข้อมูลทีมได้'))
      .finally(() => setLoading(false));
  }, []);

  // Stats
  const totalMembers = useMemo(
    () => teams.reduce((s, t) => s + t.members.length, 0),
    [teams],
  );
  const totalProjects = useMemo(
    () => teams.reduce((s, t) => s + t._count.projects, 0),
    [teams],
  );

  // Client-side search
  const filtered = useMemo(() => {
    if (!search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [teams, search]);

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((team: Team) => {
    setEditTarget(team);
    setDrawerOpen(true);
  }, []);

  const handleDelete = useCallback(async (team: Team) => {
    if (!window.confirm(`ต้องการลบทีม "${team.name}" ใช่ไหม?`)) return;
    try {
      await deleteTeam(team.id);
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
      toast.success(`ลบทีม "${team.name}" สำเร็จ`);
    } catch {
      toast.error('ลบทีมไม่สำเร็จ กรุณาลองใหม่');
    }
  }, []);

  const handleSubmit = useCallback(
    async (input: CreateTeamInput) => {
      if (editTarget) {
        const updated = await updateTeam(editTarget.id, input);
        setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        toast.success('แก้ไขทีมสำเร็จ');
      } else {
        const created = await createTeam(input);
        setTeams((prev) => [...prev, created]);
        toast.success(`สร้างทีม "${created.name}" สำเร็จ`);
      }
    },
    [editTarget],
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Page header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            Teams
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">จัดการทีมและสมาชิกในระบบ</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาทีม…"
              className="w-40 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none sm:w-52"
            />
          </div>
          {/* Create */}
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-[12px] font-semibold text-white shadow-md shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            สร้างทีม
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Users} label="ทีมทั้งหมด" value={teams.length} gradient="from-indigo-500 to-violet-500" />
        <StatCard icon={BarChart3} label="สมาชิกรวม" value={totalMembers} gradient="from-teal-500 to-cyan-500" />
        <StatCard icon={FolderOpen} label="Projects" value={totalProjects} gradient="from-violet-500 to-fuchsia-500" />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Card grid */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((team, i) => (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <TeamCard
                  team={team}
                  index={i}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}

            {/* Add team placeholder card */}
            <motion.button
              key="add-card"
              type="button"
              layout
              onClick={openCreate}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: filtered.length * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-transparent text-muted-foreground transition-colors hover:border-indigo-500/40 hover:text-foreground cursor-pointer"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-dashed border-border bg-muted">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-[12px] font-semibold">สร้างทีมใหม่</span>
            </motion.button>
          </AnimatePresence>

          {/* Empty state (no search results) */}
          {filtered.length === 0 && search && (
            <div className="col-span-full py-16 text-center text-muted-foreground text-sm">
              ไม่พบทีมที่ตรงกับ &ldquo;{search}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Drawer */}
      <TeamDrawer
        open={drawerOpen}
        team={editTarget}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

- [ ] **Step 2: Check StatCard props** — verify that `StatCard` accepts `icon`, `label`, `value`, `gradient` by reading `components/management/stat-card.tsx` before committing. Adapt the call if the actual prop names differ.

- [ ] **Step 3: Check ActionMenu trigger prop** — open `components/management/action-menu.tsx` and confirm it accepts a `trigger` prop. If it uses a different API (e.g., a render prop or ref), update `team-card.tsx` before committing.

- [ ] **Step 4: Run dev server and verify**

```bash
npm run dev
```

Open `http://localhost:3000/admin/teams` and confirm:
- 5 mock team cards render in a 3-column grid (fallback mock data)
- Stat cards show correct totals (5 teams, 13 members, 16 projects)
- Search filters cards live as you type
- Clicking "สร้างทีม" opens the drawer from the right
- Drawer form submits (mock) and shows a new card
- ⋯ menu opens with Edit / Delete options
- Delete confirms and removes the card with exit animation
- Light mode and dark mode both look correct

- [ ] **Step 5: Commit**

```bash
git add "app/(management)/admin/teams/page.tsx"
git commit -m "feat(teams): complete teams page with card grid, search, drawer, CRUD"
```

---

## Self-Review

**Spec coverage:**
- ✅ Banner card with gradient, overlapping logo, name+tags row, centered description, footer
- ✅ 3 stat cards (teams, members, projects) using StatCard component
- ✅ Search: client-side filter on name/description/tags
- ✅ Create/Edit drawer (TeamDrawer) with name, description, tags, logoUrl
- ✅ Delete with confirm dialog
- ✅ Add-team placeholder card as last grid cell
- ✅ Loading skeleton grid
- ✅ Staggered animation on mount, exit animation on delete
- ✅ ActionMenu for ⋯ edit/delete
- ✅ Semantic CSS tokens (bg-card, bg-background, text-foreground, border-border) throughout
- ✅ Mock data fallback when API unreachable
- ✅ Tag color hash, avatar color hash, banner gradient cycling by index
- ✅ Members sorted LEAD first, max 3 shown + overflow count

**Placeholder scan:** None. All steps contain actual code.

**Type consistency:**
- `Team` and `TeamMember` defined in `types.ts` (Task 1), imported in all subsequent tasks
- `CreateTeamInput` defined in `types.ts`, used in `TeamDrawer.onSubmit` and `lib/api/teams.ts`
- `fetchTeams()` returns `Promise<Team[]>` — matches `useState<Team[]>` in page.tsx
- `avatarColor(seed: string)` defined in `team-card.tsx` — same pattern as permissions page, not a shared import (YAGNI: only used here)
- `ActionMenu` trigger prop assumed — Task 7 step 3 explicitly verifies before commit
- `StatCard` gradient prop assumed — Task 7 step 2 explicitly verifies before commit
