import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_ENV = process.env.JWT_SECRET;
if (!JWT_SECRET_ENV && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
}
const JWT_SECRET = JWT_SECRET_ENV || 'fallback_secret_for_development_only';

// Define which routes require authentication
const protectedPaths = [
  '/', // The dashboard is protected
  '/onboarding',
  '/profile',
  '/settings',
];

// Define paths that are strictly for unauthenticated users (like login)
const authPaths = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Skip middleware for static assets, public files, API auth routes
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }
  
  const token = request.cookies.get('auth_token')?.value;
  let isValid = false;
  let jwtPayload = null;

  if (token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      isValid = true;
      jwtPayload = payload;
    } catch (error) {
      // Invalid or expired token
      isValid = false;
    }
  }

  // 2. Protect Frontend Routes
  const isProtectedPath = protectedPaths.some(p => pathname === p || pathname.startsWith(`${p}/`)) && pathname !== '/';
  const isRoot = pathname === '/';
  
  if ((isProtectedPath || isRoot) && !isValid) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const isAuthPath = authPaths.some(p => pathname.startsWith(p));
  if (isAuthPath && isValid) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // 3. Protect Backend API Routes (Excluding /api/auth which was skipped above)
  if (pathname.startsWith('/api/') && !isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 4. Pass the userId to API routes via headers if valid, to prevent IDOR
  const response = NextResponse.next();
  if (isValid && jwtPayload?.userId) {
    response.headers.set('x-user-id', jwtPayload.userId as string);
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
