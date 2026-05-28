'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Zap, LayoutGrid, BellRing, Lightbulb, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeroTelemetry } from '@/components/hero-telemetry';

const Scene = dynamic(() => import('@/components/it-nextgen-scene'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-zinc-900/5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">Initiating Core...</div>
});

export default function Home() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (headingRef.current) {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power4.out' }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-10 items-center">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-semibold tracking-wide uppercase"
              >
                <Zap size={14} className="fill-current" />
                A-DXC Center NextGen Edition
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <ThemeToggle />
              </motion.div>
            </div>
            
            <h1 
              ref={headingRef}
              className="text-6xl md:text-7xl font-extrabold tracking-tight"
            >
              The Modern <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent italic pr-4">Workspace</span>
            </h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xl text-muted-foreground max-w-[600px] leading-relaxed"
            >
              ยกระดับการจัดการไอทีด้วยระบบอัจฉริยะแบบ NextGen ที่เชื่อมโยงทุกข้อมูลโปรเจค เครื่องมือ และ AI Support ไว้ในที่เดียว
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Button size="lg" className="rounded-full gap-2 px-8 bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                เข้าสู่ระบบ A-DXC Center <Rocket size={18} />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full gap-2 px-8 border-indigo-200 cursor-pointer">
                เรียนรู้เพิ่มเติม
              </Button>
            </motion.div>

            {/* Telemetry Data (Total Visitors & Status) */}
            <HeroTelemetry />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
            <Scene />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* App Hub */}
          <motion.div whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className="h-full border-zinc-200 bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50 dark:border-zinc-800 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col cursor-pointer group">
              <CardHeader>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                  <LayoutGrid size={24} />
                </div>
                <CardTitle className="text-xl font-bold">App Hub</CardTitle>
                <CardDescription className="text-sm">ศูนย์รวมระบบปฏิบัติการ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  เข้าถึงระบบ HR, ERP, ลางาน และเครื่องมือเบิกจ่ายต่างๆ ขององค์กรได้ง่ายๆ ในหน้าเดียวจบ
                </p>
                <div className="pt-4 flex items-center text-indigo-600 dark:text-indigo-400 font-medium group-hover:gap-2 transition-all text-sm mt-auto">
                  เข้าใช้งาน <ChevronRight size={16} className="ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Announcements & Security */}
          <motion.div whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className="h-full border-zinc-200 bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50 dark:border-zinc-800 transition-all hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col cursor-pointer group">
              <CardHeader>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                  <BellRing size={24} />
                </div>
                <CardTitle className="text-xl font-bold">Announcements</CardTitle>
                <CardDescription className="text-sm">ข่าวสารและแจ้งเตือน</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  ประกาศแผนบำรุงรักษาระบบ (Maintenance) และแจ้งเตือนภัยคุกคามทางไซเบอร์ที่พนักงานควรรู้
                </p>
                <div className="pt-4 flex items-center text-amber-600 dark:text-amber-400 font-medium group-hover:gap-2 transition-all text-sm mt-auto">
                  อ่านประกาศ <ChevronRight size={16} className="ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Meet IT Team & Tips */}
          <motion.div whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className="h-full border-zinc-200 bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50 dark:border-zinc-800 transition-all hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col cursor-pointer group">
              <CardHeader>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                  <Lightbulb size={24} />
                </div>
                <CardTitle className="text-xl font-bold">IT Team & Tips</CardTitle>
                <CardDescription className="text-sm">ทริคไอทีและทีมซัพพอร์ต</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  ทำความรู้จักทีมงานไอที พร้อมอ่านทริคคอมพิวเตอร์ดีๆ ที่ช่วยให้คุณทำงานง่ายและรวดเร็วขึ้น
                </p>
                <div className="pt-4 flex items-center text-emerald-600 dark:text-emerald-400 font-medium group-hover:gap-2 transition-all text-sm mt-auto">
                  ดูทริคเพิ่มเติม <ChevronRight size={16} className="ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI IT Support */}
          <motion.div whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className="h-full border-zinc-200 bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50 dark:border-zinc-800 transition-all hover:shadow-2xl hover:shadow-pink-500/10 flex flex-col cursor-pointer group">
              <CardHeader>
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4 text-pink-600 dark:text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-colors duration-300">
                  <Rocket size={24} />
                </div>
                <CardTitle className="text-xl font-bold">AI IT Support</CardTitle>
                <CardDescription className="text-sm">ผู้ช่วยอัจฉริยะ 24/7</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
                <p className="text-muted-foreground leading-relaxed text-sm mb-4">
                  ถาม-ตอบข้อสงสัยเบื้องต้น เช่น ลืมรหัสผ่าน, วิธีต่อ VPN ด้วย Chatbot ที่พร้อมบริการตลอดเวลา
                </p>
                <div className="p-3 bg-pink-500/5 border border-pink-500/10 rounded-xl flex items-center justify-between transition-colors group-hover:bg-pink-500 group-hover:text-white mt-auto">
                  <span className="text-sm font-medium">คุยกับ AI Support</span>
                  <div className="bg-pink-500 text-white p-1 rounded-lg group-hover:bg-pink-600 transition-colors">
                    <Zap size={14} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

