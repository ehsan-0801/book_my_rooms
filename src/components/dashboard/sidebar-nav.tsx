"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";

import type { NavSection } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

type LucideIcon = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export function SidebarNav({
  sections,
  onNavigate,
}: {
  sections: NavSection[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  // "/dashboard" must match exactly, or it lights up on every child route.
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-5">
      {sections.map((section, i) => (
        <div key={section.title ?? `section-${i}`}>
          {section.title ? (
            <h2 className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {section.title}
            </h2>
          ) : null}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = (Icons[item.icon as keyof typeof Icons] ??
                Icons.Circle) as unknown as LucideIcon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
