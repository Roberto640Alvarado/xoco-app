import { redirect } from "next/navigation";

// El middleware decide el destino real: con sesión activa, /login
// redirige a /dashboard; sin sesión, se queda en /login. Ver middleware.ts.
export default function RootPage() {
  redirect("/login");
}
