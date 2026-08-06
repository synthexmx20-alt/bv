/**
 * IconButton — botón cuadrado accesible con un único icono (BV2-04).
 *
 * - Touch target mínimo 44×44px por defecto (WCAG 2.5.5).
 * - aria-label OBLIGATORIO: un botón solo-ícono no tiene texto visible.
 * - Estados disabled/loading; forwardRef; className controlado.
 */
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icon';
import { cn } from './cn';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  name: IconName;
  /** Etiqueta accesible requerida (qué hace el botón). */
  'aria-label': string;
  size?: number;
  /** Tamaño del hit target; por defecto 44px. */
  hitSize?: number;
  loading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { name, size = 24, hitSize = 44, loading = false, disabled, className, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-lg shrink-0 ' +
          'transition-colors duration-200 ease-out ' +
          'hover:bg-black/10 dark:hover:bg-white/10 ' +
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d8ef0] focus-visible:ring-offset-2 ' +
          'disabled:opacity-50 disabled:pointer-events-none motion-reduce:transition-none',
        className
      )}
      style={{ width: hitSize, height: hitSize, minWidth: hitSize, minHeight: hitSize }}
      {...rest}
    >
      {loading ? (
        <svg className="animate-spin motion-reduce:animate-none" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        <Icon name={name} size={size} />
      )}
    </button>
  );
});

export default IconButton;
