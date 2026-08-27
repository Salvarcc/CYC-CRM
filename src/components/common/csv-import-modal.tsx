"use client";

import { Button } from "@/components/tailgrids/core/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/tailgrids/core/dialog";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { parseCsv, importRows, type ParseResult, type ValidationError } from "@/utils/import-csv";

interface CsvImportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  cpu: "Procesadores",
  motherboard: "Placas Madre",
  ram: "Memoria RAM",
  gpu: "Tarjetas de Video",
  cooler: "Refrigeración",
  case: "Gabinetes",
  psu: "Fuentes de Poder",
};

function groupByCategory(rows: ParseResult["valid"]) {
  const groups: Record<string, number> = {};
  for (const r of rows) {
    groups[r.categoryKey] = (groups[r.categoryKey] || 0) + 1;
  }
  return groups;
}

export function CsvImportModal({ isOpen, onOpenChange, onComplete }: CsvImportModalProps) {
  const [step, setStep] = useState<"select" | "preview" | "importing" | "done">("select");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [previewRows, setPreviewRows] = useState<ParseResult["valid"]>([]);
  const [previewErrors, setPreviewErrors] = useState<ValidationError[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{ created: number; failed: number; failDetails: { row: number; name: string; error: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("select");
    setParseResult(null);
    setPreviewRows([]);
    setPreviewErrors([]);
    setProgress({ current: 0, total: 0 });
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [onOpenChange, reset]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsv(text);
      setParseResult(parsed);
      setPreviewRows(parsed.valid.slice(0, 20));
      setPreviewErrors(parsed.errors);
      setStep("preview");
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const handleImport = useCallback(async () => {
    if (!parseResult?.valid.length) return;
    setStep("importing");
    setProgress({ current: 0, total: parseResult.valid.length });

    const res = await importRows(parseResult.valid, (current, total) => {
      setProgress({ current, total });
    });

    setResult(res);
    setStep("done");

    if (res.failed === 0) {
      toast.success(`${res.created} productos importados correctamente`);
    } else {
      toast.warning(`Importados: ${res.created} | Fallidos: ${res.failed}`);
    }

    onComplete();
  }, [parseResult, onComplete]);

  const groups = parseResult?.valid ? groupByCategory(parseResult.valid) : {};
  const totalValid = parseResult?.valid.length || 0;
  const totalErrors = previewErrors.length;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <Dialog isOpen={isOpen} onOpenChange={onOpenChange} className="max-w-4xl">
        {() => (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                  <span className="material-symbols-outlined">upload</span>
                </div>
                <div>
                  <DialogTitle>Importar CSV</DialogTitle>
                  <p className="mt-1 text-sm text-text-tertiary">
                    {step === "select" && "Selecciona un archivo CSV para importar"}
                    {step === "preview" && `Vista previa — ${totalValid} productos válidos`}
                    {step === "importing" && `Importando ${progress.current} de ${progress.total}...`}
                    {step === "done" && "Importación completada"}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <DialogBody className="max-h-[70vh] overflow-y-auto">
              {/* Step 1: File Select */}
              {step === "select" && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-background-gray-secondary">
                    <span className="material-symbols-outlined text-3xl text-icon-tertiary">upload_file</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-text-primary">
                      Arrastra un archivo CSV aquí o haz clic para seleccionar
                    </p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Formato: el mismo que genera "Exportar CSV"
                    </p>
                  </div>
                  <Button
                    appearance="outline"
                    onPress={() => fileRef.current?.click()}
                  >
                    <span className="material-symbols-outlined text-base">folder_open</span>
                    Seleccionar archivo
                  </Button>
                </div>
              )}

            {/* Step 2: Preview */}
            {step === "preview" && parseResult && (
              <div className="space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-background-gray-secondary p-3 text-center">
                    <p className="text-2xl font-semibold text-text-primary">{totalValid}</p>
                    <p className="text-xs text-text-tertiary">Productos válidos</p>
                  </div>
                  <div className="rounded-lg bg-background-gray-secondary p-3 text-center">
                    <p className={`text-2xl font-semibold ${totalErrors > 0 ? "text-red-500" : "text-text-primary"}`}>{totalErrors}</p>
                    <p className="text-xs text-text-tertiary">Errores</p>
                  </div>
                  <div className="rounded-lg bg-background-gray-secondary p-3 text-center">
                    <p className="text-2xl font-semibold text-text-primary">{Object.keys(groups).length}</p>
                    <p className="text-xs text-text-tertiary">Categorías</p>
                  </div>
                </div>

                {/* Category breakdown */}
                {Object.keys(groups).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(groups).map(([cat, count]) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-background-white-primary px-3 py-1 text-xs text-text-secondary"
                      >
                        {CATEGORY_LABELS[cat] || cat}
                        <span className="font-semibold">{count}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Errors list */}
                {totalErrors > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-red-700">
                      Errores (se saltarán al importar):
                    </p>
                    <div className="max-h-32 space-y-1 overflow-y-auto">
                      {previewErrors.map((err, i) => (
                        <p key={i} className="text-xs text-red-600">
                          Fila {err.row}: {err.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview table */}
                <div className="overflow-x-auto rounded-lg border border-card-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-card-border bg-background-gray-secondary">
                        <th className="px-3 py-2 text-left font-medium text-text-tertiary">Fila</th>
                        <th className="px-3 py-2 text-left font-medium text-text-tertiary">Nombre</th>
                        <th className="px-3 py-2 text-left font-medium text-text-tertiary">Marca</th>
                        <th className="px-3 py-2 text-left font-medium text-text-tertiary">Categoría</th>
                        <th className="px-3 py-2 text-left font-medium text-text-tertiary">Precio</th>
                        <th className="px-3 py-2 text-left font-medium text-text-tertiary">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} className="border-b border-card-border last:border-b-0">
                          <td className="px-3 py-2 text-text-tertiary">{i + 2}</td>
                          <td className="px-3 py-2 font-medium text-text-primary">{row.form.nombre}</td>
                          <td className="px-3 py-2 text-text-secondary">{row.form.marca}</td>
                          <td className="px-3 py-2">
                            <span className="inline-block rounded bg-brand-500/10 px-2 py-0.5 text-brand-600">
                              {CATEGORY_LABELS[row.categoryKey] || row.categoryKey}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-text-secondary">{row.form.precio || "—"}</td>
                          <td className="px-3 py-2 text-text-secondary">{row.form.stock || "0"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalValid > 20 && (
                    <p className="px-3 py-2 text-center text-xs text-text-tertiary">
                      Mostrando 20 de {totalValid} productos
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Importing */}
            {step === "importing" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="size-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                <p className="text-sm text-text-secondary">
                  Importando producto {progress.current} de {progress.total}...
                </p>
                <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-background-gray-secondary">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-300"
                    style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Done */}
            {step === "done" && result && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <span className="material-symbols-outlined text-3xl text-green-600">check_circle</span>
                    <p className="mt-1 text-2xl font-semibold text-green-700">{result.created}</p>
                    <p className="text-xs text-green-600">Creados</p>
                  </div>
                  <div className={`rounded-lg p-4 text-center ${result.failed > 0 ? "bg-red-50" : "bg-background-gray-secondary"}`}>
                    <span className={`material-symbols-outlined text-3xl ${result.failed > 0 ? "text-red-500" : "text-icon-tertiary"}`}>
                      {result.failed > 0 ? "error" : "check_circle"}
                    </span>
                    <p className={`mt-1 text-2xl font-semibold ${result.failed > 0 ? "text-red-600" : "text-text-primary"}`}>{result.failed}</p>
                    <p className={`text-xs ${result.failed > 0 ? "text-red-500" : "text-text-tertiary"}`}>Fallidos</p>
                  </div>
                </div>

                {result.failDetails.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-red-700">Detalles de errores:</p>
                    <div className="max-h-32 space-y-1 overflow-y-auto">
                      {result.failDetails.map((err, i) => (
                        <p key={i} className="text-xs text-red-600">
                          Fila {err.row} ({err.name}): {err.error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            {step === "select" && (
              <DialogClose appearance="outline" onPress={handleClose}>
                Cancelar
              </DialogClose>
            )}
            {step === "preview" && (
              <>
                <DialogClose appearance="outline" onPress={handleClose}>
                  Cancelar
                </DialogClose>
                <Button onPress={handleImport} isDisabled={totalValid === 0}>
                  <span className="material-symbols-outlined text-base">upload</span>
                  Importar {totalValid} productos
                </Button>
              </>
            )}
            {step === "done" && (
              <Button onPress={handleClose}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </>
      )}
    </Dialog>
    </>
  );
}
