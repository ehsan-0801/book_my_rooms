import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { requireVendor } from "@/lib/auth-guards";
import { applyDiscount, bdt } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { setRoomDiscount } from "@/lib/actions/catalog";

export const metadata: Metadata = { title: "Offers", robots: { index: false } };

export default async function OffersPage() {
  const { vendorId } = await requireVendor();

  const rooms = await prisma.room.findMany({
    where: { property: { vendorId } },
    orderBy: [{ property: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true, name: true, basePrice: true, discountValue: true,
      property: { select: { name: true } },
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers"
        description="Set a discount on any room. Discounted rates show as a strikethrough price across the marketplace."
      />

      {rooms.length === 0 ? (
        <EmptyState
          icon="TicketPercent"
          title="No rooms to discount yet"
          body="Add a room type first, then you can run an offer on it."
          action={
            <Button asChild>
              <Link href="/dashboard/rooms/new">Add room</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((r) => {
            const pct = Number(r.discountValue ?? 0);
            const final = applyDiscount(Number(r.basePrice), pct || undefined);
            return (
              <li key={r.id} className="overflow-hidden rounded-xl border bg-card">
                <div className="relative aspect-[16/9] bg-muted">
                  {r.images[0] ? (
                    <Image
                      src={r.images[0].url}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : null}
                  {pct > 0 ? (
                    <Badge className="absolute top-2 left-2 bg-offer text-offer-foreground">
                      {pct}% off
                    </Badge>
                  ) : null}
                </div>

                <div className="p-4">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.property.name}
                  </p>

                  <p className="mt-2 flex items-baseline gap-2">
                    {pct > 0 ? (
                      <span className="text-sm text-muted-foreground line-through">
                        {bdt(Number(r.basePrice))}
                      </span>
                    ) : null}
                    <span className="text-lg font-bold text-price">{bdt(final)}</span>
                    <span className="text-xs text-muted-foreground">/ night</span>
                  </p>

                  <ActionForm action={setRoomDiscount} className="mt-4 flex items-end gap-2">
                    <input type="hidden" name="roomId" value={r.id} />
                    <div className="flex-1">
                      <label
                        htmlFor={`discount-${r.id}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Discount %
                      </label>
                      <Input
                        id={`discount-${r.id}`}
                        name="discountValue"
                        type="number"
                        min={0}
                        max={90}
                        defaultValue={pct || 0}
                        className="mt-1 h-9"
                      />
                    </div>
                    <SubmitButton size="sm" className="h-9">
                      Apply
                    </SubmitButton>
                  </ActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
