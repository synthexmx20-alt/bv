// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { InlineAlert } from '../../components/ui/InlineAlert';
import { Skeleton } from '../../components/ui/Skeleton';

function render(html: string): HTMLElement {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.firstElementChild as HTMLElement;
}

describe('InlineAlert', () => {
  it('error usa role=alert', () => {
    const el = render(renderToStaticMarkup(<InlineAlert tone="error">Pago rechazado</InlineAlert>));
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.textContent).toContain('Pago rechazado');
  });

  it('success/info usan role=status (polite)', () => {
    expect(render(renderToStaticMarkup(<InlineAlert tone="success">Listo</InlineAlert>)).getAttribute('role')).toBe('status');
    expect(render(renderToStaticMarkup(<InlineAlert tone="info">Nota</InlineAlert>)).getAttribute('role')).toBe('status');
  });

  it('el icono es decorativo (aria-hidden)', () => {
    const el = render(renderToStaticMarkup(<InlineAlert tone="success">Ok</InlineAlert>));
    const iconWrap = el.querySelector('[aria-hidden="true"]');
    expect(iconWrap).toBeTruthy();
  });

  it('permite ocultar el icono', () => {
    const el = render(renderToStaticMarkup(<InlineAlert tone="info" icon={false}>Sin icono</InlineAlert>));
    expect(el.querySelector('svg')).toBeNull();
  });
});

describe('Skeleton', () => {
  it('es decorativo (aria-hidden) y animado con reduced-motion', () => {
    const el = render(renderToStaticMarkup(<Skeleton className="h-6 w-24" />));
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.className).toContain('animate-pulse');
    expect(el.className).toContain('motion-reduce:animate-none');
  });
});
