/*
 * The intro emblem: a five-petal sakura with Ravi's vermilion "R" hanko seal at
 * its heart, gold stamens between the petals, and the kanji 桜 (sakura) set
 * beside it as an indigo signature. One drawing routine serves two purposes:
 *   - "mask": flat region colours, sampled to give each particle its target
 *   - "art":  the crisp final artwork that fades in when the shape manifests
 */

export type Region = "petal" | "seal" | "stamen" | "kanji";

export type EmblemGeo = { w: number; h: number; cx: number; cy: number; R: number };

export function emblemGeometry(w: number, h: number): EmblemGeo {
  const R = Math.min(w * 0.3, h * 0.235);
  return { w, h, cx: w / 2, cy: h * 0.44, R };
}

/* Mask colours: one pure channel per region so sampling can classify pixels. */
export const MASK: Record<Region, [number, number, number]> = {
  petal: [255, 0, 0],
  seal: [0, 255, 0],
  stamen: [255, 255, 0],
  kanji: [0, 0, 255],
};

/* Particle palettes — vivid but in key with the site. */
export const PALETTE: Record<Region, string[]> = {
  petal: ["#ff6f97", "#f7869f", "#fb9cb4", "#ffb3c6", "#f45d88", "#ff8fab", "#fcc2d1", "#ee7aa0"],
  seal: ["#e04a3c", "#f05a3e", "#d93a2f", "#ff6a4a"],
  stamen: ["#f0b13c", "#ffc75a", "#e39b2a"],
  kanji: ["#34508f", "#4565b2", "#2b4277"],
};

// Ravi's "R" monogram from the brand seal (64-unit viewBox).
const R_PATH =
  "M17 47V17h12.5c6.4 0 10.5 3.6 10.5 9.1 0 4.3-2.5 7.4-6.6 8.5L41.5 47h-6.4l-7.3-11.7H22.6V47H17Zm5.6-16.5h6.7c3.2 0 5.1-1.7 5.1-4.4s-1.9-4.3-5.1-4.3h-6.7v8.7Z";

function petalPath(R: number) {
  // Points up (−y); the notch at the tip is what makes it read as sakura.
  const p = new Path2D();
  p.moveTo(0, -R * 0.1);
  p.bezierCurveTo(-R * 0.58, -R * 0.28, -R * 0.66, -R * 0.86, -R * 0.21, -R * 1.0);
  p.lineTo(0, -R * 0.83);
  p.lineTo(R * 0.21, -R * 1.0);
  p.bezierCurveTo(R * 0.66, -R * 0.86, R * 0.58, -R * 0.28, 0, -R * 0.1);
  p.closePath();
  return p;
}

const sealSize = (R: number) => R * 0.64;

export const kanjiPos = (g: EmblemGeo) => ({ x: g.cx + g.R * 1.08, y: g.cy + g.R * 0.86, size: g.R * 0.42 });

const fontVar = (name: string, fallback: string) =>
  (typeof document !== "undefined" && getComputedStyle(document.body).getPropertyValue(name).trim()) || fallback;

export const jpFont = () => fontVar("--font-jp", "serif");
export const displayFont = () => fontVar("--font-display", "Georgia, serif");
export const sansFont = () => fontVar("--font-sans", "system-ui, sans-serif");

type Mode = "mask" | "art";

export function drawEmblem(ctx: CanvasRenderingContext2D, g: EmblemGeo, mode: Mode) {
  const { cx, cy, R } = g;
  const rgb = (r: Region) => `rgb(${MASK[r].join(",")})`;
  const S = sealSize(R);

  // Petals
  const petal = petalPath(R);
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((i * 2 * Math.PI) / 5);
    if (mode === "mask") {
      ctx.fillStyle = rgb("petal");
      ctx.fill(petal);
    } else {
      ctx.fillStyle = "#fbd3dc";
      ctx.fill(petal);
      ctx.lineWidth = Math.max(1, R * 0.008);
      ctx.strokeStyle = "rgba(232, 112, 142, .55)";
      ctx.stroke(petal);
      // fine veins fanning to the notch
      ctx.strokeStyle = "rgba(232, 112, 142, .28)";
      ctx.lineWidth = Math.max(0.6, R * 0.004);
      for (const k of [-0.16, 0, 0.16]) {
        ctx.beginPath();
        ctx.moveTo(0, -R * 0.36);
        ctx.quadraticCurveTo(k * R * 0.6, -R * 0.62, k * R, -R * 0.84);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Clear a breathing gap around the seal so it reads as its own mark
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.roundRect(cx - S / 2 - R * 0.05, cy - S / 2 - R * 0.05, S + R * 0.1, S + R * 0.1, S * 0.26);
  ctx.fill();
  ctx.restore();

  // Stamens between the petals
  for (let i = 0; i < 5; i++) {
    const a = ((i + 0.5) * 2 * Math.PI) / 5 - Math.PI / 2;
    const x = cx + Math.cos(a) * R * 0.56;
    const y = cy + Math.sin(a) * R * 0.56;
    ctx.fillStyle = mode === "mask" ? rgb("stamen") : "#f0b13c";
    ctx.beginPath();
    ctx.arc(x, y, R * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }

  // The hanko seal with the R monogram
  ctx.save();
  ctx.translate(cx - S / 2, cy - S / 2);
  ctx.fillStyle = mode === "mask" ? rgb("seal") : "#e04a3c";
  ctx.beginPath();
  ctx.roundRect(0, 0, S, S, S * 0.22);
  ctx.fill();
  const k = S / 58; // seal body spans 58 of the logo's 64 units
  ctx.translate(-3 * k, -3 * k);
  ctx.scale(k, k);
  const rPath = new Path2D(R_PATH);
  if (mode === "mask") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill(rPath);
  } else {
    ctx.strokeStyle = "rgba(255, 248, 242, .9)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(7.5, 7.5, 49, 49, 10);
    ctx.stroke();
    ctx.fillStyle = "#fff8f2";
    ctx.fill(rPath);
    ctx.font = `700 7.4px ${jpFont()}`;
    ctx.textAlign = "center";
    ["ラ", "ヴ", "ィ"].forEach((c, i) => ctx.fillText(c, 50, 22 + i * 10));
    ctx.beginPath();
    ctx.arc(50, 49.5, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 桜 — the signature
  const kp = kanjiPos(g);
  ctx.save();
  ctx.font = `700 ${kp.size}px ${jpFont()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = mode === "mask" ? rgb("kanji") : "#34508f";
  ctx.fillText("桜", kp.x, kp.y);
  ctx.restore();
}

/** Name + title under the emblem (art only — drawn as type, not particles). */
export function drawCaption(ctx: CanvasRenderingContext2D, g: EmblemGeo, subtitle: string, alpha: number) {
  if (alpha <= 0) return;
  const { cx, cy, R } = g;
  const nameSize = Math.max(26, R * 0.27);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#262b3d";
  ctx.font = `600 ${nameSize}px ${displayFont()}`;
  const y = cy + R * 1.42;
  const name = "Ravi ";
  const tail = "Y.T.";
  const wName = ctx.measureText(name).width;
  const wTail = ctx.measureText(tail).width;
  const x0 = cx - (wName + wTail) / 2;
  ctx.textAlign = "left";
  ctx.fillText(name, x0, y);
  ctx.fillStyle = "#e04a3c";
  ctx.fillText(tail, x0 + wName, y);
  ctx.textAlign = "center";
  ctx.fillStyle = "#5c6275";
  ctx.font = `600 ${Math.max(11, R * 0.075)}px ${sansFont()}`;
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.max(2, R * 0.022)}px`;
  ctx.fillText(subtitle.toUpperCase(), cx, y + nameSize * 0.95);
  ctx.restore();
}

/**
 * Sample the mask into ~n target points (uniform grid, jittered), each tagged
 * with its region. Seal and kanji are sampled a little denser so the logo and
 * the glyph stay legible at particle resolution.
 */
export function sampleTargets(g: EmblemGeo, n: number, rand: () => number) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(g.w);
  c.height = Math.ceil(g.h);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  drawEmblem(ctx, g, "mask");
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);

  const classify = (i: number): Region | null => {
    if (data[i + 3] < 200) return null;
    const r = data[i], gg = data[i + 1], b = data[i + 2];
    if (b > 180 && r < 90 && gg < 90) return "kanji";
    if (r > 180 && gg > 180 && b < 90) return "stamen";
    if (gg > 180 && r < 90) return "seal";
    if (r > 180 && gg < 90) return "petal";
    return null;
  };

  // Pass 1: area per region (coarse, every 2px)
  const area: Record<Region, number> = { petal: 0, seal: 0, stamen: 0, kanji: 0 };
  for (let y = 0; y < height; y += 2)
    for (let x = 0; x < width; x += 2) {
      const reg = classify((y * width + x) * 4);
      if (reg) area[reg] += 4;
    }
  const weight: Record<Region, number> = { petal: 1, seal: 1.7, stamen: 2.2, kanji: 2.4 };
  const weighted = (Object.keys(area) as Region[]).reduce((s, r) => s + area[r] * weight[r], 0) || 1;

  // Pass 2: per-region grid with spacing chosen to hit its share of n
  const out: { x: number; y: number; region: Region }[] = [];
  (Object.keys(area) as Region[]).forEach((reg) => {
    if (!area[reg]) return;
    const share = (n * area[reg] * weight[reg]) / weighted;
    const step = Math.max(1.2, Math.sqrt(area[reg] / share));
    for (let y = step / 2; y < height; y += step)
      for (let x = step / 2; x < width; x += step) {
        const jx = x + (rand() - 0.5) * step * 0.6;
        const jy = y + (rand() - 0.5) * step * 0.6;
        const ix = Math.min(width - 1, Math.max(0, Math.round(jx)));
        const iy = Math.min(height - 1, Math.max(0, Math.round(jy)));
        if (classify((iy * width + ix) * 4) === reg) out.push({ x: jx, y: jy, region: reg });
      }
  });
  return out;
}
