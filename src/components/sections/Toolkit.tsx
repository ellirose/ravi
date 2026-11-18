"use client";

import { BadgeCheck, GraduationCap, Hand, Languages } from "lucide-react";
import { ToolSphere } from "../canvas/ToolSphere";
import { flagByCode } from "../Flags";
import { Reveal, Tilt } from "../motion";
import { useI18n } from "@/i18n/LanguageProvider";

const groupDots = ["bg-shu", "bg-ai", "bg-matcha", "bg-kin", "bg-[#d9738a]"];

export function Toolkit() {
  const { t } = useI18n();
  const k = t.toolkit;
  return (
    <section id="toolkit" className="tex tex-washi relative overflow-hidden bg-[#fdf4f2] py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_1fr]">
          {/* Marumado window holding the canvas sphere */}
          <Reveal variant="scale" className="relative mx-auto aspect-square w-full max-w-[600px]">
            <div aria-hidden className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-shu/30" />
            <div className="absolute inset-4 rounded-full bg-paper shadow-float ring-1 ring-sumi/5 sm:inset-6" />
            <div aria-hidden className="absolute inset-[13%] rounded-full border border-sumi/6" />
            <ToolSphere groups={k.groups} className="absolute inset-4 size-[calc(100%-2rem)] rounded-full sm:inset-6 sm:size-[calc(100%-3rem)]" />
            <span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-sumi px-4 py-2 text-sm font-semibold text-paper shadow-lift">
              <Hand className="size-4.5" strokeWidth={2} /> {k.sphereHint}
            </span>
          </Reveal>

          <div>
            <Reveal variant="up">
              <p className="text-sm font-bold tracking-[0.3em] text-shu uppercase">{k.eyebrow}</p>
              <h2 className="mt-3 font-display text-[clamp(2.5rem,5vw,4.6rem)] leading-[1.04] font-medium tracking-tight">{k.title}</h2>
              <p className="mt-5 max-w-xl text-xl leading-relaxed text-sumi-soft">{k.body}</p>
            </Reveal>
            <div className="mt-9 space-y-5">
              {k.groups.map((g, i) => (
                <Reveal key={g.name} variant="left" delay={i * 70} className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-5">
                  <span className="flex w-36 shrink-0 items-center gap-2.5 pt-1.5 text-base font-bold text-sumi">
                    <span className={`size-3 rounded-full ${groupDots[i]}`} /> {g.name}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {g.tools.map((tool) => (
                      <span key={tool} className="rounded-full border border-sumi/8 bg-paper px-3.5 py-1.5 text-[0.95rem] font-semibold text-sumi-soft shadow-soft transition hover:-translate-y-0.5 hover:text-sumi">
                        {tool}
                      </span>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-7 md:grid-cols-3">
          {/* Education — diploma roll */}
          <Reveal variant="rise">
            <Tilt max={7} className="relative h-full">
              <div className="relative h-full rounded-[28px] bg-paper p-7 shadow-lift">
                <span aria-hidden className="absolute top-6 -right-3 h-[calc(100%-3rem)] w-6 rounded-full bg-kin-soft shadow-soft ring-1 ring-kin/30" />
                <span className="grid size-16 place-items-center rounded-[20px] bg-ai-soft text-ai"><GraduationCap className="size-8" strokeWidth={1.8} /></span>
                <h3 className="mt-5 text-sm font-bold tracking-[0.25em] text-sumi-mute uppercase">{k.educationTitle}</h3>
                <p className="mt-2 font-display text-2xl leading-snug font-semibold">{k.degree}</p>
                <p className="mt-2 text-lg text-sumi-soft">{k.school}</p>
                <span className="mt-5 inline-block rounded-full bg-kinu px-4 py-1 text-sm font-bold tracking-widest text-sumi-soft">{k.date}</span>
              </div>
            </Tilt>
          </Reveal>

          {/* Certifications — hanko stamps */}
          <Reveal variant="rise" delay={110}>
            <Tilt max={7} className="h-full">
              <div className="h-full rounded-[28px] bg-paper p-7 shadow-lift">
                <span className="grid size-16 place-items-center rounded-[20px] bg-shu-soft text-shu"><BadgeCheck className="size-8" strokeWidth={1.8} /></span>
                <h3 className="mt-5 text-sm font-bold tracking-[0.25em] text-sumi-mute uppercase">{k.certTitle}</h3>
                <ul className="mt-4 space-y-4">
                  {k.certs.map((c) => (
                    <li key={c.name} className="flex items-center gap-4">
                      <span className="grid size-14 shrink-0 rotate-[-8deg] place-items-center rounded-full border-2 border-shu text-center font-display text-sm leading-none font-bold text-shu">{c.year}</span>
                      <span>
                        <span className="block text-[1.05rem] leading-snug font-semibold text-sumi">{c.name}</span>
                        <span className="block text-sm text-sumi-mute">{c.issuer}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Tilt>
          </Reveal>

          {/* Languages — flags */}
          <Reveal variant="rise" delay={220}>
            <Tilt max={7} className="h-full">
              <div className="h-full rounded-[28px] bg-paper p-7 shadow-lift">
                <span className="grid size-16 place-items-center rounded-[20px] bg-matcha-soft text-matcha"><Languages className="size-8" strokeWidth={1.8} /></span>
                <h3 className="mt-5 text-sm font-bold tracking-[0.25em] text-sumi-mute uppercase">{k.languagesTitle}</h3>
                <ul className="mt-4 grid grid-cols-1 gap-3">
                  {k.languages.map((l) => {
                    const F = flagByCode[l.code];
                    return (
                      <li key={l.code} className="flex items-center gap-3.5">
                        <F className="size-10 shrink-0 drop-shadow-sm" />
                        <span className="text-[1.05rem] font-semibold text-sumi">{l.name}</span>
                        {l.level ? <span className="ml-auto rounded-full bg-kinu px-3 py-0.5 text-sm font-semibold text-sumi-soft">{l.level}</span> : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Tilt>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
