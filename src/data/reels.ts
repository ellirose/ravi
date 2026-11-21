import type { Locale } from "@/i18n/dictionaries";

/* AI commercial spots produced for clients (sources: docs/Folder_1).
   Videos live in /public/reels; posters and 4-frame filmstrips were pulled
   from each file (posters/<id>.webp, frames/<id>-1..4.webp). All are silent. */

export const reelCategories = ["fashion", "characters", "food", "beauty", "jewelry", "lifestyle", "sports"] as const;
export type ReelCategory = (typeof reelCategories)[number];

type Title = Record<Locale, string>;
export type Reel = {
  id: string;
  cat: ReelCategory;
  title: Title;
  w: number;
  h: number;
  /** seconds */
  d: number;
  /** MB, for the spec line */
  mb: number;
  /** object-position for crops */
  focus?: string;
};

const r = (id: string, cat: ReelCategory, w: number, h: number, d: number, mb: number, en: string, pt: string, es: string, focus?: string): Reel => ({
  id, cat, w, h, d, mb, focus, title: { en, pt, es },
});

export const reels: Reel[] = [
  r("mens-corduroy-outfit", "fashion", 606, 1080, 8, 0.9, "Corduroy menswear", "Moda masculina em veludo cotelê", "Moda masculina de pana"),
  r("striped-suit-orange-backdrop", "fashion", 606, 1080, 4, 1, "Pinstripe on orange", "Risca de giz no laranja", "Raya diplomática en naranja"),
  r("suit-and-navy-dress-duo", "fashion", 606, 1080, 6, 1.1, "Suit & navy dress duo", "Dupla terno e vestido azul", "Dúo de traje y vestido azul"),
  r("plaid-sunglasses-glance", "characters", 1920, 1062, 5, 2.2, "Plaid & sunglasses glance", "Olhar de xadrez e óculos", "Mirada de cuadros y gafas", "60% 30%"),
  r("sunlit-beauty-portrait", "characters", 3840, 2160, 8, 6.3, "Sunlit beauty portrait", "Retrato de beleza ao sol", "Retrato de belleza al sol", "55% 35%"),
  r("yellow-dress-lemon-grove", "characters", 612, 1080, 5, 1, "Yellow dress, lemon grove", "Vestido amarelo no limoeiro", "Vestido amarillo entre limoneros"),
  r("cold-brew-bottle-showcase", "food", 3840, 2160, 10, 9.3, "Cold brew showcase", "Vitrine de cold brew", "Escaparate de cold brew", "45% 55%"),
  r("fresh-strawberries", "food", 606, 1080, 8, 1.3, "Fresh strawberries", "Morangos frescos", "Fresas frescas"),
  r("honeycomb-drip", "food", 1920, 1080, 6, 2.8, "Honeycomb drip", "Mel escorrendo do favo", "Goteo de panal"),
  r("orange-food-menu-promotion", "food", 3840, 2160, 10, 2.3, "Menu promotion on orange", "Promoção de cardápio em laranja", "Promoción de menú en naranja", "18% 50%"),
  r("facial-serum-showcase", "beauty", 606, 1080, 10, 1.4, "Facial serum, UGC style", "Sérum facial, estilo UGC", "Sérum facial, estilo UGC"),
  r("golden-serum-drop", "beauty", 1920, 1080, 4, 1.2, "Golden serum drop", "Gota de sérum dourado", "Gota de sérum dorado"),
  r("golden-sunlight-serum-showcase", "beauty", 3840, 2160, 8, 5.2, "Golden-hour serum", "Sérum na luz dourada", "Sérum a la luz dorada", "40% 40%"),
  r("crystal-gem-pink", "jewelry", 606, 1080, 6, 1.1, "Crystal on blush", "Cristal sobre rosa", "Cristal sobre rosa"),
  r("earrings-necklace-portrait", "jewelry", 1512, 906, 10, 2.3, "Earrings & necklace portrait", "Retrato com brincos e colar", "Retrato con pendientes y collar", "50% 30%"),
  r("sparkling-diamond", "jewelry", 1800, 1080, 5.3, 2, "Shattering diamond", "Diamante cintilante", "Diamante centelleante", "45% 35%"),
  r("beach-palm-sunset-portrait", "lifestyle", 1800, 1080, 10, 4.1, "Palm beach at sunset", "Praia com palmeiras ao pôr do sol", "Playa de palmeras al atardecer"),
  r("golden-hour-mountain-portrait", "lifestyle", 1800, 1080, 5.3, 1.7, "Golden-hour mountain", "Montanha na hora dourada", "Montaña en la hora dorada", "55% 40%"),
  r("outdoor-gym-training", "sports", 1920, 1080, 5, 0.9, "Outdoor gym session", "Treino na academia ao ar livre", "Entreno en gimnasio al aire libre", "70% 50%"),
  r("skateboarder-skatepark", "sports", 1920, 1080, 8, 2.6, "Skatepark editorial", "Editorial na pista de skate", "Editorial en el skatepark"),
  r("skier-golden-hour", "sports", 1920, 1066, 8.7, 2.6, "Ski run at golden hour", "Esqui na hora dourada", "Esquí en la hora dorada"),
];

export const reelById = Object.fromEntries(reels.map((x) => [x.id, x])) as Record<string, Reel>;

/** Showreel running order — paced like an edit: abstract opener, alternating
    scale, colour and format so every cut feels like a change of key. */
export const showreel: Reel[] = [
  "golden-serum-drop", "sunlit-beauty-portrait", "striped-suit-orange-backdrop", "cold-brew-bottle-showcase",
  "sparkling-diamond", "skateboarder-skatepark", "yellow-dress-lemon-grove", "honeycomb-drip",
  "golden-hour-mountain-portrait", "crystal-gem-pink", "skier-golden-hour", "plaid-sunglasses-glance",
  "fresh-strawberries", "golden-sunlight-serum-showcase", "earrings-necklace-portrait", "suit-and-navy-dress-duo",
  "beach-palm-sunset-portrait", "outdoor-gym-training", "orange-food-menu-promotion", "facial-serum-showcase",
  "mens-corduroy-outfit",
].map((id) => reelById[id]);

export const isVertical = (x: Reel) => x.h > x.w;
export const reelSrc = (x: Reel) => `/reels/${x.id}.mp4`;
export const reelPoster = (x: Reel) => `/reels/posters/${x.id}.webp`;
export const reelFrames = (x: Reel) => [1, 2, 3, 4].map((n) => `/reels/frames/${x.id}-${n}.webp`);
export const resolutionLabel = (x: Reel) => (Math.max(x.w, x.h) >= 3840 ? "4K" : Math.max(x.w, x.h) >= 1800 ? "HD" : "Social");

/** 00:00:04:12 style timecode at 24 fps. */
export function timecode(seconds: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const s = Math.max(0, seconds);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(Math.floor(s) % 60)}:${pad(Math.floor((s % 1) * 24))}`;
}
