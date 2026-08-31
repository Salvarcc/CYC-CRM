"use client";

import {
  SOCKET_OPTIONS,
  TIPO_MEMORIA_OPTIONS,
  CPU_TDP_OPTIONS,
  FACTOR_FORMA_OPTIONS,
  RAM_SLOTS_OPTIONS,
  MAX_MEMORIA_OPTIONS,
  RAM_CAPACIDAD_OPTIONS,
  RAM_FRECUENCIA_OPTIONS,
  VRAM_OPTIONS,
  GPU_PSU_REC_OPTIONS,
  GPU_LARGO_OPTIONS,
  COOLER_TDP_OPTIONS,
  COOLER_VENTILADORES_OPTIONS,
  CASE_GPU_MAX_OPTIONS,
  CASE_FAN_SLOTS_OPTIONS,
  CASE_FUENTE_POTENCIA_OPTIONS,
  PSU_POTENCIA_OPTIONS,
  CERTIFICACION_80PLUS_OPTIONS,
  PSU_FACTOR_FORMA_OPTIONS,
  TIPO_REFRIGERACION_OPTIONS,
  SSD_CAPACIDAD_OPTIONS,
  SSD_FORMATO_OPTIONS,
  SSD_LECTURA_OPTIONS,
  SSD_ESCRITURA_OPTIONS,
  MONITOR_TAMANO_OPTIONS,
  MONITOR_RESOLUCION_OPTIONS,
  MONITOR_PANEL_OPTIONS,
  MONITOR_RATIO_OPTIONS,
  MONITOR_RESPUESTA_OPTIONS,
  MONITOR_REFRESCO_OPTIONS,
  MONITOR_PUERTOS_OPTIONS,
  formValueToArray,
  toggleArrayValue,
} from "./technical-attrs";

interface CategoryAttributeFormProps {
  categoryKey: string;
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function CategoryAttributeForm({
  categoryKey,
  form,
  setForm,
}: CategoryAttributeFormProps) {
  return (
    <div className="space-y-4">
      {/* ── CPU ── */}
      {categoryKey === "cpu" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Socket <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.socket || ""}
                onChange={(e) => setForm((f) => ({ ...f, socket: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {SOCKET_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Tipo Memoria <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.tipoMemoria || ""}
                onChange={(e) => setForm((f) => ({ ...f, tipoMemoria: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {TIPO_MEMORIA_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">TDP (Watts) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.tdp || ""}
                onChange={(e) => setForm((f) => ({ ...f, tdp: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {CPU_TDP_OPTIONS.map((w) => (
                  <option key={w} value={w}>{w}W</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-center gap-2 pt-5">
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  className="size-4 rounded"
                  checked={form.requiereCooler === "true"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, requiereCooler: e.target.checked ? "true" : "false" }))
                  }
                />
                Requiere Cooler
              </label>
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  className="size-4 rounded"
                  checked={form.tieneGraficosIntegrados === "true"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tieneGraficosIntegrados: e.target.checked ? "true" : "false",
                    }))
                  }
                />
                Gráficos Integrados
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Motherboard ── */}
      {categoryKey === "motherboard" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Socket <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.socket || ""}
                onChange={(e) => setForm((f) => ({ ...f, socket: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {SOCKET_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Tipo Memoria <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.tipoMemoria || ""}
                onChange={(e) => setForm((f) => ({ ...f, tipoMemoria: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {TIPO_MEMORIA_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Factor Forma <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.factorForma || ""}
                onChange={(e) => setForm((f) => ({ ...f, factorForma: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {FACTOR_FORMA_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">RAM Slots <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.ramSlots || ""}
                onChange={(e) => setForm((f) => ({ ...f, ramSlots: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {RAM_SLOTS_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Max Memoria RAM (GB) <span className="text-red-500">*</span></label>
            <select
              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary md:w-1/2"
              value={form.maxMemoriaGB || ""}
              onChange={(e) => setForm((f) => ({ ...f, maxMemoriaGB: e.target.value }))}
            >
              <option value="">Seleccionar...</option>
              {MAX_MEMORIA_OPTIONS.map((g) => (
                <option key={g} value={g}>{g} GB</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── RAM ── */}
      {categoryKey === "ram" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Tipo Memoria <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.tipoMemoria || ""}
                onChange={(e) => setForm((f) => ({ ...f, tipoMemoria: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {TIPO_MEMORIA_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Factor Forma <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.factorForma || ""}
                onChange={(e) => setForm((f) => ({ ...f, factorForma: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                <option value="DIMM">DIMM</option>
                <option value="SODIMM">SODIMM</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Capacidad (GB) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.capacidadGB || ""}
                onChange={(e) => setForm((f) => ({ ...f, capacidadGB: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {RAM_CAPACIDAD_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c} GB</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Frecuencia (MHz) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.frecuenciaMHz || ""}
                onChange={(e) => setForm((f) => ({ ...f, frecuenciaMHz: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {RAM_FRECUENCIA_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f} MHz</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── GPU ── */}
      {categoryKey === "gpu" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">VRAM (GB) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.vramGB || ""}
                onChange={(e) => setForm((f) => ({ ...f, vramGB: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {VRAM_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v} GB</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">PSU Rec. (Watts) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.consumoRecomendadoFuenteWatts || ""}
                onChange={(e) => setForm((f) => ({ ...f, consumoRecomendadoFuenteWatts: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {GPU_PSU_REC_OPTIONS.map((w) => (
                  <option key={w} value={w}>{w}W</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Largo (mm) <span className="text-red-500">*</span></label>
            <select
              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary md:w-1/2"
              value={form.largoMm || ""}
              onChange={(e) => setForm((f) => ({ ...f, largoMm: e.target.value }))}
            >
              <option value="">Seleccionar...</option>
              {GPU_LARGO_OPTIONS.map((l) => (
                <option key={l} value={l}>{l} mm</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── Cooler ── */}
      {categoryKey === "cooler" && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Sockets Soportados <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SOCKET_OPTIONS.map((s) => {
                const selected = formValueToArray(form.socketsSoportados).includes(s);
                return (
                  <label
                    key={s}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? "border-brand-500 bg-brand-500/10 text-brand-600"
                        : "border-card-border bg-background-white-primary text-text-secondary hover:border-brand-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected}
                      onChange={() => {
                        const current = formValueToArray(form.socketsSoportados);
                        setForm((f) => ({
                          ...f,
                          socketsSoportados: toggleArrayValue(current, s).join(", "),
                        }));
                      }}
                    />
                    {s}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">TDP Soportado (W) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.tdpSoportadoWatts || ""}
                onChange={(e) => setForm((f) => ({ ...f, tdpSoportadoWatts: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {COOLER_TDP_OPTIONS.map((w) => (
                  <option key={w} value={w}>{w}W</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Tipo <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.tipoRefrigeracion || ""}
                onChange={(e) => setForm((f) => ({ ...f, tipoRefrigeracion: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {TIPO_REFRIGERACION_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">N° Ventiladores <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.numeroVentiladores || ""}
                onChange={(e) => setForm((f) => ({ ...f, numeroVentiladores: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {COOLER_VENTILADORES_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Case ── */}
      {categoryKey === "case" && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Factores de Forma Soportados <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {FACTOR_FORMA_OPTIONS.map((ff) => {
                const selected = formValueToArray(form.soportaFactoresForma).includes(ff);
                return (
                  <label
                    key={ff}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? "border-brand-500 bg-brand-500/10 text-brand-600"
                        : "border-card-border bg-background-white-primary text-text-secondary hover:border-brand-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected}
                      onChange={() => {
                        const current = formValueToArray(form.soportaFactoresForma);
                        setForm((f) => ({
                          ...f,
                          soportaFactoresForma: toggleArrayValue(current, ff).join(", "),
                        }));
                      }}
                    />
                    {ff}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">GPU Máx (mm) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.largoMaxGpuMm || ""}
                onChange={(e) => setForm((f) => ({ ...f, largoMaxGpuMm: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {CASE_GPU_MAX_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l} mm</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Max Fans / Radiador <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.soportaFanCoolerVentiladores || ""}
                onChange={(e) => setForm((f) => ({ ...f, soportaFanCoolerVentiladores: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {CASE_FAN_SLOTS_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                className="size-4 rounded"
                checked={form.tieneFuentePoder === "true"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tieneFuentePoder: e.target.checked ? "true" : "false" }))
                }
              />
              Incluye Fuente de Poder
            </label>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Potencia Fuente (W) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.potenciaFuenteWatts || ""}
                onChange={(e) => setForm((f) => ({ ...f, potenciaFuenteWatts: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {CASE_FUENTE_POTENCIA_OPTIONS.map((w) => (
                  <option key={w} value={w}>{w}W</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── PSU ── */}
      {categoryKey === "psu" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Potencia (W) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.potenciaWatts || ""}
                onChange={(e) => setForm((f) => ({ ...f, potenciaWatts: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {PSU_POTENCIA_OPTIONS.map((w) => (
                  <option key={w} value={w}>{w}W</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Certificación 80+ <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.certificacion80Plus || ""}
                onChange={(e) => setForm((f) => ({ ...f, certificacion80Plus: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {CERTIFICACION_80PLUS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Factor Forma <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.factorForma || ""}
                onChange={(e) => setForm((f) => ({ ...f, factorForma: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {PSU_FACTOR_FORMA_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 pt-6 text-sm text-text-primary">
              <input
                type="checkbox"
                className="size-4 rounded"
                checked={form.esModular === "true"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, esModular: e.target.checked ? "true" : "false" }))
                }
              />
              Modular
            </label>
          </div>
        </div>
      )}

      {/* ── SSD ── */}
      {categoryKey === "ssd" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Capacidad (GB) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.capacidadGB || ""}
                onChange={(e) => setForm((f) => ({ ...f, capacidadGB: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {SSD_CAPACIDAD_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c} GB</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Formato <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.formato || ""}
                onChange={(e) => setForm((f) => ({ ...f, formato: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {SSD_FORMATO_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Interfaz <span className="text-red-500">*</span></label>
            <select
              className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary md:w-1/2"
              value={form.interfaz || ""}
              onChange={(e) => setForm((f) => ({ ...f, interfaz: e.target.value }))}
            >
              <option value="">Seleccionar...</option>
              <option value="SATA">SATA</option>
              <option value="NVMe">NVMe</option>
              <option value="PCIe">PCIe</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Lectura (MB/s) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.lecturaMBs || ""}
                onChange={(e) => setForm((f) => ({ ...f, lecturaMBs: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {SSD_LECTURA_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v} MB/s</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Escritura (MB/s) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.escrituraMBs || ""}
                onChange={(e) => setForm((f) => ({ ...f, escrituraMBs: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {SSD_ESCRITURA_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v} MB/s</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Monitor ── */}
      {categoryKey === "monitor" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Tamaño <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.tamano || ""}
                onChange={(e) => setForm((f) => ({ ...f, tamano: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {MONITOR_TAMANO_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Resolución <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.resolucion || ""}
                onChange={(e) => setForm((f) => ({ ...f, resolucion: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {MONITOR_RESOLUCION_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Tipo Panel <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.tipoPanel || ""}
                onChange={(e) => setForm((f) => ({ ...f, tipoPanel: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {MONITOR_PANEL_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Relación de Aspecto <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.ratioAspecto || ""}
                onChange={(e) => setForm((f) => ({ ...f, ratioAspecto: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {MONITOR_RATIO_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Tiempo Respuesta (ms) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.tiempoRespuestaMs || ""}
                onChange={(e) => setForm((f) => ({ ...f, tiempoRespuestaMs: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {MONITOR_RESPUESTA_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v} ms</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Tasa de Refresco (Hz) <span className="text-red-500">*</span></label>
              <select
                className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                value={form.tasaRefrescoHz || ""}
                onChange={(e) => setForm((f) => ({ ...f, tasaRefrescoHz: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {MONITOR_REFRESCO_OPTIONS.map((hz) => (
                  <option key={hz} value={hz}>{hz} Hz</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Puertos <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {MONITOR_PUERTOS_OPTIONS.map((p) => {
                const selected = formValueToArray(form.puertos).includes(p);
                return (
                  <label
                    key={p}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? "border-brand-500 bg-brand-500/10 text-brand-600"
                        : "border-card-border bg-background-white-primary text-text-secondary hover:border-brand-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected}
                      onChange={() => {
                        const current = formValueToArray(form.puertos);
                        setForm((f) => ({
                          ...f,
                          puertos: toggleArrayValue(current, p).join(", "),
                        }));
                      }}
                    />
                    {p}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
