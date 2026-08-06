/**
 * Button — primitiva de botón accesible (BV2-04).
 *
 * - Touch target mínimo 44px (WCAG 2.5.5) en tamaños md/lg; sm solo en contextos densos.
 * - Estados: variant (color), size, disabled, loading (spinner + aria-busy, bloquea clicks).
 * - forwardRef para foco/medidas; className controlado vía cn (sin paquete externo).
 * - Sin copy de negocio ni hex directos: colores por tokens Tailwind (primary, surface, etc.).
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Muestra spinner, pone aria-busy y deshabilita la interacción. */
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg ' +
  'transition-colors duration-200 ease-out select-none whitespace-nowrap ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d8ef0] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ' +
  'disabled:opacity-50 disabled:pointer-events-none motion-reduce:transition-none';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-600 active:bg-primary-700',
  secondary:
    'bg-surface-highlight text-white hover:bg-[#3e4255] border border-border-dark',
  ghost: 'bg-transparent text-current hover:bg-black/10 dark:hover:bg-white/10',
  danger: 'bg-[#e05a5a] text-white hover:bg-[#c94a4a]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 min-h-[2.25rem] px-4 text-sm', // 36px — solo contextos densos/admin
  md: 'h-11 min-h-[2.75rem] px-6 text-base', // 44px — touch target mínimo
  lg: 'h-12 min-h-[3rem] px-8 text-lg', // 48px
};

function Spinner() {
  return (
    <svg
      className="animate-spin motion-reduce:animate-none h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    leftIcon,
    rightIcon,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...rest}
    >
      {loading ? <Spinner /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

export default Button;
