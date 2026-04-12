import { NextResponse } from 'next/server';

const LOGIN_PATH = '/login';
const DASHBOARD_PATH = '/dashboard';
const DASHBOARD_ADMIN_PATH = '/dashboard/admin';
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

async function validateSession(token) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { isValid: false, role: null };
    }

    const data = await response.json();
    return {
      isValid: true,
      role: data?.role || null,
    };
  } catch {
    return { isValid: false, role: null };
  }
}

function buildLoginRedirect(request, pathname, search) {
  const loginUrl = new URL(LOGIN_PATH, request.url);
  const nextPath = `${pathname}${search || ''}`;
  loginUrl.searchParams.set('next', nextPath);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.set('auth_token', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
  });
  response.cookies.set('auth_role', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
  });
  return response;
}

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const authToken = request.cookies.get('auth_token')?.value;
  const authRole = request.cookies.get('auth_role')?.value;

  if (pathname.startsWith(DASHBOARD_PATH)) {
    if (!authToken) {
      return buildLoginRedirect(request, pathname, search);
    }

    const session = await validateSession(authToken);
    if (!session.isValid) {
      return buildLoginRedirect(request, pathname, search);
    }

    if (
      pathname.startsWith(DASHBOARD_ADMIN_PATH) &&
      session.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
    }

    const response = NextResponse.next();
    if (session.role && authRole !== session.role) {
      response.cookies.set('auth_role', session.role, {
        path: '/',
        maxAge: 60 * 60 * 12,
        sameSite: 'lax',
      });
    }
    return response;
  }

  if (pathname === LOGIN_PATH && authToken) {
    const session = await validateSession(authToken);

    if (!session.isValid) {
      const response = NextResponse.next();
      response.cookies.set('auth_token', '', {
        path: '/',
        maxAge: 0,
        sameSite: 'lax',
      });
      response.cookies.set('auth_role', '', {
        path: '/',
        maxAge: 0,
        sameSite: 'lax',
      });
      return response;
    }

    if (session.role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL(DASHBOARD_ADMIN_PATH, request.url));
    }

    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};