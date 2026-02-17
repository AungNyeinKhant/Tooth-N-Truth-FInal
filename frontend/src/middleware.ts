import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper function to decode JWT and get role
function getUserRoleFromToken(token: string): string | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.role || null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // If user is not authenticated and trying to access protected route
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If user is authenticated and trying to access auth pages
  if (token && (pathname === '/login' || pathname === '/register')) {
    const userRole = getUserRoleFromToken(token);
    
    // Redirect based on role
    if (userRole === 'PATIENT') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else if (userRole === 'BRANCH_MANAGER') {
      return NextResponse.redirect(new URL('/branch-manager/dashboard', request.url));
    } else if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    
    // Fallback to home if role not recognized
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
