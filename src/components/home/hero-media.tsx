"use client";

import Image from "next/image";
import { useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";

const SOURCES = {
  /** ~3.5 MB — tablet and desktop */
  wide: "/videos/hero-720.mp4",
  /** ~2.3 MB — phones, where the video is cropped hard anyway */
  narrow: "/videos/hero-540.mp4",
};

/** Which rendition to load, or null when video shouldn't play at all. */
function readHeroSource(): string | null {
  // Someone who asked the OS to reduce motion gets the still, full stop.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  // Data Saver or a slow connection: don't pull megabytes of decoration.
  const conn = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "")) return null;

  return window.matchMedia("(min-width: 768px)").matches
    ? SOURCES.wide
    : SOURCES.narrow;
}

// Resolved once per page load and cached, so `getSnapshot` stays referentially
// stable and a resize never swaps the source mid-playback (which would restart
// the video). `subscribe` is intentionally inert for the same reason.
let cachedSource: string | null | undefined;
const subscribe = () => () => {};
const getSnapshot = () => {
  if (cachedSource === undefined) cachedSource = readHeroSource();
  return cachedSource;
};
const getServerSnapshot = () => null;

/**
 * Hero background: an optimised poster image that always renders, with the
 * video fading in on top once it can actually play.
 *
 * Doing it in that order keeps the LCP element a normal `next/image` (fast,
 * responsive, cached) rather than a multi-megabyte video, and means a blocked,
 * failed or reduced-motion video degrades to exactly the still that shipped
 * before.
 */
export function HeroMedia({
  poster,
  alt = "",
}: {
  poster: string;
  alt?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);

  // A media query is external state, so it's read through the store rather
  // than synced into state from an effect.
  const src = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  return (
    <>
      <Image
        src={poster}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />

      {src ? (
        <video
          ref={videoRef}
          // Autoplay only works muted, and `playsInline` stops iOS Safari
          // taking the video fullscreen.
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          tabIndex={-1}
          onCanPlay={() => setReady(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className={cn(
            "absolute inset-0 -z-10 size-full object-cover transition-opacity duration-700",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : null}

      {/*
        WCAG 2.2.2: anything that moves automatically for more than five
        seconds needs a way to stop it. Rendered only once the video is
        actually running, so it never sits over a plain image.
      */}
      {src && ready ? (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={!playing}
          className="absolute top-4 right-4 z-10 inline-flex size-9 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:top-6 sm:right-6"
        >
          {playing ? (
            <Pause className="size-4" aria-hidden />
          ) : (
            <Play className="size-4 translate-x-px" aria-hidden />
          )}
          <span className="sr-only">
            {playing ? "Pause background video" : "Play background video"}
          </span>
        </button>
      ) : null}
    </>
  );
}
