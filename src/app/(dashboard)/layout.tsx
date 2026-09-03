import { DashboardShell } from "@/components/dashboard/dashboard-shell";

/**
 * No server-side data access: the actual access boundary is the middleware
 * (an unauthenticated request never reaches this tree), and the shell itself
 * reads the session client-side so a role change or sign-out is reflected
 * without a server round trip.
 */
export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return <DashboardShell>{children}</DashboardShell>;
}
