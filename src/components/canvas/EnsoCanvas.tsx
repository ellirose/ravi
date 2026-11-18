"use client";

import { useEffect, useRef } from "react";
import { fitCanvas, mulberry32, prefersReducedMotion } from "./utils";

/**
 * An ensō (円相) painted with a simulated dry brush: dozens of bristle
 * strands follow the circle, each with its own pressure, ink load and
 * drop-outs, so the stroke starts wet and finishes in feathered "kasure".
 */
export function EnsoCanvas({ className = "", color = "38, 43, 61", seal = true }: { className?: string; color?: string; seal?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    let raf = 0;
    let progress = 0;
    let drawnTo = 0;
    let started = false;
    let geo = fitCanvas(canvas);

    const SEG = 360;
    const BRISTLES = 34;
    const rand = mulberry32(88);
    const bristles = Array.from({ length: BRISTLES }, (_, i) => ({
      offset: (i / (BRISTLES - 1)) * 2 - 1,
      load: 0.55 + rand() * 0.45, // how long this bristle keeps ink
      alpha: 0.35 + rand() * 0.4,
      width: 0.8 + rand() * 1.6,
      jitter: rand() * 1000,
    }));
    const gaps = Array.from({ length: BRISTLES }, () => Array.from({ length: SEG }, () => rand()));
    const wobble = [rand() * 6, rand() * 6, rand() * 6];

    const point = (t: number) => {
      const { w, h } = geo;
      const R = Math.min(w, h) * 0.4;
      const start = -Math.PI * 0.62;
      const a = start + t * Math.PI * 2 * 0.92;
      const r = R * (1 + 0.025 * Math.sin(a * 3 + wobble[0]) + 0.015 * Math.sin(a * 5 + wobble[1]));
      return { x: w / 2 + Math.cos(a) * r, y: h / 2 + Math.sin(a) * r, a, R };
    };

    // Brush width: quick press-in, full body, long thinning tail
    const pressure = (t: number) => {
      const inP = Math.min(1, t / 0.06);
      const tail = t > 0.62 ? 1 - Math.pow((t - 0.62) / 0.38, 1.4) * 0.82 : 1;
      return inP * tail * (0.92 + 0.08 * Math.sin(t * 20));
    };

    const drawRange = (from: number, to: number) => {
      const { ctx } = geo;
      const s0 = Math.floor(from * SEG);
      const s1 = Math.floor(to * SEG);
      for (let s = Math.max(1, s0); s <= s1 && s < SEG; s++) {
        const t0 = (s - 1) / SEG;
        const t1 = s / SEG;
        const p0 = point(t0);
        const p1 = point(t1);
        const width = p0.R * 0.2 * pressure(t1);
        const nx = Math.cos(p1.a);
        const ny = Math.sin(p1.a);
        bristles.forEach((b, bi) => {
          // Dry-brush: as ink runs out, gaps appear
          const dryness = Math.max(0, (t1 - b.load * 0.75) / 0.4);
          if (gaps[bi][s] < dryness * 0.9) return;
          const off = b.offset * width * 0.5 + Math.sin(t1 * 40 + b.jitter) * 0.6;
          ctx.strokeStyle = `rgba(${color}, ${b.alpha * (1 - dryness * 0.35)})`;
          ctx.lineWidth = b.width * (0.6 + pressure(t1) * 0.8);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p0.x + nx * off, p0.y + ny * off);
          ctx.lineTo(p1.x + nx * off, p1.y + ny * off);
          ctx.stroke();
        });
      }
      if (seal && to >= 1) {
        const { w, h } = geo;
        const R = Math.min(w, h) * 0.4;
        const sx = w / 2 + R * 0.78;
        const sy = h / 2 + R * 0.86;
        const sz = R * 0.2;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(-0.08);
        ctx.fillStyle = "rgba(224, 74, 60, .92)";
        ctx.beginPath();
        ctx.roundRect(-sz / 2, -sz / 2, sz, sz, sz * 0.18);
        ctx.fill();
        ctx.fillStyle = "#fff8f2";
        ctx.font = `700 ${sz * 0.62}px ${getComputedStyle(document.body).getPropertyValue("--font-jp") || "serif"}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("創", 0, sz * 0.04);
        ctx.restore();
      }
    };

    const redraw = () => {
      geo = fitCanvas(canvas);
      geo.ctx.clearRect(0, 0, geo.w, geo.h);
      drawRange(0, drawnTo);
    };

    const animate = () => {
      const t0 = performance.now();
      const dur = 2400;
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        progress = 1 - Math.pow(1 - p, 2.2);
        drawRange(drawnTo, progress);
        drawnTo = progress;
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started) {
          started = true;
          if (prefersReducedMotion()) { drawnTo = 1; redraw(); } else animate();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(canvas);
    const ro = new ResizeObserver(() => redraw());
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, [color, seal]);

  return <canvas ref={ref} aria-hidden className={className} />;
}
