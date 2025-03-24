import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

// Define public routes
const publicRoutes = ['/sign-in*', '/sign-up*', '/api/trpc*', '/', '/favicon.ico'];

// Create a middleware using clerkMiddleware
export default clerkMiddleware({
  publicRoutes,
  afterAuth: async (auth, req, evt) => {
    const { userId } = auth;

    // If no userId is found, redirect to sign-in
    if (!userId) {
      console.log('Clerk auth check failed: No user ID found');
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            req.cookies.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            req.cookies.delete(name);
          },
        },
      }
    );

    // Check if the user exists in Supabase
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.log('Supabase user check failed:', { error, user: data });
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    return NextResponse.next();
  },
});

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - login (login route)
     * - sign-in (sign-in route)
     * - sign-up (sign-up route)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|login|sign-in|sign-up).*)',
    '/(api|trpc)(.*)',
  ],
}; 