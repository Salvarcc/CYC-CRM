"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

const ACCEPT = ".png,.jpg,.jpeg";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export function ImageUploader({ value, onChange, className }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast.error("Solo se permiten archivos PNG o JPG");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("El archivo no puede superar 5 MB");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error al subir" }));
        throw new Error(err.error || "Error al subir imagen");
      }
      const data = await res.json();
      setPreview(data.url);
      onChange(data.url);
      toast.success("Imagen subida correctamente");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista previa"
            className="h-32 w-32 rounded-lg border border-card-border object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onChange("");
            }}
            className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-error text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Eliminar imagen"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-card-border bg-background-gray-secondary text-text-tertiary hover:border-brand-500 hover:text-brand-500 transition-colors cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-3xl">
            {uploading ? "hourglass_top" : "add_photo_alternate"}
          </span>
          <span className="text-xs text-center leading-tight">
            {uploading ? "Subiendo..." : "Subir imagen"}
            <br />
            PNG o JPG (max 5 MB)
          </span>
        </button>
      )}
    </div>
  );
}
