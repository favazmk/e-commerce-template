import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const ADMIN_ROLES = ['admin', 'super_admin']

/** Baseline hardening headers applied to every response. */
function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  return response
}

function isProtectedApi(pathname: string): boolean {
  return pathname.startsWith('/api/admin')
}

function isProtectedAdminPage(pathname: string): boolean {
  return pathname.startsWith('/admin')
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  try {
    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data: { user } } = await supabase.auth.getUser()

    // Admin route protection
    if (isProtectedAdminPage(pathname) || isProtectedApi(pathname)) {
      if (!user) {
        if (isProtectedApi(pathname)) {
          return applySecurityHeaders(
            NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          )
        }
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return applySecurityHeaders(NextResponse.redirect(loginUrl))
      }

      // Server-side role authorization
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userData || !ADMIN_ROLES.includes(userData.role)) {
        if (isProtectedApi(pathname)) {
          return applySecurityHeaders(
            NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          )
        }
        return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)))
      }
    }

    // Account route protection
    if (pathname.startsWith('/account')) {
      if (!user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return applySecurityHeaders(NextResponse.redirect(loginUrl))
      }
    }
  } catch (error) {
    // Never leak internal error detail (message/stack) to the client, and never
    // fail open on a protected route.
    console.error('[Middleware Error]', error)

    if (isProtectedApi(pathname)) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
      )
    }
    if (isProtectedAdminPage(pathname) || pathname.startsWith('/account')) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
    }
    // Public pages stay reachable if the auth service is briefly unavailable.
  }

  return applySecurityHeaders(supabaseResponse)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
