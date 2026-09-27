import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    useTypeScriptCli: false,
  },
  async rewrites() {
    const apiOrigin = (process.env.API_PROXY_TARGET || 'http://127.0.0.1:3001').replace(/\/+$/, '');
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
