
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

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

export default withAuth(
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

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
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
