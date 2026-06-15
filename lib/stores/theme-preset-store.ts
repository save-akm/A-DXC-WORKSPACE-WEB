'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_DARK_PRESET_ID,
  DEFAULT_LIGHT_PRESET_ID,
  resolvePresetId,
  themePresets,
} from '@/lib/management/themes';

type PresetMode = 'light' | 'dark';

interface ThemePresetState {
  lightPresetId: string;
  darkPresetId: string;
  setPreset: (mode: PresetMode, id: string) => void;
}

interface LegacyState {
  presetId?: string;
}

export const useThemePresetStore = create<ThemePresetState>()(
  persist(
    (set) => ({
      lightPresetId: DEFAULT_LIGHT_PRESET_ID,
      darkPresetId: DEFAULT_DARK_PRESET_ID,
      setPreset: (mode, id) =>
        set(mode === 'dark' ? { darkPresetId: id } : { lightPresetId: id }),
    }),
    {
      name: 'a-dxc-theme-preset',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persisted, version) => {
        // v0/v1 → v2: split single presetId into per-mode ids.
        let next: Partial<ThemePresetState>;
        if (version < 2) {
          const legacy = (persisted ?? {}) as LegacyState;
          const old = themePresets.find((p) => p.id === legacy.presetId);
          next = {
            lightPresetId: old?.mode === 'light' ? old.id : DEFAULT_LIGHT_PRESET_ID,
            darkPresetId: old?.mode === 'dark' ? old.id : DEFAULT_DARK_PRESET_ID,
          };
        } else {
          next = (persisted ?? {}) as Partial<ThemePresetState>;
        }
        // v2 → v3: presets were trimmed; reset ids that no longer exist.
        // (persist merges this over the initializer, so setPreset is preserved.)
        return {
          lightPresetId: resolvePresetId(next.lightPresetId, 'light'),
          darkPresetId: resolvePresetId(next.darkPresetId, 'dark'),
        } as ThemePresetState;
      },
    },
  ),
);
