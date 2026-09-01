import { Logo } from "@/components/site/logo";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Badge } from "@/components/ui/badge";
import { DASHBOARD_NAV, ROLE_LABEL } from "@/lib/dashboard-nav";
import { requireUser } from "@/lib/auth-guards";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  // Middleware guarantees a session exists; this also gives us the role.
  const user = await requireUser();
  const sections = DASHBOARD_NAV[user.role] ?? DASHBOARD_NAV.CUSTOMER;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
          <MobileSidebar sections={sections} />
          <Logo className="hidden sm:inline-flex" />
          <Badge variant="secondary" className="ml-1 hidden md:inline-flex">
            {ROLE_LABEL[user.role]}
          </Badge>

          <div className="ml-auto">
            <UserMenu
              name={user.name ?? "Account"}
              email={user.email ?? ""}
              image={user.image}
              role={user.role}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r lg:block">
          <div className="sticky top-16 max-h-[calc(100svh-4rem)] overflow-y-auto p-3">
            <SidebarNav sections={sections} />
          </div>
        </aside>

        <main id="main" className="min-w-0 flex-1 bg-secondary/25">
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
