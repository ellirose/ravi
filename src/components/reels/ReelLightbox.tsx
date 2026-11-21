"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isVertical, reelPoster, reelSrc, resolutionLabel, timecode, type Reel } from "@/data/reels";
import { useI18n } from "@/i18n/LanguageProvider";
import { reelStyle } from "./reelStyle";

/** Full-screen screening of one spot: custom transport, scrubbing, prev/next across the current filter. */
export function ReelLightbox({ items, index, onIndex, onClose }: { items: Reel[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const { t, locale } = useI18n();
  const s = t.studio;
  const reel = items[index];
  const st = reelStyle[reel.cat];
  const v = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  const go = useCallback((d: number) => { setReady(false); onIndex((index + d + items.length) % items.length); }, [index, items.length, onIndex]);
  const close = useCallback(() => { setVisible(false); window.setTimeout(onClose, 380); }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setVisible(true));
    closeBtn.current?.focus();
    return () => { document.body.style.overflow = prev; opener?.focus(); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === " " && document.activeElement?.tagName !== "BUTTON") {
        e.preventDefault();
        const el = v.current;
        if (el?.paused) el.play().catch(() => {});
        else el?.pause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, go]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = v.current;
      if (el?.duration) {
        if (bar.current) bar.current.style.transform = `scaleX(${el.currentTime / el.duration})`;
        if (clock.current) clock.current.textContent = `${timecode(el.currentTime).slice(3)} / ${timecode(el.duration).slice(3)}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const st = strip.current;
    const thumb = st?.querySelector<HTMLElement>(`[data-i="${index}"]`);
    if (st && thumb) st.scrollTo({ left: thumb.offsetLeft - (st.clientWidth - thumb.offsetWidth) / 2, behavior: "smooth" });
  }, [index]);

  const toggle = () => {
    const el = v.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };
  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = v.current;
    if (!el?.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    el.currentTime = Math.min(0.999, Math.max(0, (e.clientX - r.left) / r.width)) * el.duration;
  };

  const vertical = isVertical(reel);

  return createPortal(
    <div
      role="dialog"
      data-reel-lightbox=""
      aria-modal="true"
      aria-label={reel.title[locale]}
      className={`fixed inset-0 z-[80] flex flex-col bg-sumi/94 text-paper backdrop-blur-xl transition-opacity duration-400 ${visible ? "opacity-100" : "opacity-0"}`}
      onPointerDown={(e) => { touch.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={(e) => {
        if (!touch.current || e.pointerType === "mouse") return;
        const dx = e.clientX - touch.current.x;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - touch.current.y)) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 pt-4 sm:px-8 sm:pt-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${st.chip}`}>
            <st.Icon className="size-6" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold sm:text-2xl">{reel.title[locale]}</p>
            <p className="text-sm font-semibold text-paper/65">
              {s.filters[reel.cat]} · {resolutionLabel(reel)} · {reel.w}×{reel.h} · {vertical ? s.vertical : s.wide} · <span className="tabular-nums">{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
            </p>
          </div>
        </div>
        <button
          ref={closeBtn}
          type="button"
          onClick={close}
          aria-label={s.close}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-paper text-sumi shadow-lift transition hover:rotate-90 hover:bg-shu hover:text-white"
        >
          <span className="relative block size-5">
            <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rotate-45 rounded bg-current" />
            <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 -rotate-45 rounded bg-current" />
          </span>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-4 sm:px-28">
        <div
          key={reel.id}
          className={`relative overflow-hidden rounded-[22px] bg-black/30 shadow-float transition-all duration-500 ease-[var(--ease-silk)] ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
          style={{ aspectRatio: `${reel.w} / ${reel.h}`, height: vertical ? "min(100%, calc(100svh - 15rem))" : undefined, width: vertical ? undefined : "min(100%, calc((100svh - 15rem) * " + reel.w / reel.h + "))" }}
        >
          <Image src={reelPoster(reel)} alt="" aria-hidden fill sizes="90vw" className={`object-cover transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`} />
          <video
            ref={v}
            src={reelSrc(reel)}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onClick={toggle}
            onPlaying={() => setReady(true)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="absolute inset-0 size-full cursor-pointer object-cover"
          />
        </div>
        <button type="button" onClick={() => go(-1)} aria-label={s.prev} className="absolute left-3 grid size-14 place-items-center rounded-full bg-paper text-sumi shadow-lift transition hover:-translate-x-1 hover:text-shu sm:left-8 sm:size-16">
          <ArrowLeft className="size-6" strokeWidth={2.4} />
        </button>
        <button type="button" onClick={() => go(1)} aria-label={s.next} className="absolute right-3 grid size-14 place-items-center rounded-full bg-paper text-sumi shadow-lift transition hover:translate-x-1 hover:text-shu sm:right-8 sm:size-16">
          <ArrowRight className="size-6" strokeWidth={2.4} />
        </button>
      </div>

      {/* transport */}
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 sm:px-8">
        <button type="button" onClick={toggle} aria-label={playing ? s.pause : s.play} className="grid size-12 shrink-0 place-items-center rounded-full bg-shu text-white shadow-lift transition hover:scale-105">
          {playing ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5 translate-x-px" fill="currentColor" />}
        </button>
        <div
          role="presentation"
          onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); seek(e); }}
          onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) seek(e); }}
          className="group relative h-8 flex-1 cursor-pointer touch-none"
        >
          <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-paper/20">
            <span ref={bar} className="absolute inset-0 origin-left scale-x-0 rounded-full bg-paper" />
          </span>
        </div>
        <span ref={clock} className="shrink-0 font-mono text-sm text-paper/75 tabular-nums">00:00:00 / 00:00:00</span>
      </div>

      <div ref={strip} className="no-scrollbar mx-auto mt-3 flex max-w-full gap-2.5 overflow-x-auto px-4 pb-5 sm:px-8">
        {items.map((r, i) => (
          <button
            key={r.id}
            data-i={i}
            type="button"
            aria-label={r.title[locale]}
            aria-current={i === index}
            onClick={() => { setReady(false); onIndex(i); }}
            className={`relative h-16 shrink-0 overflow-hidden rounded-xl transition duration-300 ${isVertical(r) ? "w-10" : "w-28"} ${i === index ? "ring-3 ring-shu ring-offset-2 ring-offset-sumi" : "opacity-45 hover:opacity-100"}`}
          >
            <Image src={reelPoster(r)} alt="" fill sizes="112px" className="object-cover" style={{ objectPosition: r.focus }} />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
