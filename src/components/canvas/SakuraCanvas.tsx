"use client";

import { useEffect, useRef } from "react";
import { fitCanvas, mulberry32, prefersReducedMotion } from "./utils";

type Petal = {
  x: number; y: number; z: number; // z: 0 (far) → 1 (near)
  size: number; rot: number; vrot: number;
  flip: number; vflip: number; // 3D flip about the petal's long axis
  sway: number; swaySpeed: number; fall: number; hue: number;
  vx: number; vy: number;
};

const PALETTE = ["#f7c6d0", "#f2b3c0", "#fbd9df", "#f4bccb", "#fde4e8"];

/**
 * Sakura petals that tumble in pseudo-3D (scale on one axis = flip), drift with
 * depth-based parallax and scatter away from the pointer like a breeze.
 */
export function SakuraCanvas({ className = "", density = 1 }: { className?: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const rand = mulberry32(2026);
    let { ctx, w, h } = fitCanvas(canvas);
    let petals: Petal[] = [];
    let raf = 0;
    let running = false;
    let last = performance.now();
    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };
    let wind = 0;

    const spawn = (p: Partial<Petal> = {}): Petal => {
      const z = Math.pow(rand(), 1.6);
      return {
        x: rand() * w, y: -20 - rand() * h * 0.2, z,
        size: 5 + z * 11, rot: rand() * Math.PI * 2, vrot: (rand() - 0.5) * 1.6,
        flip: rand() * Math.PI * 2, vflip: 1.2 + rand() * 2.4,
        sway: rand() * Math.PI * 2, swaySpeed: 0.6 + rand() * 0.9, fall: 18 + z * 46,
        hue: Math.floor(rand() * PALETTE.length), vx: 0, vy: 0, ...p,
      };
    };

    const populate = () => {
      const count = Math.round(Math.min(56, Math.max(16, ((w * h) / 30000) * density)));
      petals = Array.from({ length: count }, () => spawn({ y: rand() * h }));
    };
    populate();

    const drawPetal = (p: Petal) => {
      const s = p.size;
      const flipScale = Math.cos(p.flip);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.max(0.12, Math.abs(flipScale)));
      ctx.globalAlpha = 0.35 + p.z * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.95);
      ctx.bezierCurveTo(-s * 0.95, s * 0.35, -s * 0.78, -s * 0.78, -s * 0.2, -s * 0.98);
      ctx.lineTo(0, -s * 0.7);
      ctx.lineTo(s * 0.2, -s * 0.98);
      ctx.bezierCurveTo(s * 0.78, -s * 0.78, s * 0.95, s * 0.35, 0, s * 0.95);
      ctx.closePath();
      // Back face reads slightly paler — sells the 3D tumble.
      ctx.fillStyle = flipScale > 0 ? PALETTE[p.hue] : "#fdeef1";
      ctx.fill();
      // Fine centre vein
      ctx.globalAlpha *= 0.45;
      ctx.strokeStyle = "#e597a8";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.8);
      ctx.quadraticCurveTo(s * 0.05, 0, 0, -s * 0.6);
      ctx.stroke();
      ctx.restore();
    };

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      // Hidden under the intro overlay: keep the loop alive but skip the work.
      if (document.documentElement.getAttribute("data-intro") === "playing") {
        if (running) raf = requestAnimationFrame(step);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      wind += (Math.sin(now / 3200) * 14 - wind) * 0.02;
      pointer.vx *= 0.92;
      pointer.vy *= 0.92;

      // far petals first so near ones overlap them
      petals.sort((a, b) => a.z - b.z);
      for (const p of petals) {
        p.sway += p.swaySpeed * dt;
        p.flip += p.vflip * dt;
        p.rot += p.vrot * dt;

        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          const r = 140;
          if (d2 < r * r) {
            const d = Math.sqrt(d2) || 1;
            const force = (1 - d / r) * 260 * (0.4 + p.z);
            p.vx += (dx / d) * force * dt + pointer.vx * 0.02;
            p.vy += (dy / d) * force * dt + pointer.vy * 0.02;
          }
        }
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.x += (wind * (0.4 + p.z) + Math.sin(p.sway) * 22 * (0.5 + p.z) + p.vx) * dt;
        p.y += (p.fall + p.vy) * dt;

        if (p.y > h + 30 || p.x < -60 || p.x > w + 60) Object.assign(p, spawn({ x: rand() * (w + 120) - 60 }));
        drawPetal(p);
      }
      if (running) raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (running || prefersReducedMotion()) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onResize = () => {
      ({ ctx, w, h } = fitCanvas(canvas));
      populate();
      if (!running) step(performance.now());
    };
    const host = canvas.parentElement!;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (pointer.active) { pointer.vx = (x - pointer.x) * 6; pointer.vy = (y - pointer.y) * 6; }
      pointer.x = x; pointer.y = y; pointer.active = true;
    };
    const onLeave = () => { pointer.active = false; };

    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(canvas);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    step(performance.now()); // first frame, also the static frame for reduced motion

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [density]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className}`} />;
}
