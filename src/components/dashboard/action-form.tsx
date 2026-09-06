"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { progress } from "@/lib/progress";
import {
  UploadQueueProvider,
  useUploadQueueValue,
} from "@/components/dashboard/upload-queue";
import type { ActionResult } from "@/lib/actions/result";
import { cn } from "@/lib/utils";

type Action = (
  prev: ActionResult | undefined,
  formData: FormData,
) => Promise<ActionResult>;

function announce(result: ActionResult) {
  if (result.status === "success") toast.success(result.message);
  else if (result.status === "warning") toast.warning(result.message);
  else toast.error(result.message);
}

/** Lets SubmitButton reflect its own form's pending state. */
const PendingContext = createContext(false);

/**
 * A form whose server-action result is announced as a toast.
 *
 * Submission is handled imperatively rather than through `useActionState`.
 * Many of these forms delete the row they live in — a wishlist card, a table
 * row — so the component unmounts as soon as the action revalidates, and an
 * effect watching the returned state would never fire. Awaiting the action in
 * the submit handler keeps the continuation alive after unmount, so the toast
 * always lands.
 */
export function ActionForm({
  action,
  children,
  className,
  onResult,
  ...props
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  onResult?: (result: ActionResult) => void;
} & Omit<React.ComponentProps<"form">, "action" | "onSubmit">) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const uploads = useUploadQueueValue();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    progress.start();
    startTransition(async () => {
      try {
        // Images chosen in this form are still only local previews; they're
        // uploaded now, on the save the user just asked for. A failure here
        // means nothing was stored, so the action must not run — otherwise the
        // record would save with its images silently missing.
        try {
          for (const { name, value } of await uploads.flushAll()) {
            formData.set(name, value);
          }
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Could not upload the images",
          );
          return;
        }

        const result = await action(undefined, formData);
        announce(result);
        onResult?.(result);
        if (result.redirectTo) router.push(result.redirectTo);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        );
      } finally {
        progress.done();
      }
    });
  }

  return (
    <PendingContext.Provider value={pending}>
      <UploadQueueProvider value={uploads}>
        <form onSubmit={onSubmit} className={className} {...props}>
          {children}
        </form>
      </UploadQueueProvider>
    </PendingContext.Provider>
  );
}

/** Submit button that reflects the enclosing ActionForm's pending state. */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const pending = useContext(PendingContext);
  return (
    <Button type="submit" disabled={pending} className={className} {...props}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {pending ? (pendingLabel ?? "Saving…") : children}
    </Button>
  );
}

/**
 * A single-purpose action trigger — approve, publish, pause, settle.
 *
 * Hidden inputs carry the payload so the trigger stays an ordinary form
 * submission rather than a bespoke click handler.
 */
export function ActionButton({
  action,
  values,
  children,
  pendingLabel,
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  action: Action;
  values: Record<string, string>;
  pendingLabel?: string;
}) {
  return (
    <ActionForm action={action} className={cn("contents", className)}>
      {Object.entries(values).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton pendingLabel={pendingLabel} {...props}>
        {children}
      </SubmitButton>
    </ActionForm>
  );
}
