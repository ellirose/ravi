"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { LanguageFlags, LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "@/i18n/LanguageProvider";

export const sectionIds = ["about", "collection", "works", "motion", "experience", "toolkit"] as const;
const kanjiNumerals = ["一", "二", "三", "四", "五", "六"];

export function Header() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const progress = useRef<HTMLSpanElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });

  const labels: Record<(typeof sectionIds)[number], string> = {
    about: t.nav.about,
    collection: t.nav.collection,
    works: t.nav.works,
    motion: t.nav.motion,
    experience: t.nav.experience,
    toolkit: t.nav.toolkit,
  };

  // Scroll state + progress thread
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 24);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (progress.current) progress.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section tracking
  useEffect(() => {
    const els = sectionIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const hero = document.getElementById("home");
    const heroIo = new IntersectionObserver(([e]) => e.isIntersecting && setActive(""), { rootMargin: "-45% 0px -50% 0px" });
    if (hero) heroIo.observe(hero);
    return () => { io.disconnect(); heroIo.disconnect(); };
  }, []);

  // Sliding indicator under the active link
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const link = nav.querySelector<HTMLAnchorElement>(`a[data-id="${active}"]`);
    if (!link) { setIndicator((s) => ({ ...s, visible: false })); return; }
    setIndicator({ left: link.offsetLeft, width: link.offsetWidth, visible: true });
  }, [active, t]);

  // Lock scroll + Escape for the mobile menu
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
        <div
          className={`pointer-events-auto relative mx-auto flex max-w-[1400px] items-center justify-between gap-4 overflow-visible rounded-[28px] border transition-all duration-500 ease-[var(--ease-silk)] ${
            scrolled
              ? "border-sumi/8 bg-paper/85 px-3 py-2 shadow-lift backdrop-blur-xl sm:px-4"
              : "border-transparent bg-paper/40 px-3 py-3 backdrop-blur-md sm:px-5"
          }`}
        >
          <a href="#home" aria-label="Ravi Y.T. — home" className="min-w-0 rounded-2xl">
            <Logo />
          </a>

          <nav aria-label="Primary" className="hidden xl:block">
            <div ref={navRef} className="relative flex items-center gap-1 rounded-full bg-kinu/70 p-1.5">
              <span
                aria-hidden
                className="absolute top-1.5 bottom-1.5 rounded-full bg-paper shadow-soft transition-all duration-500 ease-[var(--ease-silk)]"
                style={{ left: indicator.left, width: indicator.width, opacity: indicator.visible ? 1 : 0 }}
              />
              {sectionIds.map((id) => (
                <a
                  key={id}
                  data-id={id}
                  href={`#${id}`}
                  aria-current={active === id ? "true" : undefined}
                  className={`relative z-10 rounded-full px-4 py-2 text-[0.98rem] font-semibold transition-colors ${
                    active === id ? "text-shu" : "text-sumi-soft hover:text-sumi"
                  }`}
                >
                  {labels[id]}
                </a>
              ))}
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <a
              href="#works"
              className="group hidden h-12 items-center gap-2 rounded-full bg-sumi pl-5 pr-2 text-[0.95rem] font-semibold text-paper shadow-lift transition hover:bg-shu md:flex"
            >
              {t.nav.cta}
              <span className="grid size-8 place-items-center rounded-full bg-paper/15 transition-transform duration-500 group-hover:rotate-45">
                <ArrowUpRight className="size-4.5" strokeWidth={2.5} />
              </span>
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t.nav.menu}
              aria-expanded={open}
              className="group grid size-12 place-items-center rounded-full bg-shu text-white shadow-lift transition hover:bg-shu-deep xl:hidden"
            >
              <span className="flex w-5 flex-col gap-1.5">
                <span className="h-0.5 w-full rounded bg-current transition-all group-hover:w-3/4" />
                <span className="h-0.5 w-3/4 self-end rounded bg-current transition-all group-hover:w-full" />
              </span>
            </button>
          </div>

          {/* Red-thread scroll progress */}
          <span aria-hidden className="absolute inset-x-6 -bottom-px h-[2.5px] overflow-hidden rounded-full">
            <span ref={progress} className="block h-full origin-left scale-x-0 rounded-full bg-shu" />
          </span>
        </div>
      </header>

      {/* Mobile / tablet menu — two shoji panels slide together */}
      <div
        className={`fixed inset-0 z-[60] xl:hidden ${open ? "visible" : "invisible delay-700"}`}
        role="dialog"
        aria-modal="true"
        aria-label={t.nav.menu}
      >
        <div
          className={`tex tex-washi absolute inset-y-0 left-0 w-1/2 bg-paper transition-transform duration-700 ease-[var(--ease-silk)] ${open ? "translate-x-0" : "-translate-x-full"}`}
          style={{ backgroundImage: "linear-gradient(rgb(193 154 78 / .14) 1.5px, transparent 1.5px), linear-gradient(90deg, rgb(193 154 78 / .14) 1.5px, transparent 1.5px)", backgroundSize: "64px 84px" }}
        />
        <div
          className={`tex tex-washi absolute inset-y-0 right-0 w-1/2 bg-paper transition-transform duration-700 ease-[var(--ease-silk)] ${open ? "translate-x-0" : "translate-x-full"}`}
          style={{ backgroundImage: "linear-gradient(rgb(193 154 78 / .14) 1.5px, transparent 1.5px), linear-gradient(90deg, rgb(193 154 78 / .14) 1.5px, transparent 1.5px)", backgroundSize: "64px 84px" }}
        />
        <div className={`relative flex h-full flex-col px-6 pt-6 pb-8 transition-opacity duration-500 sm:px-10 ${open ? "opacity-100 delay-300" : "opacity-0"}`}>
          <div className="flex items-center justify-between">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.nav.close}
              className="grid size-12 place-items-center rounded-full bg-sumi text-paper shadow-lift transition hover:rotate-90 hover:bg-shu"
            >
              <span className="relative block size-5">
                <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rotate-45 rounded bg-current" />
                <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 -rotate-45 rounded bg-current" />
              </span>
            </button>
          </div>
          <nav aria-label="Mobile" className="mt-10 flex flex-1 flex-col justify-center gap-1">
            {sectionIds.map((id, i) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setOpen(false)}
                className="group flex items-baseline gap-5 border-b border-sumi/8 py-3"
                style={{ transitionDelay: open ? `${250 + i * 60}ms` : "0ms" }}
              >
                <span className="w-8 font-jp text-xl text-shu">{kanjiNumerals[i]}</span>
                <span className="font-display text-4xl font-medium text-sumi transition-transform duration-500 group-hover:translate-x-2 sm:text-5xl">
                  {labels[id]}
                </span>
              </a>
            ))}
          </nav>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <LanguageFlags />
            <span className="font-jp text-lg tracking-[0.4em] text-sumi-soft">東京</span>
          </div>
        </div>
      </div>
    </>
  );
}
