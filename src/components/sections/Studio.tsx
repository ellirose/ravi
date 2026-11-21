"use client";

import { Lightbulb, Scissors, Send, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { reelCategories, reels, type Reel, type ReelCategory } from "@/data/reels";
import { useI18n } from "@/i18n/LanguageProvider";
import { Reveal } from "../motion";
import { padFor, ReelCard } from "../reels/ReelCard";
import { ReelLightbox } from "../reels/ReelLightbox";
import { ReelStage } from "../reels/ReelStage";
import { reelStyle } from "../reels/reelStyle";

type Filter = ReelCategory | "all";
const filters: Filter[] = ["all", ...reelCategories];
const processIcons = [Lightbulb, WandSparkles, Scissors, Send];
const processTones = ["bg-kin-soft text-[#9a7633]", "bg-sakura-soft text-[#c2566e]", "bg-ai-soft text-ai", "bg-matcha-soft text-[#5d7a3d]"];
const GAP = 18;

type Placed = { reel: Reel; w: number; h: number };

/** Justified rows: every row shares one screen height and fills the width exactly. */
function justify(items: Reel[], W: number, target: number): Placed[][] {
  const rows: Placed[][] = [];
  const fit = (row: Reel[]) => {
    const chrome = row.reduce((s, r) => s + padFor(r).x, 0) + GAP * (row.length - 1);
    return (W - chrome) / row.reduce((s, r) => s + r.w / r.h, 0);
  };
  const push = (row: Reel[], h: number) => {
    const hh = Math.min(h, target * 1.4);
    rows.push(row.map((r) => ({ reel: r, w: hh * (r.w / r.h) + padFor(r).x, h: hh + padFor(r).y })));
  };
  let row: Reel[] = [];
  for (const r of items) {
    row.push(r);
    const width = row.reduce((s, x) => s + target * (x.w / x.h) + padFor(x).x, 0) + GAP * (row.length - 1);
    if (width < W) continue;
    // Break where the row height lands closest to the target: either squeeze
    // this item in, or close the row before it and start the next with it.
    const hWith = fit(row);
    const without = row.slice(0, -1);
    const hWithout = without.length ? Math.min(fit(without), target * 1.4) : Infinity;
    if (without.length && Math.abs(Math.log(hWithout / target)) < Math.abs(Math.log(hWith / target))) {
      push(without, hWithout);
      row = [r];
    } else {
      push(row, hWith);
      row = [];
    }
  }
  if (row.length) push(row, Math.min(fit(row), target));
  return rows;
}

export function Studio() {
  const { t } = useI18n();
  const s = t.studio;
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);
  const [width, setWidth] = useState(1280);
  const grid = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  const list = useMemo(() => (filter === "all" ? reels : reels.filter((r) => r.cat === filter)), [filter]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reels.length };
    reels.forEach((r) => (c[r.cat] = (c[r.cat] ?? 0) + 1));
    return c;
  }, []);

  useEffect(() => {
    const el = grid.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    const btn = rail?.querySelector<HTMLButtonElement>(`[data-f="${filter}"]`);
    if (!rail || !btn) return;
    setPill({ left: btn.offsetLeft, width: btn.offsetWidth });
    rail.scrollTo({ left: btn.offsetLeft - (rail.clientWidth - btn.offsetWidth) / 2, behavior: "smooth" });
  }, [filter, t]);

  const target = width < 640 ? 300 : width < 1024 ? 290 : 330;
  const rows = useMemo(() => justify(list, width, target), [list, width, target]);

  return (
    <section id="studio" className="tex tex-plaster relative overflow-hidden bg-[#f3eee6] py-24 sm:py-32">
      <span aria-hidden className="tategaki pointer-events-none absolute top-16 left-3 font-jp text-[clamp(4rem,9vw,8rem)] leading-none text-sumi/[0.05] select-none">広告</span>

      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <Reveal variant="up">
            <p className="text-sm font-bold tracking-[0.3em] text-shu uppercase">{s.eyebrow}</p>
            <h2 className="mt-3 max-w-3xl font-display text-[clamp(2.5rem,5.5vw,5rem)] leading-[1.03] font-medium tracking-tight">{s.title}</h2>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-sumi-soft">{s.body}</p>
          </Reveal>
          {/* stats as film reels */}
          <div className="flex gap-4 sm:gap-6">
            {s.stats.map((st, i) => (
              <Reveal key={st.label} variant="scale" delay={120 + i * 100} className="flex flex-col items-center gap-3">
                <div className="group relative grid size-24 place-items-center rounded-full bg-sumi text-paper shadow-float sm:size-28">
                  <span
                    aria-hidden
                    className="absolute inset-2 rounded-full transition-transform duration-[1.6s] ease-[var(--ease-silk)] group-hover:rotate-[120deg]"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 16%, #fffdf9 0 7%, transparent 7.5%), radial-gradient(circle at 80% 38%, #fffdf9 0 7%, transparent 7.5%), radial-gradient(circle at 70% 78%, #fffdf9 0 7%, transparent 7.5%), radial-gradient(circle at 30% 78%, #fffdf9 0 7%, transparent 7.5%), radial-gradient(circle at 20% 38%, #fffdf9 0 7%, transparent 7.5%)",
                      opacity: 0.16,
                    }}
                  />
                  <span className="relative font-display text-[1.9rem] leading-none font-semibold sm:text-[2.2rem]">{st.value}</span>
                </div>
                <span className="max-w-[7rem] text-center text-sm leading-tight font-bold text-sumi-soft">{st.label}</span>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal variant="shoji" className="mt-14">
          <ReelStage />
        </Reveal>

        {/* process */}
        <div className="mt-20">
          <Reveal variant="up">
            <h3 className="font-display text-[clamp(1.8rem,3vw,2.6rem)] font-medium tracking-tight">{s.processTitle}</h3>
          </Reveal>
          <ol className="relative mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <span aria-hidden className="film-holes-x absolute top-[42px] right-10 left-10 hidden h-3 rounded-full bg-sumi/85 lg:block" />
            {s.process.map((p, i) => {
              const Icon = processIcons[i];
              return (
                <Reveal as="li" key={p.title} variant="rise" delay={i * 110} className="relative">
                  <div className="shape-shadow h-full">
                    <div className="shape-tag h-full bg-paper px-6 pt-14 pb-7">
                      <span className={`absolute top-6 left-1/2 grid size-16 -translate-x-1/2 place-items-center rounded-2xl ${processTones[i]} shadow-soft`}>
                        <Icon className="size-8" strokeWidth={1.8} />
                      </span>
                      <p className="mt-10 font-jp text-sm text-sumi-mute">{["一", "二", "三", "四"][i]}</p>
                      <p className="mt-1 font-display text-2xl font-semibold">{p.title}</p>
                      <p className="mt-2 text-[1.05rem] leading-relaxed text-sumi-soft">{p.body}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>

        {/* filter */}
        <Reveal variant="fade" className="sticky top-24 z-30 mt-20 -mx-5 px-5 sm:mx-0 sm:px-0">
          <div ref={railRef} role="tablist" aria-label={s.title} className="no-scrollbar relative flex gap-1 overflow-x-auto rounded-full border border-sumi/8 bg-paper/90 p-1.5 shadow-lift backdrop-blur-xl">
            <span aria-hidden className="absolute top-1.5 bottom-1.5 rounded-full bg-sumi transition-all duration-500 ease-[var(--ease-silk)]" style={{ left: pill.left, width: pill.width }} />
            {filters.map((f) => {
              const { Icon } = reelStyle[f];
              const on = f === filter;
              return (
                <button
                  key={f}
                  data-f={f}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  onClick={() => setFilter(f)}
                  className={`relative z-10 flex shrink-0 grow items-center justify-center gap-2 rounded-full px-3 py-2.5 text-[0.95rem] font-semibold whitespace-nowrap transition-colors duration-300 ${on ? "text-paper" : "text-sumi-soft hover:text-sumi"}`}
                >
                  <Icon className="size-[18px]" strokeWidth={2} />
                  {s.filters[f]}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${on ? "bg-shu text-white" : "bg-kinu text-sumi-mute"}`}>{counts[f]}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* justified gallery */}
        <div ref={grid} className="mt-12">
          <div key={filter} role="tabpanel" className="flex flex-col" style={{ gap: GAP + 8 }}>
            {rows.map((row, ri) => (
              <div key={ri} className="flex items-end justify-center" style={{ gap: GAP }}>
                {row.map((p, i) => (
                  <Reveal key={p.reel.id} variant="rise" delay={i * 90} className="shrink-0">
                    <ReelCard reel={p.reel} width={p.w} height={p.h} onOpen={() => setOpen(list.indexOf(p.reel))} />
                  </Reveal>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {open !== null ? <ReelLightbox items={list} index={open} onIndex={setOpen} onClose={() => setOpen(null)} /> : null}
    </section>
  );
}
