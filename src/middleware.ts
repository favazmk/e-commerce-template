import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { securityHeaders } from '@/lib/security/headers'

const ADMIN_ROLES = ['admin', 'super_admin']

/** Baseline hardening headers applied to every response. */
function applySecurityHeaders(response: NextResponse, isApi = false): NextResponse {
  for (const [name, value] of Object.entries(securityHeaders({ isApi }))) {
    response.headers.set(name, value)
  }
  return response
}

function isProtectedApi(pathname: string): boolean {
  return pathname.startsWith('/api/admin')
}

/** Routes that require any signed-in customer (not necessarily an admin). */
function isCustomerApi(pathname: string): boolean {
  return pathname.startsWith('/api/account')
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
  const isApiRoute = pathname.startsWith('/api')

  try {
    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data: { user } } = await supabase.auth.getUser()

    // Admin route protection
    if (isProtectedAdminPage(pathname) || isProtectedApi(pathname)) {
      if (!user) {
        if (isProtectedApi(pathname)) {
          return applySecurityHeaders(
            NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
            true
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
            NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
            true
          )
        }
        return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)))
      }
    }

    // Customer API protection. The route handlers guard themselves with
    // requireUser(); this simply avoids paying for the handler at all.
    if (isCustomerApi(pathname) && !user) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        true
      )
    }

    // Account route protection
    if (pathname.startsWith('/account')) {
      if (!user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return applySecurityHeaders(NextResponse.redirect(loginUrl))
      }
    }

    // A signed-in customer landing on sign-in or sign-up belongs in their
    // account, not on a form they no longer need.
    if (user && (pathname === '/login' || pathname === '/register')) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/account', request.url)))
    }
  } catch (error) {
    // Never leak internal error detail (message/stack) to the client, and never
    // fail open on a protected route.
    console.error('[Middleware Error]', error)

    if (isProtectedApi(pathname) || isCustomerApi(pathname)) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Service unavailable' }, { status: 503 }),
        true
      )
    }
    if (isProtectedAdminPage(pathname) || pathname.startsWith('/account')) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
    }
    // Public pages stay reachable if the auth service is briefly unavailable.
  }

  return applySecurityHeaders(supabaseResponse, isApiRoute)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * Feed and sitemap routes are excluded too: they are public, cached, and
     * gain nothing from a session lookup on every crawler request.
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|feeds/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
