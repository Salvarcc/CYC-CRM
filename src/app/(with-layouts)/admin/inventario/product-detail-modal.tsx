"use client";

import { useEffect, useState } from "react";
import { ImageUploader } from "@/components/common/image-uploader/image-uploader";
import { Button } from "@/components/tailgrids/core/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/tailgrids/core/dialog";
import { getSubcategorias } from "./subcategorias";
import CategoryAttributeForm from "./category-attribute-form";

export interface ProductDetailItem {
  id: string;
  nombre: string;
  marca: string;
  category: string;
  categoryKey: string;
  precio: number | null;
  moneda: string;
  stock: number;
  imagenUrl: string | null;
  createdAt: string;
  oculto: boolean;
  cotizador: boolean;
  attrs: Record<string, unknown>;
}

interface ProductDetailModalProps {
  item: ProductDetailItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, categoryKey: string, form: Record<string, string>) => Promise<void>;
}

const PLACEHOLDER_IMG = "https://placehold.co/40x40/f3f4f6/6b7280?text=PC";

function productToForm(item: ProductDetailItem): Record<string, string> {
  const form: Record<string, string> = {
    nombre: item.nombre,
    marca: item.marca,
    precio: item.precio != null ? String(item.precio) : "",
    moneda: item.moneda || "USD",
    stock: String(item.stock),
    imagenUrl: item.imagenUrl ?? "",
  };
  for (const [key, value] of Object.entries(item.attrs)) {
    if (key === "subcategoria") {
      form.subcategoria = value != null ? String(value) : "";
      continue;
    }
    if (value === null || value === undefined) {
      form[key] = "";
      continue;
    }
    if (Array.isArray(value)) {
      form[key] = value.join(", ");
      continue;
    }
    form[key] = String(value);
  }
  return form;
}

export default function ProductDetailModal({
  item,
  open,
  onOpenChange,
  onSave,
}: ProductDetailModalProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && item) {
      setForm(productToForm(item));
    }
  }, [open, item]);

  const handleSave = async () => {
    if (!item) return;
    if (!form.nombre?.trim()) return;
    setSaving(true);
    try {
      await onSave(item.id, item.categoryKey, form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange} className="max-w-5xl">
      {({ close }) => (
        <>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                <span className="material-symbols-outlined">visibility</span>
              </div>
              <div>
                <DialogTitle>Detalle del Producto</DialogTitle>
                <p className="mt-1 text-sm text-text-tertiary">
                  {item ? item.category : "—"}
                  {item ? ` · ${item.id.slice(0, 12)}...` : ""}
                </p>
              </div>
            </div>
          </DialogHeader>

          {item && (
            <DialogBody className="max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* ── Left: Información Básica ── */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Información Básica
                  </h3>

                  <div className="flex items-center gap-3">
                    <img
                      src={form.imagenUrl || item.imagenUrl || PLACEHOLDER_IMG}
                      alt={item.nombre}
                      className="size-14 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.nombre}</p>
                      <p className="text-xs text-text-tertiary">{item.marca}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">
                        Nombre del Producto <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                        value={form.nombre || ""}
                        onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">
                        Marca
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                        value={form.marca || ""}
                        onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">Subcategoría</label>
                      <select
                        className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary disabled:cursor-not-allowed disabled:text-text-tertiary"
                        value={form.subcategoria || ""}
                        disabled={getSubcategorias(item.categoryKey).length === 0}
                        onChange={(e) => setForm((f) => ({ ...f, subcategoria: e.target.value }))}
                      >
                        <option value="">Seleccionar...</option>
                        {getSubcategorias(item.categoryKey).map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-text-primary">Moneda</label>
                        <select
                          className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                          value={form.moneda || "USD"}
                          onChange={(e) => setForm((f) => ({ ...f, moneda: e.target.value }))}
                        >
                          <option value="USD">USD ($)</option>
                          <option value="PEN">PEN (S/.)</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-text-primary">Precio</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                          value={form.precio || ""}
                          onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-text-primary">Stock</label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full rounded-lg border border-card-border bg-background-white-primary px-3 py-2.5 text-sm text-text-primary"
                          value={form.stock || ""}
                          onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">Imagen del Producto</label>
                      <ImageUploader
                        value={form.imagenUrl || ""}
                        onChange={(url) => setForm((f) => ({ ...f, imagenUrl: url }))}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Right: Atributos Técnicos ── */}
                <div className="space-y-4 rounded-xl bg-background-gray-secondary p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Atributos Técnicos
                  </h3>
                  <CategoryAttributeForm categoryKey={item.categoryKey} form={form} setForm={setForm} />
                </div>
              </div>
            </DialogBody>
          )}

          <DialogFooter>
            <DialogClose appearance="outline" onPress={close}>
              Cancelar
            </DialogClose>
            <Button onClick={handleSave} isDisabled={!item || saving || !form.nombre?.trim()}>
              <span className="material-symbols-outlined text-base">save</span>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  );
}
