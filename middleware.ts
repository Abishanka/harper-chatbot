import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// This middleware extracts Clerk user ID from headers instead of using Clerk in middleware
export async function middleware(request: NextRequest) {
  // Get Clerk user ID from header
  const clerkUserId = request.headers.get('x-clerk-user-id') || '';
  
  // List of public routes that don't require authentication
  const publicRoutes = ['/sign-in', '/sign-up'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Allow public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For API routes, ensure Clerk user ID is present
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!clerkUserId) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
  }
  
  // Set up Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Create a response with the Supabase session
  const response = NextResponse.next();

  // Add Clerk user ID to Supabase request headers
  if (clerkUserId) {
    response.headers.set('x-clerk-user-id', clerkUserId);
  }

  return response;
}

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 