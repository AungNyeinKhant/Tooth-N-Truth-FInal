import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper function to decode JWT and get role
function getUserRoleFromToken(token: string): string | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.role || null;
  } catch (e) {
    return null;
  }
}

// Helper to check if token has valid structure (not expired check - that's handled by API)
function isTokenValid(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return false;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    
    // Just check if it has required fields - don't check expiration here
    // Token refresh is handled by axios interceptor on API calls
    return !!(payload.sub && payload.role);
  } catch (e) {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  
  let userRole: string | null = null;
  let isAuthenticated = false;
  
  if (accessToken && isTokenValid(accessToken)) {
    userRole = getUserRoleFromToken(accessToken);
    isAuthenticated = !!userRole;
  } else if (refreshToken) {
    userRole = getUserRoleFromToken(refreshToken);
    isAuthenticated = !!userRole;
  }

  // Define route types
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isAdminRoute = pathname.startsWith('/admin');
  const isBranchManagerRoute = pathname.startsWith('/branch-manager');

  // 1. Auth pages (/login, /register) - ALWAYS PUBLIC
  if (isAuthPage) {
    if (!isAuthenticated) {
      // Anonymous or invalid token - ALLOW access to login/register
      return NextResponse.next();
    } else {
      // Authenticated user accessing login/register - REDIRECT to their dashboard
      if (userRole === 'PATIENT') {
        return NextResponse.redirect(new URL('/', request.url));
      } else if (userRole === 'BRANCH_MANAGER') {
        return NextResponse.redirect(new URL('/branch-manager/dashboard', request.url));
      } else if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 2. Home page (/) and book page (/book) - ALWAYS PUBLIC
  if (pathname === '/' || pathname === '/book') {
    return NextResponse.next();
  }

  // 3. If user is not authenticated (no valid token) and trying to access protected route
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. If user is authenticated, check role-based access
  // Admin routes - only ADMIN allowed
  if (isAdminRoute && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Branch Manager routes - only BRANCH_MANAGER allowed
  if (isBranchManagerRoute && userRole !== 'BRANCH_MANAGER') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
