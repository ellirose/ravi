"use client";

import Image from "next/image";
import { Clapperboard, Film, Layers, Pause, Play, Smartphone, WandSparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoopVideo, Timecode, type LoopVideoHandle } from "../LoopVideo";
import { Reveal, Tilt } from "../motion";
import { useI18n } from "@/i18n/LanguageProvider";

const serviceIcons = [Clapperboard, Film, WandSparkles, Layers, Smartphone];
const serviceTones = ["text-shu bg-shu-soft", "text-ai bg-ai-soft", "text-matcha bg-matcha-soft", "text-kin bg-kin-soft", "text-[#d9738a] bg-sakura-soft"];

export function Motion() {
  const { t } = useI18n();
  const m = t.motion;
  const player = useRef<LoopVideoHandle>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(false);
  const onPlayingChange = useCallback((p: boolean) => setPlaying(p), []);

  // Custom progress bar (no native controls)
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (bar.current && player.current) bar.current.style.transform = `scaleX(${player.current.progress()})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    player.current?.seek((e.clientX - r.left) / r.width);
  };

  return (
    <section id="motion" className="tex tex-washi relative overflow-hidden bg-paper py-24 sm:py-32">
      <span aria-hidden className="tategaki pointer-events-none absolute top-16 right-4 font-jp text-[clamp(4rem,9vw,8rem)] leading-none text-sumi/[0.05] select-none">映像</span>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-16 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div>
          <Reveal variant="up">
            <p className="text-sm font-bold tracking-[0.3em] text-shu uppercase">{m.eyebrow}</p>
            <h2 className="mt-3 font-display text-[clamp(2.5rem,5vw,4.6rem)] leading-[1.04] font-medium tracking-tight">{m.title}</h2>
            <p className="mt-6 max-w-xl text-xl leading-relaxed text-sumi-soft">{m.body}</p>
          </Reveal>
          <ul className="mt-10 space-y-3">
            {m.services.map((s, i) => {
              const Icon = serviceIcons[i];
              return (
                <Reveal as="li" key={s} variant="left" delay={i * 80}>
                  <div className="group flex items-center gap-5 rounded-[22px] border border-sumi/6 bg-paper/80 p-3 pr-6 shadow-soft transition duration-500 hover:translate-x-2 hover:shadow-lift">
                    <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${serviceTones[i]} transition-transform duration-500 group-hover:rotate-[-8deg]`}>
                      <Icon className="size-7" strokeWidth={1.8} />
                    </span>
                    <span className="text-xl font-semibold text-sumi">{s}</span>
                    <span className="ml-auto font-jp text-sm text-sumi-mute tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>

        {/* Film-frame player with a layered collage: ink loop (top-right), stamp portrait (bottom-right), stat (below) */}
        <Reveal variant="shoji" className="relative pt-10 pb-32 sm:pb-28">
          <Tilt max={4} className="relative">
            <div className="rounded-[34px] bg-sumi p-3 shadow-float sm:p-4">
              <div className="film-holes-x mx-6 h-4 opacity-60" aria-hidden />
              <div className="relative my-2 aspect-video overflow-hidden rounded-[22px] bg-ai-soft">
                <LoopVideo ref={player} src="/media/video/tokyo-motion.mp4" poster="/media/images/tokyo-city.jpg" posterSizes="(min-width: 1024px) 50vw, 100vw" onPlayingChange={onPlayingChange} />
                {/* frame guides sit beneath the HUD */}
                <div aria-hidden className="pointer-events-none absolute inset-[11%] rounded-lg border border-paper/35" />
                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-2 rounded-full bg-sumi/70 px-3.5 py-1.5 text-xs font-bold tracking-wider text-paper backdrop-blur">
                    <span className="animate-blink size-2 rounded-full bg-shu" /> REC <Timecode className="font-mono text-paper/80" />
                  </span>
                  <span className="hidden rounded-full bg-paper/85 px-3.5 py-1.5 text-xs font-bold tracking-[0.2em] text-sumi uppercase backdrop-blur sm:inline">{m.reel}</span>
                </div>
                <div className="absolute bottom-4 left-4 right-[36%] flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => (playing ? player.current?.pause() : player.current?.play())}
                    aria-label={playing ? m.pause : m.play}
                    className="grid size-14 shrink-0 place-items-center rounded-full bg-shu text-white shadow-lift transition hover:scale-105 hover:bg-shu-deep"
                  >
                    {playing ? <Pause className="size-6" fill="currentColor" /> : <Play className="size-6 translate-x-0.5" fill="currentColor" />}
                  </button>
                  <div onClick={seek} className="relative h-2.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-paper/35 backdrop-blur" role="presentation">
                    <span ref={bar} className="absolute inset-0 origin-left scale-x-0 rounded-full bg-paper" />
                  </div>
                </div>
              </div>
              <div className="film-holes-x mx-6 h-4 opacity-60" aria-hidden />
            </div>
          </Tilt>

          {/* Ink loop in a round window */}
          <div className="absolute top-0 -right-2 z-10 size-24 overflow-hidden rounded-full shadow-float ring-8 ring-paper sm:-right-5 sm:size-32">
            <LoopVideo src="/media/video/ink-motion.mp4" />
          </div>

          {/* Postage-stamp portrait */}
          <div className="absolute right-[2%] bottom-0 z-10 w-[34%] max-w-[210px] rotate-[6deg] transition-transform duration-700 hover:rotate-0">
            <div className="shape-shadow">
              <div className="shape-stamp bg-paper p-[18px]">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image src="/profile/ravi-05.png" alt="Ravi with a camera and a drone" fill sizes="210px" className="object-cover object-[50%_22%]" />
                </div>
                <p className="mt-2 flex items-center justify-between font-jp text-sm text-sumi-soft"><span>映像</span><span className="text-shu">¥100</span></p>
              </div>
            </div>
          </div>

          {/* Stat beneath the player */}
          <div className="absolute bottom-2 left-2 flex items-end gap-4">
            <span className="font-display text-[clamp(3rem,5vw,4.25rem)] leading-none font-semibold text-sumi">{m.stat}</span>
            <span className="mb-1.5 max-w-[11rem] text-sm leading-snug font-semibold text-sumi-soft">{m.statLabel}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
