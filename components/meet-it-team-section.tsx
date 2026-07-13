'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { ProfileCard } from '@/components/profile/profile-card';
import { fetchProfilesRequest } from '@/lib/api/profile';
import type {
  PublicProfile,
  ProfileUser,
  UserProfileData,
  UserSkill,
} from '@/lib/api/profile';

type FilterTab = string; // 'ALL' | branch code

const ALL: FilterTab = 'ALL';

/** Map a public-directory profile onto the props the account ProfileCard expects. */
function toProfileUser(p: PublicProfile): ProfileUser {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    nickname: p.nickname,
    email: p.email,
    phone: p.phone,
    avatarUrl: p.avatarUrl,
    position: p.position,
    department: {
      id: p.department.id,
      code: p.department.code,
      name: p.department.name,
      branch: p.department.branch,
    },
    departmentUnit: p.department.unit,
  };
}

function toProfileData(p: PublicProfile): UserProfileData {
  return {
    id: p.id,
    userId: p.id,
    bio: p.bio,
    coverUrl: p.coverUrl,
    highlight: p.highlight,
    isActive: true,
    likeCount: p.likeCount,
    isLiked: p.isLiked,
    createdAt: '',
    updatedAt: '',
  };
}

function ProfileMember({ p }: { p: PublicProfile }) {
  return (
    <div className="w-[300px] sm:w-[320px] lg:w-[340px]">
      <ProfileCard
        user={toProfileUser(p)}
        profile={toProfileData(p)}
        skills={p.skills as UserSkill[]}
        isOwn
        social={false}
        showReview={false}
        variant="compact"
        className="h-full"
      />
    </div>
  );
}

/**
 * A single row of profile cards. Auto-scrolls (marquee, pauses on hover) ONLY
 * when the cards overflow the container; otherwise the cards are shown once,
 * centered and static — so a single profile renders as one card, not a loop.
 */
function TeamRow({ profiles, duration }: { profiles: PublicProfile[]; duration: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const measure = () => {
      const c = containerRef.current;
      const s = setRef.current;
      if (!c || !s) return;
      setOverflow(s.scrollWidth > c.clientWidth + 4);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [profiles]);

  if (profiles.length === 0) return null;

  return (
    <div ref={containerRef} className="group relative overflow-hidden">
      {/* Edge fade masks — only while scrolling */}
      {overflow && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-background via-background/80 to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-background via-background/80 to-transparent sm:w-24" />
        </>
      )}

      <div
        className={
          overflow
            ? 'flex w-fit animate-marquee-left py-2 group-hover:paused'
            : 'flex flex-wrap justify-center py-2'
        }
        style={overflow ? { animationDuration: `${duration}s` } : undefined}
      >
        {/* First set — measured to decide whether scrolling is needed. */}
        <div ref={setRef} className="flex shrink-0">
          {profiles.map((p) => (
            <div key={p.id} className="mr-4 shrink-0 lg:mr-5">
              <ProfileMember p={p} />
            </div>
          ))}
        </div>

        {/* Duplicate set — only when overflowing, for a seamless -50% loop. */}
        {overflow && (
          <div className="flex shrink-0" aria-hidden>
            {profiles.map((p) => (
              <div key={`dup-${p.id}`} className="mr-4 shrink-0 lg:mr-5">
                <ProfileMember p={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-4 overflow-hidden py-2 lg:gap-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="w-[300px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card/50 sm:w-[320px] lg:w-[340px]"
        >
          <div className="h-28 w-full animate-pulse bg-muted" />
          <div className="-mt-10 px-4">
            <div className="h-20 w-20 animate-pulse rounded-full bg-muted ring-4 ring-card" />
          </div>
          <div className="space-y-2.5 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MeetItTeamSection() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [activeTab, setActiveTab] = useState<FilterTab>(ALL);

  useEffect(() => {
    fetchProfilesRequest()
      .then((data) => {
        setProfiles(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  // Branch tabs derived from the data: ALL + unique branch codes (label from name).
  const branches = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => {
      const b = p.department.branch;
      if (b?.code && !map.has(b.code)) map.set(b.code, b.name);
    });
    return Array.from(map, ([code, name]) => ({ code, name })).sort((a, b) =>
      a.code.localeCompare(b.code),
    );
  }, [profiles]);

  const tabs = useMemo<FilterTab[]>(() => [ALL, ...branches.map((b) => b.code)], [branches]);

  const filtered = useMemo(() => {
    if (activeTab === ALL) return profiles;
    return profiles.filter((p) => p.department.branch?.code === activeTab);
  }, [profiles, activeTab]);

  const activeBranchName = branches.find((b) => b.code === activeTab)?.name;

  // Keep scroll speed roughly consistent regardless of card count.
  const duration = Math.max(30, filtered.length * 7);

  return (
    <section
      id="meet-it-team-section"
      className="relative w-full overflow-hidden bg-transparent py-16 text-foreground lg:py-20 2xl:py-32"
    >
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-1/3 -left-32 h-96 w-96 rounded-full bg-brand/12 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        {/* Heading */}
        <div className="mb-8 text-center lg:mb-10 2xl:mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="type-section-heading mb-3 lg:mb-4 2xl:mb-6"
          >
            Meet the <span className="text-brand">IT Team</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-muted-foreground lg:mb-8 2xl:text-xl"
          >
            ทีม IT จากทุกสาขา พร้อมสนับสนุนการทำงานของคุณในทุกด้าน
          </motion.p>

          {/* Tab Filter */}
          {tabs.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-80px' }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 p-1.5 shadow-md shadow-black/5 backdrop-blur-md"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`relative cursor-pointer rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wide transition-colors lg:px-5 lg:py-2 lg:text-xs ${
                      isActive ? 'text-brand-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="meet-it-active-tab"
                        className="absolute inset-0 rounded-full bg-brand shadow-lg shadow-brand/30"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{tab}</span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* Branch label — appears when a specific branch is selected */}
          <AnimatePresence mode="wait">
            {activeTab !== ALL && activeBranchName && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="mt-3 text-xs text-muted-foreground"
              >
                สาขา <span className="font-bold text-brand">{activeBranchName}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Body */}
        {status === 'loading' && <SkeletonRow />}

        {status === 'error' && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            โหลดข้อมูลทีมไม่สำเร็จ กรุณาลองใหม่อีกครั้งภายหลัง
          </p>
        )}

        {status === 'ready' && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            ยังไม่มีสมาชิกทีมให้แสดงในขณะนี้
          </p>
        )}

        {status === 'ready' && filtered.length > 0 && (
          <TeamRow key={activeTab} profiles={filtered} duration={duration} />
        )}

        {/* Footer hint */}
        {status === 'ready' && filtered.length > 0 && (
          <div className="mt-3 text-center text-xs text-muted-foreground md:mt-6 xl:mt-10">
            <Users className="mr-1 inline h-3 w-3 text-brand" />
            แสดง <span className="font-bold text-foreground">{filtered.length}</span> คน
          </div>
        )}
      </div>
    </section>
  );
}
