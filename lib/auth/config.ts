export const authConfig = {
  apiUrl: process.env.API_URL ?? 'http://localhost:3001',
  endpoints: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    menus: '/menus/my',
    updatePassword: '/auth/update-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  cookies: {
    refresh: 'a_dxc_rt',
  },
  refreshLeadMs: 60_000,
  refreshCookieMaxAge: {
    remember: 60 * 60 * 24 * 30, // 30 days
    session: 60 * 60 * 24,       // 1 day
  },
} as const;
