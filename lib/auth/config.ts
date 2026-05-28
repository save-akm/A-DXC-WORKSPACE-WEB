export const authConfig = {
  apiUrl: process.env.API_URL ?? 'http://localhost:3001',
  endpoints: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    menus: '/menus/my',
  },
  cookies: {
    refresh: 'a_dxc_rt',
  },
  refreshLeadMs: 60_000,
  refreshCookieMaxAgeSeconds: 60 * 60 * 24 * 30,
} as const;
