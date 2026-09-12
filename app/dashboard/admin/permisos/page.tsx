import { PermissionsPanel } from "@/features/permissions/components/permissions-panel";

export default function AdminPermissionsPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Permisos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Habilita o deshabilita, por rol, qué módulos del dashboard puede ver cada quien — el cambio aplica
          de inmediato, tanto en el menú como en la API.
        </p>
      </div>

      <PermissionsPanel />
    </div>
  );
}
