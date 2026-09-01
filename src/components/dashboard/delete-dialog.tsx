"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { progress } from "@/lib/progress";
import type { ActionResult } from "@/lib/actions/result";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The only confirmation modal in the product — deletions are the one action
 * that can't be undone. Everything else (publish, suspend, cancel) is
 * reversible and submits directly.
 *
 * `confirmText` adds a type-to-confirm step for destructive-and-cascading
 * deletes, e.g. removing a property that owns rooms and bookings.
 */
export function DeleteDialog({
  action,
  id,
  title,
  description,
  confirmText,
  triggerLabel = "Delete",
  triggerVariant = "ghost",
  iconOnly = false,
}: {
  action: (
    prev: ActionResult | undefined,
    formData: FormData,
  ) => Promise<ActionResult>;
  id: string;
  title: string;
  description: string;
  confirmText?: string;
  triggerLabel?: string;
  triggerVariant?: "ghost" | "outline" | "destructive";
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();

  const needsTyping = Boolean(confirmText);
  const canDelete = !needsTyping || typed.trim() === confirmText;

  function onConfirm() {
    startTransition(async () => {
      progress.start();
      try {
        const fd = new FormData();
        fd.set("id", id);
        const result = await action(undefined, fd);

        if (result.status === "success") {
          toast.success(result.message);
          setOpen(false);
          setTyped("");
        } else if (result.status === "warning") {
          // A refusal the user can act on — keep the dialog open so the
          // explanation stays next to the thing they were deleting.
          toast.warning(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not delete that record",
        );
      } finally {
        progress.done();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTyped("");
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          // Always sm: `iconOnly` hides the label from `md` up rather than
          // shrinking the hit target, which must stay comfortable on mobile.
          size="sm"
          className={
            triggerVariant === "destructive"
              ? undefined
              : "text-destructive hover:bg-destructive/10 hover:text-destructive"
          }
          aria-label={triggerLabel}
        >
          <Trash2 className="size-4" aria-hidden />
          {/* In dense tables the label is hidden from `md` up, where horizontal
              room is scarce, but kept on the mobile card footers. */}
          {iconOnly ? <span className="md:sr-only">{triggerLabel}</span> : triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-5 text-destructive" aria-hidden />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {needsTyping ? (
          <div>
            <Label htmlFor="confirm-input" className="text-sm">
              Type <span className="font-mono font-semibold">{confirmText}</span> to
              confirm
            </Label>
            <Input
              id="confirm-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="mt-1.5"
            />
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!canDelete || pending}
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {pending ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
