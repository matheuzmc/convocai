import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Define public routes (accessible without login)
  const publicRoutes = ['/login', '/register']
  // Define authentication routes (login/signup/register)
  const authRoutes = ['/login', '/register']

  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthRoute = authRoutes.includes(pathname)

  // Redirect logged-in users from auth routes to dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/events', request.url))
  }

  // Redirect non-logged-in users from protected routes to login
  if (!user && !isPublicRoute) {
    // Store the attempted URL to redirect back after login
    const loginUrl = new URL('/login', request.url)
    // Construct the 'next' parameter value from the original URL's pathname and search params
    const originalPathWithQuery = request.nextUrl.pathname + request.nextUrl.search;
    loginUrl.searchParams.set('next', originalPathWithQuery)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest file)
     * - images (public images folder)
     * - icons (PWA icons folder)
     * - auth/callback (Supabase auth callback)
     * - firebase-messaging-sw.js (Firebase Service Worker)
     * - sw.js (Service Worker)
     * - workbox-*.js (Workbox files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest\.json|images|icons|auth/callback|firebase-messaging-sw\\.js|sw\\.js|workbox-.*\\.js).*)',
  ],
} 