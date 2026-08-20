import {
  HomeIcon,
  InventoryIcon,
  QuoteIcon,
  SalesIcon,
  UserGroupIcon,
  CurrencyIcon,
} from "./icon";

export const NAV_DATA = [
  {
    label: "CyM ERP",
    items: [
      {
        title: "Dashboard",
        icon: <HomeIcon />,
        url: "/admin",
      },
      {
        title: "Inventario",
        icon: <InventoryIcon />,
        url: "/admin/inventario",
      },
      {
        title: "Tipo de Cambio",
        icon: <CurrencyIcon />,
        url: "/admin/tipo-cambio",
      },
      {
        title: "Cotizaciones",
        icon: <QuoteIcon />,
        url: "/admin/cotizaciones",
      },
      {
        title: "Ventas",
        icon: <SalesIcon />,
        url: "/admin/ventas",
      },
      {
        title: "Clientes",
        icon: <UserGroupIcon />,
        url: "/admin/clientes",
      },
    ],
  },
];
