"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";

export interface HeroSlide {
  src: string;
  /** Shown beside the controls, so the imagery reads as bookable places. */
  label: string;
  region: string;
  alt: string;
}

/** How long each slide holds before the next one begins fading in. */
const DWELL_MS = 7000;
/** Crossfade length. Long and eased, so slides melt rather than cut. */
const FADE_MS = 2000;
/* The Ken Burns drift itself lives in globals.css as `.animate-hero-drift`,
   deliberately longer than the dwell so it never "lands". */

/* prefers-reduced-motion, read through the store rather than synced into
   state from an effect. */
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getSnapshot = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getServerSnapshot = () => false;

/**
 * Hero background slideshow.
 *
 * Slides crossfade over two seconds while the active image drifts in a slow
 * Ken Burns zoom, so the imagery is always gently moving without ever pulling
 * attention off the search form.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const reducedMotion = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Nothing advances on its own for reduced-motion or while paused; the dots
  // still work in both cases.
  const autoplay = !reducedMotion && !paused && slides.length > 1;

  useEffect(() => {
    if (!autoplay) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      DWELL_MS,
    );
    return () => window.clearInterval(id);
  }, [autoplay, slides.length]);

  const current = slides[index];

  return (
    <>
      {slides.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={slide.src}
            aria-hidden={!active}
            className={cn(
              "absolute inset-0 -z-10 overflow-hidden",
              !reducedMotion && "transition-opacity ease-in-out",
              active ? "opacity-100" : "opacity-0",
            )}
            style={
              reducedMotion ? undefined : { transitionDuration: `${FADE_MS}ms` }
            }
          >
            <Image
              src={slide.src}
              alt=""
              fill
              // Only the first slide blocks paint; the rest load in behind it.
              priority={i === 0}
              loading={i === 0 ? undefined : "lazy"}
              sizes="100vw"
              className={cn(
                "object-cover",
                // Alternating origins keep consecutive slides from drifting
                // the same way, which would read as a single long pan.
                i % 2 === 0 ? "origin-left" : "origin-right",
                // Applied only while active, so the animation restarts each
                // time a slide comes back around.
                !reducedMotion && active && "animate-hero-drift",
              )}
            />
          </div>
        );
      })}

      {/*
        Controls sit opposite the left-aligned copy, on their own translucent
        pill — slides range from dark sea to pale sky, and the scrim alone
        can't guarantee contrast for small text across all of them.
      */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3 rounded-full border border-white/15 bg-black/30 py-1.5 pr-2 pl-3 backdrop-blur-sm sm:top-6 sm:right-6 sm:gap-3.5 sm:pl-4">
        <p className="hidden text-right text-xs leading-tight font-medium text-white sm:block">
          {current.label}
          <span className="block text-[11px] font-normal text-white/75">
            {current.region}
          </span>
        </p>

        <ol className="flex items-center gap-1.5" aria-label="Choose a slide">
          {slides.map((slide, i) => (
            <li key={slide.src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index ? "true" : undefined}
                aria-label={`Show ${slide.label}`}
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-500",
                  i === index
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/80",
                )}
              />
            </li>
          ))}
        </ol>

        {/* WCAG 2.2.2: auto-updating content needs a way to stop it. Hidden
            for reduced-motion, where nothing moves in the first place. */}
        {!reducedMotion && slides.length > 1 ? (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            className="inline-flex size-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            {paused ? (
              <Play className="size-3.5 translate-x-px" aria-hidden />
            ) : (
              <Pause className="size-3.5" aria-hidden />
            )}
            <span className="sr-only">
              {paused ? "Resume slideshow" : "Pause slideshow"}
            </span>
          </button>
        ) : null}
      </div>
    </>
  );
}
