"use client";

import { Card, CardContent, CardHeader } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";

const stats = [
  {
    id: "inventory",
    label: "Total Inventario",
    value: "1,247",
    change: "+12%",
    isPositive: true,
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
    value: "38",
    change: "+5",
    isPositive: true,
    iconBg: "bg-blue-200",
    iconColor: "text-blue-900",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    id: "sales",
    label: "Ventas del Mes",
    value: "S/ 45,280",
    change: "+18%",
    isPositive: true,
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
    label: "Clientes Activos",
    value: "312",
    change: "+8%",
    isPositive: true,
    iconBg: "bg-purple-300/20",
    iconColor: "text-purple-600",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
];

const recentQuotes = [
  { id: "COT-2024-001", client: "Juan Pérez", total: "S/ 8,450", status: "Pendiente", date: "18 Ago" },
  { id: "COT-2024-002", client: "María López", total: "S/ 12,300", status: "Aprobada", date: "17 Ago" },
  { id: "COT-2024-003", client: "Tech Solutions SAC", total: "S/ 25,800", status: "En Proceso", date: "16 Ago" },
  { id: "COT-2024-004", client: "Carlos Ruiz", total: "S/ 6,200", status: "Aprobada", date: "15 Ago" },
  { id: "COT-2024-005", client: "Distribuidora Andina", total: "S/ 18,750", status: "Pendiente", date: "14 Ago" },
];

const inventoryAlerts = [
  { component: "AMD Ryzen 7 7800X3D", stock: 2, status: "Bajo" },
  { component: "NVIDIA RTX 4070 Ti Super", stock: 3, status: "Bajo" },
  { component: "Kingston Fury 32GB DDR5", stock: 5, status: "Bajo" },
  { component: "ASUS ROG Strix B650E-F", stock: 1, status: "Crítico" },
];

const statusStyles: Record<string, string> = {
  Pendiente: "bg-yellow-100 text-yellow-800",
  Aprobada: "bg-green-100 text-green-800",
  "En Proceso": "bg-blue-100 text-blue-800",
};

const stockStyles: Record<string, string> = {
  Bajo: "bg-yellow-100 text-yellow-800",
  Crítico: "bg-red-100 text-red-800",
};

export default function CymDashboard() {
  return (
    <div className="mt-6 space-y-5">
      <div className="px-2 lg:px-6">
        <h1 className="mb-1 text-[28px] leading-8 font-medium text-text-primary">
          Dashboard
        </h1>
        <p className="text-sm leading-5 text-text-tertiary">
          Resumen general del ERP CyM — inventario, cotizaciones y ventas.
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
                <span
                  className={cn(
                    "flex items-center gap-1 text-sm leading-5 font-medium",
                    item.isPositive ? "text-green-600" : "text-red-600",
                  )}
                >
                  {item.change}
                </span>
              </div>
            </Card>
          ))}
        </div>

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
              <div className="space-y-4">
                {inventoryAlerts.map((item) => (
                  <div key={item.component} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {item.component}
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
                { label: "Registrar Venta", href: "/admin/ventas", icon: "💰" },
                { label: "Ver Clientes", href: "/admin/clientes", icon: "👥" },
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
