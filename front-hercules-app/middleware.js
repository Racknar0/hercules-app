import { NextResponse } from 'next/server';

const LOGIN_PATH = '/login';
const DASHBOARD_PATH = '/dashboard';
const DASHBOARD_ADMIN_PATH = '/dashboard/admin';

export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const authToken = request.cookies.get('auth_token')?.value;
  const authRole = request.cookies.get('auth_role')?.value;

  if (pathname.startsWith(DASHBOARD_PATH)) {
    if (!authToken) {
      const loginUrl = new URL(LOGIN_PATH, request.url);
      const nextPath = `${pathname}${search || ''}`;
      loginUrl.searchParams.set('next', nextPath);
      return NextResponse.redirect(loginUrl);
    }

    if (
      pathname.startsWith(DASHBOARD_ADMIN_PATH) &&
      authRole !== 'SUPER_ADMIN'
    ) {
      return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
    }
  }

  if (pathname === LOGIN_PATH && authToken) {
    if (authRole === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL(DASHBOARD_ADMIN_PATH, request.url));
    }

    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};