import { CreateUserForm } from "@/features/users/components/create-user-form";
import { UsersTable } from "@/features/users/components/users-table";

export default function AdminUsersPage() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Altas y bajas de cuentas SUPER_ADMIN / FINANZAS. No hay registro público — toda cuenta se crea desde aquí.
        </p>
      </div>

      <CreateUserForm />
      <UsersTable />
    </div>
  );
}
