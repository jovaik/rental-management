import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;
  const pathname = url.pathname;

  // Extract subdomain
  const subdomain = extractSubdomainFromHost(hostname);

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/api/auth', '/api/tenant/current'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Get token to check authentication
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Redirect to login if accessing protected route without authentication
  if (!isPublicRoute && !token && pathname !== '/') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/register pages
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect root to dashboard if authenticated, otherwise to login
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Clone the response
  const response = NextResponse.next();

  // Add subdomain to headers for use in API routes and pages
  if (subdomain) {
    response.headers.set('x-tenant-subdomain', subdomain);
  }

  // Add full hostname to headers
  response.headers.set('x-hostname', hostname);

  return response;
}

function extractSubdomainFromHost(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];

  // Split by dots
  const parts = host.split('.');

  // If localhost or IP, no subdomain
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null;
  }

  // If we have at least 3 parts (subdomain.domain.tld), return the first part
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

// Configure which routes should be processed by middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
