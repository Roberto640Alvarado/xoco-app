// Traduce `pos.payment.method.type` (Odoo) a etiqueta + color de UI —
// compartido entre la tabla de detalle y la gráfica de
// /dashboard/efectivo-otros-medios para que ambas usen exactamente la
// misma clasificación (ver CLAUDE.md, "Nunca duplicar
// validaciones/lógica").
//
// Los métodos reales de esta empresa, según la investigación en Odoo
// (ver plan-history "buscador-compradores-efectivo-otros-medios"), solo
// traen `cash` (uno por tienda: "Efectivo Ramblas", "Efectivo SB"...) y
// `bank` (Tarjeta, bancos por nombre, transferencias, apps de delivery)
// y `pay_later` (Cuenta de cliente). `pay_now` no se vio en los datos
// reales pero es un type estándar de Odoo; cualquier type nuevo que
// Odoo agregue cae al fallback "Otro" en vez de romper la vista.
export interface PaymentMethodTypeMeta {
  label: string;
  color: string;
}

const PAYMENT_METHOD_TYPE_META: Record<string, PaymentMethodTypeMeta> = {
  cash: { label: "Efectivo", color: "var(--color-chart-1)" },
  bank: { label: "Tarjeta / transferencia", color: "var(--color-chart-2)" },
  pay_later: { label: "Cuenta de cliente", color: "var(--color-chart-3)" },
  pay_now: { label: "Pago en línea", color: "var(--color-chart-4)" },
};

const FALLBACK_TYPE_META: PaymentMethodTypeMeta = { label: "Otro", color: "var(--color-chart-5)" };

export function paymentMethodTypeMeta(type: string): PaymentMethodTypeMeta {
  return PAYMENT_METHOD_TYPE_META[type] ?? FALLBACK_TYPE_META;
}
