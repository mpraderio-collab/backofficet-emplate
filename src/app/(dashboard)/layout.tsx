import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { DashboardNav } from "./DashboardNav";
import { MobileNav } from "./MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface md:flex-row">
      <div className="print:hidden">
        <MobileNav
          userLabel={`${session.user.name} · ${session.user.email}`}
          signOutAction={handleSignOut}
        />
      </div>
      <aside className="print:hidden hidden w-[236px] shrink-0 flex-col bg-primary text-white md:flex">
        <div className="px-6 py-6">
          <p className="text-lg font-bold text-white">Backoffice</p>
          <p className="mt-1 text-xs text-white/60">Gestión interna</p>
        </div>
        <DashboardNav />
        <div className="border-t border-white/12 p-3">
          <p className="truncate px-3 py-1 text-xs text-white/50">
            {session.user.name} · {session.user.email}
          </p>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-white/78 transition-colors hover:bg-white/12 hover:text-white"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-6 py-8 md:px-10 print:p-0">{children}</main>
    </div>
  );
}
