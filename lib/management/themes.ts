export interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  /** Preview gradient shown in picker — Tailwind classes. */
  preview: string;
  mode: 'light' | 'dark';
}

export const themePresets: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    emoji: '⚪',
    preview: 'from-white to-gray-50',
    mode: 'light',
  },
  {
    id: 'dawn',
    name: 'Dawn',
    emoji: '🌤️',
    preview: 'from-sky-300 via-sky-200 to-slate-100',
    mode: 'light',
  },
  {
    id: 'cloud',
    name: 'Cloud',
    emoji: '☁️',
    preview: 'from-slate-200 via-slate-100 to-zinc-100',
    mode: 'light',
  },
  {
    id: 'blossom',
    name: 'Blossom',
    emoji: '🌸',
    preview: 'from-fuchsia-200 via-pink-200 to-rose-100',
    mode: 'light',
  },
  {
    id: 'matcha',
    name: 'Matcha',
    emoji: '🍵',
    preview: 'from-emerald-200 via-lime-200 to-emerald-100',
    mode: 'light',
  },
  {
    id: 'lagoon',
    name: 'Lagoon',
    emoji: '🌊',
    preview: 'from-cyan-200 via-sky-200 to-blue-100',
    mode: 'light',
  },
  {
    id: 'peach',
    name: 'Peach',
    emoji: '🍑',
    preview: 'from-orange-200 via-amber-200 to-rose-100',
    mode: 'light',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    emoji: '💎',
    preview: 'from-cyan-200 via-violet-200 to-fuchsia-100',
    mode: 'light',
  },
  {
    id: 'navy',
    name: 'Midnight',
    emoji: '🌌',
    preview: 'from-indigo-500 via-violet-500 to-fuchsia-500',
    mode: 'dark',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    emoji: '🌃',
    preview: 'from-fuchsia-500 via-purple-500 to-cyan-400',
    mode: 'dark',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    emoji: '🌅',
    preview: 'from-rose-500 via-orange-400 to-amber-300',
    mode: 'dark',
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    preview: 'from-emerald-500 via-teal-500 to-lime-400',
    mode: 'dark',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    preview: 'from-cyan-400 via-sky-500 to-blue-600',
    mode: 'dark',
  },
];

export const DEFAULT_LIGHT_PRESET_ID = 'default';
export const DEFAULT_DARK_PRESET_ID = 'navy';
