/**
 * Skeleton — placeholder de carga (BV2-04).
 *
 * - aria-hidden (decorativo; el estado de carga lo anuncia el contenedor).
 * - animate-pulse respetando prefers-reduced-motion (ya en tokens.css).
 * - className controlado para fijar forma/tamaño (rounded, h-*, w-*).
 */
import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Forma: rect (rounded-md), circle (rounded-full), text (línea). */
  variant?: 'rect' | 'circle' | 'text';
}

export function Skeleton({ variant = 'rect', className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse motion-reduce:animate-none bg-surface-highlight dark:bg-surface-highlight bg-black/10',
        variant === 'rect' && 'rounded-md',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'rounded h-4 w-full',
        className
      )}
      {...rest}
    />
  );
}

export default Skeleton;
