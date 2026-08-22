import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductShell } from '../src/components/product-shell';

describe('ProductShell', () => {
  it('identifies the product and main landmark', () => {
    render(
      <ProductShell>
        <p>Conteúdo</p>
      </ProductShell>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('Aletheia');
    expect(screen.getByRole('main')).toHaveTextContent('Conteúdo');
  });
});
