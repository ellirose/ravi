"use client";

import { Seal } from "./Logo";
import { LanguageFlags } from "./LanguageSwitcher";
import { sectionIds } from "./Header";
import { useI18n } from "@/i18n/LanguageProvider";

/** A tiny torii — the "back to top" gate. */
function ToriiIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M3 7.5c4 1.4 22 1.4 26 0l-.8 3.2c-4.4.9-20 .9-24.4 0Z" fill="currentColor" />
      <rect x="6" y="13" width="20" height="2.4" rx="1" fill="currentColor" />
      <rect x="8.4" y="10" width="2.6" height="19" rx="1" fill="currentColor" />
      <rect x="21" y="10" width="2.6" height="19" rx="1" fill="currentColor" />
    </svg>
  );
}

export function Footer() {
  const { t } = useI18n();
  const labels: Record<(typeof sectionIds)[number], string> = {
    about: t.nav.about, collection: t.nav.collection, works: t.nav.works, motion: t.nav.motion, studio: t.nav.studio, experience: t.nav.experience, toolkit: t.nav.toolkit,
  };
  return (
    <footer className="tex tex-wood relative overflow-hidden bg-hinoki/60">
      <div className="seigaiha h-10 w-full opacity-40" aria-hidden />
      <div className="mx-auto max-w-[1400px] px-5 pt-16 pb-10 sm:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr_auto] lg:items-start">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <a href="#home" className="group shrink-0" aria-label="Ravi Y.T.">
              <Seal animated className="size-28 drop-shadow-[0_16px_24px_rgb(224_74_60/0.35)] sm:size-32" />
            </a>
            <div>
              <p className="font-display text-[clamp(3rem,6vw,5rem)] leading-none font-semibold tracking-tight text-sumi">
                Ravi <span className="text-shu">Y.T.</span>
              </p>
              <p className="mt-3 max-w-md text-xl text-sumi-soft">{t.footer.tagline}</p>
            </div>
          </div>

          <nav aria-label="Footer">
            <p className="text-sm font-bold tracking-[0.3em] text-sumi-mute uppercase">{t.footer.explore}</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
              {sectionIds.map((id) => (
                <li key={id}>
                  <a href={`#${id}`} className="group inline-flex items-center gap-2 text-lg font-semibold text-sumi transition hover:text-shu">
                    <span className="h-0.5 w-3 rounded bg-shu transition-all group-hover:w-6" />
                    {labels[id]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col items-start gap-5 lg:items-end">
            <LanguageFlags size="size-12" />
            <a href="#home" className="group inline-flex items-center gap-3 rounded-full bg-shu py-2 pr-6 pl-2 text-base font-semibold text-white shadow-lift transition hover:bg-shu-deep">
              <span className="grid size-11 place-items-center rounded-full bg-white/18 transition-transform duration-500 group-hover:-translate-y-1">
                <ToriiIcon className="size-6" />
              </span>
              {t.footer.backTop}
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-sumi/12 pt-6 text-[0.95rem] text-sumi-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Ravi Y.T. {t.footer.rights}</p>
          <p className="flex items-center gap-3">
            {t.footer.crafted}
            <span className="font-jp text-base tracking-[0.3em] text-shu">東京</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
