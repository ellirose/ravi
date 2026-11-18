"use client";

import Image from "next/image";
import { Clapperboard, CodeXml, MapPin, Palette, TrendingUp } from "lucide-react";
import { EnsoCanvas } from "../canvas/EnsoCanvas";
import { Reveal, Tilt } from "../motion";
import { useI18n } from "@/i18n/LanguageProvider";

const expertiseIcons = [
  { Icon: Palette, tone: "text-shu bg-shu-soft" },
  { Icon: Clapperboard, tone: "text-ai bg-ai-soft" },
  { Icon: CodeXml, tone: "text-matcha bg-matcha-soft" },
  { Icon: TrendingUp, tone: "text-kin bg-kin-soft" },
];

/** Wooden roller for the kakejiku (hanging scroll) frame. */
function Rod({ className = "" }: { className?: string }) {
  return (
    <div className={`tex tex-wood relative h-5 overflow-hidden rounded-full bg-hinoki shadow-soft ${className}`}>
      <span className="absolute inset-y-0 -left-0.5 w-4 rounded-full bg-[#b98a52]" />
      <span className="absolute inset-y-0 -right-0.5 w-4 rounded-full bg-[#b98a52]" />
    </div>
  );
}

export function About() {
  const { t } = useI18n();
  const a = t.about;
  return (
    <section id="about" className="tex tex-washi relative overflow-hidden bg-washi pt-24 pb-10 sm:pt-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-16 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        {/* Kakejiku — photo mounted like a hanging scroll */}
        <Reveal variant="rise" className="mx-auto w-full max-w-[460px]">
          <Tilt max={6} className="relative">
            <svg aria-hidden viewBox="0 0 200 60" className="mx-auto -mb-1 h-14 w-48 text-[#9b7a4f]">
              <path d="M30 58 100 6 170 58" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="100" cy="6" r="5" fill="var(--color-shu)" />
            </svg>
            <Rod className="-mx-5" />
            <div className="tex tex-linen relative bg-kinu px-6 pt-6 pb-8 shadow-lift">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image src="/profile/ravi-06.png" alt="Ravi wearing a traditional hakama in a Kyoto garden" fill sizes="(min-width:1024px) 420px, 90vw" className="object-cover object-[60%_30%]" />
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-base font-semibold text-sumi-soft">
                  <MapPin className="size-5 text-shu" strokeWidth={2.2} />
                  {a.location}
                </span>
                <span className="font-jp text-lg tracking-[0.3em] text-sumi/60">ラヴィ</span>
              </div>
            </div>
            <Rod className="-mx-5" />
          </Tilt>
        </Reveal>

        <div className="relative">
          <EnsoCanvas className="pointer-events-none absolute -top-24 -right-10 -z-10 aspect-square w-[min(560px,90vw)] opacity-[0.22] sm:-right-4" />
          <Reveal variant="up">
            <p className="text-sm font-bold tracking-[0.3em] text-shu uppercase">{a.eyebrow}</p>
            <h2 className="mt-4 max-w-2xl font-display text-[clamp(2.5rem,5.2vw,4.75rem)] leading-[1.04] font-medium tracking-tight">{a.title}</h2>
          </Reveal>
          <Reveal variant="up" delay={120}>
            <p className="mt-7 max-w-2xl text-[1.2rem] leading-relaxed text-sumi-soft sm:text-[1.3rem]">{a.body}</p>
          </Reveal>
          <Reveal variant="left" delay={220}>
            <blockquote className="mt-9 flex max-w-xl items-start gap-4 border-l-4 border-shu pl-5">
              <span className="font-jp text-4xl leading-none text-shu" aria-hidden>「</span>
              <p className="font-display text-2xl leading-snug text-sumi italic sm:text-[1.7rem]">{a.quote}</p>
            </blockquote>
          </Reveal>
        </div>
      </div>

      {/* Ema rack — expertise plaques hanging from a wooden beam */}
      <div className="relative mx-auto mt-24 max-w-[1400px] px-5 sm:px-8">
        <Reveal variant="fade" className="flex items-center gap-4">
          <h3 className="text-sm font-bold tracking-[0.3em] text-sumi-soft uppercase">{a.expertiseTitle}</h3>
          <span className="h-px flex-1 bg-sumi/10" />
        </Reveal>
        <div className="tex tex-wood relative mt-8 hidden h-4 rounded-full bg-hinoki shadow-soft lg:block" aria-hidden />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:-mt-2 lg:grid-cols-4 lg:gap-6">
          {a.expertise.map((e, i) => {
            const { Icon, tone } = expertiseIcons[i];
            return (
              <Reveal key={e.title} variant="rise" delay={i * 100} className="group origin-top">
                <div className="flex flex-col items-center">
                  <span aria-hidden className="hidden h-9 w-px bg-[#9b7a4f] lg:block" />
                  <div className="w-full transition-transform duration-700 ease-[var(--ease-spring)] group-hover:rotate-[-2.5deg]" style={{ transformOrigin: "50% 0" }}>
                    <div className="shape-shadow">
                      <div className="shape-ema tex tex-wood relative bg-hinoki px-7 pt-16 pb-8">
                        <span aria-hidden className="absolute top-[7%] left-1/2 size-3.5 -translate-x-1/2 rounded-full bg-[#7d5f3a] ring-4 ring-[#f3e6cf]" />
                        <span className={`grid size-[4.5rem] place-items-center rounded-[22px] shadow-soft ${tone} transition-transform duration-500 group-hover:scale-110`}>
                          <Icon className="size-9" strokeWidth={1.7} />
                        </span>
                        <h4 className="mt-5 font-display text-[1.65rem] leading-tight font-semibold text-sumi">{e.title}</h4>
                        <p className="mt-3 text-[1rem] leading-relaxed text-sumi/75">{e.items}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
