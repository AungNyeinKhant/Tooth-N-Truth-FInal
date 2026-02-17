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
    console.log('[Middleware] Token decode error:', e);
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookie
  const token = request.cookies.get('accessToken')?.value;
  
  // Debug logging
  console.log('='.repeat(50));
  console.log('[Middleware] Pathname:', pathname);
  console.log('[Middleware] Token exists:', !!token);
  console.log('[Middleware] Token value:', token ? token.substring(0, 50) + '...' : 'null');
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);
  console.log('[Middleware] Is public route:', isPublicRoute);
  
  // If user is not authenticated and trying to access protected route
  if (!token && !isPublicRoute) {
    console.log('[Middleware] REDIRECTING to /login - no token for protected route');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If user is authenticated and trying to access auth pages
  if (token && (pathname === '/login' || pathname === '/register')) {
    const userRole = getUserRoleFromToken(token);
    console.log('[Middleware] User role:', userRole);
    console.log('[Middleware] Authenticated user accessing auth page - redirecting');
    
    // Redirect based on role
    if (userRole === 'PATIENT') {
      console.log('[Middleware] Redirecting PATIENT to /');
      return NextResponse.redirect(new URL('/', request.url));
    } else if (userRole === 'BRANCH_MANAGER') {
      return NextResponse.redirect(new URL('/branch-manager/dashboard', request.url));
    } else if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    
    // Fallback to home if role not recognized
    console.log('[Middleware] Role not recognized, redirecting to /');
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  console.log('[Middleware] ALLOWING request to proceed');
  console.log('='.repeat(50));
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
