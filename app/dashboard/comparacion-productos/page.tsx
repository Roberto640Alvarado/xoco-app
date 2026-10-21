import { ProductComparisonView } from "@/features/sales/components/product-comparison-view";

// Productos → Comparación: se separó de Mejores productos, donde la
// comparación mes en curso vs. mes anterior convivía con los rankings sin
// compartir sus filtros. Toda la lógica vive en la feature de ventas.
export default function ComparacionProductosPage() {
  return <ProductComparisonView />;
}
