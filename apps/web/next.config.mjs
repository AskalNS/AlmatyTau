/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone — минимальный рантайм-образ: Next копирует только нужные
  // node_modules, итоговый контейнер в разы меньше.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  // Компилируем общий пакет типов из монорепозитория.
  transpilePackages: ['@atm/contracts'],

  images: {
    // Медиа отдаётся с домена MinIO/CDN — разрешаем оптимизацию оттуда.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'minio' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async redirects() {
    return [
      // Корень уводим на язык по умолчанию (middleware уточнит по заголовку).
      { source: '/', destination: '/ru', permanent: false },
    ];
  },
};

export default nextConfig;
