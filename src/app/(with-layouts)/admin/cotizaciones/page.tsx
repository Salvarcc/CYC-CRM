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
import { useEffect, useState } from "react";
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

export default function CotizacionesPage() {
  const [activeTab, setActiveTab] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/cotizaciones")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setQuotes(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredQuotes = quotes.filter((quote) => {
    const matchesTab =
      activeTab === "Todas" || quote.status === activeTab.replace(/s$/, "");
    const matchesSearch =
      quote.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabCounts = {
    Todas: quotes.length,
    Pendientes: quotes.filter((q) => q.status === "Pendiente").length,
    Aprobadas: quotes.filter((q) => q.status === "Aprobada").length,
    Rechazadas: quotes.filter((q) => q.status === "Rechazada").length,
    Completadas: quotes.filter((q) => q.status === "Completada").length,
  };

  const totalValue = quotes.reduce((sum, q) => {
    const num = parseFloat(q.total.replace(/[$,S/.]/g, ""));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

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
                    {loading ? "—" : quotes.length}
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
                    {loading ? "—" : tabCounts.Pendientes}
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
                    Completadas
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-green-600">
                    {loading ? "—" : tabCounts.Completadas}
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
                    {loading ? "—" : `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-12 text-center text-sm text-text-tertiary">
                      Cargando cotizaciones...
                    </TableCell>
                  </TableRow>
                ) : filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-12 text-center text-sm text-text-tertiary">
                      No se encontraron cotizaciones.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => (
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
                  ))
                )}
              </TableBody>
            </TableRoot>
          </div>
        </Card>
      </div>
    </div>
  );
}
