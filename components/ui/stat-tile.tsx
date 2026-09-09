import { Skeleton } from "./skeleton";

interface StatTileProps {
  label: string;
  value: string;
  isLoading?: boolean;
}

// Contrato de stat tile (ver dataviz skill): label en minúsculas sin dos
// puntos, value en semibold con figuras proporcionales.
export function StatTile({ label, value, isLoading }: StatTileProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-7 w-20" />
      ) : (
        <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      )}
    </div>
  );
}
