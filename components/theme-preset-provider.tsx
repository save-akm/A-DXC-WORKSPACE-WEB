'use client';

import { useEffect, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { useThemePresetStore } from '@/lib/stores/theme-preset-store';

export function ThemePresetProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const lightPresetId = useThemePresetStore((s) => s.lightPresetId);
  const darkPresetId = useThemePresetStore((s) => s.darkPresetId);

  useEffect(() => {
    const id = resolvedTheme === 'dark' ? darkPresetId : lightPresetId;
    document.documentElement.dataset.preset = id;
  }, [resolvedTheme, lightPresetId, darkPresetId]);

  return <>{children}</>;
}
