import { apiFetch } from '@/lib/auth/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type {
  ApiEnvelope,
  Post,
  PaginatedPosts,
  PostListParams,
  BlogStats,
  CreatePostInput,
  UpdatePostInput,
  ViewResult,
  Tag,
  CreateTagInput,
  UpdateTagInput,
  Comment,
  FlatComment,
  CreateCommentInput,
  UpdateCommentInput,
  ReactionSummary,
  ReactionType,
  PaginatedBookmarks,
  BookmarkListParams,
  ToggleBookmarkResult,
  Attachment,
  UploadCoverResult,
} from '@/lib/blog/types';

// ── Posts ─────────────────────────────────────────────────────────────────────────

/** Serialize list params into a query string, skipping empty values. */
function buildPostQuery(params?: PostListParams): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.search?.trim()) qs.set('search', params.search.trim());
  if (params.tagId) qs.set('tagId', params.tagId);
  if (params.tagSlug) qs.set('tagSlug', params.tagSlug);
  if (params.authorId) qs.set('authorId', params.authorId);
  if (params.mine) qs.set('mine', 'true');
  if (params.status) qs.set('status', params.status);
  if (typeof params.isPinned === 'boolean') qs.set('isPinned', String(params.isPinned));
  if (typeof params.isFeatured === 'boolean') qs.set('isFeatured', String(params.isFeatured));
  if (typeof params.isVerified === 'boolean') qs.set('isVerified', String(params.isVerified));
  if (params.visibility) qs.set('visibility', params.visibility);
  if (params.orderBy) qs.set('orderBy', params.orderBy);
  if (params.order) qs.set('order', params.order);
  const q = qs.toString();
  return q ? `?${q}` : '';
}

/** Encode slug once for a URL path segment (avoids double-encoding). */
function encodeSlugSegment(slug: string): string {
  let raw = slug.trim();
  try {
    if (raw.includes('%')) raw = decodeURIComponent(raw);
  } catch { /* keep raw */ }
  return encodeURIComponent(raw.normalize('NFC'));
}

/** GET /knowledge/posts — paginated list (no content). blog:VIEW */
export async function fetchPosts(params?: PostListParams): Promise<PaginatedPosts> {
  const res = await apiFetch<ApiEnvelope<PaginatedPosts>>(`/knowledge/posts${buildPostQuery(params)}`);
  return res.data;
}

/** GET /knowledge/posts/slug/:slug — a single post with content. blog:VIEW */
export async function fetchPostBySlug(slug: string): Promise<Post> {
  const res = await apiFetch<ApiEnvelope<Post>>(`/knowledge/posts/slug/${encodeSlugSegment(slug)}`);
  return res.data;
}

/** GET /knowledge/posts/:id — a single post with content (edit form). blog:VIEW */
export async function fetchPostById(id: string): Promise<Post> {
  const res = await apiFetch<ApiEnvelope<Post>>(`/knowledge/posts/${id}`);
  return res.data;
}

/**
 * Resolve a post by slug. The backend returns DRAFT/ARCHIVED via the slug
 * endpoint for the owner or an admin (others get 404), so this is now a thin
 * wrapper kept for call-site clarity.
 */
export async function fetchPostResolvable(slug: string): Promise<Post> {
  return fetchPostBySlug(slug);
}

/** GET /knowledge/stats — aggregate feed counts in one round. blog:VIEW */
export async function fetchBlogStats(): Promise<BlogStats> {
  const res = await apiFetch<ApiEnvelope<BlogStats>>('/knowledge/stats');
  return res.data;
}

/** POST /knowledge/posts — create draft. blog:CREATE */
export async function createPost(input: CreatePostInput): Promise<Post> {
  const res = await apiFetch<ApiEnvelope<Post>>('/knowledge/posts', { method: 'POST', body: input });
  return res.data;
}

/** PATCH /knowledge/posts/:id — partial update (min 1 field). blog:CREATE + owner/admin */
export async function updatePost(id: string, input: UpdatePostInput): Promise<Post> {
  const res = await apiFetch<ApiEnvelope<Post>>(`/knowledge/posts/${id}`, { method: 'PATCH', body: input });
  return res.data;
}

/** POST /knowledge/posts/:id/publish — DRAFT → PUBLISHED (idempotent). */
export async function publishPost(id: string): Promise<Post> {
  const res = await apiFetch<ApiEnvelope<Post>>(`/knowledge/posts/${id}/publish`, { method: 'POST' });
  return res.data;
}

/** POST /knowledge/posts/:id/archive — → ARCHIVED (no-op if already). editPost */
export async function archivePost(id: string): Promise<Post> {
  const res = await apiFetch<ApiEnvelope<Post>>(`/knowledge/posts/${id}/archive`, { method: 'POST' });
  return res.data;
}

/** POST /knowledge/posts/:id/unpublish — PUBLISHED → DRAFT. editPost */
export async function unpublishPost(id: string): Promise<Post> {
  const res = await apiFetch<ApiEnvelope<Post>>(`/knowledge/posts/${id}/unpublish`, { method: 'POST' });
  return res.data;
}

/**
 * POST /knowledge/posts/:id/unarchive — ARCHIVED → DRAFT. editPost
 * Other statuses return INVALID_STATUS. Publish still rejects ARCHIVED, so the
 * restore path is unarchive → edit → publish.
 */
export async function unarchivePost(id: string): Promise<Post> {
  const res = await apiFetch<ApiEnvelope<Post>>(`/knowledge/posts/${id}/unarchive`, { method: 'POST' });
  return res.data;
}

/** DELETE /knowledge/posts/:id — soft delete. blog:CREATE + owner/admin with DELETE */
export async function deletePost(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`/knowledge/posts/${id}`, { method: 'DELETE' });
}

/** POST /knowledge/posts/:id/view — record a read (deduped 24h per user). */
export async function recordPostView(id: string): Promise<ViewResult> {
  const res = await apiFetch<ApiEnvelope<ViewResult>>(`/knowledge/posts/${id}/view`, { method: 'POST' });
  return res.data;
}

// ── Tags ─────────────────────────────────────────────────────────────────────────

/** GET /knowledge/tags — list tags (activeOnly defaults to true server-side). */
export async function fetchTags(activeOnly = true): Promise<Tag[]> {
  const q = activeOnly ? '' : '?activeOnly=false';
  const res = await apiFetch<ApiEnvelope<Tag[]>>(`/knowledge/tags${q}`);
  return res.data;
}

/** POST /knowledge/tags — create tag. blog:UPDATE (admin) */
export async function createTag(input: CreateTagInput): Promise<Tag> {
  const res = await apiFetch<ApiEnvelope<Tag>>('/knowledge/tags', { method: 'POST', body: input });
  return res.data;
}

/** PATCH /knowledge/tags/:id — update tag. blog:UPDATE (admin) */
export async function updateTag(id: string, input: UpdateTagInput): Promise<Tag> {
  const res = await apiFetch<ApiEnvelope<Tag>>(`/knowledge/tags/${id}`, { method: 'PATCH', body: input });
  return res.data;
}

/** DELETE /knowledge/tags/:id — hard delete (cascades off posts). blog:DELETE (admin) */
export async function deleteTag(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`/knowledge/tags/${id}`, { method: 'DELETE' });
}

// ── Comments ──────────────────────────────────────────────────────────────────────

/** GET /knowledge/posts/:postId/comments — nested tree. blog:VIEW */
export async function fetchComments(postId: string): Promise<Comment[]> {
  const res = await apiFetch<ApiEnvelope<Comment[]>>(`/knowledge/posts/${postId}/comments`);
  return res.data;
}

/** POST /knowledge/posts/:postId/comments — create comment/reply. blog:VIEW */
export async function createComment(postId: string, input: CreateCommentInput): Promise<FlatComment> {
  const res = await apiFetch<ApiEnvelope<FlatComment>>(`/knowledge/posts/${postId}/comments`, {
    method: 'POST',
    body: input,
  });
  return res.data;
}

/** PATCH /knowledge/comments/:id — edit own comment (or admin). blog:VIEW */
export async function updateComment(id: string, input: UpdateCommentInput): Promise<FlatComment> {
  const res = await apiFetch<ApiEnvelope<FlatComment>>(`/knowledge/comments/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return res.data;
}

/** DELETE /knowledge/comments/:id — soft delete. blog:VIEW + owner/admin */
export async function deleteComment(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`/knowledge/comments/${id}`, { method: 'DELETE' });
}

// ── Reactions ─────────────────────────────────────────────────────────────────────

/** GET /knowledge/posts/:postId/reactions — summary counts + mine. blog:VIEW */
export async function fetchReactions(postId: string): Promise<ReactionSummary> {
  const res = await apiFetch<ApiEnvelope<ReactionSummary>>(`/knowledge/posts/${postId}/reactions`);
  return res.data;
}

/** POST /knowledge/posts/:postId/reactions — toggle reaction type. blog:VIEW */
export async function toggleReaction(postId: string, type: ReactionType): Promise<ReactionSummary> {
  const res = await apiFetch<ApiEnvelope<ReactionSummary>>(`/knowledge/posts/${postId}/reactions`, {
    method: 'POST',
    body: { type },
  });
  return res.data;
}

// ── Bookmarks ─────────────────────────────────────────────────────────────────────

function buildBookmarkQuery(params?: BookmarkListParams): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const q = qs.toString();
  return q ? `?${q}` : '';
}

/** GET /knowledge/bookmarks — paginated saved posts. blog:VIEW */
export async function fetchBookmarks(params?: BookmarkListParams): Promise<PaginatedBookmarks> {
  const res = await apiFetch<ApiEnvelope<PaginatedBookmarks>>(
    `/knowledge/bookmarks${buildBookmarkQuery(params)}`,
  );
  return res.data;
}

/** POST /knowledge/posts/:postId/bookmarks — toggle bookmark. blog:VIEW */
export async function toggleBookmark(postId: string): Promise<ToggleBookmarkResult> {
  const res = await apiFetch<ApiEnvelope<ToggleBookmarkResult>>(
    `/knowledge/posts/${postId}/bookmarks`,
    { method: 'POST' },
  );
  return res.data;
}

// ── Attachments ───────────────────────────────────────────────────────────────────

/** GET /knowledge/posts/:postId/attachments — list files. blog:VIEW */
export async function fetchAttachments(postId: string): Promise<Attachment[]> {
  const res = await apiFetch<ApiEnvelope<Attachment[]>>(`/knowledge/posts/${postId}/attachments`);
  return res.data;
}

/** POST /knowledge/posts/:postId/attachments — multipart upload. blog:CREATE + author/admin */
export async function uploadAttachment(postId: string, file: File): Promise<Attachment> {
  const token = useAuthStore.getState().accessToken;
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`/api/_proxy/knowledge/posts/${postId}/attachments`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
    cache: 'no-store',
  });

  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    try {
      const data = await res.json() as { message?: string; code?: string };
      message = data?.message ?? message;
      code = data?.code;
    } catch { /* non-JSON */ }
    const err = new Error(message) as Error & { status: number; code?: string };
    err.status = res.status;
    err.code = code;
    throw err;
  }

  const envelope = await res.json() as ApiEnvelope<Attachment>;
  return envelope.data;
}

/** DELETE /knowledge/attachments/:id — remove file. blog:CREATE + author/admin */
export async function deleteAttachment(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: true }>>(`/knowledge/attachments/${id}`, { method: 'DELETE' });
}

// ── Cover image ───────────────────────────────────────────────────────────────────

/** POST /knowledge/posts/:postId/cover — multipart upload (field: cover). blog:CREATE + author/admin */
export async function uploadPostCover(postId: string, file: File): Promise<UploadCoverResult> {
  const token = useAuthStore.getState().accessToken;
  const form = new FormData();
  form.append('cover', file);

  const res = await fetch(`/api/_proxy/knowledge/posts/${postId}/cover`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
    cache: 'no-store',
  });

  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    try {
      const data = await res.json() as { message?: string; code?: string };
      message = data?.message ?? message;
      code = data?.code;
    } catch { /* non-JSON */ }
    const err = new Error(message) as Error & { status: number; code?: string };
    err.status = res.status;
    err.code = code;
    throw err;
  }

  const envelope = await res.json() as ApiEnvelope<UploadCoverResult>;
  return envelope.data;
}

/** DELETE /knowledge/posts/:postId/cover — remove cover. blog:CREATE + author/admin */
export async function deletePostCover(postId: string): Promise<Post> {
  const res = await apiFetch<ApiEnvelope<Post>>(`/knowledge/posts/${postId}/cover`, { method: 'DELETE' });
  return res.data;
}
