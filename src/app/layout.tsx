import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { AppToaster } from "@/components/site/app-toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3021"),
  title: {
    default: "Book My Rooms — Hotels, Resorts & Homestays in Bangladesh",
    template: "%s · Book My Rooms",
  },
  description:
    "Compare and book hotels, resorts, cottages, villas, homestays and eco-resorts across Bangladesh. Real-time availability, secure EPS payment, instant confirmation.",
  openGraph: {
    type: "website",
    siteName: "Book My Rooms",
    locale: "en_BD",
  },
};

/**
 * Root layout holds only the document shell. Page chrome is split by route
 * group: `(storefront)` gets the public header/footer, `(dashboard)` gets the
 * signed-in sidebar.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SessionProvider>{children}</SessionProvider>
        <AppToaster />
      </body>
    </html>
  );
}
