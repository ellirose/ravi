"use client";

import Image from "next/image";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isVertical, reelFrames, reelPoster, reelSrc, showreel, timecode, type Reel } from "@/data/reels";
import { useI18n } from "@/i18n/LanguageProvider";
import { Tilt } from "../motion";
import { reelStyle } from "./reelStyle";

const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function isSlowConnection() {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !!conn && (conn.saveData === true || /(^|-)2g$|^3g$/.test(conn.effectiveType ?? ""));
}

const list = showreel;
const starts = list.reduce<number[]>((acc, r, i) => (acc.push(i ? acc[i - 1] + list[i - 1].d : 0), acc), []);
const total = starts[list.length - 1] + list[list.length - 1].d;

type Deck = { slots: (Reel | null)[]; front: number; index: number; armed: boolean };
/** Put spot i on air: if the visible slot doesn't hold it, load it into the hidden one. */
function request(d: Deck, i: number): Deck {
  const r = list[i];
  if (!d.armed || d.slots[d.front]?.id === r.id || d.slots[1 - d.front]?.id === r.id) return { ...d, index: i };
  const slots = [...d.slots];
  slots[1 - d.front] = r;
  return { ...d, slots, index: i };
}
const arm = (d: Deck): Deck => (d.armed ? d : request({ ...d, armed: true }, d.index));

/**
 * The screening room: every spot plays back-to-back as one showreel. Two
 * <video> slots alternate — the next spot buffers in the hidden slot while the
 * current one plays, then the cut is a short dissolve. Below sits an edit
 * timeline (V1 thumbnails + an industry track) with a live playhead; clicking a
 * clip cuts to it at that point.
 */
export function ReelStage() {
  const { t, locale } = useI18n();
  const s = t.studio;
  const stage = useRef<HTMLDivElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([null, null]);
  // slots: which spot each <video> holds; front: the visible slot; index: the spot on air
  const [deck, setDeck] = useState<Deck>({ slots: [null, null], front: 0, index: 0, armed: false });
  const { slots, front, index, armed } = deck;
  const [playing, setPlaying] = useState(false);
  const wantPlay = useRef(true); // user intent; false after an explicit pause or with reduced motion
  const visible = useRef(false);
  const pendingSeek = useRef(0);
  const playhead = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  const cur = list[index];
  const next = list[(index + 1) % list.length];
  const video = (k: number) => vids.current[k];

  /* Arm once the page has loaded and the stage is on screen. */
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (prefersReduced()) wantPlay.current = false;
    const slow = isSlowConnection();
    let loaded = document.readyState === "complete";
    const tryArm = () => { if (loaded && visible.current && !slow) setDeck((d) => arm(d)); };
    const onLoad = () => { loaded = true; tryArm(); };
    if (!loaded) window.addEventListener("load", onLoad, { once: true });
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      const v = vids.current[front];
      if (!e.isIntersecting) v?.pause();
      else {
        tryArm();
        if (v?.currentSrc && wantPlay.current) v.play().catch(() => {});
      }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => { io.disconnect(); window.removeEventListener("load", onLoad); };
  }, [front]);

  /* Cut to the requested spot once its slot can play (a short dissolve). */
  useEffect(() => {
    if (!armed || slots[front]?.id === cur.id) return;
    const back = 1 - front;
    const v = vids.current[back];
    if (!v || slots[back]?.id !== cur.id) return;
    let raf = 0;
    const cut = () => {
      if (pendingSeek.current && v.duration) v.currentTime = pendingSeek.current * v.duration;
      pendingSeek.current = 0;
      vids.current[front]?.pause();
      setDeck((d) => (d.slots[back]?.id === cur.id ? { ...d, front: back } : d));
      if (wantPlay.current && visible.current) v.play().catch(() => {});
    };
    if (v.readyState >= 3) raf = requestAnimationFrame(cut);
    else v.addEventListener("canplay", cut, { once: true });
    return () => { cancelAnimationFrame(raf); v.removeEventListener("canplay", cut); };
  }, [armed, cur, slots, front]);

  /* After a cut has settled, buffer the following spot in the hidden slot. */
  useEffect(() => {
    if (!armed || slots[front]?.id !== cur.id) return;
    const back = 1 - front;
    if (slots[back]?.id === next.id) return;
    const id = window.setTimeout(() => setDeck((d) => {
      if (d.slots[d.front]?.id !== cur.id) return d;
      const c = [...d.slots];
      c[1 - d.front] = next;
      return { ...d, slots: c };
    }), 900);
    return () => window.clearTimeout(id);
  }, [armed, slots, front, cur, next]);

  const go = useCallback((n: number) => setDeck((d) => request(d, (d.index + n + list.length) % list.length)), []);

  /* Playhead + clock follow the front slot. */
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = vids.current[front];
      const local = v && slots[front]?.id === cur.id && isFinite(v.currentTime) ? Math.min(cur.d, v.currentTime) : 0;
      const g = starts[index] + local;
      if (playhead.current) playhead.current.style.left = `${(g / total) * 100}%`;
      if (clock.current) clock.current.textContent = timecode(g);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [front, index, slots, cur]);

  /* Play state: listen on both slots (a cut can start playback before React re-renders). */
  const frontRef = useRef(0);
  useEffect(() => { frontRef.current = front; }, [front]);
  useEffect(() => {
    const els = vids.current.filter(Boolean) as HTMLVideoElement[];
    const sync = () => setPlaying(els.some((v) => !v.paused && !v.ended));
    const ended = (e: Event) => { if (e.target === vids.current[frontRef.current]) go(1); };
    els.forEach((v) => {
      v.addEventListener("play", sync);
      v.addEventListener("pause", sync);
      v.addEventListener("ended", ended);
    });
    return () => els.forEach((v) => {
      v.removeEventListener("play", sync);
      v.removeEventListener("pause", sync);
      v.removeEventListener("ended", ended);
    });
  }, [go]);

  /* Keep the active clip centred in the (scrollable, on small screens) timeline. */
  useEffect(() => {
    const r = rail.current;
    const clip = r?.querySelector<HTMLElement>(`[data-clip="${index}"]`);
    if (!r || !clip || r.scrollWidth <= r.clientWidth) return;
    r.scrollTo({ left: clip.offsetLeft - (r.clientWidth - clip.offsetWidth) / 2, behavior: "smooth" });
  }, [index]);

  const toggle = () => {
    const v = video(front);
    if (playing) { wantPlay.current = false; v?.pause(); return; }
    wantPlay.current = true;
    if (!armed) setDeck((d) => arm(d)); // explicit play arms even on slow links
    else v?.play().catch(() => {});
  };
  const jump = (i: number, frac = 0) => {
    wantPlay.current = true;
    if (i === index && slots[front]?.id === cur.id) {
      const v = video(front);
      if (v?.duration) v.currentTime = frac * v.duration;
      v?.play().catch(() => {});
      return;
    }
    pendingSeek.current = frac;
    setDeck((d) => request(arm(d), i));
  };

  const ticks = useMemo(() => Array.from({ length: Math.floor(total / 5) + 1 }, (_, k) => k * 5), []);
  const st = reelStyle[cur.cat];

  return (
    // the screen and its timeline fit one viewport
    <div ref={stage} className="mx-auto" style={{ maxWidth: "max(36rem, calc((100svh - 19rem) * 16 / 9))" }}>
      <Tilt max={3} className="relative">
        <div className="rounded-[34px] bg-sumi p-2.5 shadow-float sm:p-3.5">
          <div className="relative aspect-video overflow-hidden rounded-[24px] bg-[#1b1f2c]">
            {/* blurred backdrop for vertical spots, so 9:16 sits in a lit field */}
            <Image key={`bg-${cur.id}`} src={reelPoster(cur)} alt="" aria-hidden fill sizes="40vw" className={`scale-125 object-cover blur-2xl transition-opacity duration-700 ${isVertical(cur) ? "opacity-60" : "opacity-0"}`} />
            {/* poster holds the frame until the spot can play */}
            <Image
              key={`p-${cur.id}`}
              src={reelPoster(cur)}
              alt={cur.title[locale]}
              fill
              sizes="(min-width: 1024px) 70vw, 100vw"
              className={isVertical(cur) ? "object-contain" : "object-cover"}
              style={{ objectPosition: cur.focus }}
            />
            {[0, 1].map((k) => {
              const r = slots[k];
              return (
                <video
                  key={k}
                  ref={(el) => { vids.current[k] = el; }}
                  src={r ? reelSrc(r) : undefined}
                  muted
                  playsInline
                  preload="auto"
                  aria-hidden
                  className={`absolute inset-0 size-full transition-opacity duration-500 ${r && isVertical(r) ? "object-contain" : "object-cover"} ${k === front && r?.id === cur.id ? "opacity-100" : "opacity-0"}`}
                />
              );
            })}

            {/* HUD */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-sumi/55 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-sumi/75 to-transparent" />
            <div className="absolute top-4 left-4 flex items-center gap-2 sm:top-5 sm:left-5">
              <span className="flex items-center gap-2 rounded-full bg-sumi/70 px-3.5 py-1.5 text-xs font-bold tracking-wider text-paper backdrop-blur">
                <span className={`size-2 rounded-full bg-shu ${playing ? "animate-blink" : ""}`} />
                <span className="hidden uppercase sm:inline">{s.screening}</span>
                <span className="tabular-nums">{String(index + 1).padStart(2, "0")}/{String(list.length).padStart(2, "0")}</span>
              </span>
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${st.chip}`}>
                <st.Icon className="size-3.5" strokeWidth={2.4} />
                {s.filters[cur.cat]}
              </span>
            </div>
            <span ref={clock} className="absolute top-4 right-4 hidden rounded-full sm:block bg-sumi/70 px-3.5 py-1.5 font-mono text-xs font-bold text-paper tabular-nums backdrop-blur sm:top-5 sm:right-5">00:00:00:00</span>

            <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 sm:inset-x-6 sm:bottom-6">
              <div key={cur.id} className="min-w-0 animate-fade-up">
                <p className="font-jp text-sm text-paper/70">{st.kanji} · {cur.d.toFixed(0)}{s.seconds} · {isVertical(cur) ? s.vertical : s.wide}</p>
                <p className="truncate font-display text-[clamp(1.35rem,3vw,2.4rem)] leading-tight font-semibold text-paper">{cur.title[locale]}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => jump((index - 1 + list.length) % list.length)} aria-label={s.prev} className="hidden size-11 place-items-center rounded-full bg-paper/15 text-paper backdrop-blur transition hover:bg-paper/30 sm:grid">
                  <SkipBack className="size-5" fill="currentColor" />
                </button>
                <button type="button" onClick={toggle} aria-label={playing ? s.pause : s.play} className="grid size-14 place-items-center rounded-full bg-shu text-white shadow-lift transition hover:scale-105 hover:bg-shu-deep">
                  {playing ? <Pause className="size-6" fill="currentColor" /> : <Play className="size-6 translate-x-0.5" fill="currentColor" />}
                </button>
                <button type="button" onClick={() => jump((index + 1) % list.length)} aria-label={s.next} className="grid size-11 place-items-center rounded-full bg-paper/15 text-paper backdrop-blur transition hover:bg-paper/30">
                  <SkipForward className="size-5" fill="currentColor" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Tilt>

      {/* Edit timeline */}
      <div className="mt-6 rounded-[26px] border border-sumi/8 bg-paper/85 p-3 shadow-lift backdrop-blur sm:p-4">
        <div className="mb-2 flex items-center justify-between px-1 text-xs font-bold tracking-[0.2em] text-sumi-mute uppercase">
          <span>{s.timeline}</span>
          <span className="font-mono tracking-normal tabular-nums">{timecode(total)}</span>
        </div>
        <div ref={rail} className="no-scrollbar overflow-x-auto">
          <div className="relative min-w-[1100px] select-none">
            {/* ruler */}
            <div className="relative ml-10 h-6 border-b border-sumi/10">
              {ticks.map((sec) => (
                <span key={sec} className="absolute bottom-0 h-2 w-px bg-sumi/25" style={{ left: `${(sec / total) * 100}%`, height: sec % 30 === 0 ? 10 : 5 }}>
                  {sec % 30 === 0 ? <span className="absolute -top-4 left-1 font-mono text-[10px] whitespace-nowrap text-sumi-mute">{timecode(sec).slice(3, 8)}</span> : null}
                </span>
              ))}
            </div>
            {/* V1: clip thumbnails */}
            <div className="mt-2 flex items-center">
              <span className="w-10 shrink-0 font-mono text-xs font-bold text-sumi-mute">V1</span>
              <div className="flex flex-1 gap-[3px]">
                {list.map((r, i) => {
                  const on = i === index;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      data-clip={i}
                      onClick={(e) => {
                        const b = e.currentTarget.getBoundingClientRect();
                        jump(i, Math.min(0.95, Math.max(0, (e.clientX - b.left) / b.width)));
                      }}
                      aria-label={`${s.clip} ${i + 1}: ${r.title[locale]}`}
                      aria-current={on}
                      title={r.title[locale]}
                      className={`group relative h-14 overflow-hidden rounded-md transition duration-300 sm:h-16 ${on ? "ring-2 ring-shu ring-offset-2 ring-offset-paper" : "opacity-70 hover:opacity-100"}`}
                      style={{ flex: `${r.d} 1 0` }}
                    >
                      <span className="absolute inset-0 flex">
                        {reelFrames(r).slice(0, r.d >= 8 ? 4 : r.d >= 5 ? 3 : 2).map((f) => (
                          <span key={f} className="relative h-full flex-1">
                            <Image src={f} alt="" fill sizes="80px" className="object-cover" />
                          </span>
                        ))}
                      </span>
                      <span className="absolute inset-x-0 top-0 h-1" style={{ background: reelStyle[r.cat].clip }} />
                      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-sumi/80 to-transparent px-1.5 pt-3 pb-1 text-left text-[10px] font-semibold text-paper">{r.title[locale]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* industry track */}
            <div className="mt-[3px] flex items-center">
              <span className="w-10 shrink-0 font-mono text-xs font-bold text-sumi-mute">IND</span>
              <div className="flex flex-1 gap-[3px]">
                {list.map((r, i) => (
                  <span key={r.id} className={`flex h-5 items-center justify-center rounded-[4px] font-jp text-[11px] text-white transition-opacity ${i === index ? "opacity-100" : "opacity-55"}`} style={{ flex: `${r.d} 1 0`, background: reelStyle[r.cat].clip }}>
                    {reelStyle[r.cat].kanji}
                  </span>
                ))}
              </div>
            </div>
            {/* playhead */}
            <div className="pointer-events-none absolute top-0 bottom-0 left-10 right-0">
              <div ref={playhead} className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-shu" style={{ left: 0 }}>
                <span className="absolute -top-1 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-shu" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
