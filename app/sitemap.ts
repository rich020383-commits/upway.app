import type { MetadataRoute } from 'next';

/**
 * Sitemap de upway.business.
 *
 * Google tiene indexada una versión antigua genérica de UpWay Business
 * (con sectores retail/supermercado/droguería). Este sitemap le dice la
 * historia vigente: voz-first salud, precios y legales. Las mini-landings
 * de /industries se retiraron y quedan con redirect 301 al home.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://upway.business';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/precios`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terminos`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
