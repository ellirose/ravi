"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { displayFont, jpFont } from "./emblem";
import { runIntro } from "./engine";

/**
 * First-render intro. The overlay is in the server HTML (shown only while
 * <html data-intro="playing">, set by the boot script), so the page never
 * flashes before it. Particles wander, then converge into the sakura + seal
 * emblem once fonts and the hero portrait are ready; the page is revealed the
 * moment the emblem fully manifests.
 */
export function IntroScene() {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controller = useRef<{ skip: () => void; stop: () => void } | null>(null);
  const subtitle = useRef(t.hero.kicker);
  useEffect(() => {
    subtitle.current = t.hero.kicker;
  }, [t]);

  useEffect(() => {
    const html = document.documentElement;
    const canvas = canvasRef.current;
    if (!canvas || html.getAttribute("data-intro") !== "playing") return;
    (window as unknown as { __introStarted?: boolean }).__introStarted = true;

    // Readiness = the type used by the emblem + the hero portrait are loaded.
    let ready = false;
    const fonts = Promise.all([
      document.fonts.load(`700 64px ${jpFont()}`, "桜ラヴィ"),
      document.fonts.load(`600 48px ${displayFont()}`, "Ravi Y.T."),
    ]).then(() => document.fonts.ready);
    const portrait = document.querySelector<HTMLImageElement>("img[data-hero-portrait]");
    const image = portrait && !portrait.complete ? portrait.decode().catch(() => undefined) : Promise.resolve();
    Promise.all([fonts, image]).then(() => (ready = true), () => (ready = true));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controller.current = runIntro(canvas, {
      reduced,
      isReady: () => ready,
      subtitle: () => subtitle.current,
      onReveal: () => html.setAttribute("data-intro", "reveal"),
      onDone: () => {
        html.setAttribute("data-intro", "done");
        try { history.scrollRestoration = "auto"; } catch { /* ignore */ }
        // Release the backing store; the overlay is hidden by CSS from here on.
        canvas.width = canvas.height = 0;
      },
    });
    requestAnimationFrame(() => canvas.setAttribute("data-live", ""));

    const skipOnKey = (e: KeyboardEvent) => e.key === "Escape" && controller.current?.skip();
    window.addEventListener("keydown", skipOnKey);
    return () => {
      controller.current?.stop();
      window.removeEventListener("keydown", skipOnKey);
    };
  }, []);

  return (
    <>
      <div className="intro-root fixed inset-0 z-[100] bg-washi" aria-hidden>
        {/* Shown before hydration: a quiet seal that the particles take over from */}
        <div className="intro-placeholder absolute top-[44%] left-1/2 size-16 -translate-x-1/2 -translate-y-1/2">
          <svg viewBox="0 0 64 64" className="size-full animate-pulse">
            <rect x="3" y="3" width="58" height="58" rx="14" fill="#e04a3c" />
            <path
              d="M17 47V17h12.5c6.4 0 10.5 3.6 10.5 9.1 0 4.3-2.5 7.4-6.6 8.5L41.5 47h-6.4l-7.3-11.7H22.6V47H17Zm5.6-16.5h6.7c3.2 0 5.1-1.7 5.1-4.4s-1.9-4.3-5.1-4.3h-6.7v8.7Z"
              fill="#fff8f2"
            />
          </svg>
        </div>
        <canvas ref={canvasRef} className="intro-canvas absolute inset-0 size-full" />
      </div>
      <button
        type="button"
        onClick={() => controller.current?.skip()}
        className="intro-skip fixed right-5 bottom-5 z-[101] rounded-full border border-sumi/10 bg-paper/80 px-5 py-2.5 text-sm font-semibold tracking-wider text-sumi-soft shadow-soft backdrop-blur transition hover:text-shu"
      >
        {t.intro.skip}
      </button>
    </>
  );
}
