// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';

function render(html: string): HTMLElement {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.firstElementChild as HTMLElement;
}

describe('Button', () => {
  it('renderiza un <button> semántico type=button por defecto', () => {
    const el = render(renderToStaticMarkup(<Button>Comprar</Button>));
    expect(el.tagName.toLowerCase()).toBe('button');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.textContent).toContain('Comprar');
  });

  it('estado disabled emite atributo disabled', () => {
    const el = render(renderToStaticMarkup(<Button disabled>Pagar</Button>));
    expect(el.hasAttribute('disabled')).toBe(true);
  });

  it('estado loading deshabilita y pone aria-busy', () => {
    const el = render(renderToStaticMarkup(<Button loading>Enviando</Button>));
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(el.getAttribute('aria-busy')).toBe('true');
  });

  it('no fija aria-busy cuando no está cargando', () => {
    const el = render(renderToStaticMarkup(<Button>Listo</Button>));
    expect(el.hasAttribute('aria-busy')).toBe(false);
  });

  it('touch target md cumple mínimo 44px (min-h-[2.75rem])', () => {
    const el = render(renderToStaticMarkup(<Button size="md">Ok</Button>));
    expect(el.className).toContain('min-h-[2.75rem]');
  });

  it('acepta className controlado sin perder clases base', () => {
    const el = render(renderToStaticMarkup(<Button className="w-full">Ok</Button>));
    expect(el.className).toContain('w-full');
    expect(el.className).toContain('inline-flex');
  });
});

describe('IconButton', () => {
  it('exige aria-label y lo emite', () => {
    const el = render(renderToStaticMarkup(<IconButton name="close" aria-label="Cerrar" />));
    expect(el.getAttribute('aria-label')).toBe('Cerrar');
  });

  it('usa hit target 44px por defecto', () => {
    const el = render(renderToStaticMarkup(<IconButton name="menu" aria-label="Menú" />));
    expect(el.getAttribute('style')).toContain('44px');
  });

  it('estado loading deshabilita y pone aria-busy', () => {
    const el = render(renderToStaticMarkup(<IconButton name="search" aria-label="Buscar" loading />));
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(el.getAttribute('aria-busy')).toBe('true');
  });
});
