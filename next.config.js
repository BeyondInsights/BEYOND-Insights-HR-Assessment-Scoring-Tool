/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ============================================
  // SECURITY HARDENING
  // ============================================
  
  // CRITICAL: Disable source maps in production
  // This prevents anyone from reconstructing your original code
  productionBrowserSourceMaps: false,
  
  // Remove console.log statements in production builds
  // Prevents accidental data leakage through console
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error/warn for debugging
    } : false,
  },
  
  // Disable x-powered-by header (minor security through obscurity)
  poweredByHeader: false,
  
  // ============================================
  // BUILD OPTIMIZATION
  // ============================================
  
  webpack: (config, { isServer }) => {
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
    
    // Additional minification for production
    if (!isServer && process.env.NODE_ENV === 'production') {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    
    return config;
  },
  
  // Security headers (also defined in netlify.toml for redundancy)
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
