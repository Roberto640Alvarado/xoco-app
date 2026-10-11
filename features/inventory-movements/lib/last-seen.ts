// Última vez que el usuario abrió Movimientos / Solicitudes en ESTE
// navegador — el Vendedor lo manda como `since*` para que el aviso cuente
// solo lo que Admin/Finanzas resolvió después. Es una comodidad por
// dispositivo (localStorage), no estado compartido: si está bloqueado o
// vacío, el backend cae a los últimos 7 días.
export type SeenScope = "movements" | "requests";

const keyFor = (email: string, scope: SeenScope) => `xoco:inventory-${scope}-last-seen:${email}`;

export function readLastSeen(email: string, scope: SeenScope): string | undefined {
  try {
    return window.localStorage.getItem(keyFor(email, scope)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function markSeen(email: string, scope: SeenScope): void {
  try {
    window.localStorage.setItem(keyFor(email, scope), new Date().toISOString());
  } catch {
    // sin storage: no pasa nada, el backend usa su ventana por defecto
  }
}
