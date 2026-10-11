// Última vez que el usuario abrió Inventario → Movimientos en ESTE
// navegador — el Vendedor lo manda como `since` para que el aviso cuente
// solo lo que Admin/Finanzas resolvió después. Es una comodidad por
// dispositivo (localStorage), no estado compartido: si está bloqueado o
// vacío, el backend cae a los últimos 7 días.
const keyFor = (email: string) => `xoco:movements-last-seen:${email}`;

export function readMovementsLastSeen(email: string): string | undefined {
  try {
    return window.localStorage.getItem(keyFor(email)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function markMovementsSeen(email: string): void {
  try {
    window.localStorage.setItem(keyFor(email), new Date().toISOString());
  } catch {
    // sin storage: no pasa nada, el backend usa su ventana por defecto
  }
}
