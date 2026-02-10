/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  webpack: (config, { isServer, dev }) => {
    // Exclude archive/backup folders from builds
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules',
        '**/_archive',
        '**/old2app',
        '**/backup_*',
      ],
    };
    
    return config;
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
