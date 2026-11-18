"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export type LoopVideoHandle = { play: () => void; pause: () => void; seek: (fraction: number) => void; progress: () => number };

/**
 * Muted, looping background video that only plays while visible and falls
 * back gracefully to its poster image if the file is missing.
 */
export const LoopVideo = forwardRef<LoopVideoHandle, { src: string; poster?: string; className?: string; onPlayingChange?: (p: boolean) => void }>(
  function LoopVideo({ src, poster, className = "", onPlayingChange }, ref) {
    const v = useRef<HTMLVideoElement>(null);
    const userPaused = useRef(false);
    const [failed, setFailed] = useState(false);

    useImperativeHandle(ref, () => ({
      play: () => { userPaused.current = false; v.current?.play().catch(() => {}); },
      pause: () => { userPaused.current = true; v.current?.pause(); },
      seek: (fraction: number) => {
        const el = v.current;
        if (el && el.duration && isFinite(el.duration)) el.currentTime = Math.min(1, Math.max(0, fraction)) * el.duration;
      },
      progress: () => {
        const el = v.current;
        return el && el.duration && isFinite(el.duration) ? el.currentTime / el.duration : 0;
      },
    }));

    useEffect(() => {
      const el = v.current;
      if (!el) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !reduced && !userPaused.current) el.play().catch(() => {});
        else el.pause();
      }, { threshold: 0.1 });
      io.observe(el);
      const on = () => onPlayingChange?.(true);
      const off = () => onPlayingChange?.(false);
      el.addEventListener("play", on);
      el.addEventListener("pause", off);
      return () => { io.disconnect(); el.removeEventListener("play", on); el.removeEventListener("pause", off); };
    }, [onPlayingChange]);

    return (
      <>
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" aria-hidden className={`absolute inset-0 size-full object-cover ${className}`} />
        ) : null}
        {!failed && (
          <video
            ref={v}
            className={`absolute inset-0 size-full object-cover ${className}`}
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            onError={() => setFailed(true)}
          />
        )}
      </>
    );
  },
);

/** Ticking SMPTE-style timecode (24 fps) — a small nod to the edit suite. */
export function Timecode({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = (now: number) => {
      const total = (now - t0) / 1000;
      const f = Math.floor((total % 1) * 24);
      const s = Math.floor(total) % 60;
      const m = Math.floor(total / 60) % 60;
      if (ref.current) ref.current.textContent = `00:${pad(m)}:${pad(s)}:${pad(f)}`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span ref={ref} className={`tabular-nums ${className}`}>00:00:00:00</span>;
}
