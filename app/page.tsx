'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { warpState } from '@/lib/warp-state';
import { useChatUIStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Info, Rocket, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeroTelemetry } from '@/components/hero-telemetry';
import { Landing } from '@/components/landing';
import { WarpOverlay } from '@/components/warp-overlay';
import { FloatingNav } from '@/components/floating-nav';
import { AiPromptBox } from '@/components/ai-prompt-box';
import { ChatInterface } from '@/components/chat-interface';
import { VisualDataFlow } from '@/components/visual-data-flow';


const Scene = dynamic(() => import('@/components/it-robot-scene'), {
  ssr: false,
  loading: () => (
    <div className="h-[330px] 2xl:h-[500px] w-full flex items-center justify-center bg-zinc-900/5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-muted-foreground">
      Initializing AI...
    </div>
  ),
});

const BackgroundScene = dynamic(() => import('@/components/hero-background-scene'), { ssr: false });

export default function Home() {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isPromptActive = useChatUIStore((s) => s.isPromptActive);

  useEffect(() => {
    document.body.style.overflow = isPromptActive ? 'hidden' : '';

    if (isPromptActive) {
      gsap.to('#hero-content-left', {
        x: -800, opacity: 0, scale: 0.85,
        duration: 0.5, ease: 'power2.inOut', overwrite: 'auto',
      });
      gsap.to('#hero-content-right', {
        x: 800, opacity: 0, scale: 0.85,
        duration: 0.5, ease: 'power2.inOut', overwrite: 'auto',
      });
    } else {
      gsap.to(['#hero-content-left', '#hero-content-right'], {
        x: 0, opacity: 1, scale: 1,
        duration: 0.5, ease: 'power2.out', overwrite: 'auto',
      });
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isPromptActive]);

  useEffect(() => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // Hero heading entrance
    if (headingRef.current) {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power4.out' }
      );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // WARP DIVE ORCHESTRATION
    // ══════════════════════════════════════════════════════════════════════════
    
    const warpTl = gsap.timeline({
      scrollTrigger: {
        id: 'warp-trigger',
        trigger: '#main-scroll-container',
        start: 'top top',
        end: '+=400%',
        pin: true,
        scrub: 1,
        snap: {
          snapTo: [0, 1],
          duration: { min: 0.4, max: 1.2 },
          delay: 0.2,
          ease: 'power3.inOut',
        },
        onUpdate: (self) => {
          warpState.progress = self.progress;
        },
      },
    });

    // ════════ START STATE RESET ════════
    warpTl.set('#hero-section', { autoAlpha: 1, zIndex: 10 }, 0);
    warpTl.set(['#cyber-core-zoom', '#visual-data-flow'], { opacity: 1, scale: 1, x: 0, y: 0 }, 0);

    // 1. HERO SPLIT (Explicit FromTo for reliability)
    warpTl.fromTo(['#hero-content-left', '#ai-widget-left', '#hero-top-bar'], 
      { x: 0, opacity: 1, scale: 1 },
      { x: -800, opacity: 0, scale: 0.8, duration: 0.4, ease: 'power2.inOut' }, 
      0
    );

    warpTl.fromTo(['#hero-content-right', '#ai-widget-right'], 
      { x: 0, opacity: 1, scale: 1 },
      { x: 800, opacity: 0, scale: 0.8, duration: 0.4, ease: 'power2.inOut' }, 
      0
    );

    warpTl.fromTo(['#ai-prompt-center', '#ai-status-badge'],
      { y: 0, opacity: 1, scale: 1 },
      { y: 300, opacity: 0, scale: 0.9, duration: 0.4, ease: 'power2.inOut' },
      0
    );

    // 2. CYBER CORE "WARP DIVE" (Floating effect: Move to center while zooming)
    warpTl.fromTo(['#cyber-core-zoom', '#visual-data-flow'], 
      { scale: 1, opacity: 1, x: 0, zIndex: 10 },
      { 
        scale: 6, 
        opacity: 0, 
        x: '-25%', // Move towards center as it's on the right
        duration: 0.4, 
        ease: 'power2.in',
        zIndex: 100 
      }, 
      0.05
    );

    // 3. WARP FX
    warpTl.fromTo('#warp-glow', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.3);
    warpTl.fromTo('#warp-flash', { opacity: 0 }, { opacity: 0.7, duration: 0.2 }, 0.5);

    // 4. WARP COMPLETE — fade hero out, fade warp FX out.
    //    Landing is rendered OUTSIDE the pin and reveals via natural scroll
    //    once the pin releases. No more #app-hub-reveal layer.
    warpTl.to('#hero-section', { autoAlpha: 0, zIndex: 5, duration: 0.1 }, 0.95);
    warpTl.to(['#warp-flash', '#warp-glow'], { opacity: 0, duration: 0.2 }, 0.96);

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const handleAppHubClick = () => {
    // Skip the warp and land on the start of <Landing /> (#app-hub-section).
    const target = document.getElementById('app-hub-section');
    if (target) {
      gsap.to(window, {
        scrollTo: { y: target, offsetY: 0 },
        duration: 1.5,
        ease: 'power3.inOut',
      });
      return;
    }
    // Fallback: jump to end of pin if Landing hasn't rendered yet.
    const st = ScrollTrigger.getById('warp-trigger');
    if (st) {
      gsap.to(window, {
        scrollTo: st.end,
        duration: 1.5,
        ease: 'power3.inOut',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* ═══ Layer 0: Fixed 3D Background ═══ */}
      <div className="fixed inset-0 z-0">
        <BackgroundScene />
      </div>

      {/* ═══ Layer 2: Warp Overlay ═══ */}
      <WarpOverlay />

      {/* ═══ Hero — fixed to viewport. Stays visible throughout the warp pin
              range; the warp timeline fades it out (autoAlpha) when warp
              completes so Landing (at z-[5] below hero) shows through. ═══ */}
      <section id="hero-section" className="fixed inset-0 w-full h-full flex flex-col justify-between py-4 md:py-4 2xl:py-8 overflow-hidden z-10">
          
          {/* Visual Data Flow (Background of Hero) */}
          <VisualDataFlow />

          <div className="container mx-auto px-6 md:px-12 lg:px-14 2xl:px-4 relative z-10 flex flex-col h-full">
            {/* Top Bar */}
            <div id="hero-top-bar" className="flex items-center justify-between w-full">

              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs 2xl:text-sm font-semibold tracking-wide uppercase"
                >
                  <Zap size={14} className="fill-current" />
                  A-DXC WorkSpace Center
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <ThemeToggle />
                </motion.div>
              </div>
              
              <HeroTelemetry />
            </div>

            {/* Hero Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-3 items-center grow relative">

              {/* LEFT CONTENT */}
              <div id="hero-content-left" className="space-y-6 md:space-y-8 2xl:space-y-10">
                <h1 
                  ref={headingRef}
                  className="text-3xl md:text-4xl lg:text-5xl 2xl:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-200"
                >

                  The Modern <span className="bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent italic pr-4">Workspace</span>
                </h1>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-base md:text-lg 2xl:text-xl text-muted-foreground max-w-150 leading-relaxed"
                >
                  ศูนย์กลางการทำงานของ A-DXC ที่เชื่อมโยงทั้งข้อมูล เครื่องมือ และ AI Support ไว้ในที่เดียว
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap items-center gap-4"
                >
                  <Button
                    size="lg"
                    onClick={() => router.push('/login')}
                    className="rounded-full gap-2 px-8 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 cursor-pointer"
                  >
                    เข้าสู่ระบบ <Rocket size={18} />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="rounded-full gap-2 px-8 border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:bg-zinc-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                    onClick={handleAppHubClick}
                  >
                    เรียนรู้เพิ่มเติม <Info size={18} />
                  </Button>
                </motion.div>
              </div>

              {/* RIGHT CONTENT (CyberCore Wrapper) */}
              <motion.div
                id="hero-content-right"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 1 }}
                className="relative will-change-transform z-20 overflow-visible"
              >
                <div id="cyber-core-zoom" className="w-full relative overflow-visible">
                  <Scene />
                </div>
              </motion.div>

              {/* Chat overlay — replaces hero left/right while prompt is active */}
              <AnimatePresence>
                {isPromptActive && <ChatInterface key="chat-interface" />}
              </AnimatePresence>
            </div>
          </div>

          {/* AI Prompt Box */}
          <div className="container mx-auto mt-auto relative z-10 pb-2 shrink-0">
            <AiPromptBox />
          </div>
        </section>

      {/* ═══ Warp scroll-range anchor — 0-height. The pin spacer that GSAP
              attaches to this trigger is what provides the 400vh of scroll
              distance for the warp timeline. Because this element itself
              has no layout height, there is no dead zone after the pin
              releases — Landing immediately follows at scrollY = pin.end. ═══ */}
      <div id="main-scroll-container" className="h-0 w-full" aria-hidden="true" />

      {/* ─── Landing (post-warp) — App Hub, Announcements, ...
              z-[5] keeps Landing behind the fixed hero so it stays hidden
              while the warp is active; once hero fades to autoAlpha:0,
              Landing shows through. ─── */}
      <div className="relative z-5">
        <Landing />
      </div>

      {/* ─── Floating Navigation ─── */}
      <FloatingNav />
    </div>
  );
}

