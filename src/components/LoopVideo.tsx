"use client";

import Image from "next/image";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export type LoopVideoHandle = { play: () => void; pause: () => void; seek: (fraction: number) => void; progress: () => number };

const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Data-saver or 2G/3G: show the poster only and skip the multi-MB video download. */
function isSlowConnection() {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !!conn && (conn.saveData === true || /(^|-)2g$|^3g$/.test(conn.effectiveType ?? ""));
}

/**
 * Muted, looping background video. The file is only requested once the page has
 * finished loading and the video is in view (so it never competes with the JS
 * and images the page needs first), it plays only while visible, and it falls
 * back to its poster on slow connections or if the file is missing.
 */
export const LoopVideo = forwardRef<
  LoopVideoHandle,
  { src: string; poster?: string; posterSizes?: string; className?: string; onPlayingChange?: (p: boolean) => void }
>(
  function LoopVideo({ src, poster, posterSizes = "50vw", className = "", onPlayingChange }, ref) {
    const v = useRef<HTMLVideoElement>(null);
    const userPaused = useRef(false);
    const visible = useRef(false);
    const [load, setLoad] = useState(false);
    const [failed, setFailed] = useState(false);

    useImperativeHandle(ref, () => ({
      play: () => {
        userPaused.current = false;
        if (!load) setLoad(true); // explicit play loads even on slow connections
        else v.current?.play().catch(() => {});
      },
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
      const slow = isSlowConnection();
      let pageLoaded = document.readyState === "complete";
      const tryLoad = () => {
        if (!slow && pageLoaded && visible.current) setLoad(true);
      };
      const onPageLoad = () => { pageLoaded = true; tryLoad(); };
      if (!pageLoaded) window.addEventListener("load", onPageLoad, { once: true });

      const io = new IntersectionObserver(([e]) => {
        visible.current = e.isIntersecting;
        if (!e.isIntersecting) { el.pause(); return; }
        tryLoad();
        if (el.currentSrc && !prefersReduced() && !userPaused.current) el.play().catch(() => {});
      }, { threshold: 0.1 });
      io.observe(el);
      const on = () => onPlayingChange?.(true);
      const off = () => onPlayingChange?.(false);
      el.addEventListener("play", on);
      el.addEventListener("pause", off);
      return () => {
        io.disconnect();
        window.removeEventListener("load", onPageLoad);
        el.removeEventListener("play", on);
        el.removeEventListener("pause", off);
      };
    }, [onPlayingChange]);

    // Start playback once the source has been attached.
    useEffect(() => {
      const el = v.current;
      if (!load || !el) return;
      if (visible.current && !userPaused.current && !prefersReduced()) el.play().catch(() => {});
    }, [load]);

    return (
      <>
        {poster ? (
          <Image src={poster} alt="" aria-hidden fill sizes={posterSizes} className={`object-cover ${className}`} />
        ) : null}
        {!failed && (
          <video
            ref={v}
            className={`absolute inset-0 size-full object-cover ${className}`}
            src={load ? src : undefined}
            muted
            loop
            playsInline
            preload="none"
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
