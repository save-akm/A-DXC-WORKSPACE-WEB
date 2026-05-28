'use client';

import { motion } from 'framer-motion';
import {
  CalendarDays,
  Users,
  Camera,
  ArrowUpRight,
  PartyPopper,
  Trees,
  GraduationCap,
  Brain,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BokehSparkles } from '@/components/bokeh-sparkles';

interface Activity {
  title: string;
  date: string;
  attendees: number;
  category: string;
  color: string;
  span: string;
  icon: LucideIcon;
}

const ACTIVITIES: Activity[] = [
  {
    title: 'New Year Party 2026',
    date: '15 ม.ค. 2026',
    attendees: 320,
    category: 'Celebration',
    color: 'from-rose-500 via-pink-500 to-purple-600',
    span: 'lg:col-span-2 lg:row-span-2',
    icon: PartyPopper,
  },
  {
    title: 'IT Bootcamp 2026',
    date: '03 ก.พ. 2026',
    attendees: 85,
    category: 'Training',
    color: 'from-indigo-500 via-blue-500 to-cyan-500',
    span: '',
    icon: GraduationCap,
  },
  {
    title: 'CSR Day — Tree Planting',
    date: '12 มี.ค. 2026',
    attendees: 180,
    category: 'Community',
    color: 'from-emerald-500 via-green-500 to-teal-600',
    span: '',
    icon: Trees,
  },
  {
    title: 'Tech Talk: AI & Workspace',
    date: '05 เม.ย. 2026',
    attendees: 142,
    category: 'Knowledge',
    color: 'from-violet-500 via-fuchsia-500 to-pink-500',
    span: 'lg:col-span-2',
    icon: Brain,
  },
  {
    title: 'Sport Day 2026',
    date: '20 เม.ย. 2026',
    attendees: 280,
    category: 'Wellness',
    color: 'from-amber-500 via-orange-500 to-rose-500',
    span: '',
    icon: Trophy,
  },
];

export function ActivitySection() {
  return (
    <section
      id="activity-section"
      className="relative w-full py-16 lg:py-20 2xl:py-32 bg-transparent text-zinc-900 dark:text-white overflow-hidden"
    >
      {/* Bokeh + sparkles backdrop — celebratory festival lights */}
      <BokehSparkles />

      {/* Decorative orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-pink-500/15 dark:bg-pink-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] rounded-full bg-rose-500/15 dark:bg-rose-500/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Heading */}
        <div className="text-center mb-10 lg:mb-12 2xl:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 text-xs 2xl:text-sm font-semibold tracking-wide uppercase mb-4"
          >
            <Camera size={14} />
            Moments &amp; Memories
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-5xl 2xl:text-7xl font-extrabold mb-3 lg:mb-4 2xl:mb-6 tracking-tight"
          >
            A-DXC{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 dark:from-rose-400 dark:via-pink-400 dark:to-purple-400">
              Activity
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base lg:text-base 2xl:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed"
          >
            ภาพบรรยากาศและความทรงจำของกิจกรรมต่าง ๆ ที่หล่อหลอมเราให้เป็นทีมเดียวกัน
          </motion.p>
        </div>

        {/* Asymmetric Activity Mosaic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 2xl:gap-6 max-w-7xl mx-auto auto-rows-[260px] lg:auto-rows-[280px] 2xl:auto-rows-[340px]">
          {ACTIVITIES.map((act, idx) => {
            const Icon = act.icon;
            return (
              <motion.div
                key={act.title}
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: false, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.06 }}
                whileHover={{ y: -6 }}
                className={`group cursor-pointer relative ${act.span}`}
              >
                <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-xl shadow-black/10 dark:shadow-black/40">
                  {/* Gradient backdrop */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${act.color}`} />

                  {/* Soft highlight */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.30),transparent_60%)]" />

                  {/* Diagonal pattern */}
                  <div
                    className="absolute inset-0 opacity-25 mix-blend-overlay"
                    style={{
                      backgroundImage:
                        'linear-gradient(135deg, rgba(255,255,255,0.25) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.25) 75%, transparent 75%)',
                      backgroundSize: '28px 28px',
                    }}
                  />

                  {/* Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                  {/* Floating large icon */}
                  <Icon className="absolute top-6 right-6 w-10 h-10 lg:w-12 lg:h-12 text-white/40 group-hover:text-white/80 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500" />

                  {/* Date pill */}
                  <div className="absolute top-6 left-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold">
                    <CalendarDays className="w-3 h-3" />
                    {act.date}
                  </div>

                  {/* Bottom info */}
                  <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6 text-white">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">
                      {act.category}
                    </div>
                    <h3 className="font-extrabold text-lg lg:text-xl 2xl:text-3xl leading-tight mb-3 drop-shadow-md">
                      {act.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 text-xs text-white/85">
                        <Users className="w-3 h-3" />
                        {act.attendees} ผู้เข้าร่วม
                      </div>
                      <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white group-hover:bg-white group-hover:text-zinc-900 transition-colors duration-300">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View all CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10 lg:mt-12"
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full
              bg-zinc-900 text-white hover:bg-zinc-800
              dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100
              text-sm font-semibold shadow-lg
              transition-all hover:gap-3 cursor-pointer"
          >
            ดูกิจกรรมทั้งหมด
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
