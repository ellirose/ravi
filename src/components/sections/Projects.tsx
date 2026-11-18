"use client";

import { Presentation, Rocket, Video } from "lucide-react";
import { Reveal } from "../motion";
import { useI18n } from "@/i18n/LanguageProvider";

const fabrics = [
  { bg: "bg-ai", crest: "text-ai", kanji: "発", Icon: Rocket },
  { bg: "bg-shu", crest: "text-shu", kanji: "営", Icon: Presentation },
  { bg: "bg-matcha", crest: "text-matcha", kanji: "映", Icon: Video },
];

/** Case studies as noren — split shop curtains whose panels sway on hover. */
export function Projects() {
  const { t } = useI18n();
  const p = t.projects;
  return (
    <section id="projects" className="tex tex-wood relative bg-[#f6efe3] py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal variant="up" className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold tracking-[0.3em] text-shu uppercase">{p.eyebrow}</p>
            <h2 className="mt-3 font-display text-[clamp(2.5rem,5.5vw,5rem)] leading-[1.03] font-medium tracking-tight">{p.title}</h2>
          </div>
          <span aria-hidden className="font-jp text-[clamp(3rem,7vw,6rem)] leading-none text-sumi/10">暖簾</span>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-7">
          {p.items.map((item, i) => {
            const f = fabrics[i];
            return (
              <Reveal key={item.title} variant="rise" delay={i * 120}>
                <article className="group [perspective:900px]">
                  {/* curtain rod */}
                  <div className="relative z-10 mx-[-14px] h-4 rounded-full bg-sumi shadow-lift">
                    <span className="absolute top-1/2 -left-1 size-6 -translate-y-1/2 rounded-full bg-sumi" />
                    <span className="absolute top-1/2 -right-1 size-6 -translate-y-1/2 rounded-full bg-sumi" />
                  </div>
                  <div className={`tex tex-linen relative -mt-1 ${f.bg} rounded-b-sm px-7 pt-9 pb-8 text-white shadow-float`}>
                    <div className="flex items-start justify-between">
                      <span className="rounded-full bg-white/18 px-3.5 py-1 text-sm font-bold tracking-widest">{item.year}</span>
                      <span className="grid size-14 place-items-center rounded-2xl bg-white/15">
                        <f.Icon className="size-7" strokeWidth={1.8} />
                      </span>
                    </div>
                    <div className="mt-7 font-display text-[clamp(3.6rem,6vw,5rem)] leading-none font-semibold tracking-tight">{item.metric}</div>
                    <div className="mt-1 text-base font-semibold text-white/80">{item.metricLabel}</div>
                    <h3 className="mt-6 font-display text-[1.75rem] leading-tight font-semibold">{item.title}</h3>
                    <p className="mt-3 text-[1.05rem] leading-relaxed text-white/85">{item.body}</p>
                  </div>
                  {/* split panels with a crest straddling the slits */}
                  <div className="relative flex h-40 gap-1">
                    {[0, 1, 2].map((k) => (
                      <div
                        key={k}
                        className={`tex tex-linen relative flex-1 overflow-hidden ${f.bg} origin-top shadow-lift transition-transform duration-700 ease-[var(--ease-spring)] group-hover:[transform:rotateX(var(--sway))]`}
                        style={{ ["--sway" as string]: `${[-14, 10, -8][k]}deg`, transitionDelay: `${k * 70}ms` }}
                      >
                        <span
                          aria-hidden
                          className={`absolute top-1/2 grid size-28 -translate-y-1/2 place-items-center rounded-full bg-white font-jp text-6xl font-bold ${f.crest}`}
                          style={{ left: `calc(${150 - k * 100}% - 3.5rem + ${(1 - k) * 4}px)` }}
                        >
                          {f.kanji}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
