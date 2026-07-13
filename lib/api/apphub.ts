import { apiFetch } from '@/lib/auth/client';
import type {
  ApiEnvelope,
  PublicCategory,
  PopularApp,
  FavoriteApp,
  FavoriteRecord,
  AppsSort,
  AdminCategory,
  AdminApp,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateAppInput,
  UpdateAppInput,
} from '@/lib/apphub/types';

// ── Public — landing page ───────────────────────────────────────────────────────

/** GET /apps — active categories + apps. `sort` defaults to "popular" on the API. */
export async function fetchApps(sort?: AppsSort): Promise<PublicCategory[]> {
  const qs = sort ? `?sort=${sort}` : '';
  const res = await apiFetch<ApiEnvelope<PublicCategory[]>>(`/apps${qs}`, { auth: false });
  return res.data;
}

/** GET /apps/popular — top N apps flattened across categories (limit 1–50, default 10). */
export async function fetchPopularApps(limit?: number): Promise<PopularApp[]> {
  const qs = limit ? `?limit=${limit}` : '';
  const res = await apiFetch<ApiEnvelope<PopularApp[]>>(`/apps/popular${qs}`, { auth: false });
  return res.data;
}

/** POST /apps/:id/click — increment the popularity counter (rate-limited server-side). */
export async function trackAppClick(id: string): Promise<{ id: string; clickCount: number }> {
  const res = await apiFetch<ApiEnvelope<{ id: string; clickCount: number }>>(
    `/apps/${id}/click`,
    { method: 'POST', auth: false },
  );
  return res.data;
}

// ── Favorites — current user (requires auth) ────────────────────────────────────

/** GET /apps/favorites — the current user's favorites in their saved order. */
export async function fetchFavorites(): Promise<FavoriteApp[]> {
  const res = await apiFetch<ApiEnvelope<FavoriteApp[]>>('/apps/favorites');
  return res.data;
}

/** POST /apps/:id/favorite — append an app to favorites. */
export async function addFavorite(id: string): Promise<FavoriteRecord> {
  const res = await apiFetch<ApiEnvelope<FavoriteRecord>>(`/apps/${id}/favorite`, {
    method: 'POST',
  });
  return res.data;
}

/** DELETE /apps/:id/favorite — remove an app from favorites. */
export async function removeFavorite(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`/apps/${id}/favorite`, { method: 'DELETE' });
}

/** PUT /apps/favorites/reorder — persist a new favorite ordering. */
export async function reorderFavorites(appIds: string[]): Promise<FavoriteApp[]> {
  const res = await apiFetch<ApiEnvelope<FavoriteApp[]>>('/apps/favorites/reorder', {
    method: 'PUT',
    body: { appIds },
  });
  return res.data;
}

// ── Admin — categories (requires permission `apps`) ─────────────────────────────

/** GET /admin/app-categories — all categories incl. inactive, with app counts. */
export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const res = await apiFetch<ApiEnvelope<AdminCategory[]>>('/admin/app-categories');
  return res.data;
}

export async function createCategory(input: CreateCategoryInput): Promise<AdminCategory> {
  const res = await apiFetch<ApiEnvelope<AdminCategory>>('/admin/app-categories', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<AdminCategory> {
  const res = await apiFetch<ApiEnvelope<AdminCategory>>(`/admin/app-categories/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`/admin/app-categories/${id}`, { method: 'DELETE' });
}

// ── Admin — apps (requires permission `apps`) ───────────────────────────────────

/** GET /admin/apps — all apps incl. inactive, ordered by category + sortOrder. */
export async function fetchAdminApps(): Promise<AdminApp[]> {
  const res = await apiFetch<ApiEnvelope<AdminApp[]>>('/admin/apps');
  return res.data;
}

export async function fetchAdminApp(id: string): Promise<AdminApp> {
  const res = await apiFetch<ApiEnvelope<AdminApp>>(`/admin/apps/${id}`);
  return res.data;
}

export async function createApp(input: CreateAppInput): Promise<AdminApp> {
  const res = await apiFetch<ApiEnvelope<AdminApp>>('/admin/apps', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function updateApp(id: string, input: UpdateAppInput): Promise<AdminApp> {
  const res = await apiFetch<ApiEnvelope<AdminApp>>(`/admin/apps/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

export async function deleteApp(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`/admin/apps/${id}`, { method: 'DELETE' });
}
