"use client";

import { SearchIcon } from "@/components/common/header/icons";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/tailgrids/core/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/tailgrids/core/input-group";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";
import { MenuDotsIcon } from "@/utils/icon";
import { useState } from "react";
import { DownloadIcon, FilterIcon } from "./icons";

type BadgeColor =
  | "gray"
  | "primary"
  | "error"
  | "warning"
  | "success"
  | "cyan"
  | "sky"
  | "blue"
  | "violet"
  | "purple"
  | "pink"
  | "rose"
  | "orange";

interface Quote {
  id: string;
  client: string;
  date: string;
  components: string;
  total: string;
  status: string;
  statusColor: BadgeColor;
}

const STATUS_TABS = ["Todas", "Pendientes", "Aprobadas", "Rechazadas", "Completadas"] as const;

const STATUS_COLOR_MAP: Record<string, BadgeColor> = {
  pendiente: "warning",
  aprobada: "success",
  rechazada: "error",
  completada: "blue",
  "en progreso": "cyan",
  cotizada: "violet",
};

const MOCK_QUOTES: Quote[] = [
  {
    id: "COT-2026-001",
    client: "María García",
    date: "15 Ago 2026",
    components: "Intel i9-14900K, ASUS Z790, 32GB DDR5, RTX 4090",
    total: "$3,249.96",
    status: "Pendiente",
    statusColor: "warning",
  },
  {
    id: "COT-2026-002",
    client: "Carlos López",
    date: "14 Ago 2026",
    components: "AMD Ryzen 7 7800X3D, MSI B650, 16GB DDR5, RTX 4070",
    total: "$1,849.96",
    status: "Aprobada",
    statusColor: "success",
  },
  {
    id: "COT-2026-003",
    client: "Ana Martínez",
    date: "13 Ago 2026",
    components: "Intel i5-14600K, Gigabyte B760, 16GB DDR4, RTX 4060",
    total: "$1,049.96",
    status: "Completada",
    statusColor: "blue",
  },
  {
    id: "COT-2026-004",
    client: "Roberto Sánchez",
    date: "12 Ago 2026",
    components: "AMD Ryzen 9 7950X, ASUS X670E, 64GB DDR5, RTX 4090",
    total: "$4,129.96",
    status: "En Progreso",
    statusColor: "cyan",
  },
  {
    id: "COT-2026-005",
    client: "Laura Fernández",
    date: "11 Ago 2026",
    components: "Intel i7-14700K, MSI Z790, 32GB DDR5, RTX 4070 Ti",
    total: "$2,449.96",
    status: "Rechazada",
    statusColor: "error",
  },
  {
    id: "COT-2026-006",
    client: "Diego Ruiz",
    date: "10 Ago 2026",
    components: "AMD Ryzen 5 7600, Gigabyte B650M, 16GB DDR5, RX 7800 XT",
    total: "$1,149.96",
    status: "Pendiente",
    statusColor: "warning",
  },
  {
    id: "COT-2026-007",
    client: "Sofía Hernández",
    date: "09 Ago 2026",
    components: "Intel i9-14900K, ASUS ROG Z790, 64GB DDR5, RTX 4090",
    total: "$4,549.96",
    status: "Aprobada",
    statusColor: "success",
  },
  {
    id: "COT-2026-008",
    client: "Pablo Moreno",
    date: "08 Ago 2026",
    components: "AMD Ryzen 7 7700X, MSI B650, 32GB DDR5, RTX 4060 Ti",
    total: "$1,549.96",
    status: "Completada",
    statusColor: "blue",
  },
];

export default function CotizacionesPage() {
  const [activeTab, setActiveTab] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredQuotes = MOCK_QUOTES.filter((quote) => {
    const matchesTab =
      activeTab === "Todas" || quote.status === activeTab.replace(/s$/, "");
    const matchesSearch =
      quote.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabCounts = {
    Todas: MOCK_QUOTES.length,
    Pendientes: MOCK_QUOTES.filter((q) => q.status === "Pendiente").length,
    Aprobadas: MOCK_QUOTES.filter((q) => q.status === "Aprobada").length,
    Rechazadas: MOCK_QUOTES.filter((q) => q.status === "Rechazada").length,
    Completadas: MOCK_QUOTES.filter((q) => q.status === "Completada").length,
  };

  return (
    <div className="mt-6 space-y-5">
      {/* Header */}
      <div className="px-2 lg:px-6">
        <h1 className="mb-1 text-[28px] leading-8 font-medium text-text-primary">
          Gestión de Cotizaciones
        </h1>
        <p className="text-sm leading-5 text-text-tertiary">
          Administra las cotizaciones y armados de PC de los clientes.
        </p>
      </div>

      <div className="space-y-5 px-2 lg:px-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm leading-5 font-medium text-text-tertiary">
                    Total Cotizaciones
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-text-primary">
                    {MOCK_QUOTES.length}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-primary-background">
                  <span className="text-badge-primary-icon-color material-symbols-outlined text-xl">
                    description
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm leading-5 font-medium text-text-tertiary">
                    Pendientes
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-orange-600">
                    {tabCounts.Pendientes}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-warning-background">
                  <span className="text-badge-warning-icon-color material-symbols-outlined text-xl">
                    pending
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm leading-5 font-medium text-text-tertiary">
                    Aprobadas
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-green-600">
                    {tabCounts.Aprobadas}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-success-background">
                  <span className="text-badge-success-icon-color material-symbols-outlined text-xl">
                    check_circle
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm leading-5 font-medium text-text-tertiary">
                    Valor Total
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-text-primary">
                    $18,969.68
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-violet-background">
                  <span className="text-badge-violet-icon-color material-symbols-outlined text-xl">
                    attach_money
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quotes Table */}
        <Card>
          <CardHeader className="mb-6">
            <CardTitle>Cotizaciones</CardTitle>
            <div className="flex items-center gap-1.5">
              <InputGroup className="py-1.5">
                <InputGroupAddon align="inline-start" className="pr-0 text-icon-tertiary">
                  <SearchIcon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Buscar por cliente o ID..."
                  className="py-0 pl-2 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
              <Button appearance="outline" className="h-8 w-8 p-1.5 text-icon-tertiary">
                <FilterIcon />
              </Button>
              <Button appearance="outline" className="h-8 w-8 p-1.5 text-icon-tertiary">
                <DownloadIcon />
              </Button>
            </div>
          </CardHeader>

          {/* Status Tabs */}
          <div className="mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-brand-500 text-white"
                    : "bg-background-gray-primary text-text-secondary hover:bg-background-gray-secondary"
                }`}
              >
                {tab}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    activeTab === tab
                      ? "bg-white/20 text-white"
                      : "bg-background-gray-secondary text-text-tertiary"
                  }`}
                >
                  {tabCounts[tab]}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div>
            <TableRoot className="w-full min-w-200 rounded-none border-none">
              <TableHeader>
                <TableRow className="[&_th]:border-t">
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    ID
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Cliente
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Fecha
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Componentes
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Total
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Estado
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    <div className="flex items-center justify-center">Acción</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id} className="[&_td]:border-none">
                    <TableCell className="px-6 py-3.5 text-sm leading-5 font-medium text-text-primary">
                      {quote.id}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm leading-5 font-medium text-text-primary">
                      {quote.client}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm leading-5 text-text-secondary">
                      {quote.date}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate px-6 py-3.5 text-sm leading-5 text-text-secondary">
                      {quote.components}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm leading-5 font-medium text-text-primary">
                      {quote.total}
                    </TableCell>
                    <TableCell className="px-6 py-3.5">
                      <Badge color={quote.statusColor} size="sm">
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7.5 w-8 rounded-lg border-none p-1.5 text-icon-secondary shadow-xs"
                        >
                          <MenuDotsIcon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          </div>
        </Card>
      </div>
    </div>
  );
}
