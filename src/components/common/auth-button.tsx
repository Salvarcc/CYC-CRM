"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export function AuthButton() {
  const { data: session, status } = useSession();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
    }

    if (menuAbierto) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuAbierto]);

  if (status === "loading") {
    return (
      <span
        aria-hidden
        className="material-symbols-outlined animate-pulse"
        style={{ color: "var(--store-on-surface-variant)" }}
      >
        person
      </span>
    );
  }

  if (!session?.user) {
    return (
      <Link
        className="transition-colors"
        href="/login"
        style={{ color: "var(--store-on-surface-variant)" }}
        title="Iniciar sesión"
      >
        <span className="material-symbols-outlined">person</span>
      </Link>
    );
  }

  const nombre = session.user.nombre ?? "Cliente";
  const correo = session.user.email ?? "";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={menuAbierto}
        aria-haspopup="menu"
        aria-label="Menú de usuario"
        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-transform hover:scale-105"
        onClick={() => setMenuAbierto((v) => !v)}
        style={{
          backgroundColor: "var(--store-primary)",
          color: "var(--store-on-primary)",
        }}
        title={nombre}
      >
        {inicial}
      </button>

      {menuAbierto && (
        <div
          className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl shadow-xl"
          role="menu"
          style={{
            backgroundColor: "var(--store-surface-container-lowest)",
            border: "1px solid var(--store-outline-variant)",
          }}
        >
          <div
            className="border-b px-4 py-3"
            style={{ borderColor: "var(--store-outline-variant)" }}
          >
            <p
              className="truncate text-sm font-bold"
              style={{ color: "var(--store-on-surface)" }}
            >
              {nombre}
            </p>
            <p
              className="truncate text-xs"
              style={{ color: "var(--store-on-surface-variant)" }}
            >
              {correo}
            </p>
          </div>
          <button
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors hover:bg-[var(--store-surface-container-low)]"
            onClick={() => signOut({ redirectTo: "/" })}
            role="menuitem"
            style={{ color: "var(--store-error)" }}
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
