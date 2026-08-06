/**
 * SelectField — select accesible con label/hint/error asociados (BV2-04).
 *
 * - <label htmlFor> + <select id>; hint/error con aria-describedby.
 * - appearance-none heredado; chevron propio (Icon expand_more) accesible.
 * - forwardRef al <select>; HTML semántico nativo.
 */
import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Icon } from '../Icon';
import { cn } from './cn';

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
  selectClassName?: string;
  children: ReactNode;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, id, wrapperClassName, selectClassName, required, children, ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-text-primary dark:text-gray-200"
      >
        {label}
        {required ? <span className="ml-0.5 text-[#e05a5a]" aria-hidden="true">*</span> : null}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full appearance-none rounded-lg border bg-surface-light dark:bg-surface-dark ' +
              'border-border-light dark:border-border-dark ' +
              'text-text-primary dark:text-white ' +
              'h-11 min-h-[2.75rem] pl-4 pr-10 text-base ' +
              'transition-colors duration-200 ease-out motion-reduce:transition-none ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d8ef0] focus-visible:border-transparent ' +
              'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-[#e05a5a] focus-visible:ring-[#e05a5a]',
            selectClassName
          )}
          {...rest}
        >
          {children}
        </select>
        <span
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-secondary"
          aria-hidden="true"
        >
          <Icon name="expand_more" size={20} />
        </span>
      </div>
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

export default SelectField;
