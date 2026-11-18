"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { workCategories, works, type WorkCategory } from "@/data/works";
import { useI18n } from "@/i18n/LanguageProvider";
import { categoryIcon } from "../categoryIcons";
import { useLightbox } from "../Lightbox";
import { Reveal } from "../motion";
import { WorkCard } from "../WorkCard";

type Filter = WorkCategory | "all";
const filters: Filter[] = ["all", ...workCategories];
const INITIAL = 12;

export function Works() {
  const { t } = useI18n();
  const { open } = useLightbox();
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  const list = useMemo(() => (filter === "all" ? works : works.filter((w) => w.cat === filter)), [filter]);
  const visible = expanded ? list : list.slice(0, INITIAL);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: works.length };
    works.forEach((w) => (c[w.cat] = (c[w.cat] ?? 0) + 1));
    return c;
  }, []);

  useEffect(() => {
    const btn = railRef.current?.querySelector<HTMLButtonElement>(`[data-f="${filter}"]`);
    if (!btn) return;
    setPill({ left: btn.offsetLeft, width: btn.offsetWidth });
    btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [filter, t]);

  const choose = (f: Filter) => {
    setFilter(f);
    setExpanded(false);
  };

  return (
    <section id="works" className="tex tex-linen relative bg-kinu py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <Reveal variant="up">
            <p className="text-sm font-bold tracking-[0.3em] text-shu uppercase">{t.works.eyebrow}</p>
            <h2 className="mt-3 font-display text-[clamp(2.6rem,6vw,5.5rem)] leading-[1] font-medium tracking-tight">{t.works.title}</h2>
            <p className="mt-5 max-w-2xl text-xl text-sumi-soft">{t.works.body}</p>
          </Reveal>
          <Reveal variant="scale" delay={150} className="flex items-center gap-4 lg:flex-col lg:items-end">
            <span className="font-display text-[clamp(4rem,8vw,7rem)] leading-none font-semibold text-shu">{works.length}</span>
            <span className="text-base font-bold tracking-[0.2em] text-sumi-soft uppercase">{t.works.count}</span>
          </Reveal>
        </div>

        {/* Custom segmented filter with sliding pill */}
        <Reveal variant="fade" delay={200} className="sticky top-24 z-30 mt-12 -mx-5 px-5 sm:mx-0 sm:px-0">
          <div ref={railRef} role="tablist" aria-label={t.works.title} className="no-scrollbar relative flex gap-1 overflow-x-auto rounded-full border border-sumi/8 bg-paper/90 p-1.5 shadow-lift backdrop-blur-xl">
            <span aria-hidden className="absolute top-1.5 bottom-1.5 rounded-full bg-sumi transition-all duration-500 ease-[var(--ease-silk)]" style={{ left: pill.left, width: pill.width }} />
            {filters.map((f) => {
              const Icon = categoryIcon[f];
              const on = f === filter;
              return (
                <button
                  key={f}
                  data-f={f}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  onClick={() => choose(f)}
                  className={`relative z-10 flex shrink-0 grow items-center justify-center gap-2 rounded-full px-3 py-2.5 text-[0.95rem] font-semibold whitespace-nowrap transition-colors duration-300 ${on ? "text-paper" : "text-sumi-soft hover:text-sumi"}`}
                >
                  <Icon className="size-[18px]" strokeWidth={2} />
                  {t.works.filters[f]}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${on ? "bg-shu text-white" : "bg-kinu text-sumi-mute"}`}>{counts[f]}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <div key={filter} role="tabpanel" className="mt-14 columns-1 gap-8 sm:columns-2 lg:columns-3 xl:columns-4">
          {visible.map((w, i) => (
            <Reveal key={w.id} variant="rise" delay={(i % 4) * 80} className="mb-10 break-inside-avoid" threshold={0.05}>
              <WorkCard work={w} onOpen={() => open(list, list.indexOf(w))} />
            </Reveal>
          ))}
        </div>

        {list.length > INITIAL && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="group inline-flex h-16 items-center gap-3 rounded-full border-2 border-sumi/12 bg-paper pr-2 pl-8 text-lg font-semibold shadow-soft transition hover:border-shu hover:shadow-lift"
            >
              {expanded ? t.works.less : `${t.works.more} (${list.length - INITIAL})`}
              <span className={`grid size-12 place-items-center rounded-full bg-shu text-white transition-transform duration-500 ${expanded ? "rotate-180" : "group-hover:translate-y-0.5"}`}>
                <ChevronDown className="size-6" strokeWidth={2.4} />
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
