/**
 * Price — formato de moneda MXN accesible y consistente (BV2-04).
 *
 * - Intl.NumberFormat('es-MX', currency MXN): nunca concatenar "$" a mano.
 * - Envuelve en <data> con value=numérico para HTML semántico.
 */
import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export interface PriceProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Monto en la unidad principal (pesos). */
  amount: number;
  /** Fracción de dígitos; por defecto 2 (formato moneda estándar). */
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

const formatterCache = new Map<string, Intl.NumberFormat>();
function getFormatter(min: number, max: number) {
  const key = `${min}-${max}`;
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    });
    formatterCache.set(key, f);
  }
  return f;
}

export function Price({
  amount,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  className,
  ...rest
}: PriceProps) {
  const formatted = getFormatter(minimumFractionDigits, maximumFractionDigits).format(amount);
  return (
    <data value={amount} className={cn('tabular-nums', className)} {...rest}>
      {formatted}
    </data>
  );
}

export default Price;
