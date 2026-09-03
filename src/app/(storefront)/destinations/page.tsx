import type { Metadata } from "next";
import { DestinationsClient } from "@/components/storefront/destinations-client";

export const metadata: Metadata = {
  title: "Destinations in Bangladesh",
  description:
    "Explore Cox's Bazar, Sylhet, Bandarban, the Sundarbans, Sreemangal, Saint Martin's Island, Rangamati and Kuakata.",
};

export default function DestinationsPage() {
  return <DestinationsClient />;
}
