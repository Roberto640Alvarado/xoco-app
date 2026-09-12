interface ChartErrorStateProps {
  /** `message` de la API (ya viene en español, listo para mostrar). */
  message?: string | null;
}

// Estado de error de una gráfica, con la MISMA altura (h-64) que su
// estado vacío y su skeleton, para que el bloque no cambie de tamaño
// según cómo salga el request.
//
// Existe porque las gráficas solo recibían `isLoading`: un request
// fallido caía en el estado vacío y se leía como "no hubo ventas en el
// rango". Pasó de verdad — los reportes contra endpoints que la API
// todavía no exponía se veían como rangos sin datos en vez de como un
// error. Mismo texto que el de las tablas (ej. daily-sales-table).
export function ChartErrorState({ message }: ChartErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex h-64 items-center justify-center px-4 text-center text-sm text-destructive"
    >
      No se pudo cargar{message ? `: ${message}` : "."}
    </div>
  );
}
