import type { Metadata } from "next";
import { Suspense } from "react";

import { BookingConfirmationClient } from "@/components/storefront/booking-confirmation-client";
import { DetailSkeleton } from "@/components/storefront/skeletons";

export const metadata: Metadata = {
  title: "Booking confirmed",
  robots: { index: false },
};

/**
 * Server shell: emits metadata. The Suspense boundary is required because the
 * client body reads useSearchParams.
 */
export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <DetailSkeleton />
        </div>
      }
    >
      <BookingConfirmationClient />
    </Suspense>
  );
}
