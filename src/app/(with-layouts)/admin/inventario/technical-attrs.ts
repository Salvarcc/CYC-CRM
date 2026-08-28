// Opciones predefinidas para atributos técnicos del modal "Agregar Producto".
// Cada categoría tiene sus campos con valores seleccionables en vez de texto libre.

export const SOCKET_OPTIONS = ["AM4", "AM5", "LGA1700", "LGA1851", "LGA1200"];

export const TIPO_MEMORIA_OPTIONS = ["DDR4", "DDR5"];

export const CPU_TDP_OPTIONS = [65, 95, 105, 125, 150, 170, 200];

export const FACTOR_FORMA_OPTIONS = ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"];

export const RAM_SLOTS_OPTIONS = [2, 4, 6];

export const MAX_MEMORIA_OPTIONS = [32, 64, 128, 192, 256];

export const RAM_CAPACIDAD_OPTIONS = [8, 16, 32, 64, 128];

export const RAM_FRECUENCIA_OPTIONS = [2400, 2666, 3000, 3200, 3600, 4800, 5200, 5600, 6000, 6400];

export const VRAM_OPTIONS = [4, 6, 8, 10, 12, 16, 24];

export const GPU_PSU_REC_OPTIONS = [450, 500, 550, 600, 650, 700, 750, 850, 1000];

export const GPU_LARGO_OPTIONS = [170, 200, 250, 270, 300, 320, 340, 360];

export const COOLER_TDP_OPTIONS = [65, 95, 120, 150, 200, 250, 300, 350];

export const COOLER_VENTILADORES_OPTIONS = [1, 2, 3, 4];

export const CASE_GPU_MAX_OPTIONS = [280, 300, 320, 340, 360, 380, 400, 420];

export const CASE_FAN_SLOTS_OPTIONS = [1, 2, 3, 4, 5, 6];

export const CASE_FUENTE_POTENCIA_OPTIONS = [400, 450, 500, 550, 600, 650, 700];

export const PSU_POTENCIA_OPTIONS = [450, 500, 550, 600, 650, 700, 750, 850, 1000, 1200];

export const CERTIFICACION_80PLUS_OPTIONS = ["Bronze", "Gold", "Platinum", "Titanium"];

export const PSU_FACTOR_FORMA_OPTIONS = ["ATX", "SFX"];

export const TIPO_REFRIGERACION_OPTIONS = ["Aire", "Líquida AIO"];

export const SSD_CAPACIDAD_OPTIONS = [120, 240, 250, 256, 480, 500, 512, 960, 1000, 1024, 2000, 2048, 4000, 4096];

export const SSD_FORMATO_OPTIONS = ["2.5\" SATA", "M.2 NVMe", "M.2 SATA", "PCIe 4.0", "PCIe 5.0"];

export const SSD_LECTURA_OPTIONS = [500, 550, 1000, 2000, 3000, 3500, 5000, 7000, 10000, 12000];

export const SSD_ESCRITURA_OPTIONS = [400, 450, 500, 1000, 1500, 2000, 3000, 4000, 6000, 8000];

export const MONITOR_TAMANO_OPTIONS = ['24"', '27"', '32"', '34"', '49"'];

export const MONITOR_RESOLUCION_OPTIONS = ["1920x1080 (Full HD)", "2560x1440 (QHD)", "3440x1440 (UWQHD)", "3840x2160 (4K UHD)", "5120x1440 (Dual QHD)"];

export const MONITOR_PANEL_OPTIONS = ["IPS", "VA", "TN", "OLED"];

export const MONITOR_RATIO_OPTIONS = ["16:9", "16:10", "21:9", "32:9"];

export const MONITOR_RESPUESTA_OPTIONS = [1, 2, 4, 5, 8];

export const MONITOR_REFRESCO_OPTIONS = [60, 75, 120, 144, 165, 240, 360];

export const MONITOR_PUERTOS_OPTIONS = ["HDMI", "DisplayPort", "USB-C", "VGA", "DVI"];

// Helper para convertir un array de strings (checkboxes) a valor del form
export function arrayToFormValue(arr: string[]): string {
  return arr.join(", ");
}

// Helper para parsear valor del form a array
export function formValueToArray(val: string | undefined): string[] {
  if (!val) return [];
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Helper para toggle un valor en un array de checkboxes
export function toggleArrayValue(arr: string[], value: string): string[] {
  if (arr.includes(value)) {
    return arr.filter((v) => v !== value);
  }
  return [...arr, value];
}
