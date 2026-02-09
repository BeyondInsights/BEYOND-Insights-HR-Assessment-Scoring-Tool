/** @type {import('next').NextConfig} */

// Only require obfuscator in production to avoid dev issues
const JavaScriptObfuscator = process.env.NODE_ENV === 'production' 
  ? require('javascript-obfuscator') 
  : null;

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
  // BUILD OPTIMIZATION + CODE OBFUSCATION
  // ============================================
  
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
    
    // Production client-side only: add obfuscation
    if (!isServer && !dev && process.env.NODE_ENV === 'production') {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
      
      // Add custom obfuscation plugin
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.emit.tapAsync('ObfuscatorPlugin', (compilation, callback) => {
            // Only obfuscate JS files
            Object.keys(compilation.assets).forEach((filename) => {
              if (filename.endsWith('.js') && !filename.includes('node_modules')) {
                try {
                  const asset = compilation.assets[filename];
                  const source = asset.source();
                  
                  // Skip if too small (likely not application code)
                  if (source.length < 1000) return;
                  
                  const obfuscatedCode = JavaScriptObfuscator.obfuscate(source, {
                    // Balanced settings: good protection without breaking functionality
                    compact: true,
                    controlFlowFlattening: false, // Can break some code, keep off
                    deadCodeInjection: false, // Increases size significantly
                    debugProtection: false, // Can cause issues
                    disableConsoleOutput: false, // We handle this separately
                    identifierNamesGenerator: 'hexadecimal', // _0x3f2a style names
                    log: false,
                    numbersToExpressions: true, // 5 becomes 2+3
                    renameGlobals: false, // Keep off to avoid breaking imports
                    selfDefending: false, // Can cause issues
                    simplify: true,
                    splitStrings: true, // Splits strings into chunks
                    splitStringsChunkLength: 10,
                    stringArray: true, // Moves strings to array
                    stringArrayCallsTransform: true,
                    stringArrayEncoding: ['base64'], // Encodes strings
                    stringArrayIndexShift: true,
                    stringArrayRotate: true,
                    stringArrayShuffle: true,
                    stringArrayWrappersCount: 2,
                    stringArrayWrappersChainedCalls: true,
                    stringArrayWrappersParametersMaxCount: 4,
                    stringArrayWrappersType: 'function',
                    stringArrayThreshold: 0.75,
                    transformObjectKeys: true, // Obfuscates object keys
                    unicodeEscapeSequence: false, // Keep readable for debugging
                  }).getObfuscatedCode();
                  
                  compilation.assets[filename] = {
                    source: () => obfuscatedCode,
                    size: () => obfuscatedCode.length,
                  };
                } catch (e) {
                  // If obfuscation fails for a file, skip it (don't break build)
                  console.warn(`Obfuscation skipped for ${filename}:`, e.message);
                }
              }
            });
            callback();
          });
        },
      });
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
