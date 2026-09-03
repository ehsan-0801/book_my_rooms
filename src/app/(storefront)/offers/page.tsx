import type { Metadata } from "next";
import { OffersClient } from "@/components/storefront/offers-client";

export const metadata: Metadata = {
  title: "Special offers",
  description:
    "Seasonal and vendor discounts on hotels, resorts and homestays across Bangladesh.",
};

export default function OffersPage() {
  return <OffersClient />;
}
