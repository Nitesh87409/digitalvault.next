import { NextResponse } from 'next/server';
import { verifyAdmin, verifyCustomer } from '@/lib/auth';

export function proxy(request) {
  const { pathname } = request.nextUrl;

  const isAdmin = verifyAdmin(request);
  const isCustomer = verifyCustomer(request);

  // Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    // Exclude admin login and API routes if they are in /admin/login
    if (pathname === '/admin/login') {
      if (isAdmin) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      return NextResponse.next();
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect Customer Routes
  const customerRoutes = ['/account', '/download', '/my-orders'];
  const isCustomerRoute = customerRoutes.some(route => pathname.startsWith(route));

  if (isCustomerRoute) {
    if (!isCustomer) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect from login/register if already logged in
  if (pathname === '/login' || pathname === '/register') {
    if (isCustomer) return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/download/:path*', '/my-orders/:path*', '/login', '/register'],
};
