import { Card, CardContent, CardHeader } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";
import { getRecentQuotes } from "@/lib/dashboard";

const statusStyles: Record<string, string> = {
  Pendiente: "bg-yellow-100 text-yellow-800",
  Aprobada: "bg-green-100 text-green-800",
  "En Proceso": "bg-blue-100 text-blue-800",
};

export async function RecentQuotes() {
  const recentQuotes = await getRecentQuotes();

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-text-primary">
          Cotizaciones Recientes
        </h2>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        {recentQuotes.length === 0 ? (
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
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          statusStyles[q.status],
                        )}
                      >
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
  );
}