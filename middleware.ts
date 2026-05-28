import { NextResponse, type NextRequest } from 'next/server';
import { authConfig } from '@/lib/auth/config';

// Routes that require an authenticated session.
const PROTECTED_PREFIXES = ['/dashboard', '/mobitoring'];

// Routes for unauthenticated users — visiting these while logged in
// bounces to /dashboard so they don't see the marketing/login page again.
const PUBLIC_ONLY_PATHS = ['/', '/login'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(authConfig.cookies.refresh);

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
  const isPublicOnly = PUBLIC_ONLY_PATHS.includes(pathname);

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isPublicOnly && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals + static assets. Match every other path.
  matcher: ['/((?!_next/|api/|favicon|icon|.*\\.(?:png|jpg|jpeg|svg|webp|ico|gif|woff2?)).*)'],
};
