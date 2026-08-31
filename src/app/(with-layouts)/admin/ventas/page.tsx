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

interface Order {
  id: string;
  client: string;
  date: string;
  items: number;
  total: string;
  paymentMethod: string;
  status: string;
  statusColor: BadgeColor;
  totalUsd: number;
  createdAt: string;
}

const STATUS_TABS = ["Todos", "Pagadas"] as const;

export default function VentasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [last24h, setLast24h] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/ventas")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Order[]) => {
        setOrders(data);
        const cutoff = Date.now() - 24 * 3_600_000;
        setLast24h(
          data.filter((o) => new Date(o.createdAt).getTime() >= cutoff).length,
        );
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesTab =
      activeTab === "Todos" ||
      (activeTab === "Pagadas" ? order.status === "Pagada" : order.status === activeTab);
    const matchesSearch =
      order.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalUsd ?? 0), 0);

  const tabCounts: Record<string, number> = {
    Todos: orders.length,
    Pagadas: orders.filter((o) => o.status === "Pagada").length,
  };

  return (
    <div className="mt-6 space-y-5">
      {/* Header */}
      <div className="px-2 lg:px-6">
        <h1 className="mb-1 text-[28px] leading-8 font-medium text-text-primary">
          Ventas y Pedidos
        </h1>
        <p className="text-sm leading-5 text-text-tertiary">
          Gestiona los pedidos, ventas y pagos de la tienda.
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
                    Total Pedidos
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-text-primary">
                    {orders.length}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-primary-background">
                  <span className="text-badge-primary-icon-color material-symbols-outlined text-xl">
                    shopping_cart
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
                    Ingresos Totales
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-green-600">
                    ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-success-background">
                  <span className="text-badge-success-icon-color material-symbols-outlined text-xl">
                    trending_up
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
                    Últimas 24h
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-orange-600">
                    {last24h}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-warning-background">
                  <span className="text-badge-warning-icon-color material-symbols-outlined text-xl">
                    schedule
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
                    Ticket Promedio
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-text-primary">
                    ${(orders.length ? totalRevenue / orders.length : 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-violet-background">
                  <span className="text-badge-violet-icon-color material-symbols-outlined text-xl">
                    receipt_long
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader className="mb-6">
            <CardTitle>Pedidos Recientes</CardTitle>
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
                    Pedido
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Cliente
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Fecha
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Artículos
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Total
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Pago
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
                  <TableRow className="[&_td]:border-none">
                    <TableCell className="px-6 py-10 text-center text-sm text-text-tertiary" colSpan={7}>
                      Cargando ventas...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow className="[&_td]:border-none">
                    <TableCell className="px-6 py-10 text-center text-sm text-text-tertiary" colSpan={7}>
                      Aún no hay ventas registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="[&_td]:border-none">
                    <TableCell className="px-6 py-3.5 text-sm leading-5 font-medium text-text-primary">
                      {order.id}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm leading-5 font-medium text-text-primary">
                      {order.client}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm leading-5 text-text-secondary">
                      {order.date}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm leading-5 text-text-secondary">
                      {order.items} artículos
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm leading-5 font-medium text-text-primary">
                      {order.total}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm leading-5 text-text-secondary">
                      {order.paymentMethod}
                    </TableCell>
                    <TableCell className="px-6 py-3.5">
                      <Badge color={order.statusColor} size="sm">
                        {order.status}
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
