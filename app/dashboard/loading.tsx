import { ChocolateLoader } from "@/design-system/components/chocolate-loader";

// Se muestra mientras cambia de sección. Aparece con un pequeño retraso para
// no parpadear cuando la pantalla carga rápido.
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <ChocolateLoader delayed />
    </div>
  );
}
