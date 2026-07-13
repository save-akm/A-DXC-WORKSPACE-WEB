'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRoleGuard } from '@/lib/hooks/use-role-guard';
import { PageHeader } from '@/components/management/page-header';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ProfileCard } from '@/components/profile/profile-card';
import { ReviewSection } from '@/components/profile/review-section';
import { AccountForm } from './components/account-form';
import { ProfileForm } from './components/profile-form';
import { fetchMyProfileRequest } from '@/lib/api/profile';
import type { UserProfileData, UserProfileResponse, UserSkill } from '@/lib/api/profile';

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const { isElevated } = useRoleGuard();
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [reviewStats, setReviewStats] = useState<{ average: number | null; total: number } | null>(null);

  useEffect(() => {
    fetchMyProfileRequest()
      .then(setProfileData)
      .catch(() => { /* profile may not exist yet */ });
  }, []);

  const handleProfileSaved = useCallback((updated: UserProfileData) => {
    setProfileData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updated } : updated,
      };
    });
  }, []);

  const handleCoverUploaded = useCallback((coverUrl: string) => {
    setProfileData((prev) => {
      if (!prev) return null;
      return { ...prev, profile: prev.profile ? { ...prev.profile, coverUrl } : null };
    });
  }, []);

  const handleCoverDeleted = useCallback(() => {
    setProfileData((prev) => {
      if (!prev) return null;
      return { ...prev, profile: prev.profile ? { ...prev.profile, coverUrl: null } : null };
    });
  }, []);

  const handleSkillsSaved = useCallback((skills: UserSkill[]) => {
    setProfileData((prev) => prev ? { ...prev, skills } : null);
  }, []);

  const handleStatsChange = useCallback((average: number | null, total: number) => {
    setReviewStats({ average, total });
  }, []);

  if (!user) {
    return (
      <div className="page-shell">
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card/40" />
      </div>
    );
  }

  // Fields controlled by AccountForm come from auth store (updated immediately after save).
  // Rich objects (position, department) come from the profile API when available.
  const cardUser = {
    firstName: user.firstName,
    lastName: user.lastName,
    nickname: user.nickname,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    position: profileData?.user?.position ?? { id: '', code: '', name: user.position },
    department: profileData?.user?.department ?? { id: '', code: '', name: user.department, branch: { id: '', code: '', name: user.branch } },
    departmentUnit: profileData?.user?.departmentUnit ?? null,
  };

  const cardProfile = profileData?.profile ?? {
    id: '',
    userId: user.id,
    bio: null,
    coverUrl: null,
    highlight: null,
    isActive: true,
    likeCount: 0,
    isLiked: false,
    createdAt: '',
    updatedAt: '',
  };

  return (
    <div className="page-shell">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <PageHeader
          icon={Settings2}
          title="ตั้งค่าบัญชี"
          subtitle="จัดการข้อมูลส่วนตัว รูปภาพ และ Profile ของคุณ"
        />
      </motion.div>

      {!isElevated && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 p-5 shadow-lg shadow-black/5 ring-1 ring-inset ring-white/10 backdrop-blur-md dark:ring-white/5 sm:p-6"
        >
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 size-48 rounded-full bg-violet-500/20 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 size-44 rounded-full bg-pink-500/20 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute right-6 top-6">
            <Sparkles className="size-7 animate-pulse text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.55)]" />
          </span>
          <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
            <div className="shrink-0 rounded-full p-1 ring-2 ring-violet-500/30 shadow-xl">
              <UserAvatar
                avatarUrl={user.avatarUrl}
                initial={user.firstName[0]}
                color="bg-gradient-to-br from-violet-500 to-fuchsia-600"
                size="xl"
              />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                ตั้งค่าบัญชีของคุณ
              </p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                อัพเดตข้อมูลส่วนตัว รูปภาพ และข้อมูลติดต่อให้เป็นปัจจุบัน
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground/80">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
        </motion.section>
      )}

      <div className={isElevated ? 'grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr] 2xl:gap-6' : undefined}>

        {/* ── Left: Profile card (sticky) + Reviews — elevated only ── */}
        {isElevated && (
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
            >
              <ProfileCard
                user={cardUser}
                profile={cardProfile}
                skills={profileData?.skills ?? []}
                reviewStats={reviewStats ?? undefined}
                postCount={profileData?.postCount}
                totalPostLikes={profileData?.totalPostLikes}
                isOwn
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.25 }}
            >
              <ReviewSection
                targetUserId={user.id}
                currentUserId={user.id}
                isOwn
                onStatsChange={handleStatsChange}
              />
            </motion.div>
          </div>
        )}

        {/* ── Right: Edit forms ── */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.18 }}
          >
            <AccountForm user={user} />
          </motion.div>
          {isElevated && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.3 }}
            >
              <ProfileForm
                userId={user.id}
                profile={profileData?.profile ?? null}
                skills={profileData?.skills ?? []}
                onSaved={handleProfileSaved}
                onCoverUploaded={handleCoverUploaded}
                onCoverDeleted={handleCoverDeleted}
                onSkillsSaved={handleSkillsSaved}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
