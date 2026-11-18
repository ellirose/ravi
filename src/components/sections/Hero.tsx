"use client";

import Image from "next/image";
import { ArrowDown, ArrowRight, Clapperboard, CodeXml, Palette, Play } from "lucide-react";
import { SakuraCanvas } from "../canvas/SakuraCanvas";
import { LoopVideo, Timecode } from "../LoopVideo";
import { Reveal, Tilt } from "../motion";
import { useI18n } from "@/i18n/LanguageProvider";
import { reelWorks } from "@/data/works";

const disciplineIcons = [
  { Icon: Palette, tone: "bg-shu-soft text-shu" },
  { Icon: Clapperboard, tone: "bg-ai-soft text-ai" },
  { Icon: CodeXml, tone: "bg-matcha-soft text-matcha" },
];

/** Stylised Mt. Fuji + ridges — flat fills, no gradients. */
function Mountains({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 360" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <path d="M0 300 C180 250 300 270 420 240 S700 230 820 262 1100 220 1250 250 1500 238 1600 250V360H0Z" fill="#e7eef7" />
      <path d="M520 360 L840 92 Q868 70 896 92 L1240 360Z" fill="#dce8f2" />
      <path d="M790 134 L840 92 Q868 70 896 92 L946 134 L920 128 L898 146 L872 126 L850 146 L826 128Z" fill="#fffdf9" />
      <path d="M0 330 C200 300 360 320 520 300 S860 300 1000 318 1300 296 1600 312V360H0Z" fill="#f3ede2" />
    </svg>
  );
}

function FilmReel() {
  const items = [...reelWorks, ...reelWorks];
  return (
    <div className="pointer-events-none absolute top-0 right-3 bottom-0 hidden w-[118px] overflow-hidden 2xl:block" aria-hidden>
      <div className="absolute inset-y-0 left-0 w-full rounded-[22px] bg-sumi/90 shadow-float" />
      <div className="film-holes absolute inset-y-0 left-1.5 w-3 opacity-80" />
      <div className="film-holes absolute inset-y-0 right-1.5 w-3 opacity-80" />
      <div className="animate-reel absolute inset-x-5 top-0 flex flex-col gap-3 py-3">
        {items.map((w, i) => (
          <div key={`${w.id}-${i}`} className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-paper/10">
            <Image src={w.src} alt="" fill sizes="80px" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const { t } = useI18n();
  const h = t.hero;

  return (
    <section id="home" className="tex tex-washi grain relative isolate flex min-h-svh flex-col overflow-hidden bg-washi lg:h-svh lg:min-h-[680px]">
      {/* Background composition */}
      <Mountains className="absolute inset-x-0 bottom-0 -z-10 h-[34%] w-full" />
      <div aria-hidden className="absolute top-[9%] right-[16%] -z-10 hidden aspect-square w-[min(30vw,46vh)] rounded-full bg-shu shadow-[0_40px_80px_-30px_rgb(224_74_60/0.55)] lg:block" />
      <div aria-hidden className="absolute top-[6%] right-[13.5%] -z-10 hidden aspect-square w-[min(35vw,54vh)] rounded-full border-[1.5px] border-shu/35 lg:block" />

      <div className="relative mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 items-center gap-5 px-5 pt-24 pb-8 sm:gap-8 sm:px-8 sm:pt-28 sm:pb-14 lg:grid-cols-[1.08fr_1fr] lg:gap-6 lg:pt-24 lg:pb-10 2xl:pr-36">
        {/* ── Copy ── */}
        <div className="relative z-30 order-2 lg:order-1">
          <Reveal variant="fade" className="mb-4 inline-flex items-center gap-3 rounded-full border border-sumi/10 bg-paper/80 py-1.5 pr-4 pl-1.5 shadow-soft backdrop-blur">
            <span className="grid size-8 place-items-center rounded-full bg-shu font-jp text-sm font-bold text-white">創</span>
            <span className="text-sm font-semibold tracking-[0.14em] text-sumi-soft uppercase">{h.kicker}</span>
          </Reveal>

          <h1 className="font-display text-[clamp(2.7rem,min(5.4vw,9.4vh),6rem)] leading-[1.02] font-medium tracking-[-0.025em] text-sumi">
            <Reveal as="span" variant="up" className="block">{h.titleA}</Reveal>
            <Reveal as="span" variant="up" delay={90} className="block">
              <span className="brush-underline text-shu italic">{h.titleHighlight}</span>
            </Reveal>
            <Reveal as="span" variant="up" delay={180} className="block text-[0.62em] leading-[1.15] text-sumi-soft">{h.titleB}</Reveal>
          </h1>

          <Reveal variant="up" delay={260}>
            <p className="mt-5 hidden max-w-xl text-[clamp(1.05rem,min(1.35vw,2.3vh),1.3rem)] sm:block leading-relaxed text-sumi-soft">{h.lead}</p>
          </Reveal>

          <Reveal variant="up" delay={340} className="mt-6 flex flex-wrap items-center gap-2.5 sm:mt-7 sm:gap-3">
            <a href="#works" className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-shu pr-1.5 pl-5 text-base font-semibold sm:h-14 sm:gap-3 sm:pr-2 sm:pl-7 sm:text-lg text-white shadow-[0_18px_30px_-12px_rgb(224_74_60/0.6)] transition hover:-translate-y-0.5 hover:bg-shu-deep">
              {h.ctaWorks}
              <span className="grid size-9 place-items-center rounded-full bg-white/20 transition-transform duration-500 group-hover:translate-x-1 sm:size-10">
                <ArrowRight className="size-5" strokeWidth={2.5} />
              </span>
            </a>
            <a href="#about" className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-sumi/12 bg-paper/70 px-5 text-base font-semibold sm:h-14 sm:px-7 sm:text-lg text-sumi backdrop-blur transition hover:border-sumi/30 hover:bg-paper">
              {h.ctaAbout}
            </a>
          </Reveal>

          {/* Discipline icons — large and prominent */}
          <div className="mt-[clamp(1.25rem,4vh,2.75rem)] grid max-w-xl grid-cols-3 gap-3 sm:gap-4">
            {h.disciplines.map((label, i) => {
              const { Icon, tone } = disciplineIcons[i];
              return (
                <Reveal key={label} variant="rise" delay={420 + i * 90}>
                  <Tilt max={12} className="group flex flex-col items-start gap-3 rounded-[26px] border border-sumi/6 bg-paper/85 p-3.5 shadow-soft backdrop-blur sm:p-4">
                    <span className={`depth-1 grid size-[clamp(3.25rem,min(5vw,8vh),4.5rem)] place-items-center rounded-[20px] ${tone} transition-transform duration-500 group-hover:scale-110`}>
                      <Icon className="size-[55%]" strokeWidth={1.75} />
                    </span>
                    <span className="text-[0.95rem] leading-tight font-bold text-sumi sm:text-base">{label}</span>
                  </Tilt>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* ── Visual composition ── */}
        <div className="relative order-1 mx-auto h-[min(31svh,420px)] w-full max-w-[560px] sm:h-[min(46svh,460px)] lg:order-2 lg:h-[min(78vh,760px)] lg:max-w-none">
          {/* Katōmado window with portrait */}
          <Reveal variant="shoji" className="absolute top-0 right-[6%] bottom-[4%] w-[66%] lg:right-[12%] lg:w-[60%]">
            <div className="shape-katomado relative size-full overflow-hidden bg-[#e9e9ea] shadow-float ring-[10px] ring-paper">
              <Image
                src="/profile/ravi-03.png"
                alt="Ravi Y.T. holding a camera"
                fill
                preload
                sizes="(min-width: 1024px) 34vw, 70vw"
                className="scale-[1.12] object-cover object-[50%_30%]"
              />
            </div>
            <div aria-hidden className="shape-katomado absolute -inset-5 -z-10 border-[1.5px] border-sumi/15" />
          </Reveal>

          {/* Vertical Japanese — design · film · development */}
          <span aria-hidden className="tategaki absolute top-[6%] left-[2%] hidden font-jp text-xl font-bold text-sumi/70 lg:block">デザイン・映像・開発</span>

          {/* Marumado round window with sakura loop video */}
          <Reveal variant="scale" delay={250} className="absolute bottom-[1%] left-[4%] z-20 aspect-square w-[38%] lg:left-[0%] lg:w-[36%]">
            <div className="relative size-full overflow-hidden rounded-full bg-sakura-soft shadow-float ring-8 ring-paper">
              <LoopVideo src="/media/video/hero-sakura.mp4" poster="/media/images/sakura-branch.jpg" posterSizes="(min-width: 1024px) 20vw, 40vw" />
            </div>
            <span className="absolute -top-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-sumi px-3.5 py-1.5 text-xs font-bold tracking-wider text-paper shadow-lift">
              <span className="animate-blink size-2 rounded-full bg-shu" />
              {h.rec}
              <Timecode className="font-mono text-paper/80" />
            </span>
          </Reveal>

          {/* Floating stat chips — layered above the window */}
          <Reveal variant="right" delay={420} className="absolute top-[12%] left-[10%] z-20 hidden sm:block lg:left-[6%]">
            <div className="animate-float rounded-[22px] border border-sumi/6 bg-paper/92 px-5 py-3.5 shadow-lift backdrop-blur">
              <div className="font-display text-4xl leading-none font-semibold text-sumi">10<span className="text-shu">+</span></div>
              <div className="mt-1 text-sm font-semibold text-sumi-soft">{h.years}</div>
            </div>
          </Reveal>
          <Reveal variant="left" delay={520} className="absolute right-0 bottom-[22%] z-20 lg:right-[2%]">
            <div className="animate-float flex items-center gap-3 rounded-full border border-sumi/6 bg-paper/92 py-2 pr-5 pl-2 shadow-lift backdrop-blur [animation-delay:-3s]">
              <span className="grid size-11 place-items-center rounded-full bg-ai text-white">
                <Play className="size-5 translate-x-px" fill="currentColor" />
              </span>
              <span>
                <span className="block font-display text-2xl leading-none font-semibold">100+</span>
                <span className="block text-xs font-semibold text-sumi-soft">{h.edits}</span>
              </span>
            </div>
          </Reveal>
          <Reveal variant="left" delay={620} className="absolute top-[4%] right-0 z-20 hidden lg:block">
            <div className="animate-float rounded-[22px] border border-sumi/6 bg-paper/92 px-4 py-3 shadow-lift backdrop-blur [animation-delay:-5s]">
              <span className="block font-display text-2xl leading-none font-semibold">20<span className="text-matcha">+</span></span>
              <span className="block text-xs font-semibold text-sumi-soft">{h.pages}</span>
            </div>
          </Reveal>
        </div>
      </div>

      <FilmReel />

      <a href="#impact" className="group absolute bottom-5 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs font-bold tracking-[0.3em] text-sumi-soft uppercase lg:flex">
        {h.scroll}
        <span className="grid size-10 place-items-center rounded-full border border-sumi/15 bg-paper/70 transition group-hover:translate-y-1 group-hover:border-shu group-hover:text-shu">
          <ArrowDown className="size-4" strokeWidth={2.5} />
        </span>
      </a>

      <SakuraCanvas className="absolute inset-0 z-40 size-full" />
    </section>
  );
}
