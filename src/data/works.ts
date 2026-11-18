import { rawWorks } from "./works.generated";
import type { Work, WorkCategory } from "./work-types";

export type { Work, WorkCategory } from "./work-types";

const titleOverrides: Record<string, string> = {
  "101points-merchandise": "101 Points Merchandise",
  "al-thuraia-branded-merchandise": "Al Thuraia Branded Kit",
  "promotional-merchandise": "Portakal Kreatif Merchandise",
  "victec-sportswear": "VICTEC Sportswear",
  "m-logo-3d-horse": "M Monogram · Stallion",
  "m-logo-neon-character": "M Monogram · Neon",
  "m-logo-chrome": "M Monogram · Chrome",
  "m-logo-red": "M Monogram · Crimson",
  "m-logo-metal-wood": "M Monogram · Metal & Wood",
  "m-logo-apple-concept": "M Monogram · Droplet",
  "m-logo-floral-pink": "M Monogram · Blossom",
  "m-logo-gold-lines": "M Monogram · Gold Lines",
  "m-logo-character-3d": "M Monogram · Character",
  "smart-campus-dashboard": "Smart Campus Dashboard",
  "minka-japanese-ui-poster": "Minka Japanese UI Poster",
  "tripypedia-travel-website": "Tripypedia Travel Website",
  "voyager-japan-website": "Voyager Japan Website",
};

const titleize = (id: string) =>
  id
    .split("-")
    .map((w) => (w === "to" || w === "of" ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ")
    .replace(/\bUi\b/g, "UI")
    .replace(/\b3d\b/gi, "3D");

// Order categories so the "All" view opens with the strongest digital work.
const order: WorkCategory[] = ["web", "mobile", "concept", "logo", "branding", "marketing", "type", "apparel"];

export const works: Work[] = rawWorks
  .map((w) => ({ ...w, title: titleOverrides[w.id] ?? titleize(w.id) }))
  .sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat));

export const workCategories: WorkCategory[] = order;

/** Hand-picked Japan pieces for the 3D collection ring. */
export const japanCollection = [
  "japan-landing-pagoda",
  "voyager-japan-website",
  "japan-travel-app",
  "discover-japan-flyer",
  "japan-trip-website",
  "minka-japanese-ui-poster",
  "japan-checkpoint-app",
  "japan-think-again-flyer",
  "visit-japan-landing",
].map((id) => works.find((w) => w.id === id)!).filter(Boolean);

/** Thumbnails for the hero film reel. */
export const reelWorks = [
  "japan-landing-pagoda",
  "rome-travel-app",
  "m-logo-floral-pink",
  "tennis-club-outfit",
  "namibia-safari-app",
  "strawberry-alphabet",
  "travel-agency-claymorphism",
  "eagle-emblem-logo",
].map((id) => works.find((w) => w.id === id)!).filter(Boolean);
