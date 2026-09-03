import type { Metadata } from "next";

import { WishlistClient } from "@/components/dashboard/views/wishlist-client";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function WishlistPage() {
  return <WishlistClient />;
}
