import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes and their required roles
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/users': ['super_admin'],
  '/settings': ['super_admin'],
  '/vehicles': ['super_admin', 'admin', 'propietario', 'colaborador', 'operador', 'taller'],
  '/pricing': ['super_admin', 'admin'],
  '/maintenance': ['super_admin', 'admin', 'technician', 'taller', 'propietario', 'colaborador'],
  '/spare-parts': ['super_admin', 'admin', 'taller'],
  '/locations': ['super_admin', 'admin'],
  '/reports': ['super_admin', 'admin', 'propietario', 'colaborador'],
  '/customers': ['super_admin', 'admin', 'operador'],
  '/expenses': ['super_admin', 'admin', 'propietario', 'colaborador'],
  '/documents': ['super_admin', 'admin', 'propietario', 'colaborador'],
  '/notifications': ['super_admin', 'admin', 'operador'],
  '/commissions': ['super_admin', 'admin', 'propietario', 'colaborador'],
  '/planning': ['super_admin', 'admin', 'operador'],
  '/calendar': ['super_admin', 'admin', 'operador'],
  '/bookings': ['super_admin', 'admin', 'operador'],
};

/**
 * Extracts tenant subdomain from the request
 * Priority: 
 * 1. Query parameter ?tenant=xxx
 * 2. Subdomain (e.g., demo.example.com)
 * 3. Environment variable DEFAULT_TENANT_SUBDOMAIN
 * 4. Fallback to "demo"
 */
function getTenantSubdomain(req: NextRequest): string {
  // Check query parameter
  const tenantParam = req.nextUrl.searchParams.get('tenant');
  if (tenantParam) {
    return tenantParam;
  }

  // Check subdomain
  const hostname = req.headers.get('host') || '';
  const parts = hostname.split('.');
  
  // If we have a subdomain (e.g., demo.example.com or demo.vercel.app)
  // and it's not www, use it
  if (parts.length >= 3 && parts[0] !== 'www') {
    // Check if it's not a Vercel preview deployment URL
    if (!hostname.includes('vercel.app') || !hostname.includes('-')) {
      return parts[0];
    }
  }

  // Use environment variable or fallback to "demo"
  return process.env.DEFAULT_TENANT_SUBDOMAIN || 'demo';
}

// Middleware for public routes (login, API auth, etc.)
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Set tenant subdomain header for all requests
  const tenantSubdomain = getTenantSubdomain(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-subdomain', tenantSubdomain);

  // For public routes like /login and /api/auth, just add the header
  if (pathname.startsWith('/api/auth') || pathname === '/login' || pathname === '/' || pathname.startsWith('/onboarding')) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // For protected routes, use withAuth
  return (withAuth(
    function middleware(req) {
      const token = req.nextauth.token;
      const pathname = req.nextUrl.pathname;

      // Check if the route requires role-based access
      for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
        if (pathname.startsWith(route)) {
          const userRole = token?.role as string;
          if (!allowedRoles.includes(userRole)) {
            // Redirect to unauthorized page
            return NextResponse.redirect(new URL('/unauthorized', req.url));
          }
        }
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    },
    {
      callbacks: {
        authorized: ({ token }) => !!token,
      },
    }
  ) as any)(request as any, {} as any);
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/login',
    '/onboarding',
    '/dashboard/:path*',
    '/vehicles/:path*',
    '/pricing/:path*',
    '/bookings/:path*',
    '/maintenance/:path*',
    '/spare-parts/:path*',
    '/locations/:path*',
    '/reports/:path*',
    '/customers/:path*',
    '/expenses/:path*',
    '/documents/:path*',
    '/notifications/:path*',
    '/commissions/:path*',
    '/planning/:path*',
    '/calendar/:path*',
    '/users/:path*',
    '/settings/:path*',
  ],
};
