// Subcategorías por categoría según PRODUCTOS.md.
// Usadas en el modal "Agregar Producto" del inventario.

export const SUBCATEGORIAS_POR_CATEGORIA: Record<string, string[]> = {
  cpu: [
    "CPU AMD RYZEN 5 SAM5 8XXX",
    "CPU AMD RYZEN 5 SAM5 9XXX",
    "CPU AMD RYZEN 7 SAM5 8XXX",
    "CPU AMD RYZEN 7 SAM5 9XXX",
    "CPU CI5 12XXX S1700",
    "CPU CI5 14XXX S1700",
    "CPU CI7 12XXX S1700",
    "CPU CI7 14XXX S1700",
    "CPU CI9 14XXX S1700",
    "CPU CU5 2XX S1851",
    "CPU CU7 2XX S1851",
    "CPU CU9 2XX S1851",
  ],
  motherboard: [
    "MB CI9 S1700 DDR4",
    "MB CI9 S1700 DDR5",
    "MB CU9 S1851 DDR5",
    "MB CU9 S1851 DDR5 GAMING",
    "MB SOCKET AM5 AMD",
    "MB SOCKET AM5 AMD GAMING",
  ],
  ram: [
    "MEM DDR4 3200 PC4-25600",
    "MEM DDR4 3600 PC4-28800",
    "MEM DDR5 5200 PC5-41600",
    "MEM DDR5 5600 PC5-44800",
  ],
  gpu: ["VIDEO, PCI EXP NVIDIA GAM", "VIDEO, PCI EXP RADEON GAM"],
  cooler: ["FAN COOLER CPU", "COOLER LIQUIDO CPU 240", "COOLER LIQUIDO CPU 360"],
  case: [
    "CASES ATX VER2.0",
    "CASES CON FUENTE P/GAMERS",
    "CASES SIN FUENTE P/GAMERS",
  ],
  psu: ["CASES, FUENTE PARA GAMING"],
  ssd: [
    "SSD 2.5\" SATA",
    "SSD M.2 NVMe",
    "SSD M.2 SATA",
    "SSD PCIe",
  ],
  monitor: [
    "MONITOR 24\"",
    "MONITOR 27\"",
    "MONITOR 32\"",
    "MONITOR ULTRAWIDE CURVO",
    "MONITOR GAMER ALTO REFRESCO",
  ],
};

export function getSubcategorias(categoriaKey: string): string[] {
  return SUBCATEGORIAS_POR_CATEGORIA[categoriaKey] ?? [];
}
