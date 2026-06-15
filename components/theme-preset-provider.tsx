'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { DEFAULT_DARK_PRESET_ID, DEFAULT_LIGHT_PRESET_ID } from '@/lib/management/themes';
import { useThemePresetStore } from '@/lib/stores/theme-preset-store';

// Pages outside management always use the default preset so that user-selected
// management themes don't bleed into the login or landing surfaces.
const PUBLIC_PATHS = ['/', '/login'];

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function ThemePresetProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const lightPresetId = useThemePresetStore((s) => s.lightPresetId);
  const darkPresetId = useThemePresetStore((s) => s.darkPresetId);
  const pathname = usePathname();

  useEffect(() => {
    const isDark = resolvedTheme === 'dark';
    const id = isPublicPath(pathname)
      ? isDark ? DEFAULT_DARK_PRESET_ID : DEFAULT_LIGHT_PRESET_ID
      : isDark ? darkPresetId : lightPresetId;
    document.documentElement.dataset.preset = id;
  }, [resolvedTheme, lightPresetId, darkPresetId, pathname]);

  return <>{children}</>;
}
