'use client';

import { BillingIcon, GearIcon, LogoutIcon, UserCircleIcon } from '@/components/common/header/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/tailgrids/core/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuHeader,
    DropdownMenuItem,
    DropdownMenuSection,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/tailgrids/core/dropdown';
import { cn } from '@/utils/cn';
import { AltArrowDownIcon } from '@/utils/icon';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Menú de usuario del pie del sidebar (esquina inferior izquierda).  */
/*                                                                      */
/*  - Con sesión admin activa: muestra nombre + avatar de iniciales     */
/*    (avatar predeterminado, sin foto) y un menú con ÚNICAMENTE         */
/*    "Cerrar sesión".                                                  */
/*  - Sin sesión admin: se conserva el perfil por defecto del template  */
/*    (Jhon Smith) con sus opciones demo.                               */
/* ------------------------------------------------------------------ */

interface AdminUser {
    id: string;
    usuario: string;
    nombre: string;
}

const fallbackUser = {
    name: 'Jhon Smith',
    email: 'jhonsmith@example.com',
    avatarUrl: '/images/user/jhon-smith.png',
};

const menuItems = [
    { href: '/profile', icon: <UserCircleIcon />, label: 'View profile' },
    { href: '#', icon: <GearIcon />, label: 'Account Settings' },
    { href: '#', icon: <BillingIcon />, label: 'Billing and Plan' },
];

function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

async function handleLogout() {
    try {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
        window.location.assign('/admin/login');
    }
}

const triggerClass =
    'group flex items-center gap-2.5 rounded-lg border-0 p-0 transition-all outline-none focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 focus-visible:ring-offset-1';

const avatarFallbackClass =
    'rounded-lg border border-border-secondary-alt bg-background-gray-secondary_alt text-text-primary';

/* ── Perfil por defecto del template (sin sesión admin) ────────────── */
function DefaultUserMenu({ isSidebarOpen }: { isSidebarOpen: boolean }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className={triggerClass}>
                <Avatar>
                    <AvatarImage
                        src={fallbackUser.avatarUrl!}
                        alt={fallbackUser.name}
                        className={cn('rounded-lg', isSidebarOpen ? 'size-10' : 'size-9')}
                    />
                    <AvatarFallback className={avatarFallbackClass}>
                        {fallbackUser.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>

                {isSidebarOpen && (
                    <>
                        <span className="min-w-0 flex-1 text-left text-sm leading-5 font-medium text-text-primary">
                            {fallbackUser.name}
                        </span>
                        <AltArrowDownIcon className="text-icon-tertiary transition-transform duration-200 group-aria-expanded:-rotate-180" />
                    </>
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
                placement="bottom start"
                className="w-70 overflow-hidden p-0 shadow-3xl"
            >
                <DropdownMenuHeader className="flex w-full items-center justify-start gap-2 border-b border-border-secondary-alt px-4 py-3">
                    <Avatar size="md">
                        <AvatarImage src={fallbackUser.avatarUrl!} alt={fallbackUser.name} />
                        <AvatarFallback className={avatarFallbackClass}>
                            {fallbackUser.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="flex flex-col">
                        <span className="text-sm font-medium text-text-primary">
                            {fallbackUser.name}
                        </span>
                        <span className="truncate text-xs text-gray-500">{fallbackUser.email}</span>
                    </span>
                </DropdownMenuHeader>

                <DropdownMenuSection className="p-1.5">
                    {menuItems.map((item) => (
                        <DropdownMenuItem
                            key={item.label}
                            href={item.href}
                            className="cursor-pointer px-3 py-2.5"
                            render={(domProps) =>
                                'href' in domProps ? (
                                    <Link {...domProps} />
                                ) : (
                                    <div {...domProps} />
                                )
                            }
                        >
                            <span className="shrink-0 text-icon-secondary group-hover:text-text-primary">
                                {item.icon}
                            </span>
                            <span className="leading-5 font-medium">{item.label}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuSection>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onAction={handleLogout}
                    className="m-1.5 w-auto cursor-pointer px-3 py-2.5"
                >
                    <span className="text-icon-secondary group-hover:text-text-primary">
                        <LogoutIcon />
                    </span>
                    <span className="leading-5">Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/* ── Usuario admin autenticado (solo "Cerrar sesión") ─────────────── */
function AdminUserMenu({ user, isSidebarOpen }: { user: AdminUser; isSidebarOpen: boolean }) {
    const name = user.nombre || user.usuario;
    const initials = getInitials(name);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className={triggerClass}>
                <Avatar title={name} className="rounded-lg">
                    <AvatarFallback
                        className={cn(avatarFallbackClass, !isSidebarOpen && 'size-9')}
                    >
                        {initials}
                    </AvatarFallback>
                </Avatar>

                {isSidebarOpen && (
                    <>
                        <span className="min-w-0 flex-1 truncate text-left text-sm leading-5 font-medium text-text-primary">
                            {name}
                        </span>
                        <AltArrowDownIcon className="text-icon-tertiary transition-transform duration-200 group-aria-expanded:-rotate-180" />
                    </>
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
                placement="bottom start"
                className="w-48 overflow-hidden p-0 shadow-3xl"
            >
                <DropdownMenuItem
                    onAction={handleLogout}
                    className="m-1.5 w-auto cursor-pointer px-3 py-2.5"
                >
                    <span className="text-icon-secondary group-hover:text-text-primary">
                        <LogoutIcon />
                    </span>
                    <span className="leading-5">Cerrar sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function SidebarUserMenu({ isSidebarOpen }: { isSidebarOpen: boolean }) {
    const [user, setUser] = useState<AdminUser | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch('/api/admin/auth/session');
                const data = (await res.json()) as { user: AdminUser | null };
                if (!cancelled) setUser(data.user ?? null);
            } catch {
                // Sin sesión admin: se mantiene el perfil por defecto.
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (user) {
        return <AdminUserMenu user={user} isSidebarOpen={isSidebarOpen} />;
    }

    return <DefaultUserMenu isSidebarOpen={isSidebarOpen} />;
}