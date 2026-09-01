"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Uploads straight from the browser to Cloudinary using a short-lived signature
 * minted by /api/upload/sign. The file never passes through the Next server, so
 * large images don't tie up a serverless invocation.
 */
export function ImageUploader({
  kind = "properties",
  value = [],
  onChange,
  max = 8,
  className,
}: {
  kind?: "properties" | "rooms" | "avatars" | "banners";
  value?: UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
  max?: number;
  className?: string;
}) {
  const [images, setImages] = useState<UploadedImage[]>(value);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const update = useCallback(
    (next: UploadedImage[]) => {
      setImages(next);
      onChange?.(next);
    },
    [onChange],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const room = max - images.length;
      if (room <= 0) {
        toast.error(`You can upload up to ${max} images.`);
        return;
      }

      const valid = files.slice(0, room).filter((f) => {
        if (!ACCEPTED.includes(f.type)) {
          toast.error(`${f.name}: only JPEG, PNG, WebP or AVIF.`);
          return false;
        }
        if (f.size > MAX_BYTES) {
          toast.error(`${f.name}: larger than 8 MB.`);
          return false;
        }
        return true;
      });
      if (!valid.length) return;

      setBusy(true);
      try {
        const signRes = await fetch("/api/upload/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind }),
        });
        if (!signRes.ok) throw new Error("Could not authorise the upload");
        const { signature, timestamp, folder, apiKey, cloudName } =
          await signRes.json();

        const uploaded: UploadedImage[] = [];
        for (const file of valid) {
          const form = new FormData();
          form.append("file", file);
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
            throw new Error(detail?.error?.message ?? `Upload failed for ${file.name}`);
          }
          const data = await res.json();
          uploaded.push({
            url: data.secure_url,
            publicId: data.public_id,
            width: data.width,
            height: data.height,
          });
        }

        update([...images, ...uploaded]);
        toast.success(
          `${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded`,
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [images, kind, max, update],
  );

  async function remove(image: UploadedImage) {
    update(images.filter((i) => i.url !== image.url));
    // Existing images loaded from the database carry no publicId (they may not
    // even live on Cloudinary), so only ask Cloudinary to delete what we
    // uploaded in this session.
    if (!image.publicId) return;
    await fetch("/api/upload/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: image.publicId }),
    }).catch(() => null);
  }

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
          void uploadFiles([...e.dataTransfer.files]);
        }}
        className={cn(
          "flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-secondary/50" : "border-border bg-card",
        )}
      >
        <span className="grid size-11 place-items-center rounded-full bg-secondary text-primary">
          {busy ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <UploadCloud className="size-5" aria-hidden />
          )}
        </span>
        <p className="mt-3 text-sm font-medium">
          {busy ? "Uploading…" : "Drag images here, or choose files"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPEG, PNG, WebP or AVIF · up to 8 MB each · {images.length}/{max} used
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="sr-only"
          id={`upload-${kind}`}
          onChange={(e) => void uploadFiles([...(e.target.files ?? [])])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          disabled={busy || images.length >= max}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" aria-hidden />
          Choose files
        </Button>
      </div>

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.url} className="group relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              {i === 0 ? (
                <span className="absolute top-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Cover
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => void remove(img)}
                aria-label="Remove image"
                className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-background/90 text-foreground shadow-sm transition-opacity hover:bg-background"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Serialised for a plain form submit alongside server actions. */}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
    </div>
  );
}
