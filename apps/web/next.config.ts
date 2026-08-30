import type { NextConfig } from 'next';

// Next 16.3 enables the TypeScript CLI checker by default. Its captured
// `tsc --showConfig` output is empty in this environment despite a successful
// process exit, so use the TypeScript API checker instead.
const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;
