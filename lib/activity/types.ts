// lib/activity/types.ts — shared types for public landing + admin CRUD.

export interface ApiEnvelope<T> {
  status: string;
  message?: string;
  code?: string;
  timestamp?: string;
  data: T;
}

export type ActivityStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED';

export const ACTIVITY_STATUSES: ActivityStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED'];

export interface ActivityTag {
  id: string;
  name: string;
}

export interface ActivityAuthor {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
  employeeId: string;
}

export interface ActivityImage {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

/** List item shape — public + admin list + joined activities. */
export interface Activity {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  /** Derived by the backend from the first gallery image (lowest sortOrder). */
  coverImageUrl: string | null;
  location: string | null;
  eventStartAt: string;
  eventEndAt: string;
  status: ActivityStatus;
  maxParticipants: number | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  tags: ActivityTag[];
  attendeeCount: number;
  createdBy: ActivityAuthor | null;
}

/** Detail — list item + gallery images (+ isJoined on public when authed). */
export interface ActivityDetail extends Activity {
  images: ActivityImage[];
  isJoined?: boolean;
}

export interface JoinedActivity extends Activity {
  joinedAt: string;
}

export interface ActivityAttendance {
  id: string;
  joinedAt: string;
  activity: Activity;
}

export interface ActivityAttendee {
  id: string;
  joinedAt: string;
  user: ActivityAuthor;
}

export interface FeaturedSlots {
  max: number;
  used: number;
  remaining: number;
}

export interface CreateActivityInput {
  name: string;
  eventStartAt: string;
  eventEndAt: string;
  description?: string | null;
  icon?: string | null;
  location?: string | null;
  status?: ActivityStatus;
  maxParticipants?: number | null;
  isActive?: boolean;
  isFeatured?: boolean;
  /** Replaces the full tag set on PATCH — load options from GET /activity-tags. */
  tagIds?: string[];
}

export type UpdateActivityInput = Partial<CreateActivityInput>;

export interface UploadActivityImageOptions {
  caption?: string;
  sortOrder?: number;
}

export interface UpdateActivityImageInput {
  caption?: string | null;
  sortOrder?: number;
}

export interface CreateActivityTagInput {
  name: string;
}

export interface ActivityAdminFilters {
  status?: ActivityStatus;
  tagId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  limit?: number;
}

export interface ActivityPublicFilters {
  status?: ActivityStatus;
  tagId?: string;
}

export const ACTIVITY_IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const LANDING_GRID_SPANS = [
  'lg:col-span-2 lg:row-span-2',
  '',
  '',
  'lg:col-span-2',
  '',
] as const;

export const LANDING_GRADIENTS = [
  'from-violet-600 via-purple-600 to-fuchsia-600',
  'from-indigo-600 via-violet-600 to-purple-600',
  'from-purple-600 via-violet-600 to-indigo-600',
  'from-fuchsia-600 via-purple-600 to-violet-600',
  'from-violet-700 via-fuchsia-600 to-purple-600',
] as const;
