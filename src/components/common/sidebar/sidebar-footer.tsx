'use client';

import ThemeToggle from '@/components/common/header/theme-toggle';
import { SidebarUserMenu } from '@/components/common/sidebar/sidebar-user-menu';
import { cn } from '@/utils/cn';

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

            <SidebarUserMenu isSidebarOpen={isSidebarOpen} />
        </div>
    );
}