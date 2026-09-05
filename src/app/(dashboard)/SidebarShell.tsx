"use client";

import { useSyncExternalStore } from "react";
import { DashboardNav } from "./DashboardNav";

const STORAGE_KEY = "sidebar-collapsed";
const CHANGE_EVENT = "sidebar-collapsed-change";

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

export function SidebarShell({
  userLabel,
  signOutAction,
  children,
}: {
  userLabel: string;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "0" : "1");
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <>
      <aside
        className={`t-card-resize print:hidden hidden shrink-0 overflow-hidden bg-primary text-white md:flex ${
          collapsed ? "w-0" : "w-[236px]"
        }`}
      >
        {/* Ancho fijo interno: el contenido no se reacomoda ni el texto se
            corta mientras el <aside> de afuera anima su ancho hacia 0. */}
        <div className="flex h-full w-[236px] shrink-0 flex-col">
          <div className="px-6 py-6">
            <p className="text-lg font-bold text-white">Backoffice</p>
            <p className="mt-1 text-xs text-white/60">Gestión interna</p>
          </div>
          <DashboardNav />
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
      </aside>

      <button
        type="button"
        onClick={toggle}
        title={collapsed ? "Mostrar menú" : "Ocultar menú"}
        className="print:hidden sticky top-6 z-10 hidden h-8 w-5 shrink-0 items-center justify-center self-start rounded-r-lg border border-l-0 border-line bg-bg text-xs font-bold text-ink-faint hover:text-ink md:flex"
      >
        {collapsed ? "›" : "‹"}
      </button>

      <main className="flex-1 px-6 py-8 md:px-10 print:p-0">{children}</main>
    </>
  );
}
