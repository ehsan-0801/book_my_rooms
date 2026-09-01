"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, LayoutDashboard, Menu, Search, UserRound } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/properties", label: "Stays" },
  { href: "/destinations", label: "Destinations" },
  { href: "/offers", label: "Offers" },
  { href: "/vendor", label: "List your property" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:px-8">
        <Logo />

        <nav
          aria-label="Main"
          className="hidden items-center gap-1 lg:flex lg:justify-self-center"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:ml-0 lg:justify-self-end">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Search stays"
          >
            <Link href="/properties">
              <Search />
            </Link>
          </Button>

          <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
            <Link href="/dashboard/wishlist">
              <Heart />
            </Link>
          </Button>

          {signedIn ? (
            <Button asChild className="hidden gap-1.5 sm:inline-flex">
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" aria-hidden />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(20rem,85vw)] p-0">
              <SheetHeader className="border-b px-5 py-4 text-left">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo />
              </SheetHeader>

              <nav aria-label="Mobile" className="flex flex-col p-3">
                {NAV.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "rounded-lg px-3 py-3 text-[15px] font-medium",
                        isActive(item.href)
                          ? "bg-secondary text-secondary-foreground"
                          : "hover:bg-secondary/60",
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <Separator className="my-3" />
                <SheetClose asChild>
                  <Link
                    href="/dashboard/bookings"
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-[15px] font-medium hover:bg-secondary/60"
                  >
                    <UserRound className="size-4" /> My bookings
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/dashboard/wishlist"
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-[15px] font-medium hover:bg-secondary/60"
                  >
                    <Heart className="size-4" /> Wishlist
                  </Link>
                </SheetClose>
              </nav>

              <div className="mt-auto grid gap-2 border-t p-4">
                {signedIn ? (
                  <SheetClose asChild>
                    <Button asChild className="w-full gap-1.5">
                      <Link href="/dashboard">
                        <LayoutDashboard className="size-4" aria-hidden />
                        Go to dashboard
                      </Link>
                    </Button>
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild className="w-full">
                        <Link href="/register">Create an account</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/login">Log in</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
