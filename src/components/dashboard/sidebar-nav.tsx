"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NavSection } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

type LucideIcon = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export function SidebarNav({
  sections,
  onNavigate,
  collapsed = false,
}: {
  sections: NavSection[];
  onNavigate?: () => void;
  /** Icon-only rail. Labels stay in the DOM for screen readers. */
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  // "/dashboard" must match exactly, or it lights up on every child route.
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <TooltipProvider delayDuration={0}>
      <nav aria-label="Dashboard" className="flex flex-col gap-5">
        {sections.map((section, i) => (
          <div key={section.title ?? `section-${i}`}>
            {section.title ? (
              <h2
                className={cn(
                  "px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase",
                  // The heading still names the group for assistive tech when
                  // there's no room to print it.
                  collapsed && "sr-only",
                )}
              >
                {section.title}
              </h2>
            ) : null}
            {/* A rule stands in for the hidden heading, so the grouping is
                still visible on the rail. */}
            {collapsed && section.title && i > 0 ? (
              <div className="mx-2 mb-1.5 border-t" />
            ) : null}

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = (Icons[item.icon as keyof typeof Icons] ??
                  Icons.Circle) as unknown as LucideIcon;
                const active = isActive(item.href);

                const link = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center rounded-lg py-2 text-sm font-medium transition-colors",
                      collapsed ? "justify-center px-2" : "gap-2.5 px-3",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className={cn(collapsed && "sr-only")}>{item.label}</span>
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </TooltipProvider>
  );
}
