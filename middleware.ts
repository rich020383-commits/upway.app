import { withAuth } from 'next-auth/middleware';

// C4: protección server-side para /dashboard y /health.
// Antes solo existía redirect en cliente (dashboard/layout.tsx), con flash de
// contenido no autenticado. Con esto NextAuth exige JWT antes de servir HTML.
export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  matcher: ['/dashboard/:path*', '/health/:path*'],
};
