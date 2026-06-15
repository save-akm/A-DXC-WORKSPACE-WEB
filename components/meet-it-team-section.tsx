'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Quote,
  Lightbulb,
  Building2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Branch = 'PCB' | 'AYT' | 'BNN' | 'BKK';
type FilterTab = 'ALL' | Branch;
type BioType = 'tip' | 'quote' | 'bio';

interface TeamMember {
  name: string;
  role: string;
  branch: Branch;
  initial: string;
  bio: string;
  bioType: BioType;
}

const TEAM: TeamMember[] = [
  // ── PCB · Prachinburi ──
  {
    name: 'ภพ ศรีสมบัติ',
    role: 'Lead DevOps Engineer',
    branch: 'PCB',
    initial: 'ภ',
    bio: 'Code · Coffee · Kubernetes — สามอย่างที่ขาดไม่ได้ในชีวิต',
    bioType: 'quote',
  },
  {
    name: 'กิตติ พงษ์เจริญ',
    role: 'Cloud Engineer',
    branch: 'PCB',
    initial: 'ก',
    bio: 'ใช้ infra-as-code ทุกอย่าง เปลี่ยน production ผ่าน PR เท่านั้น ปลอดภัย ตรวจสอบได้',
    bioType: 'tip',
  },
  {
    name: 'ปวีณา จิตรกร',
    role: 'Site Reliability Engineer',
    branch: 'PCB',
    initial: 'ป',
    bio: 'uptime 99.99% ไม่ใช่แค่ตัวเลข มันคือศิลปะของการเตรียมรับมือทุกความล้มเหลว',
    bioType: 'bio',
  },

  // ── AYT · Ayutthaya ──
  {
    name: 'ศรัณย์ ราชวัฒน์',
    role: 'Cybersecurity Lead',
    branch: 'AYT',
    initial: 'ศ',
    bio: 'เปลี่ยนรหัสผ่านทุก 90 วัน และห้ามใช้รหัสเดียวกันทุก service เด็ดขาด',
    bioType: 'tip',
  },
  {
    name: 'วรรณภา ทรัพย์เจริญ',
    role: 'Security Analyst',
    branch: 'AYT',
    initial: 'ว',
    bio: 'ก่อนคลิกลิงก์ในอีเมล hover ดู URL จริงทุกครั้ง — โดเมนปลอมมักต่างกันเพียง 1 ตัวอักษร',
    bioType: 'tip',
  },
  {
    name: 'ธนพัฒน์ สุขเกษม',
    role: 'Network Engineer',
    branch: 'AYT',
    initial: 'ธ',
    bio: 'VPN ไม่ใช่แค่เครื่องมือ มันคือเกราะป้องกันที่ทุกคนต้องใช้เมื่อทำงานนอกออฟฟิศ',
    bioType: 'quote',
  },

  // ── BNN · Bangna ──
  {
    name: 'ปรเมศวร์ นิรันดร์',
    role: 'Frontend Architect',
    branch: 'BNN',
    initial: 'ป',
    bio: 'UX ที่ดีคือ UX ที่ user ไม่รู้สึกว่ามี UX อยู่เลย',
    bioType: 'quote',
  },
  {
    name: 'พีรพัฒน์ คำสุข',
    role: 'Backend Engineer',
    branch: 'BNN',
    initial: 'พ',
    bio: 'ออกแบบ API เหมือนเขียนนิยาย — คนอ่านต้องเข้าใจตั้งแต่บทแรก ไม่ต้องอ่าน source code',
    bioType: 'bio',
  },
  {
    name: 'สุภาพร ชัยมงคล',
    role: 'QA Lead',
    branch: 'BNN',
    initial: 'ส',
    bio: 'bug ที่หาเจอวันจันทร์ ดีกว่า bug ที่ deploy ลง production ตอนเย็นวันศุกร์เสมอ',
    bioType: 'tip',
  },

  // ── BKK · Bangkok HQ ──
  {
    name: 'อภิญญา คำภา',
    role: 'Help Desk Manager',
    branch: 'BKK',
    initial: 'อ',
    bio: 'ลอง restart ก่อน — 90% ของปัญหาหายเอง อีก 10% โทรหาผมได้ทุกเมื่อ',
    bioType: 'tip',
  },
  {
    name: 'ณัฐพร วิสุทธิ์',
    role: 'AI / ML Engineer',
    branch: 'BKK',
    initial: 'ณ',
    bio: 'RAG > fine-tuning เมื่อ data เปลี่ยนบ่อย — ตอบจากแหล่งจริงเสมอ ไม่หลอกตัวเอง',
    bioType: 'quote',
  },
  {
    name: 'ชนากานต์ มีสุข',
    role: 'Data Engineer',
    branch: 'BKK',
    initial: 'ช',
    bio: 'Data is the new oil — ถ้าไม่ refine ก็ใช้ไม่ได้ ขอแค่อย่าให้ pipeline พังก็พอ',
    bioType: 'bio',
  },
];

const TABS: FilterTab[] = ['ALL', 'PCB', 'AYT', 'BNN', 'BKK'];

const BRANCH_LABELS: Record<Branch, string> = {
  PCB: 'Prachinburi',
  AYT: 'Ayutthaya',
  BNN: 'Bangna',
  BKK: 'Bangkok HQ',
};

const BIO_TYPE_META: Record<
  BioType,
  { label: string; icon: LucideIcon; tone: string; bg: string }
> = {
  tip: {
    label: 'TIP',
    icon: Lightbulb,
    tone: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  quote: {
    label: 'QUOTE',
    icon: Quote,
    tone: 'text-brand',
    bg: 'bg-brand/10 border-brand/20',
  },
  bio: {
    label: 'BIO',
    icon: Sparkles,
    tone: 'text-foreground/70',
    bg: 'bg-foreground/5 border-foreground/10',
  },
};

function MemberCard({
  member,
  fluid = false,
}: {
  member: TeamMember;
  fluid?: boolean;
}) {
  const meta = BIO_TYPE_META[member.bioType];
  const Icon = meta.icon;

  return (
    <div className={fluid ? 'w-full' : 'w-[300px] sm:w-[340px] lg:w-[380px]'}>
      <div
        className="group relative h-full rounded-2xl overflow-hidden
          bg-white/50 border border-zinc-200 hover:bg-white/70 hover:shadow-xl hover:shadow-brand/10
          dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/8 dark:shadow-2xl dark:shadow-black/40
          backdrop-blur-xl transition-all duration-500 cursor-pointer"
      >
        {/* Brand accent strip */}
        <div className="absolute inset-x-0 top-0 h-1 bg-brand" />

        {/* Decorative corner blob */}
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-brand opacity-15 blur-3xl group-hover:opacity-30 transition-opacity duration-500"
        />

        <div className="relative z-10 p-4 lg:p-5 flex gap-3 lg:gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-brand
                flex items-center justify-center text-brand-foreground text-lg lg:text-xl font-extrabold
                ring-2 ring-white dark:ring-zinc-900 shadow-lg
                transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
            >
              {member.initial}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Name + Branch */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-bold text-sm lg:text-[15px] text-zinc-800 dark:text-zinc-100 truncate">
                {member.name}
              </h3>
              <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
                <Building2 className="w-2.5 h-2.5" />
                {member.branch}
              </span>
            </div>

            {/* Role */}
            <p className="text-[11px] lg:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">
              {member.role}
            </p>

            {/* Bio block */}
            <div className="mt-2.5">
              <span
                className={`inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.18em] px-1.5 py-0.5 rounded-md border ${meta.bg} ${meta.tone} mb-1.5`}
              >
                <Icon className="w-2.5 h-2.5" />
                {meta.label}
              </span>
              <p className="text-[11px] lg:text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-3 italic">
                &ldquo;{member.bio}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({
  members,
  direction,
  duration,
}: {
  members: TeamMember[];
  direction: 'left' | 'right';
  duration: number;
}) {
  if (members.length === 0) return null;

  const animationClass =
    direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right';

  return (
    <div className="relative overflow-hidden group">
      {/* Edge fade masks */}
      <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-linear-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-linear-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

      <div
        className={`flex w-fit ${animationClass} group-hover:[animation-play-state:paused] py-2`}
        style={{ animationDuration: `${duration}s` }}
      >
        {/* Render members twice for seamless loop. Use mr-X (not gap) so the
            trailing margin is uniform across all items — translateX(-50%)
            then aligns perfectly to the duplicated set. */}
        {[...members, ...members].map((m, i) => (
          <div
            key={`${m.name}-${i}`}
            className="shrink-0 mr-4 lg:mr-5"
          >
            <MemberCard member={m} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MeetItTeamSection() {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const filtered = useMemo(() => {
    if (activeTab === 'ALL') return TEAM;
    return TEAM.filter((m) => m.branch === activeTab);
  }, [activeTab]);

  // Split alternately so both rows have content even when filtered list is small.
  const row1 = filtered.filter((_, i) => i % 2 === 0);
  const row2 = filtered.filter((_, i) => i % 2 === 1);

  // Keep visual scroll speed roughly consistent regardless of card count.
  const row1Duration = Math.max(30, row1.length * 6);
  const row2Duration = Math.max(34, row2.length * 7);

  return (
    <section
      id="meet-it-team-section"
      className="relative w-full py-16 lg:py-20 2xl:py-32 bg-transparent text-zinc-900 dark:text-white overflow-hidden"
    >
      {/* Decorative orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-brand/12 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Heading */}
        <div className="text-center mb-8 lg:mb-10 2xl:mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="type-section-heading mb-3 lg:mb-4 2xl:mb-6"
          >
            Meet the{' '}
            <span className="text-brand">
              IT Team
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base 2xl:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6 lg:mb-8"
          >
            ทีม IT จากทุกสาขา พร้อมแชร์ tip, คำคม, และเรื่องราวจากแต่ละคน
          </motion.p>

          {/* Tab Filter */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="inline-flex items-center gap-1 p-1.5 rounded-full
              bg-white/60 dark:bg-white/5 border border-zinc-200 dark:border-white/10
              backdrop-blur-md shadow-md shadow-black/5"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-3.5 lg:px-5 py-1.5 lg:py-2 rounded-full text-[11px] lg:text-xs font-bold tracking-wide transition-colors cursor-pointer
                    ${isActive ? 'text-white' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="meet-it-active-tab"
                      className="absolute inset-0 bg-brand rounded-full shadow-lg shadow-brand/30"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </button>
              );
            })}
          </motion.div>

          {/* Branch label — appears when a specific branch is selected */}
          <AnimatePresence mode="wait">
            {activeTab !== 'ALL' && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="mt-3 text-xs text-zinc-500 dark:text-zinc-400"
              >
                สาขา{' '}
                <span className="font-bold text-brand">
                  {BRANCH_LABELS[activeTab]}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Display: marquee for ALL, responsive grid for specific branch */}
        {activeTab === 'ALL' ? (
          <div className="space-y-3 lg:space-y-4">
            <MarqueeRow
              key={`${activeTab}-row1`}
              members={row1}
              direction="left"
              duration={row1Duration}
            />
            <MarqueeRow
              key={`${activeTab}-row2`}
              members={row2}
              direction="right"
              duration={row2Duration}
            />
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5"
          >
            {filtered.map((m) => (
              <MemberCard key={m.name} member={m} fluid />
            ))}
          </motion.div>
        )}

        {/* Footer hint */}
        <div className="mt-8 lg:mt-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <Sparkles className="inline w-3 h-3 mr-1 text-brand" />
          แสดง{' '}
          <span className="font-bold text-zinc-700 dark:text-zinc-300">
            {filtered.length}
          </span>{' '}
          คน
          {activeTab === 'ALL' && ' — hover เพื่อหยุดการเลื่อน'}
        </div>
      </div>
    </section>
  );
}
