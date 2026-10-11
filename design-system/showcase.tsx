"use client";

import { useState, type ReactNode } from "react";
import { Eye, Loader2, PackagePlus, Plus, Save, Trash2, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChocolateBreak } from "@/design-system/components/chocolate-break";
import { ChocolateLoader } from "@/design-system/components/chocolate-loader";
import { DataTable, type DataTableColumn } from "@/design-system/components/data-table";
import { InfoBadge, type InfoBadgeTone } from "@/design-system/components/info-badge";
import { Input } from "@/components/ui/input";
import { Panel } from "@/design-system/components/panel";
import { NoticeCard } from "@/design-system/components/notice-card";
import { SectionCard } from "@/design-system/components/section-card";
import { TourGuideCard } from "@/design-system/components/tour-guide-card";
import { ValueBox } from "@/design-system/components/value-box";
import { ReportHeader } from "@/features/page-guide/components/report-header";
import { InfoHint } from "@/features/inventory-guide/components/info-hint";

// Catálogo vivo del sistema de diseño del panel (ver design-system/README.md).
// Todo componente o patrón visual nuevo se agrega acá con un ejemplo. Los
// datos de las tablas son de muestra: no salen de la API.

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-6 flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

// ── Datos de muestra ──────────────────────────────────────────────────────

interface DemoMovement {
  id: number;
  date: string;
  store: string;
  product: string;
  reason: "Merma" | "Regalía" | "Degustación" | "Entrada";
  quantity: number;
  status: "Pendiente" | "En camino" | "Recibido" | "Confirmado" | "Rechazado";
}

const DEMO_MOVEMENTS: DemoMovement[] = [
  { id: 1, date: "11/10/2026 09:12", store: "Tienda Ramblas", product: "Chocolate oscuro 70% barra", reason: "Merma", quantity: 3, status: "Pendiente" },
  { id: 2, date: "10/10/2026 16:40", store: "Tienda Ramblas", product: "Trufas surtidas caja 12", reason: "Entrada", quantity: 24, status: "En camino" },
  { id: 3, date: "10/10/2026 11:05", store: "Tienda Centro", product: "Bombones de licor", reason: "Regalía", quantity: 2, status: "Confirmado" },
  { id: 4, date: "09/10/2026 18:22", store: "Tienda Centro", product: "Chocolate caliente 250 g", reason: "Entrada", quantity: 40, status: "Recibido" },
  { id: 5, date: "09/10/2026 10:30", store: "Tienda Ramblas", product: "Barra de leche 40%", reason: "Degustación", quantity: 5, status: "Rechazado" },
  { id: 6, date: "08/10/2026 15:18", store: "Tienda Centro", product: "Nibs de cacao 100 g", reason: "Merma", quantity: 1, status: "Confirmado" },
  { id: 7, date: "08/10/2026 09:02", store: "Tienda Ramblas", product: "Trufas surtidas caja 12", reason: "Regalía", quantity: 4, status: "Confirmado" },
  { id: 8, date: "07/10/2026 17:45", store: "Tienda Centro", product: "Chocolate oscuro 70% barra", reason: "Entrada", quantity: 60, status: "Confirmado" },
  { id: 9, date: "07/10/2026 12:10", store: "Tienda Ramblas", product: "Bombones de licor", reason: "Degustación", quantity: 6, status: "Pendiente" },
  { id: 10, date: "06/10/2026 14:00", store: "Tienda Centro", product: "Barra de leche 40%", reason: "Merma", quantity: 2, status: "Confirmado" },
  { id: 11, date: "06/10/2026 09:30", store: "Tienda Ramblas", product: "Nibs de cacao 100 g", reason: "Entrada", quantity: 30, status: "Confirmado" },
  { id: 12, date: "05/10/2026 16:25", store: "Tienda Centro", product: "Chocolate caliente 250 g", reason: "Regalía", quantity: 1, status: "Confirmado" },
];

const STATUS_TONE: Record<DemoMovement["status"], InfoBadgeTone> = {
  Pendiente: "warning",
  "En camino": "violet",
  Recibido: "info",
  Confirmado: "success",
  Rechazado: "danger",
};

interface DemoCount {
  id: number;
  product: string;
  unit: "Kg" | "Unidad";
  estimated: number | null;
}

const DEMO_COUNTS: DemoCount[] = [
  { id: 1, product: "Chocolate oscuro 70% barra", unit: "Unidad", estimated: 48 },
  { id: 2, product: "Nibs de cacao 100 g", unit: "Unidad", estimated: 12 },
  { id: 3, product: "Cobertura de chocolate", unit: "Kg", estimated: 7.5 },
  { id: 4, product: "Trufas surtidas caja 12", unit: "Unidad", estimated: null },
];

// ── Secciones ─────────────────────────────────────────────────────────────

function ButtonsSection() {
  const [saving, setSaving] = useState(false);
  return (
    <Section
      id="botones"
      title="Botones"
      description="Un solo botón primario por pantalla (la acción principal). El resto, secundario u outline."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Specimen label="Primary: la acción principal">
          <Button>Guardar cambios</Button>
          <Button disabled>Deshabilitado</Button>
        </Specimen>
        <Specimen label="Agregar: primary + ícono Plus + verbo en infinitivo">
          <Button>
            <Plus aria-hidden="true" />
            Registrar movimiento
          </Button>
          <Button>
            <PackagePlus aria-hidden="true" />
            Solicitar stock
          </Button>
        </Specimen>
        <Specimen label="Secondary: apoyo, no compite con la acción principal">
          <Button variant="secondary">Iniciar tour</Button>
          <Button variant="secondary" size="sm">
            Ver detalle
          </Button>
        </Specimen>
        <Specimen label="Outline: acciones neutrales (filtros, exportar, links)">
          <Button variant="outline">Exportar</Button>
          <Button variant="outline" size="sm">
            <Eye aria-hidden="true" />
            Ver detalle
          </Button>
        </Specimen>
        <Specimen label="Destructive: rechazar, eliminar, ocultar">
          <Button variant="destructive">
            <Trash2 aria-hidden="true" />
            Eliminar
          </Button>
          <Button variant="destructive" size="sm">
            Rechazar
          </Button>
        </Specimen>
        <Specimen label="Ghost y link: acciones de bajo énfasis">
          <Button variant="ghost">Cancelar</Button>
          <Button variant="link">Más información</Button>
        </Specimen>
        <Specimen label="Estado de carga">
          <Button
            onClick={() => {
              setSaving(true);
              setTimeout(() => setSaving(false), 1500);
            }}
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </Specimen>
        <Specimen label="Tamaños: lg, default, sm, xs, icon">
          <Button size="lg">Grande</Button>
          <Button>Normal</Button>
          <Button size="sm">Chico</Button>
          <Button size="xs">Mini</Button>
          <Button size="icon" variant="outline" aria-label="Ejemplo de ícono">
            <Plus aria-hidden="true" />
          </Button>
        </Specimen>
      </div>
    </Section>
  );
}

function BadgesSection() {
  return (
    <Section
      id="badges"
      title="Badges de información"
      description="Pastillas cortas para estados (con punto), roles y avisos (con ícono). Los tonos significan lo mismo en todo el panel."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Specimen label="Estados (dot)">
          {(Object.keys(STATUS_TONE) as DemoMovement["status"][]).map((status) => (
            <InfoBadge key={status} tone={STATUS_TONE[status]} dot>
              {status}
            </InfoBadge>
          ))}
        </Specimen>
        <Specimen label="Roles (tamaño sm)">
          <InfoBadge tone="violet" size="sm">
            Admin
          </InfoBadge>
          <InfoBadge tone="info" size="sm">
            Finanzas
          </InfoBadge>
          <InfoBadge tone="warning" size="sm">
            Vendedor
          </InfoBadge>
        </Specimen>
        <Specimen label="Tonos">
          <InfoBadge tone="neutral">Neutral</InfoBadge>
          <InfoBadge tone="info">Info</InfoBadge>
          <InfoBadge tone="success">Éxito</InfoBadge>
          <InfoBadge tone="warning">Atención</InfoBadge>
          <InfoBadge tone="danger">Error</InfoBadge>
          <InfoBadge tone="violet">En tránsito</InfoBadge>
        </Specimen>
      </div>
    </Section>
  );
}

function CardsSection() {
  const [tourClicks, setTourClicks] = useState(0);
  return (
    <Section
      id="cards"
      title="Cards"
      description="Encabezado de pantalla, tour guiado y avisos. Siempre breves: una frase, sin guiones largos, y los botones a la vista."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tour guiado (botón secundario)</p>
          <TourGuideCard
            badge={
              <InfoBadge tone="warning" size="sm">
                Vendedor
              </InfoBadge>
            }
            onStart={() => setTourClicks((current) => current + 1)}
            onInfo={() => setTourClicks((current) => current + 1)}
            infoLabel="Cómo funciona Inventario"
            showNewDot
          />
          <p className="text-xs text-muted-foreground">Clics de prueba: {tourClicks}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SectionCard: título, frase y botones</p>
          <SectionCard icon={Warehouse} title="Movimientos" description="Reporta mermas, regalías y degustaciones.">
            <Button variant="outline">Pendientes de todas las tiendas</Button>
            <Button>
              <Plus aria-hidden="true" />
              Registrar movimiento
            </Button>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SectionCard controlsOnly: varios controles en una sola línea, sin título</p>
          <SectionCard controlsOnly>
            <Input type="text" placeholder="Rango de fechas" className="w-full sm:w-[220px]" readOnly />
            <Input type="text" placeholder="Todos los productos" className="w-full sm:w-[220px]" readOnly />
            <Button variant="outline" size="sm">
              Exportar
            </Button>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Panel: la card de contenido (formularios, listas y tablas)</p>
          <Panel
            icon={Warehouse}
            title="Estado actual"
            description="Una frase corta que explica el contenido."
            badge={
              <InfoBadge tone="success" size="sm" dot>
                Vigente
              </InfoBadge>
            }
            action={
              <Button variant="outline" size="sm">
                Acción
              </Button>
            }
          >
            <p className="text-sm text-foreground">El cuerpo lleva el contenido. Con flush, las listas y tablas llegan al borde.</p>
          </Panel>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ChocolateLoader: animación de carga (sm, md y lg)</p>
          <div className="flex flex-wrap items-end justify-around gap-6 rounded-2xl border border-border bg-card p-6">
            <ChocolateLoader size="sm" label="Pequeño" />
            <ChocolateLoader size="md" label="Mediano" />
            <ChocolateLoader size="lg" label="Cargando..." />
          </div>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">ChocolateBreak: tableta que se parte (Iniciando sesión)</p>
          <div className="flex justify-center rounded-2xl border border-border bg-card p-6">
            <ChocolateBreak className="w-48" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">NoticeCard: info, éxito y atención</p>
          <NoticeCard
            tone="warning"
            icon={Warehouse}
            title="Aún oculto para los Vendedores"
            description="Carga el stock de cada tienda antes de habilitarla."
            action={
              <Button variant="outline" size="sm">
                Habilitar tiendas
              </Button>
            }
          />
          <NoticeCard tone="success" icon={Warehouse} title="Visible en 2 de 5 tiendas" description="Solo el Admin habilita tiendas." />
          <NoticeCard tone="info" icon={Warehouse} title="Carga el stock primero" description="Ocultarla no borra nada." />
        </div>
      </div>
    </Section>
  );
}

function TablesSection() {
  const [selected, setSelected] = useState<DemoMovement | null>(null);

  const movementColumns: DataTableColumn<DemoMovement>[] = [
    { id: "date", header: "Fecha", label: "Fecha", cell: (row) => <span className="text-muted-foreground">{row.date}</span>, accessor: (row) => row.date, filter: "text", nowrap: true },
    { id: "store", header: "Tienda", label: "Tienda", cell: (row) => <span className="font-medium">{row.store}</span>, accessor: (row) => row.store, filter: "select" },
    { id: "product", header: "Producto", label: "Producto", cell: (row) => row.product, accessor: (row) => row.product, filter: "text", mobile: "title" },
    { id: "reason", header: "Motivo", label: "Motivo", cell: (row) => row.reason, accessor: (row) => row.reason, filter: "select", nowrap: true },
    { id: "quantity", header: "Cantidad", label: "Cantidad", cell: (row) => <span className="tabular-nums">{row.quantity}</span>, align: "right", nowrap: true },
    {
      id: "status",
      header: (
        <span className="inline-flex items-center gap-1">
          Estado
          <InfoHint topic="estados-movimiento" />
        </span>
      ),
      label: "Estado",
      cell: (row) => (
        <InfoBadge tone={STATUS_TONE[row.status]} dot>
          {row.status}
        </InfoBadge>
      ),
      accessor: (row) => row.status,
      filter: "select",
      nowrap: true,
    },
    {
      id: "detail",
      header: "Detalle",
      label: "Detalle",
      cell: (row) => (
        <Button type="button" size="sm" variant={row.status === "Pendiente" ? "default" : "outline"} onClick={() => setSelected(row)}>
          {row.status === "Pendiente" ? "Gestionar" : "Ver detalle"}
        </Button>
      ),
      align: "right",
      nowrap: true,
      mobile: "footer",
    },
  ];

  const countColumns: DataTableColumn<DemoCount>[] = [
    { id: "index", header: "#", label: "#", cell: (_row, index) => <span className="text-muted-foreground">{index + 1}</span>, className: "w-10", nowrap: true, mobile: "hidden" },
    { id: "product", header: "Producto", label: "Producto", cell: (row) => row.product, accessor: (row) => row.product, filter: "text", mobile: "title" },
    { id: "unit", header: "Unidad", label: "Unidad", cell: (row) => <span className="text-muted-foreground">{row.unit}</span>, accessor: (row) => row.unit, filter: "select" },
    {
      id: "estimated",
      header: (
        <span className="inline-flex items-center justify-end gap-1">
          Existencia estimada
          <InfoHint topic="existencia-estimada" />
        </span>
      ),
      label: "Existencia estimada",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <ValueBox value={row.estimated != null ? String(row.estimated) : null} />
          <span className="text-xs text-muted-foreground">{row.unit === "Kg" ? "Kg" : "u"}</span>
        </div>
      ),
      align: "right",
    },
    {
      id: "count",
      header: "Inventario nuevo",
      label: "Inventario nuevo",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Input
            type="number"
            min={0}
            placeholder="Sin contar"
            aria-label={`Inventario nuevo de ${row.product}`}
            className="w-24 border-foreground/30 bg-background text-right tabular-nums"
          />
          <span className="text-xs text-muted-foreground">{row.unit === "Kg" ? "Kg" : "u"}</span>
        </div>
      ),
      align: "right",
    },
  ];

  return (
    <Section
      id="tablas"
      title="Tablas"
      description="Todas las tablas de Inventario usan DataTable: encabezado fijo, ícono de filtro por columna, pie con resultados, filas por página (10, 25, 50, 100) y wrap. En móvil se vuelven tarjetas."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tabla estándar (Solicitudes, Movimientos): fila clicable y columna Detalle
          </p>
          <DataTable
            columns={movementColumns}
            rows={DEMO_MOVEMENTS}
            getRowKey={(row) => row.id}
            itemLabel={{ singular: "movimiento", plural: "movimientos" }}
            onRowClick={setSelected}
            defaultPageSize={10}
          />
          <p className="text-xs text-muted-foreground">
            {selected ? `Fila seleccionada: ${selected.product} (${selected.status}).` : "Pulsa una fila para ver cómo se comporta."}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tabla de captura (Conteo): caja de solo lectura + input editable
          </p>
          <DataTable
            columns={countColumns}
            rows={DEMO_COUNTS}
            getRowKey={(row) => row.id}
            itemLabel={{ singular: "producto", plural: "productos" }}
          />
        </div>
      </div>
    </Section>
  );
}

export function DesignSystemShowcase() {
  return (
    <div className="flex flex-col gap-4">
      <ReportHeader page="admin-diseno" />
      <ButtonsSection />
      <BadgesSection />
      <CardsSection />
      <TablesSection />
    </div>
  );
}
