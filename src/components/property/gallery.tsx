"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { RoomImage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Gallery({
  images,
  propertyName,
}: {
  images: RoomImage[];
  propertyName: string;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  const step = (delta: number) =>
    setIndex((i) => (i + delta + images.length) % images.length);

  const [cover, ...rest] = images;
  const thumbs = rest.slice(0, 4);

  return (
    <>
      {/* Mobile: a single swipeable strip. Desktop: a 1 + 4 mosaic. */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:grid-rows-2 sm:gap-2 sm:overflow-visible sm:px-0 lg:h-[26rem]">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="group relative aspect-[4/3] w-[85vw] shrink-0 snap-start overflow-hidden rounded-xl sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:w-auto"
        >
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            priority
            sizes="(max-width: 640px) 85vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span className="sr-only">Open gallery</span>
        </button>

        {thumbs.map((img, i) => (
          <button
            key={img.url + i}
            type="button"
            onClick={() => openAt(i + 1)}
            className="group relative aspect-[4/3] w-[70vw] shrink-0 snap-start overflow-hidden rounded-xl sm:aspect-auto sm:w-auto"
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="(max-width: 640px) 70vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            {/* "+N photos" affordance on the final tile */}
            {i === thumbs.length - 1 && images.length > 5 ? (
              <span className="absolute inset-0 grid place-items-center bg-black/50 text-sm font-semibold text-white">
                +{images.length - 5} photos
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => openAt(0)}
        className="mt-3 gap-2 sm:absolute sm:right-4 sm:bottom-4 sm:mt-0 sm:shadow-md"
      >
        <Expand className="size-4" aria-hidden />
        View all {images.length} photos
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[95vw] gap-0 overflow-hidden border-0 bg-black/95 p-0 sm:max-w-4xl"
        >
          <DialogTitle className="sr-only">{propertyName} photo gallery</DialogTitle>

          <div className="relative aspect-[4/3] w-full">
            <Image
              src={images[index].url}
              alt={images[index].alt}
              fill
              sizes="95vw"
              className="object-contain"
            />

            <Button
              variant="secondary"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close gallery"
              className="absolute top-3 right-3 rounded-full"
            >
              <X className="size-4" aria-hidden />
            </Button>

            {images.length > 1 ? (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-4 bg-black px-4 py-3">
            <p className="line-clamp-1 text-sm text-white/80">{images[index].alt}</p>
            <p className="shrink-0 text-sm tabular-nums text-white/60">
              {index + 1} / {images.length}
            </p>
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto bg-black px-4 pb-4">
            {images.map((img, i) => (
              <button
                key={img.url + i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative h-14 w-20 shrink-0 overflow-hidden rounded-md ring-2 transition",
                  i === index ? "ring-white" : "ring-transparent opacity-60 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
