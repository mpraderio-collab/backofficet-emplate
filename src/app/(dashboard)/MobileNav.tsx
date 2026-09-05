"use client";

import { useState } from "react";
import { DashboardNav } from "./DashboardNav";

export function MobileNav({
  userLabel,
  signOutAction,
}: {
  userLabel: string;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative bg-primary text-white md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-base font-bold text-white">Backoffice</p>
          <p className="text-[11px] text-white/60">Gestión interna</p>
        </div>
        <button
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 hover:bg-white/12"
        >
          <span className="t-icon-swap" data-state={open ? "b" : "a"}>
            <svg
              className="t-icon"
              data-icon="a"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            <svg
              className="t-icon"
              data-icon="b"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </span>
        </button>
      </div>

      <div
        data-open={open}
        className="t-panel-slide absolute inset-x-0 top-full z-20 flex flex-col border-t border-white/12 bg-primary pb-3 shadow-lg"
      >
        <DashboardNav onNavigate={() => setOpen(false)} />
        <div className="border-t border-white/12 p-3">
          <p className="truncate px-3 py-1 text-xs text-white/50">{userLabel}</p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-white/78 transition-colors hover:bg-white/12 hover:text-white"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
