// Lo que devuelve GET /inventory/access (ver InventoryAccessDoc en
// xoco-api): las tiendas con Inventario habilitado para sus Vendedores.
export interface InventoryAccess {
  enabledPosConfigIds: number[];
}
