import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  // La instancia de Render tiene solo 512MB de RAM. Next.js detecta el número
  // de CPUs de la máquina de build y lanza un worker por núcleo (llegaba a 47
  // workers en paralelo), lo que agota la memoria física sin importar el heap
  // de Node. Forzamos 1 solo worker para que el build quepa en 512MB.
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  typescript: {
    // El type-check completo ya se corre en local/CI antes de mergear. En el
    // build de Render (512MB RAM) el proceso de tsc por separado agota la
    // memoria; lo saltamos aquí para no bloquear el deploy.
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;
