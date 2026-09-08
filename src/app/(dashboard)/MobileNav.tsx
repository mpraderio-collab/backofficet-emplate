"use client";

import { useState } from "react";
import { DashboardNav } from "./DashboardNav";

type BranchOption = { id: string; name: string };

export function MobileNav({
  userLabel,
  signOutAction,
  branches,
  activeBranchId,
  switchBranchAction,
}: {
  userLabel: string;
  signOutAction: () => Promise<void>;
  branches: BranchOption[];
  activeBranchId: string | null;
  switchBranchAction: (formData: FormData) => Promise<void>;
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
          {branches.length > 0 && (
            <form action={switchBranchAction} className="px-3 pb-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">
                  Sucursal
                </span>
                <select
                  name="branchId"
                  defaultValue={activeBranchId ?? ""}
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  className="w-full rounded-lg border border-white/20 bg-primary px-2 py-1.5 text-sm font-semibold text-white"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} className="text-ink">
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            </form>
          )}
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
