import { ExternalLink, EyeOff, Link2, MapPin, ShieldCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { InfoBadge } from "@/design-system/components/info-badge";
import { Panel } from "@/design-system/components/panel";
import { MODULE_ICON } from "../constants/module-groups";
import { MODULE_INFO } from "../constants/module-info";
import { MODULE_LABEL, getSharedPeers, type ModuleKey, type RoleModuleAccessRow } from "../types/permissions.types";
import type { UserRole } from "@/features/auth/types/auth.types";
import { ModulePreview } from "./module-preview";

export const ROLE_NAME: Record<UserRole, string> = {
  SUPER_ADMIN: "Super admin",
  FINANZAS: "Finanzas",
  VENDEDOR: "Vendedor",
};

const ALL_ROLES: UserRole[] = ["SUPER_ADMIN", "FINANZAS", "VENDEDOR"];

interface ModuleDetailProps {
  moduleKey: ModuleKey;
  role: UserRole;
  /** Fila del rol elegido para este módulo. */
  row: RoleModuleAccessRow;
  /** Todas las filas de este módulo, de todos los roles. */
  rowsByRole: Map<UserRole, RoleModuleAccessRow>;
  /** Módulos que el rol tiene disponibles (para listar solo los que comparten dato de verdad). */
  availableKeys: Set<ModuleKey>;
  isToggling: boolean;
  onToggle: (nextEnabled: boolean) => void;
}

/**
 * Detalle del módulo elegido en Permisos: vista previa de la pantalla, qué es,
 * qué verá el rol, dónde aparece, quién más la ve y el botón para darla o
 * quitarla. Así el Super admin sabe qué está dando o quitando antes de cambiar.
 */
export function ModuleDetail({ moduleKey, role, row, rowsByRole, availableKeys, isToggling, onToggle }: ModuleDetailProps) {
  const info = MODULE_INFO[moduleKey];
  const label = MODULE_LABEL[moduleKey];
  const roleName = ROLE_NAME[role];
  const peers = getSharedPeers(moduleKey).filter((key) => availableKeys.has(key));

  return (
    <Panel
      tourId="perm-detail"
      icon={MODULE_ICON[moduleKey]}
      title={label}
      description={`Menú › ${info.group}`}
      badge={
        <InfoBadge tone={row.enabled ? "success" : "neutral"} size="sm" dot>
          {row.enabled ? "Con acceso" : `Oculta para ${roleName}`}
        </InfoBadge>
      }
    >
      <div className="flex flex-col gap-5">
        <ModulePreview kind={info.preview} locked={!row.enabled} lockedLabel={`Oculta para ${roleName}`} />

        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-foreground">{info.summary}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            Aparece en el menú: {info.group} › {label}
          </p>
        </div>

        {info.includes && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pantallas que incluye</p>
            <div className="flex flex-wrap gap-1.5">
              {info.includes.map((screen) => (
                <InfoBadge key={screen} tone="info" size="sm">
                  {screen}
                </InfoBadge>
              ))}
            </div>
            {info.note && <p className="text-xs text-muted-foreground">{info.note}</p>}
            {role === "VENDEDOR" && info.vendedorNote && <p className="text-xs text-muted-foreground">{info.vendedorNote}</p>}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {row.enabled ? `Lo que ve ${roleName}` : `Lo que dejaría de ver ${roleName}`}
          </p>
          <ul className="flex flex-col gap-1.5 text-sm text-foreground">
            {info.contents.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Acceso por rol</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_ROLES.map((other) => {
              const otherRow = rowsByRole.get(other);
              const isCurrent = other === role;
              return (
                <InfoBadge
                  key={other}
                  tone={!otherRow ? "neutral" : otherRow.enabled ? "success" : "danger"}
                  size="sm"
                  dot
                  className={isCurrent ? "ring-1 ring-foreground/20" : undefined}
                >
                  {ROLE_NAME[other]}: {!otherRow ? "no aplica" : otherRow.enabled ? "con acceso" : "oculta"}
                </InfoBadge>
              );
            })}
          </div>
        </div>

        {peers.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <Link2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <p>
              Comparte datos con {peers.map((key) => MODULE_LABEL[key]).join(", ")}. El dato solo queda bloqueado
              en el servidor si todas esas pantallas también están ocultas.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {row.enabled ? (
            <Button type="button" variant="destructive" disabled={isToggling} onClick={() => onToggle(false)}>
              <EyeOff aria-hidden="true" />
              Quitar acceso a {roleName}
            </Button>
          ) : (
            <Button type="button" disabled={isToggling} onClick={() => onToggle(true)}>
              <ShieldCheck aria-hidden="true" />
              Dar acceso a {roleName}
            </Button>
          )}
          <a
            href={info.href}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Ver pantalla real
          </a>
        </div>
        {row.updatedByEmail && <p className="text-xs text-muted-foreground">Último cambio: {row.updatedByEmail}</p>}
      </div>
    </Panel>
  );
}
