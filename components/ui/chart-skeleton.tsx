import { Skeleton } from "./skeleton";

interface ChartSkeletonProps {
  height: number; // px — mismo valor que el h-64/h-72 que reemplaza
}

// Alturas relativas fijas (no aleatorias en cada render, para que no
// "salte" con cada re-render) que insinúan la forma de una gráfica de
// barras real, en vez del "Cargando..." de texto plano centrado que
// usaban todas las gráficas del dashboard.
const BAR_RATIOS = [0.45, 0.75, 0.35, 0.9, 0.6, 0.4, 0.8, 0.55, 0.7, 0.3];

export function ChartSkeleton({ height }: ChartSkeletonProps) {
  return (
    <div className="flex items-end justify-center gap-3 px-4" style={{ height }} aria-hidden="true">
      {BAR_RATIOS.map((ratio, index) => (
        <Skeleton key={index} className="w-8 rounded-t-md rounded-b-none" style={{ height: Math.round(height * ratio) }} />
      ))}
    </div>
  );
}
