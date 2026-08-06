// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Price } from '../../components/ui/Price';

function render(html: string): HTMLElement {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.firstElementChild as HTMLElement;
}

describe('Price', () => {
  it('formatea MXN con Intl es-MX sin concatenar $ manualmente', () => {
    const el = render(renderToStaticMarkup(<Price amount={1250} />));
    expect(el.textContent).toContain('$');
    expect(el.textContent).toMatch(/1,250/);
    // símbolo de moneda proviene de Intl, no de concatenación manual
    expect(el.textContent).toMatch(/\$\s?1,250\.00/);
  });

  it('respeta decimales configurables', () => {
    const el = render(renderToStaticMarkup(<Price amount={99.5} minimumFractionDigits={0} maximumFractionDigits={0} />));
    expect(el.textContent).toMatch(/\$\s?100/);
    expect(el.textContent).not.toContain('.00');
  });

  it('usa elemento <data> semántico con value numérico', () => {
    const el = render(renderToStaticMarkup(<Price amount={42.5} />));
    expect(el.tagName.toLowerCase()).toBe('data');
    expect(el.getAttribute('value')).toBe('42.5');
  });

  it('formatea cero y negativos correctamente', () => {
    expect(render(renderToStaticMarkup(<Price amount={0} />)).textContent).toMatch(/\$\s?0\.00/);
    expect(render(renderToStaticMarkup(<Price amount={-15} />)).textContent).toContain('-');
  });
});
