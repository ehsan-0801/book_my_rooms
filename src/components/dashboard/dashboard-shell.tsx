"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { NavigationProgress } from "@/components/dashboard/navigation-progress";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { useSidebarCollapsed } from "@/components/dashboard/use-sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DASHBOARD_NAV, ROLE_LABEL } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

/**
 * The dashboard chrome — header, sidebar, user menu — driven entirely by the
 * client session rather than a server-side `requireUser()` call.
 *
 * Middleware still owns the actual access boundary (an unauthenticated
 * request to /dashboard/* never reaches this component); the redirect here is
 * defense in depth for a session that expires while the tab is open.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const reloaded = useRef(false);
  const { collapsed, toggle } = useSidebarCollapsed();

  useEffect(() => {
    if (status !== "unauthenticated") return;

    // Middleware already guarantees this route isn't reached without a valid
    // session cookie, so landing here "unauthenticated" is the known
    // next-auth v5 race: useSession's first fetch after the sign-in redirect
    // can beat the cookie write and come back empty, with no built-in retry.
    // A single reload forces a genuine round trip — verified to resolve every
    // time — rather than bouncing a just-signed-in user back to /login.
    if (!reloaded.current) {
      reloaded.current = true;
      window.location.reload();
      return;
    }
    // Already retried once and still unauthenticated: this is a real
    // logged-out session (e.g. it expired while the tab was open).
    router.replace("/login");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated" || !session?.user) {
    return <ShellSkeleton />;
  }

  const user = session.user;
  const sections = DASHBOARD_NAV[user.role] ?? DASHBOARD_NAV.CUSTOMER;

  return (
    <div className="flex min-h-svh">
      {/*
        The sidebar is its own full-height column rather than something living
        under the header: the brand sits at its top, and the header starts to
        the right of it. Collapsed, the column narrows to the icon rail.
      */}
      <aside
        id="dashboard-sidebar"
        className={cn(
          "hidden shrink-0 border-r bg-background transition-[width] duration-200 ease-out lg:block",
          collapsed ? "w-[4.25rem]" : "w-64",
        )}
      >
        <div className="sticky top-0 flex h-svh flex-col">
          <div
            className={cn(
              "flex h-16 shrink-0 items-center border-b",
              collapsed ? "justify-center px-2" : "px-4",
            )}
          >
            <Logo compact={collapsed} />
          </div>
          <div className="flex-1 overflow-x-hidden overflow-y-auto p-3">
            <SidebarNav sections={sections} collapsed={collapsed} />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
          {/* useSearchParams inside needs a boundary so the shell stays static. */}
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
            {/* Below lg this opens the drawer; from lg it collapses the rail.
                Same hamburger either way, so the control reads as one thing. */}
            <MobileSidebar sections={sections} />
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              onClick={toggle}
              aria-expanded={!collapsed}
              aria-controls="dashboard-sidebar"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu />
            </Button>

            {/* The brand lives in the sidebar once there is one. */}
            <Logo className="hidden sm:inline-flex lg:hidden" />
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

        <main id="main" className="flex-1 bg-secondary/25">
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

/** Mirrors the real shell's geometry so nothing shifts once the session resolves. */
function ShellSkeleton() {
  const { collapsed } = useSidebarCollapsed();
  return (
    <div className="flex min-h-svh">
      <aside
        className={cn(
          "hidden shrink-0 border-r lg:block",
          collapsed ? "w-[4.25rem]" : "w-64",
        )}
      >
        <div className="sticky top-0 flex h-svh flex-col">
          <div
            className={cn(
              "flex h-16 shrink-0 items-center border-b",
              collapsed ? "justify-center px-2" : "px-4",
            )}
          >
            <Skeleton className={collapsed ? "size-8 rounded-lg" : "h-8 w-40"} />
          </div>
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="hidden h-6 w-32 sm:block lg:hidden" />
            <div className="ml-auto">
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </header>
        <main className="flex-1 bg-secondary/25">
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
        </main>
      </div>
    </div>
  );
}
