"use client";

import { Card, CardContent, CardHeader } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";

interface DashboardData {
  totalProducts: number;
  inventoryValue: number;
  totalCotizaciones: number;
  pendingCotizaciones: number;
  monthCotizaciones: number;
  totalClientes: number;
  lowStock: { id: string; nombre: string; stock: number; status: string }[];
  recentQuotes: {
    id: string;
    client: string;
    date: string;
    components: string;
    total: string;
    status: string;
    statusColor: string;
  }[];
}

interface StatItem {
  id: string;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

const statusStyles: Record<string, string> = {
  Pendiente: "bg-yellow-100 text-yellow-800",
  Aprobada: "bg-green-100 text-green-800",
  "En Proceso": "bg-blue-100 text-blue-800",
};

const stockStyles: Record<string, string> = {
  Bajo: "bg-yellow-100 text-yellow-800",
  Crítico: "bg-red-100 text-red-800",
};

const currencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function CymDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las métricas.");
        return res.json();
      })
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats: StatItem[] = [
    {
      id: "inventory",
      label: "Total Inventario",
      value: data ? String(data.totalProducts) : "—",
      iconBg: "bg-brand-100",
      iconColor: "text-brand-500",
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      ),
    },
    {
      id: "quotes",
      label: "Cotizaciones Pendientes",
      value: data ? String(data.pendingCotizaciones) : "—",
      iconBg: "bg-blue-200",
      iconColor: "text-blue-900",
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
    },
    {
      id: "inventory-value",
      label: "Valor de Inventario",
      value: data ? currencyFormat.format(data.inventoryValue) : "—",
      iconBg: "bg-green-600/10",
      iconColor: "text-green-600",
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659 1.616-1.054M12 18h.01M12 18a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        </svg>
      ),
    },
    {
      id: "clients",
      label: "Clientes",
      value: data ? String(data.totalClientes) : "—",
      iconBg: "bg-purple-300/20",
      iconColor: "text-purple-600",
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
    },
  ];

  const recentQuotes = data?.recentQuotes ?? [];
  const inventoryAlerts = data?.lowStock ?? [];

  return (
    <div className="mt-6 space-y-5">
      <div className="px-2 lg:px-6">
        <h1 className="mb-1 text-[28px] leading-8 font-medium text-text-primary">
          Dashboard
        </h1>
        <p className="text-sm leading-5 text-text-tertiary">
          Resumen general del ERP CyM — inventario, cotizaciones y clientes.
        </p>
      </div>

      <div className="space-y-5 px-2 lg:px-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    item.iconBg,
                    item.iconColor,
                  )}
                >
                  {item.icon}
                </div>
              </CardHeader>
              <CardContent className="mt-6 p-0">
                <div className="mb-1.25 text-xl leading-7 font-semibold text-text-primary md:text-2xl md:leading-8">
                  {item.value}
                </div>
              </CardContent>
              <div className="flex items-center justify-between p-0">
                <span className="text-sm leading-5 font-medium text-text-tertiary">
                  {item.label}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* Recent Quotes + Inventory Alerts */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_400px]">
          {/* Recent Quotes */}
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-text-primary">
                Cotizaciones Recientes
              </h2>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              {loading ? (
                <p className="text-sm text-text-tertiary">Cargando cotizaciones…</p>
              ) : recentQuotes.length === 0 ? (
                <p className="text-sm text-text-tertiary">Aún no hay cotizaciones pendientes.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border-secondary text-text-tertiary">
                        <th className="pb-3 pr-4 font-medium">ID</th>
                        <th className="pb-3 pr-4 font-medium">Cliente</th>
                        <th className="pb-3 pr-4 font-medium">Total</th>
                        <th className="pb-3 pr-4 font-medium">Estado</th>
                        <th className="pb-3 font-medium">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="text-text-secondary">
                      {recentQuotes.map((q) => (
                        <tr key={q.id} className="border-b border-border-secondary last:border-0">
                          <td className="py-3 pr-4 font-medium text-text-primary">{q.id}</td>
                          <td className="py-3 pr-4">{q.client}</td>
                          <td className="py-3 pr-4 font-medium text-text-primary">{q.total}</td>
                          <td className="py-3 pr-4">
                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", statusStyles[q.status])}>
                              {q.status}
                            </span>
                          </td>
                          <td className="py-3 text-text-tertiary">{q.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory Alerts */}
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-text-primary">
                Alertas de Inventario
              </h2>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              {loading ? (
                <p className="text-sm text-text-tertiary">Cargando alertas…</p>
              ) : inventoryAlerts.length === 0 ? (
                <p className="text-sm text-text-tertiary">Sin alertas de stock.</p>
              ) : (
                <div className="space-y-4">
                  {inventoryAlerts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {item.nombre}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          Stock: {item.stock} unidades
                        </p>
                      </div>
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", stockStyles[item.status])}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-text-primary">
              Accesos Rápidos
            </h2>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Nuevo Componente", href: "/admin/inventario", icon: "📦" },
                { label: "Crear Cotización", href: "/admin/cotizaciones", icon: "📝" },
                { label: "Ver Clientes", href: "/admin/clientes", icon: "👥" },
                { label: "Ver Ventas", href: "/admin/ventas", icon: "💰" },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border-secondary p-4 text-center transition-colors hover:border-brand-300 hover:bg-brand-100/30"
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="text-sm font-medium text-text-primary">
                    {action.label}
                  </span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
