"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type State = "idle" | "submitting" | "done";

export function NewsletterForm({ className }: { className?: string }) {
  const [state, setState] = useState<State>("idle");
  const [email, setEmail] = useState("");

  if (state === "done") {
    return (
      <p
        className={cn(
          "flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2.5 text-sm text-success",
          className,
        )}
        role="status"
      >
        <Check className="size-4 shrink-0" aria-hidden />
        You&rsquo;re subscribed. Watch your inbox.
      </p>
    );
  }

  return (
    <form
      className={cn("space-y-2", className)}
      onSubmit={(e) => {
        e.preventDefault();
        setState("submitting");
        // Design prototype — the real handler posts to /api/newsletter.
        setTimeout(() => setState("done"), 600);
      }}
    >
      <Label htmlFor="newsletter-email" className="sr-only">
        Email address
      </Label>
      <Input
        id="newsletter-email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-background"
      />
      <Button type="submit" className="w-full" disabled={state === "submitting"}>
        {state === "submitting" ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            Subscribing…
          </>
        ) : (
          "Subscribe"
        )}
      </Button>
    </form>
  );
}
