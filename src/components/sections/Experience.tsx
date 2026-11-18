"use client";

import { Briefcase, MapPin } from "lucide-react";
import { InkTrail } from "../canvas/InkTrail";
import { Reveal } from "../motion";
import { useI18n } from "@/i18n/LanguageProvider";

function Petal({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path d="M10 18C3 13 3.5 4.5 8.6 2.2L10 4.4l1.4-2.2C16.5 4.5 17 13 10 18Z" fill="currentColor" />
    </svg>
  );
}

/** Makimono (hand scroll): wooden rollers, washi sheet, ink line that paints on scroll. */
export function Experience() {
  const { t } = useI18n();
  const e = t.experience;
  return (
    <section id="experience" className="relative bg-washi py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Reveal variant="up" className="text-center">
          <p className="text-sm font-bold tracking-[0.3em] text-shu uppercase">{e.eyebrow}</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-[clamp(2.5rem,5.5vw,5rem)] leading-[1.03] font-medium tracking-tight">{e.title}</h2>
        </Reveal>

        <Reveal variant="shoji" className="mt-14">
          <div className="tex tex-wood relative mx-auto h-7 rounded-full bg-hinoki shadow-lift" aria-hidden>
            <span className="absolute -left-2 top-1/2 size-9 -translate-y-1/2 rounded-full bg-[#a77b48] shadow-soft" />
            <span className="absolute -right-2 top-1/2 size-9 -translate-y-1/2 rounded-full bg-[#a77b48] shadow-soft" />
          </div>
          <div className="tex tex-washi relative mx-3 bg-paper px-5 py-12 shadow-lift sm:mx-6 sm:px-10 lg:px-16">
            <span aria-hidden className="tategaki absolute top-10 right-6 hidden font-jp text-2xl text-sumi/25 md:block">経歴</span>
            <div className="grid grid-cols-[44px_1fr] gap-x-5 sm:grid-cols-[72px_1fr] sm:gap-x-8">
              <div className="relative row-span-3">
                <InkTrail className="absolute inset-0 size-full" />
              </div>
              {e.roles.map((r, i) => (
                <article key={r.company} className={`relative ${i < e.roles.length - 1 ? "pb-14" : ""}`}>
                  {/* hanko date seal over the ink line */}
                  <Reveal variant="scale" className="absolute top-0 -left-[66px] sm:-left-[100px]">
                    <div className="flex w-12 flex-col items-center rounded-xl bg-shu px-1 py-2.5 text-center text-white shadow-lift ring-4 ring-paper sm:w-16">
                      <span className="font-display text-sm font-bold sm:text-lg">{r.period.slice(0, 4)}</span>
                      <span className="my-0.5 h-3 w-px bg-white/60" />
                      <span className="font-display text-sm font-bold sm:text-lg">{/\d{4}/.test(r.period.split("—")[1] ?? "") ? r.period.split("—")[1].trim() : "→"}</span>
                    </div>
                  </Reveal>
                  <Reveal variant="up" delay={100}>
                    <p className="text-sm font-bold tracking-[0.2em] text-sumi-mute uppercase">{r.period}</p>
                    <h3 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-tight font-semibold text-sumi">{r.role}</h3>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      <span className="inline-flex items-center gap-2 rounded-full bg-ai-soft px-4 py-1.5 text-base font-semibold text-ai">
                        <Briefcase className="size-4.5" strokeWidth={2.2} /> {r.company}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-kinu px-4 py-1.5 text-base font-semibold text-sumi-soft">
                        <MapPin className="size-4.5" strokeWidth={2.2} /> {r.place}
                      </span>
                    </div>
                    <ul className="mt-6 grid gap-3.5 md:grid-cols-2 md:gap-x-8">
                      {r.bullets.map((b) => (
                        <li key={b} className="flex gap-3 text-[1.08rem] leading-relaxed text-sumi-soft">
                          <Petal className="mt-1.5 size-4.5 shrink-0 text-sakura" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                </article>
              ))}
            </div>
          </div>
          <div className="tex tex-wood relative mx-auto h-7 rounded-full bg-hinoki shadow-lift" aria-hidden>
            <span className="absolute -left-2 top-1/2 size-9 -translate-y-1/2 rounded-full bg-[#a77b48] shadow-soft" />
            <span className="absolute -right-2 top-1/2 size-9 -translate-y-1/2 rounded-full bg-[#a77b48] shadow-soft" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
