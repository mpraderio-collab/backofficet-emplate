import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getActiveBranch, wasJustLoggedIn } from "@/lib/branch";
import { switchBranch, confirmBranchFromPrompt, dismissBranchPrompt } from "./branch-actions";
import { MobileNav } from "./MobileNav";
import { SidebarShell } from "./SidebarShell";
import { BranchPromptModal } from "./BranchPromptModal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { active, branches } = await getActiveBranch();
  // Con una sola sucursal no hay nada para elegir.
  const showBranchPrompt = branches.length > 1 && (await wasJustLoggedIn());

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface md:flex-row">
      {showBranchPrompt && (
        <BranchPromptModal
          branches={branches}
          activeBranchId={active?.id ?? null}
          confirmAction={confirmBranchFromPrompt}
          dismissAction={dismissBranchPrompt}
        />
      )}
      <div className="print:hidden">
        <MobileNav
          userLabel={`${session.user.name} · ${session.user.email}`}
          signOutAction={handleSignOut}
          branches={branches}
          activeBranchId={active?.id ?? null}
          switchBranchAction={switchBranch}
        />
      </div>
      <SidebarShell
        userLabel={`${session.user.name} · ${session.user.email}`}
        signOutAction={handleSignOut}
        branches={branches}
        activeBranchId={active?.id ?? null}
        switchBranchAction={switchBranch}
      >
        {children}
      </SidebarShell>
    </div>
  );
}
