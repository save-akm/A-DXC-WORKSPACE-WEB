export interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  /** Preview gradient shown in picker — Tailwind classes. */
  preview: string;
  mode: 'light' | 'dark';
}

/**
 * Curated theme set. We deliberately keep this short: one neutral and one
 * branded option per mode. A long menu of competing decorative themes reads as
 * indecision, not richness — each theme here earns its place.
 *
 *   Light · Default  — neutral, the everyday surface.
 *   Light · Aurora   — the violet/fuchsia brand identity in light.
 *   Dark  · Midnight — navy, the default dark surface.
 *   Dark  · Cyberpunk— the violet/fuchsia brand identity in dark.
 */
export const themePresets: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    emoji: '⚪',
    preview: 'from-white to-gray-100',
    mode: 'light',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    emoji: '🔮',
    preview: 'from-violet-400 via-fuchsia-400 to-violet-300',
    mode: 'light',
  },
  {
    id: 'navy',
    name: 'Midnight',
    emoji: '🌌',
    preview: 'from-indigo-600 via-violet-600 to-slate-800',
    mode: 'dark',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    emoji: '🌃',
    preview: 'from-fuchsia-500 via-purple-500 to-violet-500',
    mode: 'dark',
  },
];

export const DEFAULT_LIGHT_PRESET_ID = 'default';
export const DEFAULT_DARK_PRESET_ID = 'navy';

/** Guard against stale/removed preset ids persisted in older clients. */
export function resolvePresetId(id: string | undefined, mode: 'light' | 'dark'): string {
  const found = themePresets.find((p) => p.id === id && p.mode === mode);
  if (found) return found.id;
  return mode === 'dark' ? DEFAULT_DARK_PRESET_ID : DEFAULT_LIGHT_PRESET_ID;
}
