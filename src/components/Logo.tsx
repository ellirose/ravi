"use client";

import { useId } from "react";

/* Brand mark: a vermilion hanko (判子) seal carrying an "R" monogram and the
   katakana ラヴィ (Ravi), with a rising-sun dot. The rough stamp edge comes
   from an SVG displacement filter so it feels pressed into paper. */

export function Seal({ className = "", animated = false }: { className?: string; animated?: boolean }) {
  const fid = `seal-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <filter id={fid} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="1.6" />
        </filter>
      </defs>
      <g filter={`url(#${fid})`} className={animated ? "origin-center transition-transform duration-700 ease-[var(--ease-spring)] group-hover:rotate-[-8deg] group-hover:scale-105" : ""}>
        <rect x="3" y="3" width="58" height="58" rx="14" fill="var(--color-shu)" />
        <rect x="7.5" y="7.5" width="49" height="49" rx="10" fill="none" stroke="#fff8f2" strokeWidth="1.6" opacity=".9" />
        {/* R monogram */}
        <path
          d="M17 47V17h12.5c6.4 0 10.5 3.6 10.5 9.1 0 4.3-2.5 7.4-6.6 8.5L41.5 47h-6.4l-7.3-11.7H22.6V47H17Zm5.6-16.5h6.7c3.2 0 5.1-1.7 5.1-4.4s-1.9-4.3-5.1-4.3h-6.7v8.7Z"
          fill="#fff8f2"
        />
        {/* katakana column */}
        <text x="50" y="22" fontSize="7.4" fill="#fff8f2" textAnchor="middle" style={{ fontFamily: "var(--font-jp)" }} fontWeight="700">ラ</text>
        <text x="50" y="32" fontSize="7.4" fill="#fff8f2" textAnchor="middle" style={{ fontFamily: "var(--font-jp)" }} fontWeight="700">ヴ</text>
        <text x="50" y="42" fontSize="7.4" fill="#fff8f2" textAnchor="middle" style={{ fontFamily: "var(--font-jp)" }} fontWeight="700">ィ</text>
        <circle cx="50" cy="49.5" r="2.6" fill="#fff8f2" />
      </g>
    </svg>
  );
}

export function Logo({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <span className={`group inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <Seal animated className="size-11 shrink-0 drop-shadow-[0_6px_10px_rgb(224_74_60/0.3)] md:size-13" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.3rem] font-semibold tracking-tight whitespace-nowrap text-sumi sm:text-[1.45rem]">
            Ravi <span className="text-shu">Y.T.</span>
          </span>
          <span className="mt-1 hidden text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-sumi-soft sm:block">Creative Developer</span>
        </span>
      )}
    </span>
  );
}
