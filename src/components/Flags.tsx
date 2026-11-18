"use client";

import { useId } from "react";

/* Hand-built, simplified national flags rendered inside a circle so they
   read as modern icons at small sizes. */

type FlagProps = { className?: string; title?: string };

function Round({ id, children, className, title }: FlagProps & { id: string; children: React.ReactNode }) {
  // Unique per instance: a shared id would resolve to the first (possibly hidden) flag in the page.
  const clip = `flag-${id}-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 40 40" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <defs>
        <clipPath id={clip}>
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>{children}</g>
      <circle cx="20" cy="20" r="19.25" fill="none" stroke="rgb(38 43 61 / .12)" strokeWidth="1.5" />
    </svg>
  );
}

export function FlagUS(p: FlagProps) {
  const stripes = Array.from({ length: 13 }, (_, i) => i);
  return (
    <Round id="us" {...p}>
      <rect width="40" height="40" fill="#fff" />
      {stripes.map((i) => (i % 2 === 0 ? <rect key={i} y={(i * 40) / 13} width="40" height={40 / 13} fill="#c8323c" /> : null))}
      <rect width="20" height={(40 / 13) * 7} fill="#2c3f7c" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3].map((c) => <circle key={`${r}-${c}`} cx={3.2 + c * 4.4 + (r % 2) * 2.2} cy={3 + r * 4.9} r="0.95" fill="#fff" />),
      )}
    </Round>
  );
}

export function FlagBR(p: FlagProps) {
  return (
    <Round id="br" {...p}>
      <rect width="40" height="40" fill="#1b9a4b" />
      <path d="M20 6 37 20 20 34 3 20Z" fill="#fedf00" />
      <circle cx="20" cy="20" r="8.2" fill="#22408c" />
      <path d="M12.2 18.6c5.4-1.4 11-.6 15.5 2.4" fill="none" stroke="#fff" strokeWidth="1.6" />
    </Round>
  );
}

export function FlagES(p: FlagProps) {
  return (
    <Round id="es" {...p}>
      <rect width="40" height="40" fill="#c60b1e" />
      <rect y="10" width="40" height="20" fill="#ffc400" />
      <rect x="9" y="15" width="5" height="10" rx="1.2" fill="#c60b1e" opacity=".85" />
      <rect x="10.2" y="13.6" width="2.6" height="1.6" rx=".6" fill="#ad1519" />
    </Round>
  );
}

export function FlagJP(p: FlagProps) {
  return (
    <Round id="jp" {...p}>
      <rect width="40" height="40" fill="#fff" />
      <circle cx="20" cy="20" r="8.5" fill="#bc002d" />
    </Round>
  );
}

export const flagFor = { en: FlagUS, pt: FlagBR, es: FlagES } as const;
export const flagByCode = { us: FlagUS, br: FlagBR, es: FlagES, jp: FlagJP } as const;
