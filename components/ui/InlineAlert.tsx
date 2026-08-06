/**
 * InlineAlert — mensaje de estado en línea (BV2-04).
 *
 * - Variantes success/error/warning/info usando tokens de estado (no hex de negocio).
 * - role="alert" para error (urgente) y role="status" para el resto (polite).
 * - Icono acorde al tono; contenido via children (sin copy fijado).
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import { cn } from './cn';

export type InlineAlertTone = 'success' | 'error' | 'warning' | 'info';

export interface InlineAlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: InlineAlertTone;
  icon?: IconName | false;
  children: ReactNode;
}

const toneConfig: Record<InlineAlertTone, { classes: string; icon: IconName; role: 'alert' | 'status' }> = {
  success: {
    classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: 'check_circle',
    role: 'status',
  },
  error: {
    classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: 'error',
    role: 'alert',
  },
  warning: {
    classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    icon: 'info',
    role: 'status',
  },
  info: {
    classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: 'info',
    role: 'status',
  },
};

export function InlineAlert({ tone = 'info', icon, children, className, ...rest }: InlineAlertProps) {
  const { classes, icon: defaultIcon, role } = toneConfig[tone];
  const iconName = icon === false ? null : icon ?? defaultIcon;
  return (
    <div
      role={role}
      className={cn(
        'flex items-start gap-2 rounded-lg p-4 text-sm',
        classes,
        className
      )}
      {...rest}
    >
      {iconName ? (
        <span className="mt-0.5 shrink-0" aria-hidden="true">
          <Icon name={iconName} size={20} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default InlineAlert;
