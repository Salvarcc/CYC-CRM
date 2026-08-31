import { Suspense } from "react";
import { getAdminSession } from "@/lib/admin-session";
import { redirect } from "next/navigation";
import { KpiGrid } from "./_components/dashboard/kpi-grid";
import { RecentQuotes } from "./_components/dashboard/recent-quotes";
import { InventoryAlerts } from "./_components/dashboard/inventory-alerts";
import { QuickActions } from "./_components/dashboard/quick-actions";
import {
  InventoryAlertsSkeleton,
  KpiGridSkeleton,
  RecentQuotesSkeleton,
} from "./_components/dashboard/skeletons";

export default async function CymDashboard() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

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
        <Suspense fallback={<KpiGridSkeleton />}>
          <KpiGrid />
        </Suspense>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_400px]">
          <Suspense fallback={<RecentQuotesSkeleton />}>
            <RecentQuotes />
          </Suspense>

          <Suspense fallback={<InventoryAlertsSkeleton />}>
            <InventoryAlerts />
          </Suspense>
        </div>

        <QuickActions />
      </div>
    </div>
  );
}