import { Skeleton } from "./skeleton";

interface TableSkeletonRowsProps {
  rows: number;
  columns: number;
}

// Filas "esqueleto" para el estado de carga de una tabla — reemplaza la
// fila única con colSpan + "Cargando..." que usaban todas las tablas del
// dashboard. Usa <tr>/<td> planos (sin las clases de TableRow/TableCell
// de components/ui/table.tsx) para poder insertarse igual dentro de un
// <tbody> a mano o de un <TableBody> — ambos son solo un <tbody> con
// estilos, así que no hace falta una variante por cada uno.
export function TableSkeletonRows({ rows, columns }: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border last:border-b-0">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex} className="py-3 pr-4 last:pr-0">
              <Skeleton className="h-4 w-full max-w-24" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
