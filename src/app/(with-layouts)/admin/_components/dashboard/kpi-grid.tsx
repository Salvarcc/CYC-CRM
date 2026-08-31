import { getDashboardGeneral } from "@/lib/dashboard";
import { StatCard } from "./stat-card";

const currencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export async function KpiGrid() {
  const data = await getDashboardGeneral();

  const stats = [
    {
      id: "inventory",
      label: "Total Inventario",
      value: String(data.totalProducts),
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
      value: String(data.pendingCotizaciones),
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
      value: currencyFormat.format(data.inventoryValue),
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
      value: String(data.totalClientes),
      iconBg: "bg-purple-300/20",
      iconColor: "text-purple-600",
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => (
        <StatCard key={item.id} {...item} />
      ))}
    </div>
  );
}