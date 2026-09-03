"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Logo } from "@/components/site/logo";
import { NavigationProgress } from "@/components/dashboard/navigation-progress";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DASHBOARD_NAV, ROLE_LABEL } from "@/lib/dashboard-nav";

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
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        {/* useSearchParams inside needs a boundary so the shell stays static. */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
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

/** Mirrors the real shell's geometry so nothing shifts once the session resolves. */
function ShellSkeleton() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
          <Skeleton className="size-8 rounded-md lg:hidden" />
          <Skeleton className="hidden h-6 w-32 sm:block" />
          <div className="ml-auto">
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r lg:block">
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </aside>
        <main className="min-w-0 flex-1 bg-secondary/25">
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
        </main>
      </div>
    </div>
  );
}
