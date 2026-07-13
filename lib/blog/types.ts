// lib/blog/types.ts
//
// Shared types for the "Share Know-how" blog feature — the knowledge base under
// /knowledge/posts and /knowledge/tags. All calls require auth + the `blog`
// menu permission (VIEW / CREATE / UPDATE / DELETE).

// ── Generic API envelope ────────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  status: string;
  message?: string;
  code?: string;
  timestamp?: string;
  data: T;
}

// ── Enums ───────────────────────────────────────────────────────────────────────

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type PostVisibility = 'PUBLIC' | 'INTERNAL' | 'PRIVATE';

export const POST_STATUSES: PostStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
export const POST_VISIBILITIES: PostVisibility[] = ['PUBLIC', 'INTERNAL', 'PRIVATE'];

// ── Entities ──────────────────────────────────────────────────────────────────────

/** Author subset returned inline on every post. */
export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
  employeeId: string;
}

/** A tag. `_count.posts` only present on the tag-list endpoint. */
export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
  _count?: { posts: number };
}

/**
 * A knowledge post. `content` is only present on detail/create/update/publish
 * responses — the list endpoint omits it. Everything else is always returned.
 */
export interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImageUrl: string | null;
  content?: string;
  status: PostStatus;
  isPinned: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  /** Whether the current user has bookmarked this post (list + detail). */
  isBookmarked: boolean;
  viewCount: number;
  readTimeMinutes: number;
  visibility: PostVisibility;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: PostAuthor;
  updatedBy?: PostAuthor;
  /** Set when isVerified === true — who certified the content and when. */
  verifiedAt?: string | null;
  verifiedById?: string | null;
  verifiedBy?: PostAuthor | null;
  tags: Tag[];
  _count: {
    comments: number;
    reactions: number;
    bookmarks: number;
  };
}

// ── List query + response ───────────────────────────────────────────────────────

export interface PostListParams {
  page?: number;
  limit?: number;
  search?: string;
  tagId?: string;
  tagSlug?: string;
  authorId?: string;
  mine?: boolean;
  status?: PostStatus;
  isPinned?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
  visibility?: PostVisibility;
  orderBy?: 'publishedAt' | 'viewCount' | 'reactions' | 'comments';
  order?: 'asc' | 'desc';
}

export interface PaginatedPosts {
  data: Post[];
  total: number;
  page: number;
  limit: number;
}

/** Aggregate counts for the feed stat cards (GET /knowledge/stats). */
export interface BlogStats {
  total: number;
  featured: number;
  mine: number;
}

// ── Mutations ─────────────────────────────────────────────────────────────────────

export interface CreatePostInput {
  title: string;
  content: string;
  summary?: string | null;
  visibility?: PostVisibility;
  tagIds?: string[];
}

/**
 * PATCH body — every field optional, min 1. `isPinned/isFeatured/isVerified`
 * are admin-only (blog:UPDATE). Cover image is managed via POST/DELETE …/cover.
 */
export interface UpdatePostInput {
  title?: string;
  content?: string;
  summary?: string | null;
  visibility?: PostVisibility;
  tagIds?: string[];
  isPinned?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
}

export interface UploadCoverResult {
  coverImageUrl: string;
  post: Post;
}

export interface ViewResult {
  recorded: boolean;
  viewCount: number;
}

export interface CreateTagInput {
  name: string;
  description?: string | null;
  color?: string | null;
}

export interface UpdateTagInput {
  name?: string;
  description?: string | null;
  color?: string | null;
  isActive?: boolean;
}

// ── Engagement: Comments ────────────────────────────────────────────────────────

/** Author subset on comments — same shape as PostAuthor. */
export type CommentUser = PostAuthor;

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
  replies: Comment[];
}

/** Flat comment returned from POST/PATCH — no nested replies. */
export type FlatComment = Omit<Comment, 'replies'>;

export interface CreateCommentInput {
  content: string;
  parentId?: string;
}

export interface UpdateCommentInput {
  content: string;
}

// ── Engagement: Reactions ─────────────────────────────────────────────────────────

export type ReactionType = 'LIKE' | 'USEFUL' | 'AWESOME' | 'SMART' | 'WORKED';

export const REACTION_TYPES: ReactionType[] = ['LIKE', 'USEFUL', 'AWESOME', 'SMART', 'WORKED'];

export const REACTION_LABELS: Record<ReactionType, string> = {
  LIKE: 'ถูกใจ',
  USEFUL: 'มีประโยชน์',
  AWESOME: 'เจ๋งมาก',
  SMART: 'ฉลาด',
  WORKED: 'ใช้ได้จริง',
};

export interface ReactionSummary {
  total: number;
  counts: Record<ReactionType, number>;
  myReaction: ReactionType | null;
  types: ReactionType[];
}

// ── Engagement: Bookmarks ─────────────────────────────────────────────────────────

export interface Bookmark {
  id: string;
  bookmarkedAt: string;
  /** Same shape as a feed list item; `isBookmarked` is always true here. */
  post: Post;
}

export interface BookmarkListParams {
  page?: number;
  limit?: number;
}

export interface PaginatedBookmarks {
  data: Bookmark[];
  total: number;
  page: number;
  limit: number;
}

export interface ToggleBookmarkResult {
  bookmarked: boolean;
}

// ── Engagement: Attachments ─────────────────────────────────────────────────────

export type AttachmentFileType =
  | 'IMAGE' | 'PDF' | 'XLSX' | 'CSV' | 'DOCX' | 'TXT' | 'ZIP' | 'OTHER';

export interface Attachment {
  id: string;
  postId: string;
  fileName: string;
  fileUrl: string;
  fileType: AttachmentFileType;
  fileSizeBytes: number;
  uploadedAt: string;
}

/** Human-readable file size (102400 → "100 KB"). */
export function fmtFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes % 1024 >= 100 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


/** Prefer nickname, fall back to full name. */
export function authorDisplayName(a: Pick<PostAuthor, 'firstName' | 'lastName' | 'nickname'>): string {
  return a.nickname?.trim() || `${a.firstName} ${a.lastName}`.trim();
}

export function authorInitials(a: Pick<PostAuthor, 'firstName' | 'lastName'>): string {
  return `${a.firstName.charAt(0)}${a.lastName.charAt(0)}`.trim() || '?';
}

const AVATAR_COLORS = [
  'bg-indigo-600', 'bg-violet-600', 'bg-sky-600', 'bg-teal-600',
  'bg-emerald-600', 'bg-pink-600', 'bg-rose-600', 'bg-amber-600',
];

/** Deterministic avatar color from a stable seed (user id). */
export function avatarColorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/** Turn raw backend / validation errors into friendly Thai messages. */
export function humanizeBlogError(err: unknown): string {
  const raw = (err as Error)?.message?.trim() ?? '';
  const code = (err as { code?: string })?.code;
  switch (code) {
    case 'FORBIDDEN': return 'คุณไม่มีสิทธิ์ดำเนินการนี้';
    case 'NOT_FOUND': return 'ไม่พบบทความนี้';
    case 'CONFLICT': return 'มีแท็กชื่อนี้อยู่แล้ว';
    case 'INVALID_STATUS': return 'ไม่สามารถเผยแพร่บทความที่เก็บถาวรแล้ว';
    case 'TAG_REQUIRED': return 'กรุณาเลือกแท็กอย่างน้อย 1 แท็กก่อนเผยแพร่';
    case 'INVALID_TAG': return 'แท็กไม่ถูกต้อง';
    case 'NOTHING_TO_UPDATE': return 'ไม่มีการเปลี่ยนแปลง';
    default: break;
  }
  if (!raw) return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
  return raw;
}
