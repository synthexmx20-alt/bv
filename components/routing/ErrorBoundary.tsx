/**
 * ErrorBoundary — captura fallos de carga de chunks y de render (BV2-05).
 *
 * Cuando un chunk lazy falla (p. ej. red caída o deploy nuevo con hashes
 * distintos), muestra una recuperación con opción de recargar. No filtra
 * stack traces ni detalles internos en la UI; los deja en consola.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Detalles internos solo en consola, nunca en la UI.
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <h2 className="text-xl font-semibold text-text-primary dark:text-white">
            Algo salió mal
          </h2>
          <p className="max-w-md text-sm text-text-secondary">
            No pudimos cargar esta sección. Revisa tu conexión e inténtalo de nuevo.
          </p>
          <Button onClick={this.handleReload}>Recargar</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
