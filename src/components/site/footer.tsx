"use client";

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/client";
import type { Destination } from "@/lib/types";

const COLUMNS = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/careers", label: "Careers" },
      { href: "/blog", label: "Travel guides" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "For travellers",
    links: [
      { href: "/properties", label: "Search stays" },
      { href: "/offers", label: "Special offers" },
      { href: "/dashboard/bookings", label: "My bookings" },
      { href: "/help", label: "Help centre" },
    ],
  },
  {
    title: "For partners",
    links: [
      { href: "/vendor", label: "List your property" },
      { href: "/vendor/login", label: "Vendor login" },
      { href: "/partners/advertise", label: "Advertise with us" },
      { href: "/partners/terms", label: "Partner terms" },
    ],
  },
];

/* lucide v1 dropped brand marks, so the social glyphs are inlined here. */
type GlyphProps = { className?: string };

const FacebookGlyph = ({ className }: GlyphProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
  </svg>
);

const InstagramGlyph = ({ className }: GlyphProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.98c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.17.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.17-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.14.24 1.76.4 2.17.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.17.4 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.17.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.14-.24-1.76-.4-2.17a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.17-.4-1.24-.06-1.59-.07-4.74-.07Zm0 3.37a4.49 4.49 0 1 1 0 8.98 4.49 4.49 0 0 1 0-8.98Zm0 7.4a2.91 2.91 0 1 0 0-5.82 2.91 2.91 0 0 0 0 5.82Zm5.72-7.6a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0Z" />
  </svg>
);

const YoutubeGlyph = ({ className }: GlyphProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M21.58 7.19a2.5 2.5 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42a2.5 2.5 0 0 0-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81a2.5 2.5 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.5 2.5 0 0 0 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81ZM10 15.02V8.98L15.2 12 10 15.02Z" />
  </svg>
);

export function SiteFooter() {
  // Popular destinations in the footer track the live catalogue.
  const { data: destinations } = useApi<Destination[]>(
    "/api/storefront/destinations?popular=true",
  );
  return (
    <footer className="mt-auto border-t bg-secondary/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Bangladesh&rsquo;s marketplace for hotels, resorts, cottages, villas,
              homestays and eco-resorts. Compare real availability and book in a
              few taps.
            </p>

            <ul className="mt-5 space-y-2.5 text-sm">
              <li className="flex items-start gap-2.5 text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                Level 8, Gulshan Avenue, Dhaka 1212
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <a href="tel:+8809610000000" className="hover:underline">
                  +880 961 000 0000
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <a href="mailto:hello@bookmyrooms.com.bd" className="hover:underline">
                  hello@bookmyrooms.com.bd
                </a>
              </li>
            </ul>

            <div className="mt-5 flex items-center gap-1">
              {[
                { Icon: FacebookGlyph, label: "Facebook", href: "https://facebook.com" },
                { Icon: InstagramGlyph, label: "Instagram", href: "https://instagram.com" },
                { Icon: YoutubeGlyph, label: "YouTube", href: "https://youtube.com" },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  rel="noreferrer noopener"
                  target="_blank"
                  className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-5">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <ul className="mt-3 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold">Get deals before they sell out</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Seasonal offers and new properties, once a month. No spam.
            </p>
            <NewsletterForm className="mt-4" />
          </div>
        </div>

        <div className="mt-10 border-t pt-8">
          <h3 className="text-sm font-semibold">Popular destinations</h3>
          {destinations ? (
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {destinations.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/destinations/${d.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Hotels in {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Book My Rooms. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/refund-policy" className="hover:text-foreground">Refund policy</Link>
            <span className="inline-flex items-center gap-1.5">
              Payments secured by
              <span className="rounded bg-background px-1.5 py-0.5 font-semibold text-foreground">
                EPS
              </span>
            </span>
          </div>
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground/80">
          Destination photography from Wikimedia Commons under CC BY / CC BY-SA
          licences; individual credits appear on each destination page. Property
          and room photography from Unsplash.
        </p>
      </div>
    </footer>
  );
}
