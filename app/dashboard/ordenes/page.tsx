import { PosTicketsView } from "@/features/pos-tickets/components/pos-tickets-view";

// Tickets → Órdenes: cada orden de caja con su detalle. Toda la lógica vive
// en features/pos-tickets.
export default function OrdenesPage() {
  return <PosTicketsView />;
}
