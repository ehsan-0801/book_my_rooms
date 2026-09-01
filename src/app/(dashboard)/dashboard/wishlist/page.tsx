import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Star } from "lucide-react";

import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guards";
import { bdt } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { toggleWishlist } from "@/lib/actions/customer";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const user = await requireUser();

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, propertyId: true,
      property: {
        select: {
          name: true, slug: true, basePrice: true, ratingAvg: true, ratingCount: true,
          shortDescription: true, category: true,
          type: { select: { name: true } },
          district: { select: { name: true, slug: true } },
          images: { where: { isCover: true }, take: 1, select: { url: true, alt: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wishlist"
        description={`${items.length} propert${items.length === 1 ? "y" : "ies"} saved for later.`}
      />

      {items.length === 0 ? (
        <EmptyState
          icon="Heart"
          title="Nothing saved yet"
          body="Tap the heart on any property to keep it here while you decide."
          action={
            <Button asChild>
              <Link href="/properties">Browse stays</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-xl border bg-card">
              <div className="relative aspect-[16/10] bg-muted">
                {item.property.images[0] ? (
                  <Image
                    src={item.property.images[0].url}
                    alt={item.property.images[0].alt ?? ""}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : null}
                <form
                  action={toggleWishlist}
                  className="absolute top-2 right-2"
                >
                  <input type="hidden" name="propertyId" value={item.propertyId} />
                  <Button
                    type="submit"
                    size="icon"
                    variant="secondary"
                    aria-label={`Remove ${item.property.name} from wishlist`}
                    className="size-8 rounded-full bg-background/90 backdrop-blur"
                  >
                    <Heart className="size-4 fill-destructive text-destructive" aria-hidden />
                  </Button>
                </form>
              </div>

              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{item.property.type.name}</Badge>
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Star className="size-3.5 fill-rating text-rating" aria-hidden />
                    {Number(item.property.ratingAvg).toFixed(1)}
                    <span className="text-muted-foreground">
                      ({item.property.ratingCount})
                    </span>
                  </span>
                </div>

                <h2 className="mt-2 font-semibold">
                  <Link
                    href={`/properties/${item.property.district.slug}/${item.property.slug}`}
                    className="hover:underline"
                  >
                    {item.property.name}
                  </Link>
                </h2>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  {item.property.district.name}
                </p>

                <div className="mt-3 flex items-end justify-between gap-3 border-t pt-3">
                  <p>
                    <span className="text-lg font-bold text-price">
                      {bdt(Number(item.property.basePrice))}
                    </span>
                    <span className="text-xs text-muted-foreground"> / night</span>
                  </p>
                  <Button asChild size="sm">
                    <Link
                      href={`/properties/${item.property.district.slug}/${item.property.slug}`}
                    >
                      Book
                    </Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
