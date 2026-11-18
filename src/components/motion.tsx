"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

type RevealVariant = "up" | "fade" | "scale" | "left" | "right" | "shoji" | "rise";

/** Tells the <head> boot script (see revealBoot.ts) that React has hydrated. */
function markRevealReady() {
  (window as unknown as { __revealReady?: boolean }).__revealReady = true;
}

/** Reveals children once when they scroll into view (CSS-driven, see globals.css). */
export function Reveal({
  as: Tag = "div",
  variant = "up",
  delay = 0,
  className,
  style,
  children,
}: {
  as?: ElementType;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    markRevealReady();
    const show = () => el.setAttribute("data-shown", "");
    // Already on screen, or already scrolled past (e.g. restored scroll / hash link).
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.94) {
      show();
      return;
    }
    // threshold 0 = any visible pixel, so very tall elements (taller than the
    // viewport / threshold) can still trigger; the negative bottom margin keeps
    // the reveal just inside the viewport rather than at its very edge.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      className={className}
      style={{ ...style, ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/** True while the element is (near) the viewport — used to pause canvases. */
export function useInView<T extends Element>(rootMargin = "120px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** Pointer-driven 3D tilt. Children can use `.depth-1/.depth-2` to float above the surface. */
export function Tilt({
  as: Tag = "div",
  max = 9,
  className = "",
  style,
  children,
  ...rest
}: {
  as?: ElementType;
  max?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef(0);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--ry", `${(px * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-py * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
      el.setAttribute("data-active", "");
    });
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.removeAttribute("data-active");
  };

  return (
    <Tag ref={ref} className={`tilt ${className}`} style={style} onPointerMove={onMove} onPointerLeave={onLeave} {...rest}>
      {children}
    </Tag>
  );
}

/** Animated number that counts up once visible. */
export function CountUp({ to, duration = 1600, className }: { to: number; duration?: number; className?: string }) {
  const [ref, inView] = useInView<HTMLSpanElement>("0px");
  const [value, setValue] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!inView || done.current) return;
    done.current = true;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setValue(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
