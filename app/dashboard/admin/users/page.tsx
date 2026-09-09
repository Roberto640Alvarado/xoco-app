import { CreateUserForm } from "@/features/users/components/create-user-form";
import { UsersTable } from "@/features/users/components/users-table";

export default function AdminUsersPage() {
  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administra quién tiene acceso al panel: crea cuentas, asigna su rol y actívalas o desactívalas. No
          hay registro público — toda cuenta se crea desde aquí.
        </p>
      </div>

      <div className="max-w-2xl">
        <CreateUserForm />
      </div>
      <UsersTable />
    </div>
  );
}
