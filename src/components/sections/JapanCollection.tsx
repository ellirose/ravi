"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Hand } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { japanCollection } from "@/data/works";
import { useI18n } from "@/i18n/LanguageProvider";
import { useLightbox } from "../Lightbox";
import { Reveal, usePrefersReducedMotion } from "../motion";

const N = japanCollection.length;
const STEP = 360 / N;

/** A 3D ring (carousel) of arch-shaped cards — drag, click or use the arrows. */
export function JapanCollection() {
  const { t } = useI18n();
  const { open } = useLightbox();
  const reduced = usePrefersReducedMotion();
  const ring = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const target = useRef(0);
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null);
  const hovering = useRef(false);
  const [front, setFront] = useState(0);
  const [cardW, setCardW] = useState(260);

  useEffect(() => {
    const onResize = () => setCardW(window.innerWidth < 640 ? 190 : window.innerWidth < 1024 ? 230 : 270);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const radius = Math.round((cardW / 2) / Math.tan(Math.PI / N) * 1.18);

  useEffect(() => {
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    if (ring.current) io.observe(ring.current);
    const loop = () => {
      if (visible) {
        if (!drag.current && !hovering.current && !reduced) target.current -= 0.06;
        angle.current += (target.current - angle.current) * 0.08;
        if (ring.current) ring.current.style.transform = `translateZ(${-radius}px) rotateY(${angle.current}deg)`;
        const idx = ((Math.round(-angle.current / STEP) % N) + N) % N;
        setFront((f) => (f === idx ? f : idx));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [radius, reduced]);

  const snapBy = (d: number) => { target.current = Math.round(target.current / STEP) * STEP - d * STEP; };

  return (
    <section id="collection" className="relative overflow-hidden bg-asagi py-24 sm:py-32">
      {/* Fuji photo washed into the page */}
      <div aria-hidden className="absolute inset-0 -z-0">
        <Image src="/media/images/fuji-sakura.jpg" alt="" fill sizes="100vw" className="object-cover object-[50%_35%] opacity-60" />
        <div className="absolute inset-0 bg-paper/72" />
        <div className="seigaiha absolute inset-x-0 bottom-0 h-[38%] opacity-[0.22] [mask-image:linear-gradient(to_top,#000_30%,transparent)]" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <Reveal variant="up">
            <p className="text-sm font-bold tracking-[0.3em] text-ai uppercase">{t.collection.eyebrow}</p>
            <h2 className="mt-3 font-display text-[clamp(2.6rem,6vw,5.4rem)] leading-[1] font-medium tracking-tight">{t.collection.title}</h2>
          </Reveal>
          <Reveal variant="up" delay={120}>
            <p className="text-xl leading-relaxed text-sumi-soft">{t.collection.body}</p>
          </Reveal>
        </div>

        <Reveal variant="scale" delay={150} className="relative mt-10">
          <div
            className="relative mx-auto h-[clamp(360px,52vw,520px)] cursor-grab touch-pan-y select-none active:cursor-grabbing"
            style={{ perspective: "1600px" }}
            onPointerEnter={() => (hovering.current = true)}
            onPointerLeave={() => { hovering.current = false; drag.current = null; }}
            onPointerDown={(e) => { drag.current = { x: e.clientX, start: target.current, moved: false }; }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const dx = e.clientX - drag.current.x;
              if (Math.abs(dx) > 4) drag.current.moved = true;
              target.current = drag.current.start + dx * 0.25;
            }}
            onPointerUp={() => {
              if (drag.current?.moved) target.current = Math.round(target.current / STEP) * STEP;
              setTimeout(() => (drag.current = null), 0);
            }}
          >
            <div ref={ring} className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]" style={{ width: cardW, height: cardW * 1.4, marginLeft: -cardW / 2, marginTop: -(cardW * 1.4) / 2 }}>
              {japanCollection.map((w, i) => (
                <button
                  key={w.id}
                  type="button"
                  aria-label={`${w.title}`}
                  onClick={() => { if (!drag.current?.moved) open(japanCollection, i); }}
                  className="group absolute inset-0 [backface-visibility:hidden]"
                  style={{ transform: `rotateY(${i * STEP}deg) translateZ(${radius}px)` }}
                >
                  <div className={`shape-katomado relative size-full overflow-hidden bg-paper p-2.5 shadow-float transition duration-700 ${front === i ? "" : "opacity-80 saturate-[0.85]"}`}>
                    <div className="shape-katomado relative size-full overflow-hidden">
                      <Image src={w.src} alt={w.title} fill sizes="300px" className="object-cover transition-transform duration-700 group-hover:scale-105" draggable={false} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3 text-sumi-soft">
              <Hand className="size-6 text-ai" strokeWidth={1.8} />
              <span className="text-base font-semibold">{t.collection.drag}</span>
            </div>
            <p className="order-first min-h-[2.2em] text-center font-display text-2xl font-semibold text-sumi sm:order-none" aria-live="polite">
              <span className="mr-3 font-jp text-base text-shu tabular-nums">{String(front + 1).padStart(2, "0")}</span>
              {japanCollection[front]?.title}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => snapBy(-1)} aria-label={t.collection.prev} className="grid size-14 place-items-center rounded-full border-2 border-sumi/12 bg-paper text-sumi shadow-soft transition hover:border-ai hover:text-ai">
                <ArrowLeft className="size-6" strokeWidth={2.4} />
              </button>
              <button type="button" onClick={() => snapBy(1)} aria-label={t.collection.next} className="grid size-14 place-items-center rounded-full bg-ai text-white shadow-lift transition hover:bg-sumi">
                <ArrowRight className="size-6" strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
