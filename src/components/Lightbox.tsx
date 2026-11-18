"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Work } from "@/data/works";
import { useI18n } from "@/i18n/LanguageProvider";
import { categoryIcon } from "./categoryIcons";

type Ctx = { open: (items: Work[], index: number) => void };
const LightboxContext = createContext<Ctx>({ open: () => {} });
export const useLightbox = () => useContext(LightboxContext);

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [state, setState] = useState<{ items: Work[]; index: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const thumbs = useRef<HTMLDivElement>(null);

  const open = useCallback((items: Work[], index: number) => {
    opener.current = document.activeElement as HTMLElement;
    setState({ items, index });
    requestAnimationFrame(() => setVisible(true));
  }, []);
  const close = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => { setState(null); opener.current?.focus(); }, 380);
  }, []);
  const go = useCallback((d: number) => {
    setState((s) => (s ? { ...s, index: (s.index + d + s.items.length) % s.items.length } : s));
  }, []);

  useEffect(() => {
    if (!state) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [state, close, go]);

  // Keep the active thumbnail in view
  useEffect(() => {
    if (!state) return;
    thumbs.current?.querySelector<HTMLElement>(`[data-i="${state.index}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [state]);

  const work = state ? state.items[state.index] : null;
  const Icon = work ? categoryIcon[work.cat] : null;

  return (
    <LightboxContext.Provider value={{ open }}>
      {children}
      {state && work && Icon ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={work.title}
          className={`fixed inset-0 z-[80] flex flex-col bg-washi/92 backdrop-blur-xl transition-opacity duration-400 ${visible ? "opacity-100" : "opacity-0"}`}
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
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-shu-soft text-shu">
                <Icon className="size-6" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-xl font-semibold sm:text-2xl">{work.title}</p>
                <p className="text-sm font-semibold text-sumi-soft">
                  {t.works.filters[work.cat]} · <span className="tabular-nums">{String(state.index + 1).padStart(2, "0")} / {String(state.items.length).padStart(2, "0")}</span>
                </p>
              </div>
            </div>
            <button
              ref={closeBtn}
              type="button"
              onClick={close}
              aria-label={t.lightbox.close}
              className="grid size-14 shrink-0 place-items-center rounded-full bg-sumi text-paper shadow-lift transition hover:rotate-90 hover:bg-shu"
            >
              <span className="relative block size-5">
                <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rotate-45 rounded bg-current" />
                <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 -rotate-45 rounded bg-current" />
              </span>
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-4 sm:px-28">
            <div key={work.id} className={`relative flex max-h-full items-center justify-center transition-all duration-500 ease-[var(--ease-silk)] ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
              <Image
                src={work.src}
                alt={work.title}
                width={work.w}
                height={work.h}
                sizes="90vw"
                loading="eager"
                className="h-auto max-h-[calc(100svh-15rem)] w-auto max-w-full rounded-[22px] object-contain shadow-float"
              />
            </div>
            <button type="button" onClick={() => go(-1)} aria-label={t.lightbox.prev} className="absolute left-3 grid size-14 place-items-center rounded-full bg-paper text-sumi shadow-lift transition hover:-translate-x-1 hover:text-shu sm:left-8 sm:size-16">
              <ArrowLeft className="size-6" strokeWidth={2.4} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t.lightbox.next} className="absolute right-3 grid size-14 place-items-center rounded-full bg-paper text-sumi shadow-lift transition hover:translate-x-1 hover:text-shu sm:right-8 sm:size-16">
              <ArrowRight className="size-6" strokeWidth={2.4} />
            </button>
          </div>

          <div ref={thumbs} className="no-scrollbar mx-auto flex max-w-full gap-2.5 overflow-x-auto px-4 pb-5 sm:px-8">
            {state.items.map((w, i) => (
              <button
                key={w.id}
                data-i={i}
                type="button"
                aria-label={w.title}
                aria-current={i === state.index}
                onClick={() => setState({ ...state, index: i })}
                className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-xl transition duration-300 ${i === state.index ? "ring-3 ring-shu ring-offset-2 ring-offset-washi" : "opacity-50 hover:opacity-100"}`}
              >
                <Image src={w.src} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </LightboxContext.Provider>
  );
}
