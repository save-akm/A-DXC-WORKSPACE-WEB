# Teams Page — Design Spec

**Date:** 2026-05-30  
**Status:** Approved

---

## Overview

Replace the `/admin/teams` placeholder with a full Teams management page. Displays all teams as a **banner card grid** matching the project design system (shadcn/ui + Tailwind v4, semantic CSS tokens, dark/light/preset themes, Framer Motion animations).

---

## API

### Response Shape

```ts
// GET /teams
interface TeamResponse {
  status: string;
  message: string;
  timestamp: string;
  data: Team[];
}

interface Team {
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

interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  roleInTeam: 'LEAD' | 'MEMBER';
  addedById: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    nickname: string | null;
    avatarUrl: string | null;
  };
}
```

API call uses `apiFetch` from `lib/auth/client`. Falls back to mock data when unreachable.

---

## Layout

### Page Structure

```
[Page Header: title + subtitle]           [Search box]  [+ สร้างทีม button]
[3 stat cards: ทีมทั้งหมด · สมาชิกรวม · Projects]
[Team card grid — 3 columns desktop, 2 tablet, 1 mobile]
[+ Add team placeholder card (last cell)]
```

### Stat Cards

Use existing `StatCard` component (already in `components/management/stat-card.tsx`) with:
- **ทีมทั้งหมด** — `teams.length`
- **สมาชิกรวม** — sum of all `team.members.length`
- **Projects** — sum of all `team._count.projects`

---

## Team Card Anatomy

```
┌──────────────────────────────────────────┐
│  [Banner gradient 72px tall]      [⋯ menu]│
│  [Logo/Initial overlapping bottom-left]   │
├──────────────────────────────────────────┤
│  Team Name  [TAG1]  [TAG2]               │  ← name-row
│                                          │
│  Description text (centered vertically)  │  ← desc (flex:1 + align-items:center)
│                                          │
│  ─────────────────────────────────────── │
│  [AV][AV][AV] +N คน    📁 N projects     │  ← footer
└──────────────────────────────────────────┘
```

### Banner

- Height: `h-18` (72px)
- Background: gradient derived from team position index (cycles through 6 gradients)
- **If `logoUrl` is set**: show `<img>` inside the logo circle, else show first letter of team name
- `⋯` action menu (top-right): Edit, Delete (with confirmation)

### Logo

- `36×36px`, `rounded-xl`, overlapping banner bottom-left (`absolute -bottom-[18px] left-[14px]`)
- Border: `border-[3px] border-card` (matches card bg for clean cut-out)
- Gradient background matches banner gradient (same index)

### Name Row

`flex items-center gap-2 flex-wrap`

- Team name: `text-[13px] font-bold text-foreground`
- Tags: pill shaped `rounded-full px-2 py-0.5 text-[9px] font-bold`
- Tag color determined by tag string hash → cycles through 6 accent palettes (indigo/teal/violet/amber/sky/emerald) — same light/dark pattern as role badges

### Description

`text-[11px] text-muted-foreground leading-relaxed flex-1 flex items-center`

Shows up to 2 lines, truncates with CSS.

### Divider

`h-px bg-border my-2.5`

### Footer

- **Left**: stacked avatars (max 3 shown, rest as `+N`) + member count
  - Avatar: `w-6 h-6 rounded-full border-2 border-card` — uses `UserAvatar` component with `initial` derived from `firstName[0]+lastName[0]`, color from userId hash
  - `roleInTeam === 'LEAD'` avatar shown first
- **Right**: project badge — `bg-{accentColor}/10 border border-{accentColor}/25 rounded-lg px-2 py-1 text-[10px] font-semibold`

### Add Team Placeholder Card

Last card in the grid:
- `border-2 border-dashed border-border` transparent background
- Centered `+` icon with "สร้างทีม" label
- Clicking opens the create drawer (same action as header button)

---

## Color System

All backgrounds, text, borders use **semantic tokens** — no hardcoded hex:

| Element | Token |
|---|---|
| Page background | `bg-background` |
| Card background | `bg-card` |
| Section divider | `bg-border` |
| Card border | `border border-border/60` |
| Primary text | `text-foreground` |
| Secondary text | `text-muted-foreground` |
| Dim text | `text-muted-foreground/60` |
| Avatar border cutout | `border-card` |
| Hover state | `hover:border-indigo-500/30 hover:shadow-lg` |

Banner gradients and tag colors remain as brand accent colors (they look correct on all themes).

**Tag color palette** (6 colors, assigned by `tag.charCodeAt(0) % 6`):
1. indigo — `bg-indigo-500/15 text-indigo-600 dark:text-indigo-400`
2. teal — `bg-teal-500/15 text-teal-600 dark:text-teal-400`
3. violet — `bg-violet-500/15 text-violet-600 dark:text-violet-400`
4. amber — `bg-amber-500/15 text-amber-600 dark:text-amber-400`
5. sky — `bg-sky-500/15 text-sky-600 dark:text-sky-400`
6. emerald — `bg-emerald-500/15 text-emerald-600 dark:text-emerald-400`

---

## Animations

- **Page mount**: staggered card `opacity: 0→1, y: 16→0` with `delay: i * 0.06s`
- **Card hover**: `scale: 1.01` + shadow bump (CSS transition, no Framer Motion needed)
- **Search filter**: `AnimatePresence` re-renders filtered card list
- **Stat cards**: same stagger as permissions page section cards

---

## Interactions

### Search

Client-side filter on `name`, `description`, `tags` fields (case-insensitive). No API re-fetch — all data loaded once on mount.

### Create Team

Header `+ สร้างทีม` button and placeholder card both open a `TeamDrawer` (right-side drawer, same pattern as `RoleDrawer` and user drawer). Drawer contains:
- Team name (required)
- Description (optional)
- Tags (multi-value text input)
- Logo URL (optional)

On submit: POST `/teams` → optimistic UI update → toast success.

### Edit / Delete

Via `⋯` action menu on each card (uses existing `ActionMenu` component):
- **แก้ไข** → open pre-filled `TeamDrawer`
- **ลบ** → confirm dialog → DELETE `/teams/:id` → remove card with exit animation

---

## File Structure

```
app/(management)/admin/teams/
  page.tsx                        ← main page (client component)
  types.ts                        ← Team, TeamMember interfaces
  _mocks/
    mock-data.ts                  ← fallback mock teams
  _components/
    team-card.tsx                 ← banner card component
    team-drawer.tsx               ← create/edit drawer
    team-card-skeleton.tsx        ← loading skeleton
```

`lib/api/teams.ts` — API functions (`fetchTeams`, `createTeam`, `updateTeam`, `deleteTeam`) with mock fallback.

---

## Out of Scope

- Team member management (add/remove members) — separate page
- Team detail page — separate page
- Permission checking per team — handled by permissions system
