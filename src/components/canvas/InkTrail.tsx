"use client";

import { useEffect, useRef } from "react";
import { fitCanvas, mulberry32, prefersReducedMotion } from "./utils";

/**
 * A vertical sumi-e brush line that paints itself down the timeline as the
 * reader scrolls. Ink never "unpaints" — scrolling back leaves the stroke.
 */
export function InkTrail({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    let geo = fitCanvas(canvas);
    let drawn = 0; // px painted so far
    let target = 0;
    let raf = 0;
    const rand = mulberry32(5);
    const BR = 14;
    const bristles = Array.from({ length: BR }, (_, i) => ({ o: (i / (BR - 1)) * 2 - 1, a: 0.3 + rand() * 0.5, w: 0.8 + rand() * 1.4, ph: rand() * 100 }));

    const xAt = (y: number) => geo.w / 2 + Math.sin(y * 0.006) * geo.w * 0.12 + Math.sin(y * 0.017 + 1.3) * geo.w * 0.04;
    const widthAt = (y: number) => {
      const base = Math.min(geo.w * 0.34, 14);
      return base * (0.72 + 0.28 * Math.sin(y * 0.011 + 0.6)) * (y < 40 ? 0.4 + (y / 40) * 0.6 : 1);
    };

    const paint = (from: number, to: number) => {
      const { ctx } = geo;
      const stepPx = 2;
      for (let y = Math.max(stepPx, from); y <= to; y += stepPx) {
        const x0 = xAt(y - stepPx);
        const x1 = xAt(y);
        const wdt = widthAt(y);
        for (const b of bristles) {
          const dry = (Math.sin(y * 0.05 + b.ph) + Math.sin(y * 0.013 + b.ph * 2)) * 0.5;
          if (dry > 0.82) continue; // kasure gaps
          const off = b.o * wdt * 0.5;
          ctx.strokeStyle = `rgba(38, 43, 61, ${b.a * 0.75})`;
          ctx.lineWidth = b.w;
          ctx.beginPath();
          ctx.moveTo(x0 + off, y - stepPx);
          ctx.lineTo(x1 + off, y);
          ctx.stroke();
        }
      }
    };

    const loop = () => {
      if (drawn < target) {
        const next = Math.min(target, drawn + Math.max(4, (target - drawn) * 0.12));
        paint(drawn, next);
        drawn = next;
      }
      raf = requestAnimationFrame(loop);
    };

    const onScroll = () => {
      const r = canvas.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.7 - r.top) / r.height;
      target = Math.max(target, Math.min(1, Math.max(0, p)) * geo.h);
    };

    const ro = new ResizeObserver(() => {
      geo = fitCanvas(canvas);
      const keep = drawn;
      drawn = 0;
      paint(0, keep);
      drawn = keep;
    });
    ro.observe(canvas);

    if (prefersReducedMotion()) {
      target = geo.h;
      paint(0, geo.h);
      drawn = geo.h;
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      raf = requestAnimationFrame(loop);
    }
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
