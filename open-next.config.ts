import type { OpenNextConfig } from '@opennextjs/cloudflare';

const config: OpenNextConfig = {
  // Cloudflare-specific configuration
  cloudflare: {
    // Minimize worker configuration to avoid binding issues
    worker: {
      routes: {
        include: ['/*'],
        exclude: ['/assets/*', '/_next/*'],
      },
    },
  },

  // App-specific configuration
  app: {
    // Keep default settings
  },

  // Build configuration
  build: {
    // Ensure assets are properly handled
    output: 'standalone',
  },
};

export default config;
