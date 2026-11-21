"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isVertical, reelFrames, reelPoster, reelSrc, type Reel } from "@/data/reels";
import { useI18n } from "@/i18n/LanguageProvider";
import { reelStyle } from "./reelStyle";

/** Frame chrome per format, in px — the gallery layout needs the exact sizes. */
export const PHONE_PAD = { x: 20, y: 20 };
export const FILM_PAD = { x: 16, y: 48 };
export const padFor = (r: Reel) => (isVertical(r) ? PHONE_PAD : FILM_PAD);

/**
 * A spot in its natural frame: vertical cuts sit in a phone, widescreen spots
 * on a strip of film. Hovering (or focusing) flicks through the filmstrip
 * instantly while the real video loads, then plays it; leaving rewinds.
 */
export function ReelCard({ reel, width, height, onOpen }: { reel: Reel; width: number; height: number; onOpen: () => void }) {
  const { t, locale } = useI18n();
  const s = t.studio;
  const st = reelStyle[reel.cat];
  const vertical = isVertical(reel);
  const v = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [hot, setHot] = useState(false);
  const [ready, setReady] = useState(false);
  const [flip, setFlip] = useState(0);
  const frames = reelFrames(reel);

  // Flipbook while the video buffers.
  useEffect(() => {
    if (!hot || ready) return;
    const id = window.setInterval(() => setFlip((f) => (f + 1) % frames.length), 260);
    return () => window.clearInterval(id);
  }, [hot, ready, frames.length]);

  // Progress hairline
  useEffect(() => {
    if (!hot) return;
    let raf = 0;
    const tick = () => {
      const el = v.current;
      if (bar.current && el?.duration) bar.current.style.transform = `scaleX(${el.currentTime / el.duration})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hot]);

  const enter = () => {
    if (window.matchMedia("(hover: none)").matches) return; // touch: tap opens the player instead
    setHot(true);
    v.current?.play().catch(() => {});
  };
  const leave = () => {
    setHot(false);
    setReady(false);
    setFlip(0);
    const el = v.current;
    if (el) { el.pause(); el.currentTime = 0; }
  };

  const screen = (
    <div className={`relative size-full overflow-hidden ${vertical ? "rounded-[26px]" : "rounded-[12px]"} bg-sumi`}>
      <Image src={reelPoster(reel)} alt={reel.title[locale]} fill sizes={`${Math.round(width)}px`} className="object-cover" style={{ objectPosition: reel.focus }} />
      {hot && !ready ? (
        <Image key={flip} src={frames[flip]} alt="" aria-hidden fill sizes="240px" className="object-cover" style={{ objectPosition: reel.focus }} />
      ) : null}
      {hot ? (
        <video
          ref={v}
          src={reelSrc(reel)}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-hidden
          onPlaying={() => setReady(true)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
          style={{ objectPosition: reel.focus }}
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sumi/80 via-transparent to-sumi/25" />
      {/* in a phone the chips sit below the camera island */}
      <span className={`absolute left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.chip} ${vertical ? "top-9" : "top-3"}`}>
        <st.Icon className="size-3.5" strokeWidth={2.4} />
        <span className={vertical ? "sr-only" : ""}>{s.filters[reel.cat]}</span>
      </span>
      <span className={`absolute right-3 rounded-full bg-sumi/60 px-2 py-1 font-mono text-[11px] font-bold text-paper tabular-nums backdrop-blur ${vertical ? "top-9" : "top-3"}`}>0:{String(Math.round(reel.d)).padStart(2, "0")}</span>
      <span className={`absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-shu/90 text-white shadow-lift backdrop-blur transition duration-500 ease-[var(--ease-spring)] ${hot ? "scale-100 opacity-0" : "scale-75 opacity-0 group-focus-visible:scale-100 group-focus-visible:opacity-100 [@media(hover:none)]:scale-90 [@media(hover:none)]:opacity-100"}`}>
        <Play className="size-6 translate-x-0.5" fill="currentColor" />
      </span>
      <p className={`absolute inset-x-3 bottom-3 font-display leading-snug font-semibold text-paper ${vertical ? "text-[0.95rem]" : "text-[1.05rem] sm:text-lg"}`}>{reel.title[locale]}</p>
      <span className="absolute inset-x-0 bottom-0 h-[3px] bg-paper/15">
        <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-shu" />
      </span>
    </div>
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      aria-label={`${s.watch}: ${reel.title[locale]}`}
      className="group relative block shrink-0 text-left [perspective:1000px] focus-visible:outline-none"
      style={{ width, height }}
    >
      <div
        className={`relative size-full transition-transform duration-700 ease-[var(--ease-silk)] group-focus-visible:[transform:translateY(-6px)] ${
          vertical ? "group-hover:[transform:rotateY(-7deg)_rotateX(3deg)_translateY(-6px)]" : "group-hover:[transform:rotateX(5deg)_translateY(-6px)]"
        }`}
      >
        {vertical ? (
          /* phone */
          <div className="relative size-full rounded-[36px] bg-sumi p-[10px] shadow-float ring-1 ring-white/10">
            <span aria-hidden className="absolute top-[18px] left-1/2 z-10 h-[18px] w-[30%] -translate-x-1/2 rounded-full bg-sumi" />
            <span aria-hidden className="absolute top-[20%] -left-[3px] h-[9%] w-[3px] rounded-l bg-sumi" />
            <span aria-hidden className="absolute top-[32%] -left-[3px] h-[9%] w-[3px] rounded-l bg-sumi" />
            <span aria-hidden className="absolute top-[24%] -right-[3px] h-[12%] w-[3px] rounded-r bg-sumi" />
            {screen}
          </div>
        ) : (
          /* film strip */
          <div className="relative size-full rounded-[20px] bg-sumi px-2 py-6 shadow-float">
            <div aria-hidden className="film-holes-x absolute inset-x-5 top-1.5 h-3 opacity-60" />
            <div aria-hidden className="film-holes-x absolute inset-x-5 bottom-1.5 h-3 opacity-60" />
            {screen}
          </div>
        )}
        <span aria-hidden className={`pointer-events-none absolute inset-0 ring-4 ring-shu opacity-0 transition group-focus-visible:opacity-100 ${vertical ? "rounded-[36px]" : "rounded-[20px]"}`} />
      </div>
    </button>
  );
}
