"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUploadQueue } from "@/components/dashboard/upload-queue";
import { cn } from "@/lib/utils";

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/** Either already on Cloudinary, or still just a file sitting in the browser. */
type Item =
  | { state: "saved"; key: string; image: UploadedImage }
  | { state: "pending"; key: string; file: File; preview: string };

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const toSaved = (image: UploadedImage): Item => ({
  state: "saved",
  key: image.url,
  image,
});

/**
 * Picks images now, uploads them on save.
 *
 * Choosing a file only produces a local object-URL preview — nothing leaves the
 * browser until the form is submitted, at which point the enclosing ActionForm
 * flushes this queue, uploads everything in one go, and puts the resulting URLs
 * into the submission. Abandoning the form therefore costs nothing and leaves
 * no unreferenced images in Cloudinary.
 *
 * The upload itself still goes straight from the browser to Cloudinary with a
 * short-lived signature from /api/upload/sign, so image data never occupies a
 * server invocation.
 */
export function ImageUploader({
  kind = "properties",
  value = [],
  onChange,
  name = "images",
  max = 8,
  className,
}: {
  kind?: "properties" | "rooms" | "avatars" | "banners";
  value?: UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
  name?: string;
  max?: number;
  className?: string;
}) {
  const [items, setItems] = useState<Item[]>(() => value.map(toSaved));
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const queue = useUploadQueue();

  // flush() is registered once, so it reads the live list through a ref rather
  // than closing over a stale render's state. Handlers below keep the ref in
  // step as they go; this only covers a `value` prop arriving from outside.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const pendingCount = items.filter((i) => i.state === "pending").length;

  const update = useCallback(
    (next: Item[]) => {
      itemsRef.current = next;
      setItems(next);
      onChange?.(next.flatMap((i) => (i.state === "saved" ? [i.image] : [])));
    },
    [onChange],
  );

  /** Sends everything still pending to Cloudinary and returns the final list. */
  const uploadPending = useCallback(async (): Promise<UploadedImage[]> => {
    const current = itemsRef.current;
    const pending = current.filter((i) => i.state === "pending");
    if (!pending.length) {
      return current.flatMap((i) => (i.state === "saved" ? [i.image] : []));
    }

    setUploading(true);
    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (!signRes.ok) throw new Error("Could not authorise the upload");
      const { signature, timestamp, folder, apiKey, cloudName } = await signRes.json();

      const uploaded = new Map<string, UploadedImage>();
      await Promise.all(
        pending.map(async (item) => {
          if (item.state !== "pending") return;
          const form = new FormData();
          form.append("file", item.file);
          form.append("api_key", apiKey);
          form.append("timestamp", String(timestamp));
          form.append("folder", folder);
          form.append("signature", signature);

          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: form },
          );
          if (!res.ok) {
            const detail = await res.json().catch(() => null);
            throw new Error(detail?.error?.message ?? `Upload failed for ${item.file.name}`);
          }
          const data = await res.json();
          uploaded.set(item.key, {
            url: data.secure_url,
            publicId: data.public_id,
            width: data.width,
            height: data.height,
          });
        }),
      );

      // Keep the order the user arranged, swapping each pending item for what
      // came back.
      const next = current.map((item) =>
        item.state === "pending" && uploaded.has(item.key)
          ? toSaved(uploaded.get(item.key)!)
          : item,
      );
      for (const item of current) {
        if (item.state === "pending") URL.revokeObjectURL(item.preview);
      }
      itemsRef.current = next;
      setItems(next);
      return next.flatMap((i) => (i.state === "saved" ? [i.image] : []));
    } finally {
      setUploading(false);
    }
  }, [kind]);

  // Hand the form a way to upload these on submit.
  useEffect(() => {
    if (!queue) return;
    return queue.register(async () => ({
      name,
      value: JSON.stringify(await uploadPending()),
    }));
  }, [queue, name, uploadPending]);

  // Previews hold object URLs; release them if the form goes away unsaved.
  useEffect(
    () => () => {
      for (const item of itemsRef.current) {
        if (item.state === "pending") URL.revokeObjectURL(item.preview);
      }
    },
    [],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const room = max - itemsRef.current.length;
      if (room <= 0) {
        toast.error(`You can add up to ${max} image${max === 1 ? "" : "s"}.`);
        return;
      }

      const valid = files.slice(0, room).filter((file) => {
        if (!ACCEPTED.includes(file.type)) {
          toast.error(`${file.name}: only JPEG, PNG, WebP or AVIF.`);
          return false;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name}: larger than 8 MB.`);
          return false;
        }
        return true;
      });
      if (!valid.length) return;

      update([
        ...itemsRef.current,
        ...valid.map((file, i) => ({
          state: "pending" as const,
          key: `${file.name}-${file.lastModified}-${Date.now()}-${i}`,
          file,
          preview: URL.createObjectURL(file),
        })),
      ]);
      if (inputRef.current) inputRef.current.value = "";
    },
    [max, update],
  );

  function remove(target: Item) {
    // Nothing has been uploaded yet for a pending item, and a saved one is
    // only dropped from this list — the stored record still points at it until
    // the form is actually saved, so removing here is never destructive.
    if (target.state === "pending") URL.revokeObjectURL(target.preview);
    update(itemsRef.current.filter((i) => i.key !== target.key));
  }

  const saved = items.flatMap((i) => (i.state === "saved" ? [i.image] : []));

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles([...e.dataTransfer.files]);
        }}
        className={cn(
          "flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-secondary/50" : "border-border bg-card",
        )}
      >
        <span className="grid size-11 place-items-center rounded-full bg-secondary text-primary">
          {uploading ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <UploadCloud className="size-5" aria-hidden />
          )}
        </span>
        <p className="mt-3 text-sm font-medium">
          {uploading ? "Uploading…" : "Drag images here, or choose files"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPEG, PNG, WebP or AVIF · up to 8 MB each · {items.length}/{max} used
        </p>
        {pendingCount > 0 && !uploading ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {pendingCount} new image{pendingCount === 1 ? "" : "s"} will upload when you save
          </p>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple={max > 1}
          className="sr-only"
          id={inputId}
          onChange={(e) => addFiles([...(e.target.files ?? [])])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          disabled={uploading || items.length >= max}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" aria-hidden />
          Choose files
        </Button>
      </div>

      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item, i) => (
            <li key={item.key} className="group relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                {item.state === "saved" ? (
                  <Image
                    src={item.image.url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  // A blob: URL has nothing for the image optimiser to fetch,
                  // so this preview stays a plain element.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.preview}
                    alt=""
                    className={cn(
                      "absolute inset-0 size-full object-cover transition-opacity",
                      uploading && "opacity-60",
                    )}
                  />
                )}
              </div>
              {i === 0 && max > 1 ? (
                <span className="absolute top-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Cover
                </span>
              ) : null}
              {item.state === "pending" ? (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {uploading ? "Uploading…" : "Not saved yet"}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => remove(item)}
                disabled={uploading}
                aria-label="Remove image"
                className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-background/90 text-foreground shadow-sm transition-opacity hover:bg-background disabled:opacity-50"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/*
        Carries the already-saved images for a plain submit. When there are
        pending files the form replaces this value with the flushed result, so
        what the action receives is always the full, uploaded list.
      */}
      <input type="hidden" name={name} value={JSON.stringify(saved)} />
    </div>
  );
}
