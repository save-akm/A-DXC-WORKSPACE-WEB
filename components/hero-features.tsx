'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, BellRing, Lightbulb, Rocket, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  content: string;
  actionText?: string;
  shadowColor: string;
  iconBgColor: string;
  iconTextColor: string;
  hoverIconBgColor: string;
  onClick?: () => void;
  isSpecial?: boolean;
  specialActionText?: string;
}

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  content,
  actionText,
  shadowColor,
  iconBgColor,
  iconTextColor,
  hoverIconBgColor,
  onClick,
  isSpecial,
  specialActionText,
}: FeatureCardProps) => {
  return (
    <motion.div 
      whileHover={{ y: -8 }} 
      transition={{ type: 'spring', stiffness: 300 }}
      onClick={onClick}
    >
      <Card className={`h-full border-zinc-200 bg-white/50 backdrop-blur-sm dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 transition-all hover:shadow-2xl ${shadowColor} flex flex-col cursor-pointer group`}>
        <CardHeader>
          <div className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center mb-4 ${iconTextColor} ${hoverIconBgColor} group-hover:text-white dark:group-hover:text-white transition-colors duration-300`}>
            <Icon className="w-5 h-5 2xl:w-6 2xl:h-6" />
          </div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col justify-end text-left">
          <p className="text-muted-foreground leading-relaxed text-sm">
            {content}
          </p>
          {isSpecial ? (
            <div className={`p-3 ${iconBgColor.replace('500/10', '500/5')} border ${iconBgColor.replace('500/10', '500/10')} rounded-xl flex items-center justify-between transition-colors ${hoverIconBgColor} group-hover:text-white mt-auto`}>
              <span className="text-sm font-medium">{specialActionText}</span>
              <div className={`${iconBgColor.replace('/10', '')} text-white p-1 rounded-lg group-hover:bg-opacity-80 transition-colors`}>
                <Zap size={14} />
              </div>
            </div>
          ) : (
            <div className={`pt-4 flex items-center ${iconTextColor} font-medium group-hover:gap-2 transition-all text-sm mt-auto`}>
              {actionText} <ChevronRight size={16} className="ml-1" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export function HeroFeatures({ onAppHubClick }: { onAppHubClick: () => void }) {
  return (
    <div className="container mx-auto px-6 md:px-12 lg:px-14 2xl:px-6 mt-auto mb-4 md:mb-6 2xl:mb-8 relative z-10 pb-2 shrink-0">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 lg:gap-4 2xl:gap-6">
        {/* LEFT CARDS CLUSTER (2 Cards) */}
        <div id="hero-cards-left" className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-4 2xl:gap-6">
          <FeatureCard
            icon={LayoutGrid}
            title="App Hub"
            description="ศูนย์รวมระบบปฏิบัติการ"
            content="เข้าถึงระบบ HR, ERP, ลางาน และเครื่องมือเบิกจ่ายต่างๆ ขององค์กรได้ง่ายๆ ในหน้าเดียวจบ"
            actionText="เข้าใช้งาน"
            shadowColor="hover:shadow-indigo-500/10"
            iconBgColor="bg-indigo-500/10"
            iconTextColor="text-indigo-600 dark:text-indigo-400"
            hoverIconBgColor="group-hover:bg-indigo-500"
            onClick={onAppHubClick}
          />
          <FeatureCard
            icon={BellRing}
            title="Announcements"
            description="ข่าวสารและแจ้งเตือน"
            content="ประกาศแผนบำรักษาระบบ (Maintenance) และแจ้งเตือนภัยคุกคามทางไซเบอร์ที่พนักงานควรรู้"
            actionText="อ่านประกาศ"
            shadowColor="hover:shadow-amber-500/10"
            iconBgColor="bg-amber-500/10"
            iconTextColor="text-amber-600 dark:text-amber-400"
            hoverIconBgColor="group-hover:bg-amber-500"
          />
        </div>

        {/* RIGHT CARDS CLUSTER (3 Cards) */}
        <div id="hero-cards-right" className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4 2xl:gap-6">
          <FeatureCard
            icon={Lightbulb}
            title="IT Team & Tips"
            description="ทริคไอทีและทีมซัพพอร์ต"
            content="ทำความรู้จักทีมงานไอที พร้อมอ่านทริคคอมพิวเตอร์ดีๆ ที่ช่วยให้คุณทำงานง่ายและรวดเร็วขึ้น"
            actionText="ดูทริคเพิ่มเติม"
            shadowColor="hover:shadow-emerald-500/10"
            iconBgColor="bg-emerald-500/10"
            iconTextColor="text-emerald-600 dark:text-emerald-400"
            hoverIconBgColor="group-hover:bg-emerald-500"
          />
          <FeatureCard
            icon={Rocket}
            title="AI IT Support"
            description="ผู้ช่วยอัจฉริยะ 24/7"
            content="ถาม-ตอบข้อสงสัยเบื้องต้น เช่น ลืมรหัสผ่าน, วิธีต่อ VPN ด้วย Chatbot ที่พร้อมบริการตลอดเวลา"
            isSpecial
            specialActionText="คุยกับ AI Support"
            shadowColor="hover:shadow-pink-500/10"
            iconBgColor="bg-pink-500/10"
            iconTextColor="text-pink-600 dark:text-pink-400"
            hoverIconBgColor="group-hover:bg-pink-500"
          />
          <FeatureCard
            icon={Sparkles}
            title="A-DXC Activity"
            description="กิจกรรม A-DXC"
            content="กิจกรรมต่างๆ ที่ A-DXC ได้มีส่วนร่วม"
            isSpecial
            specialActionText="ดูรายละเอียด"
            shadowColor="hover:shadow-violet-500/10"
            iconBgColor="bg-violet-500/10"
            iconTextColor="text-violet-600 dark:text-violet-400"
            hoverIconBgColor="group-hover:bg-violet-500"
          />
        </div>
      </div>
    </div>
  );
}
