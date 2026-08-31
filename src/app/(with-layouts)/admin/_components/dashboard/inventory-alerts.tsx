import { Card, CardContent, CardHeader } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";
import { getDashboardGeneral } from "@/lib/dashboard";

const stockStyles: Record<string, string> = {
  Bajo: "bg-yellow-100 text-yellow-800",
  Crítico: "bg-red-100 text-red-800",
};

export async function InventoryAlerts() {
  const data = await getDashboardGeneral();
  const inventoryAlerts = data.lowStock;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-text-primary">
          Alertas de Inventario
        </h2>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        {inventoryAlerts.length === 0 ? (
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
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    stockStyles[item.status],
                  )}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}