import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren autenticación
const protectedRoutes = ['/chat', '/tiktok'];

// Rutas públicas (solo accesibles sin autenticación)
const publicRoutes = ['/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Obtener token del localStorage no es posible en middleware server-side
  // Así que usaremos cookies como alternativa
  const token = request.cookies.get('auth-token')?.value;
  
  // Verificar si la ruta actual es protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route
  );
  
  // Si es una ruta protegida y no hay token, redirigir al login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Si está autenticado y trata de acceder a rutas públicas, redirigir a /chat
  if (isPublicRoute && token) {
    const chatUrl = new URL('/chat', request.url);
    return NextResponse.redirect(chatUrl);
  }
  
  return NextResponse.next();
}

// Configurar en qué rutas debe ejecutarse el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};