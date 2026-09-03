import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutClient } from "@/components/storefront/checkout-client";
import { DetailSkeleton } from "@/components/storefront/skeletons";

export const metadata: Metadata = {
  title: "Secure checkout",
  robots: { index: false },
};

/**
 * Server shell: emits metadata. The Suspense boundary is required because the
 * client body reads useSearchParams.
 */
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <DetailSkeleton />
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
