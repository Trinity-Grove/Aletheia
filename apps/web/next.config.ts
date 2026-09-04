import type { NextConfig } from 'next';

// Next 16.3 enables the TypeScript CLI checker by default. Its captured
// `tsc --showConfig` output is empty in this environment despite a successful
// process exit, so use the TypeScript API checker instead.
const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    useTypeScriptCli: false,
  },
  // Most pages call the backend via a literal relative `fetch('/api/v1/...')`
  // rather than the NEXT_PUBLIC_API_URL-aware client in src/lib/api — so
  // without this rewrite, every one of those calls resolves against this
  // Next.js server's own origin, which never has anything listening at
  // /api/*, and 404s. This proxies same-origin /api/* requests server-side
  // to the real NestJS API (API_PROXY_TARGET, defaulting to the local dev
  // port), so relative fetches work against a real backend without having
  // to rewrite every call site to use an absolute URL.
  async rewrites() {
    const apiOrigin = (process.env.API_PROXY_TARGET || 'http://127.0.0.1:3001').replace(/\/+$/, '');
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
