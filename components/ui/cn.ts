/**
 * cn — helper mínimo para componer className de forma controlada.
 * Evita una dependencia externa (clsx/classnames) para un caso tan pequeño.
 * Acepta strings, falsy y arrays; ignora valores vacíos.
 */
export type ClassValue = string | number | null | false | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) out.push(inner);
    } else {
      out.push(String(input));
    }
  }
  return out.join(' ');
}
