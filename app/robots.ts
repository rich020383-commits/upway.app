import type { MetadataRoute } from 'next';

/**
 * robots.txt de upway.business.
 *
 * Historia única voz-first salud: solo se indexan las páginas públicas de
 * marketing. El app (panel health, store) queda fuera del índice: son rutas con
 * sesión y no aportan SEO. `/dashboard/` se retiró (301 a /health).
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://upway.business';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/health/', '/store/', '/login', '/register'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
