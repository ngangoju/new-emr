import { NextRequest, NextResponse } from 'next/server'

const ACCESS_TOKEN_COOKIE = 'accessToken'

/**
 * Server-side auth gate for dashboard routes (Next 16 proxy convention).
 * Client layout guard remains as defense-in-depth for role/permission checks.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/design-system')) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  if (accessToken) {
    return NextResponse.next()
  }

  const sessionMarker = request.cookies.get('emr_session')?.value
  if (sessionMarker) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/dashboard/:path*', '/design-system/:path*'],
}
