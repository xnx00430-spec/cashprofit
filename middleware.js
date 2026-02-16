import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || '');

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Routes publiques (pages)
  const publicPaths = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/legal/terms',
    '/legal/privacy'
  ];

  // Routes publiques (API)
  const publicApiPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/payments/webhook',   // PawaPay callback (pas de cookie)
    '/api/cron'                // Cron jobs
  ];

  // Vérifier routes publiques
  if (publicPaths.includes(pathname) || publicApiPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Fichiers statiques
  if (pathname.startsWith('/_next') || pathname.includes('.') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Vérifier token
  const token = request.cookies.get('accessToken')?.value;

  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ message: 'Auth required' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Protection admin
    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/user', request.url));
    }

    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-role', payload.role);
    return response;

  } catch (error) {
    console.log('🚫 Invalid token:', error.message);

    if (pathname.startsWith('/api')) {
      return NextResponse.json({ message: 'Token invalide' }, { status: 401 });
    }

    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|images).*)'],
};