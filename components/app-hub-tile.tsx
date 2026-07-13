'use client';

import { motion } from 'framer-motion';
import { Heart, MousePointerClick } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AppIcon } from '@/components/app-icon';
import { cn } from '@/lib/utils';
import type { PublicApp } from '@/lib/apphub/types';

interface AppHubTileProps {
  app: Pick<PublicApp, 'id' | 'name' | 'icon' | 'description' | 'clickCount'>;
  /** Whether the favorites feature is available (user is authenticated). */
  showFavorite?: boolean;
  isFavorite?: boolean;
  onOpen: () => void;
  onToggleFavorite?: () => void;
  /** When true, skips the whileInView entrance animation (carousel already handles it). */
  inCarousel?: boolean;
}

export function AppHubTile({ app, showFavorite, isFavorite, onOpen, onToggleFavorite, inCarousel }: AppHubTileProps) {
  return (
    <motion.div
      {...(inCarousel
        ? {}
        : {
            initial: { opacity: 0, scale: 0.85, y: 30 },
            whileInView: { opacity: 1, scale: 1, y: 0 },
            viewport: { once: false, margin: '-50px' },
            transition: { duration: 0.4, ease: 'easeOut' },
          })}
      whileHover={{ scale: 1.03, y: -8 }}
      whileTap={{ scale: 0.98 }}
      className="app-hub-card group relative cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      aria-label={`เปิดแอป ${app.name}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <Card className="h-full overflow-hidden border-border bg-card/60 backdrop-blur-xl shadow-2xl shadow-black/30 transition-all duration-500 hover:bg-card hover:shadow-xl hover:shadow-brand/10">
        {/* Hover glow */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-brand/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Favorite toggle */}
        {showFavorite && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onToggleFavorite?.(); }}
            aria-label={isFavorite ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/60 backdrop-blur transition-colors hover:bg-background"
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground',
              )}
            />
          </button>
        )}

        <CardContent className="relative z-10 flex flex-col items-center gap-3 p-5 text-center lg:p-5 2xl:gap-6 2xl:p-8">
          <div className="rounded-2xl bg-brand p-3 text-brand-foreground shadow-lg shadow-black/10 ring-1 ring-white/15 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 2xl:p-4">
            <AppIcon name={app.icon} className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground 2xl:text-lg">
              {app.name}
            </h3>
            {app.description && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground 2xl:mt-3 2xl:text-sm">
                {app.description}
              </p>
            )}
          </div>
          {app.clickCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <MousePointerClick className="h-3 w-3" />
              {app.clickCount.toLocaleString()}
            </span>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
