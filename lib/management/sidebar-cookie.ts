export const SIDEBAR_COOKIE_NAME = 'sidebar:collapsed';
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseCollapsedCookie(value: string | undefined): boolean {
  return value === '1';
}

export function serializeCollapsed(collapsed: boolean): string {
  return collapsed ? '1' : '0';
}