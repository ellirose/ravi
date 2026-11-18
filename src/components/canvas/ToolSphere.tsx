"use client";

import { useEffect, useRef } from "react";
import { fitCanvas, prefersReducedMotion } from "./utils";

const GROUP_COLORS = ["#e04a3c", "#34508f", "#7f9f5a", "#c19a4e", "#d9738a"];

/**
 * A 3D sphere of tool names (Fibonacci distribution) with perspective
 * projection, depth sorting, orbit rings, inertial drag and hover focus.
 */
export function ToolSphere({ groups, className = "" }: { groups: { name: string; tools: string[] }[]; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    let geo = fitCanvas(canvas);
    const items = groups.flatMap((g, gi) => g.tools.map((label) => ({ label, gi })));
    const n = items.length;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const pts = items.map((it, i) => {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      return { ...it, x: Math.cos(th) * r, y, z: Math.sin(th) * r };
    });

    let ax = -0.25;
    let ay = 0;
    let vx = 0;
    let vy = 0.0045;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let hover = -1;
    let mouse = { x: -1, y: -1 };
    let raf = 0;
    let running = false;
    const reduced = prefersReducedMotion();
    const font = getComputedStyle(document.body).fontFamily;

    const project = (p: { x: number; y: number; z: number }) => {
      const cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
      const x1 = p.x * cy + p.z * sy;
      const z1 = -p.x * sy + p.z * cy;
      const y2 = p.y * cx - z1 * sx;
      const z2 = p.y * sx + z1 * cx;
      return { x: x1, y: y2, z: z2 };
    };

    const draw = () => {
      const { ctx, w, h } = geo;
      const R = Math.min(w, h) * 0.33;
      const f = 2.6;
      ctx.clearRect(0, 0, w, h);

      // orbit rings (equator + two tilted)
      const ring = (tiltX: number, tiltZ: number, color: string) => {
        ctx.beginPath();
        for (let i = 0; i <= 96; i++) {
          const a = (i / 96) * Math.PI * 2;
          let x = Math.cos(a), y = 0, z = Math.sin(a);
          const y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX);
          const z1 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
          const x2 = x * Math.cos(tiltZ) - y1 * Math.sin(tiltZ);
          const y2 = x * Math.sin(tiltZ) + y1 * Math.cos(tiltZ);
          ({ x, y, z } = project({ x: x2, y: y2, z: z1 }));
          const s = f / (f + z);
          const px = w / 2 + x * R * s;
          const py = h / 2 + y * R * s;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      };
      ring(0, 0, "rgba(52,80,143,.16)");
      ring(1.1, 0.3, "rgba(224,74,60,.14)");
      ring(-0.9, -0.5, "rgba(193,154,78,.18)");

      const proj = pts.map((p, i) => {
        const q = project(p);
        const s = f / (f + q.z);
        return { i, p, sx: w / 2 + q.x * R * s, sy: h / 2 + q.y * R * s, z: q.z, s };
      });
      proj.sort((a, b) => b.z - a.z);

      // hover hit-test on the front-most label near the pointer
      hover = -1;
      if (mouse.x >= 0) {
        let best = 900;
        for (const q of proj) {
          if (q.z > 0.2) continue;
          const d = (q.sx - mouse.x) ** 2 + (q.sy - mouse.y) ** 2;
          if (d < best) { best = d; hover = q.i; }
        }
      }

      for (const q of proj) {
        const depth = (1 - q.z) / 2; // 0 back → 1 front
        const isHover = q.i === hover;
        const size = (11 + depth * 9) * (isHover ? 1.3 : 1) * Math.min(1.1, Math.max(0.78, w / 480));
        ctx.globalAlpha = depth < 0.3 ? 0.1 + depth * 0.4 : 0.2 + depth * 0.8;
        ctx.font = `${depth > 0.55 ? 700 : 600} ${size}px ${font}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const col = GROUP_COLORS[q.p.gi % GROUP_COLORS.length];
        if (isHover) {
          const tw = ctx.measureText(q.p.label).width;
          ctx.fillStyle = "#fffdf9";
          ctx.beginPath();
          ctx.roundRect(q.sx - tw / 2 - 12, q.sy - size * 0.85, tw + 24, size * 1.7, size);
          ctx.shadowColor = "rgba(38,43,61,.18)";
          ctx.shadowBlur = 18;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        // group dot
        ctx.fillStyle = col;
        ctx.beginPath();
        const tw = ctx.measureText(q.p.label).width;
        ctx.arc(q.sx - tw / 2 - 8 * (0.6 + depth * 0.5), q.sy, 2.5 + depth * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = depth > 0.5 ? "#262b3d" : "#5c6275";
        ctx.fillText(q.p.label, q.sx, q.sy);
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      if (!dragging) {
        ay += vy;
        ax += vx;
        vx *= 0.95;
        vy += (0.0045 - vy) * 0.02; // ease back to idle spin
        ax += (-0.25 - ax) * 0.01;
      }
      draw();
      if (running) raf = requestAnimationFrame(loop);
    };

    const start = () => { if (running || reduced) return; running = true; raf = requestAnimationFrame(loop); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    const pos = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const down = (e: PointerEvent) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      mouse = pos(e);
      if (!dragging) { if (reduced) draw(); return; }
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      ay += dx * 0.008; ax += dy * 0.008;
      vy = dx * 0.0016; vx = dy * 0.0016;
      if (reduced) draw();
    };
    const up = () => { dragging = false; };
    const leave = () => { mouse = { x: -1, y: -1 }; if (reduced) draw(); };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", leave);
    const ro = new ResizeObserver(() => { geo = fitCanvas(canvas); draw(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(canvas);
    draw();

    return () => {
      stop(); ro.disconnect(); io.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("pointerleave", leave);
    };
  }, [groups]);

  return <canvas ref={ref} aria-hidden className={`cursor-grab touch-none active:cursor-grabbing ${className}`} />;
}
