"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command, CornerDownLeft, Search } from "lucide-react";
import type { NavIcon } from "@/components/layout/dashboard-shell";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface NavSearchItem {
  label: string;
  href: string;
  icon: NavIcon;
}

interface NavSearchProps {
  items: NavSearchItem[];
  className?: string;
}

// Quita acentos y mayúsculas para buscar "categorias" o "Categorías" igual.
function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * "Buscar" del sidebar: abre un buscador de pantallas (⌘K / Ctrl+K) con las
 * secciones que el usuario puede ver. Flechas para moverse y Enter para ir.
 */
export function NavSearch({ items, className }: NavSearchProps) {
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo(() => {
    const term = normalize(query.trim());
    return term ? items.filter((item) => normalize(item.label).includes(term)) : items;
  }, [items, query]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setSelected(0);
    }
  }

  function go(item: NavSearchItem | undefined) {
    if (!item) return;
    handleOpenChange(false);
    if (isMobile) setOpenMobile(false);
    router.push(item.href);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[selected]);
    }
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Buscar (⌘K)" onClick={() => setOpen(true)} className={cn("group/search", className)}>
            <Search aria-hidden="true" />
            <span>Buscar</span>
            <kbd className="ml-auto hidden h-5 items-center rounded-[4px] border border-border/50 bg-background/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/60 group-hover/search:inline-flex group-data-[collapsible=icon]:hidden!">
              ⌘K
            </kbd>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={false} className="top-[15vh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Buscar en el panel</DialogTitle>
          <div className="flex items-center border-b border-border/50 px-4">
            <Search className="mr-3 h-[18px] w-[18px] shrink-0 text-muted-foreground/70" strokeWidth={1.5} aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Buscar una pantalla..."
              aria-label="Buscar una pantalla"
              className="flex-1 bg-transparent py-4 text-[14px] text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <kbd className="ml-2 hidden h-5 items-center rounded-[4px] border border-black/10 bg-black/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 sm:inline-flex dark:border-white/10 dark:bg-white/10">
              ESC
            </kbd>
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-2 py-8">
              <Command className="mb-2 h-6 w-6 text-muted-foreground/30" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-[13px] font-medium text-muted-foreground">No hay pantallas con ese nombre.</p>
            </div>
          ) : (
            <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox" aria-label="Pantallas">
              {results.map((item, index) => {
                const Icon = item.icon;
                const active = index === selected;
                return (
                  <li key={item.href} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onMouseEnter={() => setSelected(index)}
                      onClick={() => go(item)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors",
                        active ? "bg-black/5 text-foreground dark:bg-white/10" : "text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {active && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
