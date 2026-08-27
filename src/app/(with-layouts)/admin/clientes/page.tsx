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

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: string;
  lastPurchase: string;
  status: string;
  statusColor: BadgeColor;
}

export default function ClientesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/clientes")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredClients = clients.filter((client) => {
    return (
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "Activo").length;
  const vipClients = clients.filter((c) => c.status === "VIP").length;
  const totalRevenue = clients.reduce((sum, c) => {
    const val = parseFloat(c.totalSpent.replace(/[$,]/g, ""));
    return sum + val;
  }, 0);

  return (
    <div className="mt-6 space-y-5">
      {/* Header */}
      <div className="px-2 lg:px-6">
        <h1 className="mb-1 text-[28px] leading-8 font-medium text-text-primary">
          Directorio de Clientes
        </h1>
        <p className="text-sm leading-5 text-text-tertiary">
          Gestiona la información y historial de compra de tus clientes.
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
                    Total Clientes
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-text-primary">
                    {loading ? "—" : totalClients}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-primary-background">
                  <span className="text-badge-primary-icon-color material-symbols-outlined text-xl">
                    group
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
                    Clientes Activos
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-green-600">
                    {loading ? "—" : activeClients}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-success-background">
                  <span className="text-badge-success-icon-color material-symbols-outlined text-xl">
                    person
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
                    Clientes VIP
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-violet-600">
                    {loading ? "—" : vipClients}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-violet-background">
                  <span className="text-badge-violet-icon-color material-symbols-outlined text-xl">
                    star
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
                    Ingresos por Clientes
                  </p>
                  <p className="mt-1 text-2xl leading-8 font-semibold text-text-primary">
                    ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-badge-warning-background">
                  <span className="text-badge-warning-icon-color material-symbols-outlined text-xl">
                    payments
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader className="mb-6">
            <CardTitle>Directorio</CardTitle>
            <div className="flex items-center gap-1.5">
              <InputGroup className="py-1.5">
                <InputGroupAddon align="inline-start" className="pr-0 text-icon-tertiary">
                  <SearchIcon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Buscar por nombre o email..."
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

          {/* Table */}
          <div>
            <TableRoot className="w-full min-w-200 rounded-none border-none">
              <TableHeader>
                <TableRow className="[&_th]:border-t">
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Cliente
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Contacto
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Pedidos
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Total Gastado
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Última Compra
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
                      Cargando clientes...
                    </TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-12 text-center text-sm text-text-tertiary">
                      No se encontraron clientes.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id} className="[&_td]:border-none">
                      <TableCell className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-500">
                            {client.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm leading-5 font-medium text-text-primary">
                              {client.name}
                            </p>
                            <p className="text-xs leading-4 text-text-tertiary">
                              {client.id.slice(0, 12)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3.5">
                        <div>
                          <p className="text-sm leading-5 text-text-primary">
                            {client.email}
                          </p>
                          <p className="text-xs leading-4 text-text-tertiary">
                            {client.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-sm leading-5 font-medium text-text-primary">
                        {client.totalOrders}
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-sm leading-5 font-medium text-text-primary">
                        {client.totalSpent}
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-sm leading-5 text-text-secondary">
                        {client.lastPurchase}
                      </TableCell>
                      <TableCell className="px-6 py-3.5">
                        <Badge color={client.statusColor} size="sm">
                          {client.status}
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
