# Permissions Page — Design Spec

**Date:** 2026-05-30  
**Status:** Approved  

---

## Overview

A single `/admin/permissions` page that lets administrators manage both **Role-based permissions** and **User-level permission overrides** across all menus in the system.

The page matches the existing project design system: shadcn/ui + Tailwind CSS v4, Framer Motion animations, OKLCH Navy dark theme, and the same component patterns used in the Users/Roles admin pages.

---

## Layout

### Tab Switcher

Two pill-style tabs at the top of the page — same pattern as the existing topbar view toggle used elsewhere:

- **Role Permissions Settings** (icon: `LayoutGrid` from lucide)
- **User Permissions Settings** (icon: `Users`)

Active tab: filled indigo→purple gradient pill with glow shadow.  
Inactive tab: `#1e293b` background, muted text.  
Tab switch uses Framer Motion `AnimatePresence` + slide transition (same as login page views).

### Page Header Card

Below the tabs, a full-width card (`bg-gradient-to-br from-[#1a1f3a] to-[#1e293b]`, `border border-indigo-500/15`, `rounded-2xl`) containing:

- **Left**: colored icon box (gradient matching the active tab) + title + subtitle
- **Right**: dirty-state badge + Save Changes button

The header is **sticky** (`sticky top-0 z-10`) so the Save button remains visible while scrolling through long section lists.

---

## Tab 1 — Role Permissions Settings

### Structure

A vertically scrollable list of **section cards**, one per menu item (Dashboard, Summary, Case By Line, Exports, Working Calendar, Line Mapping, Notifications, etc.).

Sections are **always expanded** (no accordion). Each section card:

```
┌─ Section Card ──────────────────────────────────────────┐
│ [accent bar] Menu Name        [4 roles · 5 perms]  [Select All] │
├─────────────────────────────────────────────────────────┤
│  Role          View  Create  Update  Delete  Export      │
│  Super Admin    ✓     ✓       ✓       ✓       ✓         │
│  Admin          ✓     ✓      [✓̈]      □       □         │
│  Supervisor     ✓     □       □       □       □         │
│  Viewer         ✓     □       □       □      [□̈]        │
└─────────────────────────────────────────────────────────┘
```

**Accent bar**: 3px left-border gradient that cycles through indigo→purple → purple→pink → pink→orange → teal→cyan per section, giving visual variety.

**Columns**: View · Create · Update · Delete · Export (5 permissions). Rendered as `<table>` for semantic alignment.

**Role display**: name + small colored badge (SUPER / ADMIN / SUP / VIEW).

**Select All button**: appears on each section header. Clicking it checks all checkboxes in that section for all roles. If all are already checked, it unchecks all (toggle).

### Dirty Tracking

When a checkbox is toggled:

| State | Visual |
|---|---|
| Clean checked | Indigo→violet gradient fill, white checkmark |
| Clean unchecked | Transparent, `border border-slate-600` |
| Dirty added (was unchecked → now checked) | Emerald gradient fill + `outline-2 outline-emerald-500/40 outline-offset-1` |
| Dirty removed (was checked → now unchecked) | Transparent + `border border-red-500/50 outline-2 outline-red-500/20` |

Dirty count is tracked in local state (`Map<id, originalValue>`). Re-toggling back to original removes the dirty entry.

**Header badge**: `● N รายการที่เปลี่ยน` (amber, with pulsing dot) — visible only when `dirtyCount > 0`.

**Save Changes button**:
- Disabled state: `bg-slate-800 text-slate-600 cursor-not-allowed` — shown on initial load
- Active state: emerald gradient + glow shadow — appears as soon as any checkbox changes

**Save flow**: clicking Save → button shows `⏳ กำลังบันทึก…` → calls API → on success: reset all dirty states to clean, show `toast.success()`, badge disappears.

**Discard**: a small `↩ ยกเลิก` text button (ghost style) appears next to the badge when dirty. Clicking it resets all checkboxes to their original values.

---

## Tab 2 — User Permissions Settings

### Structure

A **single section card** that shows permission overrides per user for one menu at a time. The active menu is selected via a **dropdown** (`Select Menu: [Dashboard ▾]`) in the section card header.

```
┌─ User Section Card ─────────────────────────────────────────┐
│ [accent] Dashboard    9 users    │  Select Menu: [Dashboard ▾] │
├──────────────────────────────────────────────────────────────┤
│  Name                Role        View  Create  Update  Delete  │
│  [AK] Akaraphon…     System       ✓     ✓       ✓      □      │
│  [SP] Sirinapa…      Super Admin  ✓     ✓      [✓̈]     □      │
│  …                                                            │
└──────────────────────────────────────────────────────────────┘
```

**Toolbar** (above the section card):
- Search input (search by name or role) — `max-w-xs`, `bg-slate-900` rounded input with search icon

**User rows**:
- Avatar (`UserAvatar` component, existing sizes) with gradient fallback colors
- Full name
- Role badge (same as Role tab)
- 4 permission checkboxes: View · Create · Update · Delete (no Export column on user level)

**Dirty tracking**: same visual system as Role tab.

**Pagination / infinite scroll**: table shows 20 users at a time with a "โหลดเพิ่ม" (load more) button at the bottom. Total count shown: `แสดง X จาก Y users`.

**Menu switching**: changing the dropdown resets dirty state (with a confirmation dialog if there are unsaved changes: `"มีการเปลี่ยนแปลงที่ยังไม่บันทึก ต้องการออกไหม?"`).

---

## Dirty State Legend

A small legend bar below each section/table:
```
🟢 = เพิ่มใหม่   🔴 = ลบออก   (ยังไม่ได้ save)
```

---

## Animations

- **Tab switch**: `AnimatePresence mode="wait"` + `motion.div` with `x: ±40, opacity: 0` enter/exit
- **Section cards**: staggered `motion.div` fade-up on mount (`y: 12 → 0, opacity: 0 → 1, delay: index * 0.05`)
- **Checkbox toggle**: scale pulse (`scale: 0.85 → 1`) via `motion` wrapper
- **Dirty badge**: `AnimatePresence` slide-in from right when count goes 0→1, slide-out when 1→0
- **Save button state change**: color transition via Tailwind `transition-colors duration-200`

---

## Component Structure

```
app/(management)/admin/permissions/
  page.tsx                    ← client component, tab state
  _components/
    role-permissions-tab.tsx  ← section list + dirty state
    role-section-card.tsx     ← single menu section card + table
    user-permissions-tab.tsx  ← menu dropdown + user table
    user-section-card.tsx     ← user table with pagination
    permissions-header.tsx    ← sticky header (icon, title, save btn, badge)
    permission-checkbox.tsx   ← checkbox with dirty visual states
    dirty-badge.tsx           ← animated "N รายการ" badge
```

---

## State Management

All dirty state is **local component state** (no Zustand store needed). The data flow:

1. Page loads → fetch role permissions matrix from API → store as `original` Map
2. User toggles checkbox → update `current` Map
3. Dirty = diff between `current` and `original`
4. Save → PATCH/PUT API with only changed values → on success, set `original = current`

---

## API Assumptions

| Endpoint | Method | Description |
|---|---|---|
| `GET /permissions/roles` | GET | Returns role×menu×action matrix |
| `PATCH /permissions/roles` | PATCH | Updates changed role permissions |
| `GET /permissions/users?menu=<id>` | GET | Returns user×action list for a menu |
| `PATCH /permissions/users` | PATCH | Updates changed user permissions |

Exact shape TBD — align with backend team before implementation.

---

## Out of Scope

- Creating or deleting roles/users (handled by existing Roles/Users pages)
- Permission inheritance visualization
- Audit log of who changed what (separate Audit page)
