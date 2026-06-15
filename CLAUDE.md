# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

---

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint (v9 flat config)

npx shadcn@latest add <component>   # Add new shadcn/ui component to components/ui/
```

Environment: create `.env.local` with `API_URL=http://localhost:3001`

---

## What this is

A Next.js 16 (App Router) management dashboard — workspace for teams, projects, audit logs, admin, calendar, documents, and monitoring. Thai-language enterprise app with JWT auth, real-time via Socket.io, and a Three.js/GSAP landing page.

**Full conventions, patterns, and do/don'ts → [SKILL.md](./SKILL.md)**
**UI component patterns (Card, Button, Table, etc.) → [DESIGN.md](./DESIGN.md)**

---

## Route Architecture

```
app/
  page.tsx                  ← Landing page (public, 3D hero)
  login/                    ← Auth pages (public)
  (management)/             ← Route group: all protected dashboard pages
    dashboard/
    account/
    admin/users|teams/
    security/
    ...more features
  api/
    _proxy/[...path]/       ← Proxies all API calls to process.env.API_URL
    visitor/                ← Analytics endpoints
```

`middleware.ts` guards `/dashboard/*` and `/monitoring/*` — unauthenticated requests redirect to `/login?next=...`. Authenticated users on `/` or `/login` redirect to `/dashboard`.

---

## Auth Architecture

JWT with access token in-memory only, refresh token in HTTP-only cookie (`a_dxc_rt`).

1. `loginAction` (Server Action in `lib/auth/actions.ts`) — calls backend, sets cookie, hydrates Zustand
2. Access token lives in `auth-store` (Zustand) — never touches localStorage or cookies
3. `apiFetch<T>()` (`lib/auth/client.ts`) — all client-side API calls; auto-injects Bearer header, auto-refreshes on 401
4. `AuthProvider` (`lib/auth/AuthProvider.tsx`) — schedules proactive refresh 60s before expiry; single-flight guard prevents concurrent refreshes
5. Server-side auth calls use direct `fetch` to `AUTH_CONFIG.apiBaseUrl` (bypasses the proxy)

---

## API Layer

All client API calls go through `apiFetch<T>("/api/endpoint")` which hits the Next.js proxy route (`/api/_proxy/*`) which rewrites to the backend. Response envelope: `{ status: "OK", data?: T, message?, code? }`.

Feature-specific API modules live in `lib/api/<feature>.ts`. Shared types in `lib/<feature>/types.ts`.

---

## State Management

Zustand v5 stores in `lib/stores/`. All exported via barrel at `lib/store.ts`.

Always use selectors — `useAuthStore((s) => s.user)` not `useAuthStore().user`.

Key stores: `auth-store` (user + expiry, persisted), `menu-store` (nav + permissions), `notification-store` (toast queue), `sidebar-ui-store`, `chat-ui-store`.

---

## Component Conventions

- `components/ui/` — shadcn-only, never hand-write here, never add logic
- `components/management/` — layout shell (sidebar, header, nav)
- `components/<feature>.tsx` — shared feature components

Always use `cn()` from `@/lib/utils` for class merging. Semantic colors only (`text-primary`, `text-muted-foreground`) — never hardcode (`text-blue-500`). Tailwind v4: no `tailwind.config.ts`, all theme in `app/globals.css` with `@theme`.

Default to Server Components — add `"use client"` only when needed (hooks, browser APIs, Zustand).

---

## 3D & Animation

Heavy imports (Three.js, Spline, GSAP) always use dynamic imports with `ssr: false`. Animation priority: CSS → Framer Motion → GSAP → @react-three/fiber (lightest to heaviest).

---

## Fonts

`app/fonts.ts` loads **Anuphan** (Thai) and **Geist** (Latin/code) as CSS variables. Use `font-sans` — already configured.
