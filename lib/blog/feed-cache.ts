import type { Post, Tag, PostStatus } from './types';

export type FeedParams = {
  page: number;
  debounced: string;
  activeTag: string | null;
  tab: 'all' | 'mine';
  statusFilter: 'All' | PostStatus;
  sort: string;
  verifiedOnly: boolean;
};

export type BlogStats = { total: number; mine: number; featured: number };

type FeedSnapshot = {
  params: FeedParams;
  posts: Post[];
  total: number;
};

/** In-memory cache survives client navigations within the same tab session. */
let feedSnapshot: FeedSnapshot | null = null;
let tagsSnapshot: Tag[] | null = null;
let statsSnapshot: BlogStats | null = null;

export const DEFAULT_FEED_PARAMS: FeedParams = {
  page: 1,
  debounced: '',
  activeTag: null,
  tab: 'all',
  statusFilter: 'All',
  sort: 'newest',
  verifiedOnly: false,
};

function feedParamsKey(params: FeedParams): string {
  return JSON.stringify(params);
}

export function readFeedSnapshot(params: FeedParams): FeedSnapshot | null {
  if (!feedSnapshot) return null;
  if (feedParamsKey(feedSnapshot.params) !== feedParamsKey(params)) return null;
  return feedSnapshot;
}

export function writeFeedSnapshot(params: FeedParams, posts: Post[], total: number) {
  feedSnapshot = { params, posts, total };
}

export function readTagsSnapshot(): Tag[] | null {
  return tagsSnapshot;
}

export function writeTagsSnapshot(tags: Tag[]) {
  tagsSnapshot = tags;
}

export function readStatsSnapshot(): BlogStats | null {
  return statsSnapshot;
}

export function writeStatsSnapshot(stats: BlogStats) {
  statsSnapshot = stats;
}
