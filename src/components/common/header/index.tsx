"use client";

import { MenuIcon } from "@/components/common/header/icons";
import React from "react";

//  Main Header
export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b-[0.5px] border-card-border bg-card-surface-area px-2 py-4 lg:px-5">
      {/* Mobile layout (< xl): menu */}
      <div className="flex items-center xl:hidden">
        <div className="flex flex-1 justify-start">
          <button
            id="mobile-menu-toggle"
            onClick={onMenuClick}
            aria-label="Open sidebar menu"
            className="rounded-md px-1.5 py-1 text-icon-tertiary transition-colors hover:text-text-primary"
          >
            <MenuIcon />
          </button>
        </div>

        <div className="flex-1" />
      </div>
    </header>
  );
}
