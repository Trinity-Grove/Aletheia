import type { ReactNode } from 'react';

export function ProductShell({ children }: { children: ReactNode }) {
  return (
    <div className="product-shell">
      <header>
        <strong>Aletheia</strong>
      </header>
      <main>{children}</main>
    </div>
  );
}
