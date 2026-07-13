/**
 * Canonical role name → badge CSS classes.
 * Single source of truth used across Users, Roles, and Permissions pages.
 *
 * Pattern: light bg-{color}-100 text-{color}-700 / dark bg-{color}-500/20 text-{color}-300
 */
export const ROLE_BADGE_CLASSES: Record<string, string> = {
  System:        'bg-violet-100  text-violet-700  dark:bg-violet-500/20  dark:text-violet-300',
  'Super Admin': 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300',
  Admin:         'bg-sky-100     text-sky-700     dark:bg-sky-500/20     dark:text-sky-300',
  Supervisor:    'bg-amber-100   text-amber-700   dark:bg-amber-500/20   dark:text-amber-300',
  Viewer:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  User:          'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
};

/** Maps API role codes (uppercase) to display names. */
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  SYSTEM:      'System',
  SUPER_ADMIN: 'Super Admin',
  ADMIN:       'Admin',
  SUPERVISOR:  'Supervisor',
  VIEWER:      'Viewer',
  USER:        'User',
};

/** Converts an API role code ("SUPER_ADMIN") to a display name ("Super Admin"). */
export function normalizeRoleName(role: string): string {
  return ROLE_DISPLAY_NAMES[role.toUpperCase()] ?? role;
}

export function roleBadgeClass(roleName: string): string {
  return ROLE_BADGE_CLASSES[roleName] ?? 'bg-muted text-muted-foreground';
}

/** Convert hex color (#rrggbb) to rgba for badge background tint. */
export function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `rgba(107, 114, 128, ${alpha})`;
  }
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Inline badge style from API role color. */
export function roleBadgeStyle(color: string): { backgroundColor: string; color: string } {
  return {
    backgroundColor: hexToRgba(color, 0.15),
    color,
  };
}

/** bg-* color key (used by roles page) → badge display classes */
export const ROLE_COLOR_BADGE_CLASSES: Record<string, string> = {
  'bg-violet-500':  'bg-violet-100  text-violet-700  dark:bg-violet-500/20  dark:text-violet-300',
  'bg-fuchsia-500': 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300',
  'bg-sky-500':     'bg-sky-100     text-sky-700     dark:bg-sky-500/20     dark:text-sky-300',
  'bg-amber-500':   'bg-amber-100   text-amber-700   dark:bg-amber-500/20   dark:text-amber-300',
  'bg-emerald-500': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
};
