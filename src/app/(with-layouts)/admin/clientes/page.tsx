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

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalOrders: number;
  totalSpent: string;
  lastPurchase: string;
  status: string;
  statusColor: BadgeColor;
}

const MOCK_CLIENTS: Client[] = [
  {
    id: "CLI-001",
    name: "María García",
    email: "maria.garcia@email.com",
    phone: "+52 55 1234 5678",
    location: "Ciudad de México",
    totalOrders: 5,
    totalSpent: "$12,450.00",
    lastPurchase: "15 Ago 2026",
    status: "Activo",
    statusColor: "success",
  },
  {
    id: "CLI-002",
    name: "Carlos López",
    email: "carlos.lopez@email.com",
    phone: "+52 33 9876 5432",
    location: "Guadalajara",
    totalOrders: 3,
    totalSpent: "$5,849.96",
    lastPurchase: "14 Ago 2026",
    status: "Activo",
    statusColor: "success",
  },
  {
    id: "CLI-003",
    name: "Ana Martínez",
    email: "ana.martinez@email.com",
    phone: "+52 81 5555 1234",
    location: "Monterrey",
    totalOrders: 2,
    totalSpent: "$2,099.92",
    lastPurchase: "13 Ago 2026",
    status: "Activo",
    statusColor: "success",
  },
  {
    id: "CLI-004",
    name: "Roberto Sánchez",
    email: "roberto.sanchez@email.com",
    phone: "+52 55 2222 3333",
    location: "Puebla",
    totalOrders: 1,
    totalSpent: "$4,129.96",
    lastPurchase: "12 Ago 2026",
    status: "VIP",
    statusColor: "violet",
  },
  {
    id: "CLI-005",
    name: "Laura Fernández",
    email: "laura.fernandez@email.com",
    phone: "+52 33 4444 5555",
    location: "León",
    totalOrders: 4,
    totalSpent: "$9,799.84",
    lastPurchase: "11 Ago 2026",
    status: "Activo",
    statusColor: "success",
  },
  {
    id: "CLI-006",
    name: "Diego Ruiz",
    email: "diego.ruiz@email.com",
    phone: "+52 81 6666 7777",
    location: "Querétaro",
    totalOrders: 1,
    totalSpent: "$1,149.96",
    lastPurchase: "10 Ago 2026",
    status: "Nuevo",
    statusColor: "cyan",
  },
  {
    id: "CLI-007",
    name: "Sofía Hernández",
    email: "sofia.hernandez@email.com",
    phone: "+52 55 8888 9999",
    location: "Mérida",
    totalOrders: 6,
    totalSpent: "$18,299.76",
    lastPurchase: "09 Ago 2026",
    status: "VIP",
    statusColor: "violet",
  },
  {
    id: "CLI-008",
    name: "Pablo Moreno",
    email: "pablo.moreno@email.com",
    phone: "+52 33 1111 2222",
    location: "Tijuana",
    totalOrders: 2,
    totalSpent: "$3,099.92",
    lastPurchase: "08 Ago 2026",
    status: "Activo",
    statusColor: "success",
  },
];

export default function ClientesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = MOCK_CLIENTS.filter((client) => {
    return (
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalClients = MOCK_CLIENTS.length;
  const activeClients = MOCK_CLIENTS.filter((c) => c.status === "Activo").length;
  const vipClients = MOCK_CLIENTS.filter((c) => c.status === "VIP").length;
  const totalRevenue = MOCK_CLIENTS.reduce((sum, c) => {
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
                    {totalClients}
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
                    {activeClients}
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
                    {vipClients}
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
                  placeholder="Buscar por nombre, email o ubicación..."
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
                    Ubicación
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
                {filteredClients.map((client) => (
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
                            {client.id}
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
                    <TableCell className="px-6 py-3.5 text-sm leading-5 text-text-secondary">
                      {client.location}
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
                ))}
              </TableBody>
            </TableRoot>
          </div>
        </Card>
      </div>
    </div>
  );
}
