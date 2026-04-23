import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/register', '/api/auth/login', '/api/auth/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (isPublic) return NextResponse.next()

  const token = request.cookies.get('auth-token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Middleware gates page navigation only. API routes self-authenticate via
  // getAuthUser(). Static assets (images, fonts, icons) must never hit the
  // middleware — they’re public and re-verifying JWT on every request wastes
  // TTFB and blows up the middleware invocation count.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?)$).*)',
  ],
}
