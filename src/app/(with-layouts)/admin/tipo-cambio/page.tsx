"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TipoCambio {
  id: string;
  compra: number | string;
  venta: number | string;
  fuente: string;
  fecha: string;
}

export default function TipoCambioPage() {
  const router = useRouter();
  const [tipoCambio, setTipoCambio] = useState<TipoCambio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ compra: "", venta: "", fuente: "SUNAT" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchTipoCambio();
  }, []);

  const fetchTipoCambio = async () => {
    try {
      const res = await fetch("/api/tipo-cambio");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTipoCambio(data);
      } else if (data.id) {
        setTipoCambio([data]);
      }
    } catch {
      setError("Error al cargar tipo de cambio");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.compra || !form.venta) {
      setError("Los campos compra y venta son obligatorios");
      return;
    }

    try {
      const res = await fetch("/api/tipo-cambio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compra: parseFloat(form.compra),
          venta: parseFloat(form.venta),
          fuente: form.fuente,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar");

      const nuevo = await res.json();
      setTipoCambio((prev) => [nuevo, ...prev]);
      setForm({ compra: "", venta: "", fuente: "SUNAT" });
      setShowForm(false);
      setSuccess("Tipo de cambio registrado exitosamente");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Error al guardar tipo de cambio");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center-admin text-sm">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-admin-text-primary">
            Tipo de Cambio
          </h1>
          <p className="text-sm text-admin-text-secondary mt-1">
            Administrar tasas de cambio USD/PEN
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-admin-primary text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          {showForm ? "Cancelar" : "+ Nuevo"}
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-admin-card border border-admin-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-sm font-semibold text-admin-text-primary mb-4">
            Registrar Nuevo Tipo de Cambio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-admin-text-secondary mb-1">
                Compra (USD → PEN)
              </label>
              <input
                type="number"
                step="0.0001"
                value={form.compra}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, compra: e.target.value }))
                }
                className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-lg text-sm text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-primary"
                placeholder="3.72"
              />
            </div>
            <div>
              <label className="block text-xs text-admin-text-secondary mb-1">
                Venta (USD → PEN)
              </label>
              <input
                type="number"
                step="0.0001"
                value={form.venta}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, venta: e.target.value }))
                }
                className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-lg text-sm text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-primary"
                placeholder="3.75"
              />
            </div>
            <div>
              <label className="block text-xs text-admin-text-secondary mb-1">
                Fuente
              </label>
              <input
                type="text"
                value={form.fuente}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fuente: e.target.value }))
                }
                className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-lg text-sm text-admin-text-primary focus:outline-none focus:ring-2 focus:ring-admin-primary"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-admin-primary text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      <div className="bg-admin-card border border-admin-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-admin-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-admin-text-secondary uppercase tracking-wider">
                Fecha
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-admin-text-secondary uppercase tracking-wider">
                Compra
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-admin-text-secondary uppercase tracking-wider">
                Venta
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-admin-text-secondary uppercase tracking-wider">
                Fuente
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {tipoCambio.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-admin-text-secondary text-sm"
                >
                  No hay registros de tipo de cambio
                </td>
              </tr>
            ) : (
              tipoCambio.map((tc) => (
                <tr key={tc.id} className="hover:bg-admin-bg/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-admin-text-primary">
                    {new Date(tc.fecha).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-admin-text-primary font-mono">
                    S/ {Number(tc.compra).toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-sm text-admin-text-primary font-mono">
                    S/ {Number(tc.venta).toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-sm text-admin-text-secondary">
                    {tc.fuente}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}