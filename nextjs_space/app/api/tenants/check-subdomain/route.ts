import { NextRequest, NextResponse } from 'next/server';
import { isSubdomainAvailable } from '@/lib/tenant';

/**
 * API Route: Check if subdomain is available
 * GET /api/tenants/check-subdomain?subdomain=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json(
        { success: false, error: 'Subdomain parameter is required' },
        { status: 400 }
      );
    }

    // Validate subdomain format: lowercase letters, numbers, and hyphens only
    const subdomainRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: 'Subdomain must contain only lowercase letters, numbers, and hyphens',
        },
        { status: 200 }
      );
    }

    // Check minimum length
    if (subdomain.length < 3) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: 'Subdomain must be at least 3 characters long',
        },
        { status: 200 }
      );
    }

    // Check maximum length
    if (subdomain.length > 63) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: 'Subdomain must be less than 63 characters',
        },
        { status: 200 }
      );
    }

    // Reserved subdomains
    const reserved = [
      'www',
      'api',
      'app',
      'admin',
      'dashboard',
      'mail',
      'ftp',
      'blog',
      'shop',
      'store',
      'auth',
      'login',
      'register',
      'signup',
      'signin',
    ];
    if (reserved.includes(subdomain)) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: 'This subdomain is reserved',
        },
        { status: 200 }
      );
    }

    // Check availability in database
    const available = await isSubdomainAvailable(subdomain);

    return NextResponse.json({
      success: true,
      available,
      subdomain,
    });
  } catch (error) {
    console.error('Error checking subdomain availability:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
