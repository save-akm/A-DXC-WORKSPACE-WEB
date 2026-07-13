// lib/apphub/types.ts
//
// Shared types for the App Hub feature — public landing grid, per-user
// favorites, and the admin CRUD surfaces (categories + apps).

export type EmbedType = 'LINK' | 'IFRAME';

// ── Generic API envelope ───────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  status: string;
  message?: string;
  code?: string;
  timestamp?: string;
  data: T;
}

// ── Public — landing page (GET /apps, GET /apps/popular) ────────────────────────

/** An app as returned inside a category on the public landing endpoint. */
export interface PublicApp {
  id: string;
  name: string;
  url: string;
  icon: string | null;
  description: string | null;
  openInNewTab: boolean;
  embedType: EmbedType;
  clickCount: number;
}

/** A category with its active apps (GET /apps). */
export interface PublicCategory {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  apps: PublicApp[];
}

/** A flat popular app across all categories (GET /apps/popular). */
export interface PopularApp extends PublicApp {
  category: { id: string; name: string };
}

/** Sort modes accepted by GET /apps. */
export type AppsSort = 'popular' | 'order';

// ── Favorites — current user (requires auth) ────────────────────────────────────

/** A favorited app (GET /apps/favorites, PUT /apps/favorites/reorder). */
export interface FavoriteApp {
  id: string;
  name: string;
  url: string;
  icon: string | null;
  description: string | null;
  openInNewTab: boolean;
  embedType: EmbedType;
  isActive: boolean;
  category: { id: string; name: string };
  favoritedAt: string;
  sortOrder: number;
}

/** The favorite record returned by POST /apps/:id/favorite. */
export interface FavoriteRecord {
  id: string;
  userId: string;
  appId: string;
  sortOrder: number;
  createdAt: string;
}

// ── Admin — categories (requires permission `apps`) ─────────────────────────────

export interface AdminCategory {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { apps: number };
}

export interface CreateCategoryInput {
  name: string;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

// ── Admin — apps (requires permission `apps`) ───────────────────────────────────

export interface AdminApp {
  id: string;
  name: string;
  url: string;
  categoryId: string;
  icon: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  openInNewTab: boolean;
  embedType: EmbedType;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
}

export interface CreateAppInput {
  name: string;
  url: string;
  categoryId: string;
  icon?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  openInNewTab?: boolean;
  embedType?: EmbedType;
}

export type UpdateAppInput = Partial<CreateAppInput>;
