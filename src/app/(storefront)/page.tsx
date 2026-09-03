import { HomeClient } from "@/components/storefront/home-client";

/**
 * Thin server shell.
 *
 * The page renders client-side, but metadata still has to be emitted from a
 * server component — a `"use client"` module cannot export it, and dropping it
 * would strip the title, description and Open Graph tags from every page.
 */
export default function HomePage() {
  return <HomeClient />;
}
