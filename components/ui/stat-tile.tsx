import { Skeleton } from "./skeleton";

interface StatTileProps {
  label: string;
  value: string;
  isLoading?: boolean;
  /** La query que alimenta el tile falló — ver nota abajo. */
  isError?: boolean;
}

// Contrato de stat tile (ver dataviz skill): label en minúsculas sin dos
// puntos, value en semibold con figuras proporcionales.
//
// Con `isError` muestra un guion en vez del `value` recibido: cuando la
// petición falla, las páginas calculan sus totales sobre un arreglo vacío
// y el tile terminaba anunciando un "$0.00" que parece un dato real. El
// mensaje del error lo da la gráfica/tabla de al lado (ChartErrorState),
// así que acá no se repite.
export function StatTile({ label, value, isLoading, isError }: StatTileProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-7 w-20" />
      ) : isError ? (
        <p className="mt-1 text-2xl font-semibold text-muted-foreground" aria-label="Sin dato">
          —
        </p>
      ) : (
        <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      )}
    </div>
  );
}
