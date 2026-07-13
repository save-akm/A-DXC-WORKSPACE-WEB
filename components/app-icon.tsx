'use client';

import { createElement } from 'react';
import { icons, LayoutGrid, type LucideProps } from 'lucide-react';

/**
 * Renders a Lucide icon by name. App Hub icons are admin-authored free text, so
 * the name can't be known at build time — we resolve it against lucide's full
 * `icons` registry at runtime. Accepts PascalCase ("CalendarOff") or kebab-case
 * ("calendar-off"); falls back to a neutral grid glyph when the name is empty
 * or unknown.
 */
export function resolveAppIcon(name: string | null | undefined) {
  if (!name) return LayoutGrid;
  const pascal = name
    .trim()
    .replace(/(^|[-_\s])(\w)/g, (_, __, c: string) => c.toUpperCase());
  return (icons as Record<string, typeof LayoutGrid>)[pascal] ?? LayoutGrid;
}

interface AppIconProps extends Omit<LucideProps, 'name'> {
  name: string | null | undefined;
}

export function AppIcon({ name, ...props }: AppIconProps) {
  return createElement(resolveAppIcon(name), props);
}
