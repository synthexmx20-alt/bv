/**
 * RouteFallback — estado de carga consistente para rutas diferidas (BV2-05).
 *
 * Se muestra mientras React.lazy descarga el chunk de una página. Usa Skeleton
 * (BV2-04) y anuncia el estado de carga de forma accesible sin fijar copy de negocio.
 */
import { Skeleton } from '../ui/Skeleton';

export function RouteFallback() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-[60vh] w-full flex-col gap-4 px-4 py-8 md:px-10 lg:px-20"
    >
      <span className="sr-only">Cargando…</span>
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-40 w-full" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export default RouteFallback;
