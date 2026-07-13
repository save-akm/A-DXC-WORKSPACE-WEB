'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileCard } from '@/components/profile/profile-card';
import { ReviewSection } from '@/components/profile/review-section';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  fetchUserProfileRequest,
  likeUserRequest,
  unlikeUserRequest,
} from '@/lib/api/profile';
import type { UserProfileData, UserProfileResponse } from '@/lib/api/profile';

const EMPTY_PROFILE: UserProfileData = {
  id: '', userId: '',
  bio: null, coverUrl: null, highlight: null,
  isActive: true, likeCount: 0, isLiked: false,
  createdAt: '', updatedAt: '',
};

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id ?? '');

  const [data, setData] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState<{ average: number | null; total: number } | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchUserProfileRequest(userId)
      .then(setData)
      .catch(() => { /* handle gracefully */ })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleLike = useCallback(async () => {
    if (!data?.profile) return;
    const fn = data.profile.isLiked ? unlikeUserRequest : likeUserRequest;
    const state = await fn(userId);
    setData((prev): UserProfileResponse | null => {
      if (!prev?.profile) return prev;
      return { ...prev, profile: { ...prev.profile, ...state } };
    });
  }, [data, userId]);

  const handleStatsChange = useCallback((average: number | null, total: number) => {
    setReviewStats({ average, total });
  }, []);

  const isOwn = userId === currentUserId;

  if (loading) {
    return (
      <div className="page-shell space-y-4">
        <div className="h-48 animate-pulse rounded-2xl border border-border bg-card/40" />
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card/40" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-shell flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-muted-foreground">ไม่พบ Profile ของผู้ใช้นี้</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          ย้อนกลับ
        </Button>
      </div>
    );
  }

  const resolvedProfile: UserProfileData = data.profile ?? EMPTY_PROFILE;

  return (
    <div className="page-shell space-y-4">
      {/* Back button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="-ml-1 w-fit text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        ย้อนกลับ
      </Button>

      {/* Profile card */}
      <ProfileCard
        user={data.user}
        profile={resolvedProfile}
        skills={data.skills}
        reviewStats={reviewStats ?? undefined}
        postCount={data.postCount}
        totalPostLikes={data.totalPostLikes}
        isOwn={isOwn}
        onLike={isOwn ? undefined : handleLike}
      />

      {/* Reviews */}
      <ReviewSection
        targetUserId={userId}
        currentUserId={currentUserId}
        isOwn={isOwn}
        onStatsChange={handleStatsChange}
      />
    </div>
  );
}
