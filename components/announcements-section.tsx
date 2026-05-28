'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Calendar, Sparkles, Bell, AlertCircle, ShieldAlert, Pin, ChevronRight } from 'lucide-react';

const SECURITY_ALERT = {
  title: 'แจ้งเตือนภัย Phishing Email ปลอมตัวเป็น HR',
  description:
    'พบอีเมลปลอมตัวเป็น HR ขอให้กรอก credential ผ่านลิงก์ภายนอก ห้ามคลิก หากได้รับโปรดแจ้ง security@a-dxc.com ทันที',
  level: 'CRITICAL',
  date: '28 เม.ย. 2026',
};

const ANNOUNCEMENTS = [
  {
    category: 'New Release',
    date: '27 Apr 2026',
    title: 'A-DXC WorkSpace Center v2.0 เปิดตัวแล้ว',
    description: 'อัปเกรดประสบการณ์การใช้งานใหม่ด้วย AI Assistant และ App Hub Universe',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'from-indigo-500 to-purple-500',
    badge: 'NEW',
  },
  {
    category: 'Maintenance',
    date: '01 May 2026',
    title: 'แจ้งปิดปรับปรุงระบบ ERP ชั่วคราว',
    description: 'ระบบจะปิดให้บริการตั้งแต่ 22:00 - 02:00 น. เพื่อปรับปรุงประสิทธิภาพการทำงาน',
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'from-amber-500 to-orange-500',
    badge: 'URGENT',
  },
  {
    category: 'Event',
    date: '15 May 2026',
    title: 'A-DXC Tech Talk: Future of Workspace AI',
    description: 'ร่วมฟังเสวนาเทคโนโลยีปัญญาประดิษฐ์กับการทำงานยุคใหม่ที่ห้องประชุมใหญ่ ชั้น 12',
    icon: <Calendar className="w-5 h-5" />,
    color: 'from-emerald-500 to-teal-500',
    badge: 'EVENT',
  },
  {
    category: 'Notice',
    date: '20 May 2026',
    title: 'นโยบายการใช้งาน Cloud Storage ฉบับใหม่',
    description: 'อัปเดตข้อกำหนดการจัดเก็บข้อมูลและ Quota สำหรับผู้ใช้งานทุกระดับ',
    icon: <Bell className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-500',
    badge: 'NOTICE',
  },
];

export function AnnouncementsSection() {
  return (
    <section
      id="announcements-section"
      className="relative w-full py-16 lg:py-20 2xl:py-32 bg-transparent text-zinc-900 dark:text-white overflow-hidden"
    >
      <div className="container mx-auto px-4 relative z-10">
        {/* Security Alert — Pinned / Critical banner at top */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto mb-10 lg:mb-14"
        >
          <div className="group relative rounded-3xl overflow-hidden border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent backdrop-blur-xl shadow-2xl shadow-rose-500/10 hover:shadow-rose-500/20 transition-shadow duration-500">
            {/* Animated glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-rose-500/20 blur-3xl group-hover:bg-rose-500/30 transition-colors duration-500" />

            <div className="relative z-10 p-5 lg:p-6 2xl:p-8 flex flex-col sm:flex-row items-start gap-4 lg:gap-5">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/30 ring-1 ring-white/30">
                <ShieldAlert className="w-6 h-6 lg:w-7 lg:h-7" />
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-[0.2em] px-2 py-0.5 rounded-full bg-rose-500 text-white">
                    <Pin className="w-2.5 h-2.5" />
                    {SECURITY_ALERT.level}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Security Alert
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-600">•</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {SECURITY_ALERT.date}
                  </span>
                </div>
                <h3 className="font-extrabold text-base lg:text-lg 2xl:text-2xl text-zinc-900 dark:text-white mb-2 leading-snug">
                  {SECURITY_ALERT.title}
                </h3>
                <p className="text-xs lg:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {SECURITY_ALERT.description}
                </p>
              </div>

              {/* CTA */}
              <button
                type="button"
                className="self-stretch sm:self-center inline-flex items-center justify-center gap-1 px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-500/30 transition-colors cursor-pointer whitespace-nowrap"
              >
                ดูรายละเอียด
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="text-center mb-10 lg:mb-12 2xl:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs 2xl:text-sm font-semibold tracking-wide uppercase mb-4"
          >
            <Megaphone size={14} />
            What&apos;s New
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl md:text-5xl lg:text-5xl 2xl:text-7xl font-extrabold mb-3 lg:mb-4 2xl:mb-6 tracking-tight"
          >
            A-DXC{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-pink-600 dark:from-indigo-400 dark:via-fuchsia-400 dark:to-pink-400">
              Announcements
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-base lg:text-base 2xl:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed"
          >
            ข่าวสาร อัปเดต และประกาศสำคัญจากทีม A-DXC ที่คุณไม่ควรพลาด
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 2xl:gap-8 max-w-5xl mx-auto">
          {ANNOUNCEMENTS.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <Card
                className="group h-full
                  bg-white/50 border-zinc-200 hover:bg-white/70 hover:shadow-xl hover:shadow-indigo-500/10
                  dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/[0.08] dark:shadow-2xl dark:shadow-black/40
                  backdrop-blur-xl overflow-hidden transition-all duration-300 cursor-pointer relative"
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <CardContent className="p-5 lg:p-6 2xl:p-8 flex gap-4 relative z-10">
                  <div
                    className={`shrink-0 p-3 lg:p-3 2xl:p-4 rounded-2xl bg-gradient-to-br ${item.color} text-white
                      shadow-lg shadow-black/10 dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]
                      h-fit ring-1 ring-white/30 dark:ring-white/20
                      transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-300`}
                  >
                    {item.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {item.category}
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {item.date}
                      </span>
                      <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 tracking-wider">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="font-semibold text-base lg:text-base 2xl:text-lg text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors mb-2 line-clamp-2">
                      {item.title}
                    </h3>

                    <p className="text-xs lg:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
