import { NextResponse } from 'next/server';
import { verifyAdmin, verifyCustomer } from '@/lib/auth';

function addSecurityHeaders(response) {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // XSS protection for older browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Restrict browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  // Basic Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://cdn.razorpay.com https://accounts.google.com https://www.googletagmanager.com https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleusercontent.com https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com",
      "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://cdn.razorpay.com https://accounts.google.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com",
      "frame-src https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com https://m.youtube.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  return response;
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  const isAdmin = verifyAdmin(request);
  const isCustomer = verifyCustomer(request);

  // Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    // Exclude admin login and API routes if they are in /admin/login
    if (pathname === '/admin/login') {
      if (isAdmin) return addSecurityHeaders(NextResponse.redirect(new URL('/admin/dashboard', request.url)));
      return addSecurityHeaders(NextResponse.next());
    }
    if (!isAdmin) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/admin/login', request.url)));
    }
  }

  // Protect Customer Routes
  const customerRoutes = ['/account', '/my-orders'];
  const isCustomerRoute = customerRoutes.some(route => pathname.startsWith(route));

  if (isCustomerRoute) {
    if (!isCustomer) {
      const registerUrl = new URL('/register', request.url);
      const existingRedirect = request.nextUrl.searchParams.get('redirect');
      const redirectTarget = existingRedirect || pathname;
      registerUrl.searchParams.set('redirect', redirectTarget);
      return addSecurityHeaders(NextResponse.redirect(registerUrl));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/download/:path*',
    '/my-orders/:path*',
    '/login',
    '/register',
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
