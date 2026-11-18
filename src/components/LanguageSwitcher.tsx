"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { flagFor } from "./Flags";
import { localeMeta, locales, type Locale } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/LanguageProvider";

/** Custom listbox language picker (no native <select>). */
export function LanguageSwitcher({ align = "right", direction = "down" }: { align?: "left" | "right"; direction?: "up" | "down" }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(locales.indexOf(locale));
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const Current = flagFor[locale];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const choose = (l: Locale) => {
    setLocale(l);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setActive(locales.indexOf(locale));
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % locales.length); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + locales.length) % locales.length); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(locales[active]); }
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t.nav.language}: ${localeMeta[locale].label}`}
        onClick={() => { setActive(locales.indexOf(locale)); setOpen((o) => !o); }}
        onKeyDown={onKey}
        className="group flex h-12 items-center gap-2 rounded-full border border-sumi/10 bg-paper pl-1.5 pr-2.5 shadow-soft transition sm:pr-3 hover:border-shu/30 hover:shadow-lift"
      >
        <Current className="size-9 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:rotate-[-12deg]" />
        <span className="hidden text-sm font-bold tracking-wider text-sumi sm:inline">{localeMeta[locale].short}</span>
        <ChevronDown className={`size-4 text-sumi-soft transition-transform duration-300 ${open ? "rotate-180" : ""}`} strokeWidth={2.5} />
      </button>

      <ul
        id={listId}
        role="listbox"
        aria-label={t.nav.language}
        aria-activedescendant={`${listId}-${locales[active]}`}
        tabIndex={-1}
        onKeyDown={onKey}
        className={`absolute z-50 w-[min(16rem,calc(100vw-2rem))] origin-top rounded-3xl border border-sumi/8 bg-paper p-2 shadow-float transition-all duration-300 ease-[var(--ease-silk)] ${
          align === "right" ? "right-0" : "left-0"
        } ${direction === "down" ? "top-[calc(100%+12px)]" : "bottom-[calc(100%+12px)] origin-bottom"} ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        {locales.map((l, i) => {
          const F = flagFor[l];
          const selected = l === locale;
          return (
            <li
              key={l}
              id={`${listId}-${l}`}
              role="option"
              aria-selected={selected}
              onClick={() => choose(l)}
              onPointerEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                i === active ? "bg-sakura-soft" : ""
              }`}
            >
              <F className="size-9 shrink-0" />
              <span className="flex-1">
                <span className="block text-[0.95rem] font-semibold text-sumi">{localeMeta[l].label}</span>
                <span className="block text-xs font-medium tracking-widest text-sumi-mute">{localeMeta[l].short}</span>
              </span>
              <span className={`grid size-7 place-items-center rounded-full transition ${selected ? "bg-shu text-white" : "text-transparent"}`}>
                <Check className="size-4" strokeWidth={3} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Row of flag buttons — used in the mobile menu and footer. */
export function LanguageFlags({ size = "size-11" }: { size?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div role="radiogroup" aria-label={t.nav.language} className="flex items-center gap-3">
      {locales.map((l) => {
        const F = flagFor[l];
        const on = l === locale;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={localeMeta[l].label}
            title={localeMeta[l].label}
            onClick={() => setLocale(l)}
            className={`relative rounded-full p-1 transition duration-300 ${
              on ? "bg-paper shadow-lift ring-2 ring-shu" : "opacity-70 hover:-translate-y-0.5 hover:opacity-100"
            }`}
          >
            <F className={size} />
          </button>
        );
      })}
    </div>
  );
}
