import { describe, expect, it } from 'vitest';
import { MAIN_NAV_ITEMS } from '../src/components/layout/product-shell';
import nextConfig from '../next.config';

describe('apps/web admin decoupling', () => {
  describe('MAIN_NAV_ITEMS', () => {
    it('does not contain any item with id or href matching /admin', () => {
      const adminItems = MAIN_NAV_ITEMS.filter(
        (item) => item.id.includes('admin') || item.href.includes('/admin') || item.href.startsWith('/admin'),
      );
      expect(adminItems).toHaveLength(0);
    });

    it('contains product-focused items only and excludes admin-catalog', () => {
      const itemIds = MAIN_NAV_ITEMS.map((item) => item.id);
      expect(itemIds).not.toContain('admin-catalog');
      expect(itemIds).toContain('home');
      expect(itemIds).toContain('learners');
      expect(itemIds).toContain('curriculum');
      expect(itemIds).toContain('settings');
    });
  });

  describe('next.config.ts redirects', () => {
    it('redirects /admin/:path* to backoffice destination with temporary redirect (permanent: false)', async () => {
      expect(nextConfig.redirects).toBeDefined();
      const redirects = await nextConfig.redirects!();
      const adminRedirect = redirects.find((r) => r.source === '/admin/:path*');
      expect(adminRedirect).toBeDefined();
      expect(adminRedirect?.destination).toBe('http://localhost:3002/:path*');
      expect(adminRedirect?.permanent).toBe(false);
    });

    it('honors NEXT_PUBLIC_BACKOFFICE_URL environment variable and strips trailing slashes', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_BACKOFFICE_URL;
      try {
        process.env.NEXT_PUBLIC_BACKOFFICE_URL = 'https://backoffice.aletheia.app///';
        const redirects = await nextConfig.redirects!();
        const adminRedirect = redirects.find((r) => r.source === '/admin/:path*');
        expect(adminRedirect?.destination).toBe('https://backoffice.aletheia.app/:path*');
      } finally {
        if (originalEnv === undefined) {
          delete process.env.NEXT_PUBLIC_BACKOFFICE_URL;
        } else {
          process.env.NEXT_PUBLIC_BACKOFFICE_URL = originalEnv;
        }
      }
    });
  });
});
