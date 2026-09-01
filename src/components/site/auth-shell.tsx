import Image from "next/image";
import Link from "next/link";
import { Logo } from "./logo";

/** Split layout: form on the left, photography on the right from `lg` up. */
export function AuthShell({
  title,
  subtitle,
  image,
  imageAlt,
  quote,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  quote: { text: string; author: string };
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="lg:hidden" />

          <h1 className="mt-8 text-2xl font-bold tracking-tight sm:text-3xl lg:mt-0">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-7">{children}</div>

          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <Image src={image} alt={imageAlt} fill sizes="50vw" className="object-cover" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10"
        />
        <figure className="absolute inset-x-0 bottom-0 p-10">
          <blockquote className="text-shadow-hero text-lg leading-relaxed font-medium text-white">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <figcaption className="text-shadow-hero mt-3 text-sm text-white/80">
            — {quote.author}
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
