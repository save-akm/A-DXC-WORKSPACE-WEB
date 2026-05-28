'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Layers, Database, Globe, Cpu, Cloud, Shield, LayoutGrid, Zap, MessageSquare } from 'lucide-react';

const MOCK_APPS = [
  { name: 'HR Connect', icon: <Globe className="w-8 h-8" />, color: 'from-blue-500 to-cyan-400', desc: 'ระบบจัดการบุคคล' },
  { name: 'ERP System', icon: <Database className="w-8 h-8" />, color: 'from-fuchsia-500 to-pink-500', desc: 'บริหารจัดการทรัพยากร' },
  { name: 'Service Desk', icon: <MessageSquare className="w-8 h-8" />, color: 'from-violet-500 to-purple-500', desc: 'แจ้งปัญหา IT' },
  { name: 'Cloud Ops', icon: <Cloud className="w-8 h-8" />, color: 'from-indigo-400 to-blue-500', desc: 'ระบบคลาวด์' },
  { name: 'Security Hub', icon: <Shield className="w-8 h-8" />, color: 'from-emerald-400 to-green-500', desc: 'ความปลอดภัยภัยไซเบอร์' },
  { name: 'AI Core', icon: <Cpu className="w-8 h-8" />, color: 'from-rose-400 to-orange-500', desc: 'ผู้ช่วย AI อัจฉริยะ' },
  { name: 'Workflows', icon: <Layers className="w-8 h-8" />, color: 'from-amber-400 to-yellow-500', desc: 'ระบบอนุมัติเอกสาร' },
  { name: 'Dashboard', icon: <LayoutGrid className="w-8 h-8" />, color: 'from-teal-400 to-emerald-500', desc: 'รายงานภาพรวม' },
];

export function AppHubSection() {
  return (
    <section
      id="app-hub-section"
      className="relative w-full py-16 lg:py-20 2xl:py-32 bg-transparent text-zinc-900 dark:text-white"
    >
      <div className="container mx-auto px-4 relative z-10">
        <div id="app-hub-heading" className="text-center mb-8 lg:mb-10 2xl:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-5xl 2xl:text-7xl font-extrabold mb-3 lg:mb-4 2xl:mb-6 tracking-tight"
          >
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">App Hub</span> Universe
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base lg:text-base 2xl:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed"
          >
            ศูนย์รวมแอปพลิเคชันและบริการทั้งหมดของคุณ พร้อมทะยานสู่การทำงานยุคใหม่ที่ไร้ขีดจำกัด สัมผัสประสบการณ์ที่ลื่นไหล
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-4 2xl:gap-8">
          {MOCK_APPS.map((app, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: false, margin: '-50px' }}
              transition={{ duration: 0.4, delay: idx * 0.05, ease: 'easeOut' }}
              whileHover={{ scale: 1.03, y: -8 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer group app-hub-card"
            >
              <Card className="h-full
                bg-white/60 border-zinc-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/10
                dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/[0.08] dark:shadow-2xl dark:shadow-black/50
                backdrop-blur-xl overflow-hidden transition-all duration-500 relative"
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <CardContent className="p-5 lg:p-5 2xl:p-8 flex flex-col items-center text-center gap-3 lg:gap-3 2xl:gap-6 relative z-10">
                  <div className={`p-3 lg:p-3 2xl:p-4 rounded-2xl bg-gradient-to-br ${app.color} text-white
                    shadow-lg shadow-black/10 dark:shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]
                    transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-300
                    ring-1 ring-white/30 dark:ring-white/20`}
                  >
                    {app.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base lg:text-base 2xl:text-lg text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">{app.name}</h3>
                    <p className="text-xs lg:text-xs 2xl:text-sm text-zinc-500 dark:text-zinc-400 mt-1 lg:mt-1 2xl:mt-3 leading-relaxed">{app.desc}</p>
                  </div>
                  
                  {/* Floating particles effect on hover */}
                  <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <span className="inline-block w-1 h-1 rounded-full bg-indigo-500/50 dark:bg-white/50 animate-ping" />
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
