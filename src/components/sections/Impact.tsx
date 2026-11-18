"use client";

import { Clock, Gauge, Rocket, TrendingUp } from "lucide-react";
import { CountUp, Reveal, Tilt } from "../motion";
import { useI18n } from "@/i18n/LanguageProvider";

const icons = [
  { Icon: Rocket, ring: "text-shu", soft: "bg-shu-soft" },
  { Icon: Gauge, ring: "text-ai", soft: "bg-ai-soft" },
  { Icon: TrendingUp, ring: "text-matcha", soft: "bg-matcha-soft" },
  { Icon: Clock, ring: "text-kin", soft: "bg-kin-soft" },
];

/** Career impact as kamon-style round seals that count up on reveal. */
export function Impact() {
  const { t } = useI18n();
  return (
    <section id="impact" className="tex tex-plaster relative bg-kinu py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Reveal variant="up">
            <p className="text-sm font-bold tracking-[0.3em] text-shu uppercase">{t.impact.eyebrow}</p>
            <h2 className="mt-3 font-display text-[clamp(2.4rem,5vw,4.5rem)] leading-[1.05] font-medium tracking-tight">{t.impact.title}</h2>
          </Reveal>
          <Reveal variant="fade" delay={150} className="font-jp text-[clamp(3rem,7vw,6rem)] leading-none text-sumi/10 select-none" aria-hidden>
            成果
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {t.impact.items.map((item, i) => {
            const { Icon, ring, soft } = icons[i];
            return (
              <Reveal key={item.detail} variant="rise" delay={i * 110} className={i % 2 === 1 ? "lg:mt-16" : ""}>
                <Tilt max={10} className="group relative mx-auto aspect-square w-full max-w-[320px]">
                  {/* outer kamon ring */}
                  <div className={`absolute inset-0 rounded-full border-[1.5px] border-dashed border-current opacity-30 transition-transform duration-[1.6s] ease-[var(--ease-silk)] group-hover:rotate-90 ${ring}`} />
                  <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-paper px-[16%] text-center shadow-lift">
                    <span className={`depth-1 grid size-16 place-items-center rounded-full ${soft} ${ring}`}>
                      <Icon className="size-8" strokeWidth={1.8} />
                    </span>
                    <div className="depth-2 mt-3 flex items-start font-display text-[clamp(3.4rem,5vw,4.6rem)] leading-none font-semibold text-sumi">
                      <CountUp to={item.value} />
                      <span className={`text-[0.55em] ${ring}`}>{item.suffix}</span>
                    </div>
                    <div className="mt-1 text-lg font-bold text-sumi">{item.label}</div>
                    <p className="mt-1.5 text-[0.88rem] leading-snug text-sumi-soft">{item.detail}</p>
                  </div>
                </Tilt>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
