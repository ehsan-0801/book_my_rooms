import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/site/auth-shell";
import { RegisterForm } from "@/components/site/auth-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Book My Rooms account to book stays across Bangladesh.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Book faster, track your stays and save the places you love."
      image="/images/properties/nilgiri-hill-resort.jpg"
      imageAlt="Terrace loungers looking over hills at sunrise"
      quote={{
        text: "Got up at 5:30 and the entire valley was white below us. Worth the four-hour drive.",
        author: "Tahmid Rahman, Bandarban",
      }}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
