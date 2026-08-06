// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TextField } from '../../components/ui/TextField';
import { SelectField } from '../../components/ui/SelectField';

function doc(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('TextField — relación label/hint/error', () => {
  it('asocia <label htmlFor> con <input id>', () => {
    const d = doc(renderToStaticMarkup(<TextField label="Nombre" name="nombre" />));
    const label = d.querySelector('label')!;
    const input = d.querySelector('input')!;
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.id).toBeTruthy();
  });

  it('enlaza hint y error con aria-describedby', () => {
    const d = doc(renderToStaticMarkup(
      <TextField label="Email" hint="Usa tu correo" error="Correo inválido" />
    ));
    const input = d.querySelector('input')!;
    const describedBy = input.getAttribute('aria-describedby')!;
    const hint = d.querySelector('p:not([role])')!;
    const error = d.querySelector('[role="alert"]')!;
    expect(describedBy).toContain(hint.id);
    expect(describedBy).toContain(error.id);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(error.textContent).toContain('Correo inválido');
  });

  it('sin error no emite aria-invalid ni aria-describedby', () => {
    const d = doc(renderToStaticMarkup(<TextField label="Tel" />));
    const input = d.querySelector('input')!;
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(input.hasAttribute('aria-describedby')).toBe(false);
  });

  it('marca required con asterisco decorativo (aria-hidden)', () => {
    const d = doc(renderToStaticMarkup(<TextField label="CP" required />));
    expect(d.querySelector('input')!.hasAttribute('required')).toBe(true);
    const star = d.querySelector('label span[aria-hidden="true"]');
    expect(star).toBeTruthy();
  });
});

describe('SelectField — relación label/error', () => {
  it('asocia label con select y enlaza error', () => {
    const d = doc(renderToStaticMarkup(
      <SelectField label="Zona" error="Selecciona una zona">
        <option value="a">A</option>
      </SelectField>
    ));
    const label = d.querySelector('label')!;
    const select = d.querySelector('select')!;
    expect(label.getAttribute('for')).toBe(select.id);
    const error = d.querySelector('[role="alert"]')!;
    expect(select.getAttribute('aria-describedby')).toContain(error.id);
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(select.querySelector('option')!.textContent).toBe('A');
  });
});
