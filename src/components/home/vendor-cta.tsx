import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const BENEFITS = [
  "No monthly fee — commission only on completed stays",
  "Manage rooms, rates and availability from one dashboard",
  "Payouts settled twice a month, direct to your bank",
];

export function VendorCta() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="grid lg:grid-cols-2">
        <div className="order-2 p-6 sm:p-10 lg:order-1 lg:py-14">
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            For property owners
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Fill more rooms, all year round
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            List your hotel, resort, cottage or homestay on Book My Rooms and
            reach travellers searching across all 64 districts.
          </p>

          <ul className="mt-6 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/vendor/register">
                List your property
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/vendor">How it works</Link>
            </Button>
          </div>
        </div>

        <div className="relative order-1 min-h-56 lg:order-2 lg:min-h-full">
          <Image
            src="/images/properties/royal-tulip.jpg"
            alt="Lit hotel facade and pool at dusk"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
