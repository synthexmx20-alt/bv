/**
 * TextField — campo de texto accesible con label/hint/error asociados (BV2-04).
 *
 * - HTML semántico nativo: <label htmlFor> + <input id>.
 * - hint y error se enlazan con aria-describedby (ids estables por useId).
 * - error activa aria-invalid y se anuncia con role="alert".
 * - forwardRef al <input>; className controlado en el wrapper.
 */
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  /** Texto de ayuda bajo el campo (se enlaza con aria-describedby). */
  hint?: ReactNode;
  /** Mensaje de error (aria-invalid + role=alert). */
  error?: ReactNode;
  /** Clase para el wrapper externo. */
  wrapperClassName?: string;
  /** Clase extra para el propio input. */
  inputClassName?: string;
}

const inputBase =
  'w-full rounded-lg border bg-surface-light dark:bg-surface-dark ' +
  'border-border-light dark:border-border-dark ' +
  'text-text-primary dark:text-white placeholder:text-text-secondary ' +
  'h-11 min-h-[2.75rem] px-4 text-base ' +
  'transition-colors duration-200 ease-out motion-reduce:transition-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d8ef0] focus-visible:border-transparent ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, id, wrapperClassName, inputClassName, required, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-text-primary dark:text-gray-200"
      >
        {label}
        {required ? <span className="ml-0.5 text-[#e05a5a]" aria-hidden="true">*</span> : null}
      </label>
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(inputBase, error && 'border-[#e05a5a] focus-visible:ring-[#e05a5a]', inputClassName)}
        {...rest}
      />
      {hint ? (
        <p id={hintId} className="text-sm text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-[#e05a5a]">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export default TextField;
