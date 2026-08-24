"use client";

import type { InputHTMLAttributes } from "react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

export function AuthField({ label, name, id, ...rest }: AuthFieldProps) {
  const fieldId = id ?? name;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-xs font-semibold uppercase tracking-wide"
        htmlFor={fieldId}
        style={{ color: "var(--store-on-surface-variant)" }}
      >
        {label}
      </label>
      <input
        className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--store-primary)]"
        id={fieldId}
        name={name}
        style={{
          borderColor: "var(--store-outline)",
          backgroundColor: "var(--store-surface-container-lowest)",
          color: "var(--store-on-surface)",
        }}
        {...rest}
      />
    </div>
  );
}

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div
      className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
      data-testid="auth-error"
      role="alert"
      style={{
        backgroundColor: "var(--store-error-container)",
        color: "var(--store-on-error-container)",
      }}
    >
      <span className="material-symbols-outlined text-base">error</span>
      {message}
    </div>
  );
}
