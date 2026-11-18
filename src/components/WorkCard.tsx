"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";
import type { Work } from "@/data/works";
import { useI18n } from "@/i18n/LanguageProvider";
import { categoryIcon } from "./categoryIcons";
import { Tilt } from "./motion";

/* Each category gets a silhouette drawn from the object it represents. */

function Caption({ work, center = false }: { work: Work; center?: boolean }) {
  const { t } = useI18n();
  const Icon = categoryIcon[work.cat];
  return (
    <div className={`flex items-center gap-3 ${center ? "justify-center text-center" : ""}`}>
      {!center && (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-kinu text-sumi-soft transition-colors group-hover:bg-shu group-hover:text-white">
          <Icon className="size-5" strokeWidth={2} />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-[1.05rem] leading-tight font-bold text-sumi">{work.title}</p>
        <p className="text-sm font-medium text-sumi-mute">{t.works.filters[work.cat]}</p>
      </div>
    </div>
  );
}

function OpenBadge() {
  return (
    <span className="depth-2 pointer-events-none absolute top-4 right-4 z-10 grid size-11 scale-75 place-items-center rounded-full bg-paper/95 text-shu opacity-0 shadow-lift transition duration-500 group-hover:scale-100 group-hover:opacity-100">
      <Maximize2 className="size-5" strokeWidth={2.2} />
    </span>
  );
}

function Img({ work, className = "", sizes = "(min-width:1280px) 22vw, (min-width:640px) 45vw, 92vw" }: { work: Work; className?: string; sizes?: string }) {
  return (
    <Image
      src={work.src}
      alt={work.title}
      width={work.w}
      height={work.h}
      sizes={sizes}
      className={`h-auto w-full transition-transform duration-[1.2s] ease-[var(--ease-silk)] group-hover:scale-[1.045] ${className}`}
    />
  );
}

export function WorkCard({ work, onOpen }: { work: Work; onOpen: () => void }) {
  const { t } = useI18n();
  const label = `${t.works.open}: ${work.title}`;
  const common = "group block w-full cursor-pointer text-left";

  switch (work.cat) {
    case "web":
      return (
        <Tilt as="button" type="button" onClick={onOpen} aria-label={label} className={common} max={6}>
          <div className="relative overflow-hidden rounded-[24px] border border-sumi/8 bg-paper shadow-soft transition-shadow duration-500 group-hover:shadow-float">
            <div className="flex items-center gap-2 border-b border-sumi/6 px-4 py-3">
              <span className="size-3 rounded-full bg-shu" />
              <span className="size-3 rounded-full bg-kin" />
              <span className="size-3 rounded-full bg-matcha" />
              <span className="ml-3 truncate rounded-full bg-kinu px-3 py-1 font-mono text-xs text-sumi-mute">works/{work.id}</span>
            </div>
            <div className="relative overflow-hidden"><Img work={work} /></div>
            <OpenBadge />
            <div className="p-4"><Caption work={work} /></div>
          </div>
        </Tilt>
      );
    case "mobile":
      return (
        <Tilt as="button" type="button" onClick={onOpen} aria-label={label} className={`${common} px-6`} max={10}>
          <div className="relative rounded-[44px] bg-sumi p-2.5 shadow-float">
            <span className="absolute top-4 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-sumi" />
            <div className="relative overflow-hidden rounded-[36px] bg-paper"><Img work={work} /></div>
            <OpenBadge />
          </div>
          <div className="mt-4"><Caption work={work} center /></div>
        </Tilt>
      );
    case "concept":
      return (
        <Tilt as="button" type="button" onClick={onOpen} aria-label={label} className={common} max={7}>
          <div className="mx-auto h-10 w-px bg-sumi/25" aria-hidden />
          <div className="shape-shadow">
            <div className="shape-tanzaku relative bg-paper px-4 pt-10 pb-5">
              <span aria-hidden className="absolute top-3.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-washi ring-1 ring-sumi/20" />
              <div className="relative overflow-hidden rounded-md"><Img work={work} /></div>
              <OpenBadge />
              <div className="mt-4"><Caption work={work} /></div>
            </div>
          </div>
        </Tilt>
      );
    case "logo":
      return (
        <Tilt as="button" type="button" onClick={onOpen} aria-label={label} className={`${common} px-2`} max={12}>
          <div className="relative mx-auto aspect-square w-full">
            <div aria-hidden className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-kin/60 transition-transform duration-[1.6s] group-hover:rotate-45" />
            <div className="absolute inset-3 overflow-hidden rounded-full bg-paper shadow-lift ring-4 ring-paper">
              <Image src={work.src} alt={work.title} fill sizes="(min-width:1280px) 20vw, (min-width:640px) 40vw, 85vw" className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-silk)] group-hover:scale-110" />
            </div>
            <OpenBadge />
          </div>
          <div className="mt-4"><Caption work={work} center /></div>
        </Tilt>
      );
    case "type":
      return (
        <Tilt as="button" type="button" onClick={onOpen} aria-label={label} className={common} max={8}>
          <div className="shape-shadow">
            <div className="shape-fold relative bg-paper p-4 pb-5">
              <span aria-hidden className="absolute top-0 right-0 size-[46px] bg-kinu shadow-[-4px_4px_8px_rgb(38_43_61/0.12)] [clip-path:polygon(0_0,0_100%,100%_100%)]" />
              <div className="relative overflow-hidden rounded-lg"><Img work={work} /></div>
              <OpenBadge />
              <div className="mt-4"><Caption work={work} /></div>
            </div>
          </div>
        </Tilt>
      );
    case "branding":
    case "marketing":
      return (
        <Tilt as="button" type="button" onClick={onOpen} aria-label={label} className={common} max={7}>
          <div className="shape-shadow">
            <div className="shape-ticket relative flex flex-col bg-paper">
              <div className="relative overflow-hidden"><Img work={work} /></div>
              <div aria-hidden className="mx-6 border-t-2 border-dashed border-sumi/15" />
              <div className="flex items-center justify-between gap-3 p-5">
                <Caption work={work} />
                <span className="font-jp text-xl text-shu" aria-hidden>券</span>
              </div>
              <OpenBadge />
            </div>
          </div>
        </Tilt>
      );
    case "apparel":
    default:
      return (
        <Tilt as="button" type="button" onClick={onOpen} aria-label={label} className={common} max={8}>
          <svg aria-hidden viewBox="0 0 40 30" className="mx-auto -mb-3 h-8 w-10 text-kin">
            <path d="M20 28 C8 18 10 4 20 2 C30 4 32 18 20 28" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <div className="shape-shadow">
            <div className="shape-tag relative bg-paper px-4 pt-12 pb-5">
              <span aria-hidden className="absolute top-5 left-1/2 size-4 -translate-x-1/2 rounded-full bg-washi ring-2 ring-kin/70" />
              <div className="relative overflow-hidden rounded-xl"><Img work={work} /></div>
              <OpenBadge />
              <div className="mt-4"><Caption work={work} /></div>
            </div>
          </div>
        </Tilt>
      );
  }
}
