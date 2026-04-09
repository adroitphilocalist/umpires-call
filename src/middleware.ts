import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_PHONE = '+916291299136' ;

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/send-otp',
  '/api/auth/reset-password',
  '/api/auth/test-db',
  '/api/scores',
  '/api/contests',
  '/api/matches',
  '/api/players',
  '/api/matches/bulk-update-cricbuzz',
];

// Routes that require admin access (phone number check)
const ADMIN_ROUTES = [
  '/admin',
  '/test-scores',
];

function isPublicRoute(pathname: string): boolean {
  for (const route of PUBLIC_ROUTES) {
    if (route.startsWith('/api/')) {
      if (pathname.startsWith(route)) {
        if (route === '/api/contests' || route === '/api/matches') {
          if (pathname === route || pathname === route + 's') {
            return true;
          }
        } else if (pathname.startsWith(route)) {
          return true;
        }
      }
    } else if (pathname === route || pathname.startsWith(route + '/')) {
      return true;
    }
  }
  return false;
}

function decodeJwtPayload(token: string): { userId?: string; phone?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(base64 + padding);

    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check admin route access
  const isAdminRoute = ADMIN_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isAdminRoute && payload.phone !== ADMIN_PHONE) {
    // Redirect to dashboard if not admin
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId || '');
  response.headers.set('x-user-phone', payload.phone || '');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
