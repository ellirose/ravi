export type WorkCategory = "web" | "mobile" | "concept" | "logo" | "type" | "branding" | "marketing" | "apparel";

export type RawWork = { id: string; cat: WorkCategory; src: string; w: number; h: number };
export type Work = RawWork & { title: string };
