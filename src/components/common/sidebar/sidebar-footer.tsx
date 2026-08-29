'use client';

import ThemeToggle from '@/components/common/header/theme-toggle';
import {
    BillingIcon,
    GearIcon,
    LogoutIcon,
    UserCircleIcon,
} from '@/components/common/header/icons';
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

const user = {
    name: 'Jhon Smith',
    email: 'jhonsmith@example.com',
    avatarUrl: '/images/user/jhon-smith.png',
};

const menuItems = [
    { href: '/profile', icon: <UserCircleIcon />, label: 'View profile' },
    { href: '#', icon: <GearIcon />, label: 'Account Settings' },
    { href: '#', icon: <BillingIcon />, label: 'Billing and Plan' },
];

export function SidebarFooter({ isSidebarOpen }: { isSidebarOpen: boolean }) {
    return (
        <div
            className={cn(
                'shrink-0 border-t border-card-border',
                isSidebarOpen
                    ? 'flex items-center justify-between gap-2 px-4 py-4'
                    : 'flex flex-col items-center gap-3 px-2 py-4',
            )}
        >
            <ThemeToggle />

            <DropdownMenu>
                <DropdownMenuTrigger className="group flex items-center gap-2.5 rounded-lg border-0 p-0 transition-all outline-none focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 focus-visible:ring-offset-1">
                    <Avatar>
                        <AvatarImage
                            src={user.avatarUrl!}
                            alt={user.name}
                            className={cn('rounded-lg', isSidebarOpen ? 'size-10' : 'size-9')}
                        />
                        <AvatarFallback className="rounded-lg border border-border-secondary-alt bg-background-gray-secondary_alt text-text-primary">
                            {user.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>

                    {isSidebarOpen && (
                        <>
                            <span className="min-w-0 flex-1 text-left text-sm leading-5 font-medium text-text-primary">
                                {user.name}
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
                            <AvatarImage src={user.avatarUrl!} alt={user.name} />
                            <AvatarFallback className="border border-border-secondary-alt bg-background-gray-secondary_alt text-text-primary">
                                {user.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="flex flex-col">
                            <span className="text-sm font-medium text-text-primary">
                                {user.name}
                            </span>
                            <span className="truncate text-xs text-gray-500">{user.email}</span>
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
                        onAction={() => {
                            // logout handler
                        }}
                        className="m-1.5 w-auto cursor-pointer px-3 py-2.5"
                    >
                        <span className="text-icon-secondary group-hover:text-text-primary">
                            <LogoutIcon />
                        </span>
                        <span className="leading-5">Logout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
