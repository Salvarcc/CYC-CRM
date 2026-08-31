import { Card, CardContent, CardHeader } from "@/components/tailgrids/core/card";

const actions = [
  { label: "Nuevo Componente", href: "/admin/inventario", icon: "📦" },
  { label: "Crear Cotización", href: "/admin/cotizaciones", icon: "📝" },
  { label: "Ver Clientes", href: "/admin/clientes", icon: "👥" },
  { label: "Ver Ventas", href: "/admin/ventas", icon: "💰" },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-text-primary">
          Accesos Rápidos
        </h2>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {actions.map((action) => (
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
  );
}