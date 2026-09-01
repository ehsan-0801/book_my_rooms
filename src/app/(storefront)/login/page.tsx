import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/site/auth-shell";
import { LoginForm } from "@/components/site/auth-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to manage your Book My Rooms bookings and wishlist.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your bookings, wishlist and saved travellers."
      image="/images/properties/lagoon-cabanas.jpg"
      imageAlt="Curtained cabanas beside a lit pool at dusk"
      quote={{
        text: "Swimming in the lagoon at sunrise with nobody else around. The best two nights of the trip.",
        author: "Zarin Tasnim, Saint Martin's Island",
      }}
      footer={
        <>
          New to Book My Rooms?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {/* LoginForm reads ?callbackUrl via useSearchParams, which opts the
          subtree into client rendering — the boundary keeps the shell static. */}
      <Suspense fallback={<div className="h-80 animate-pulse rounded-lg bg-muted" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
