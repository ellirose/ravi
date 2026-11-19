/*
 * The intro mark — a porthole medallion: a sumi-lacquer ring frames a red sun
 * and Mount Fuji (snowcap, kasumi mist, a still lake), while a sakura blossom
 * and Ravi's "R" hanko seal break out of the frame towards the viewer.
 *
 * Every element belongs to a depth layer so the finished mark can be
 * composited with parallax — the scene sits behind the frame, the blossom and
 * seal float in front — which, with the lighting below, gives it a 3D read.
 *   - mask: flat region colours, sampled to give each particle its target
 *   - art:  shaded, lit layers, prerendered once and composited per frame
 */

export type Region = "ring" | "sun" | "fuji" | "snow" | "sakura" | "core" | "stamen" | "seal";
export const REGIONS: Region[] = ["ring", "sun", "fuji", "snow", "sakura", "core", "stamen", "seal"];

export type EmblemGeo = { w: number; h: number; cx: number; cy: number; R: number };

export function emblemGeometry(w: number, h: number): EmblemGeo {
  const R = Math.min(w * 0.33, h * 0.23);
  return { w, h, cx: w / 2, cy: h * 0.42, R };
}

/* Mask colours: one distinct colour per region so sampling can classify pixels. */
export const MASK: Record<Region, [number, number, number]> = {
  ring: [255, 0, 255],
  sun: [255, 0, 0],
  fuji: [0, 0, 255],
  snow: [0, 255, 255],
  sakura: [255, 128, 0],
  core: [255, 255, 255],
  stamen: [255, 255, 0],
  seal: [0, 255, 0],
};

/* Electric particle palette: blue, pink, white, red and sumi black. */
export const PALETTE: Record<Region, string[]> = {
  ring: ["#1b1f30", "#2b3150", "#11141f"],
  sun: ["#ff3b30", "#e8231f", "#ff6248"],
  fuji: ["#2563ff", "#4a93ff", "#1b47c9"],
  snow: ["#ffffff", "#f1f6ff"],
  sakura: ["#ff4f98", "#ff7fb6", "#ff9fca"],
  core: ["#ffffff"],
  stamen: ["#ff2d55", "#e8231f"],
  seal: ["#ff3b30", "#e8231f", "#ff5a3c"],
};
/** Charge glow around each spark. */
export const HALO: Record<Region, string> = {
  ring: "#4d7dff",
  sun: "#ff6a4a",
  fuji: "#5aa2ff",
  snow: "#6f95ea",
  sakura: "#ff7fb6",
  core: "#ff8fbf",
  stamen: "#ff4b6e",
  seal: "#ff6a4a",
};
/** Light sparks get a coloured under-stroke so their trails read on washi. */
export const UNDER: Partial<Record<Region, string>> = { snow: "#86a5ea", core: "#ff9fca" };
/** Dark sparks keep their colour at the head instead of turning white-hot. */
export const DARK: Partial<Record<Region, true>> = { ring: true };

/* Depth (towards the viewer). The frame is the reference plane. */
export const FRAME_DEPTH = 0.7;
export const DEPTH: Record<Region, number> = {
  sun: 0, fuji: 0.35, snow: 0.35, ring: FRAME_DEPTH, sakura: 1.25, core: 1.25, stamen: 1.25, seal: 1.25,
};

const RING_IN = 0.885; // inner radius of the frame (× R)

// Ravi's "R" monogram from the brand seal (64-unit viewBox).
const R_PATH =
  "M17 47V17h12.5c6.4 0 10.5 3.6 10.5 9.1 0 4.3-2.5 7.4-6.6 8.5L41.5 47h-6.4l-7.3-11.7H22.6V47H17Zm5.6-16.5h6.7c3.2 0 5.1-1.7 5.1-4.4s-1.9-4.3-5.1-4.3h-6.7v8.7Z";

const fontVar = (name: string, fallback: string) =>
  (typeof document !== "undefined" && getComputedStyle(document.body).getPropertyValue(name).trim()) || fallback;

export const jpFont = () => fontVar("--font-jp", "serif");
export const displayFont = () => fontVar("--font-display", "Georgia, serif");
export const sansFont = () => fontVar("--font-sans", "system-ui, sans-serif");

type Mode = "mask" | "art";
type Ctx = CanvasRenderingContext2D;

/* Shadow blur/offset are in device pixels and ignore the transform. */
let PX = 1;
function shadow(ctx: Ctx, color: string, blur: number, ox = 0, oy = 0) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * PX;
  ctx.shadowOffsetX = ox * PX;
  ctx.shadowOffsetY = oy * PX;
}
function noShadow(ctx: Ctx) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
}
const rgb = (r: Region) => `rgb(${MASK[r].join(",")})`;
const unit = (g: EmblemGeo) => ({ X: (u: number) => g.cx + u * g.R, Y: (v: number) => g.cy + v * g.R });

/* ── Shapes ─────────────────────────────────────────────────────────────── */

function petalPath(s: number) {
  // Points up (−y); the notch at the tip is what makes it read as sakura.
  const p = new Path2D();
  p.moveTo(0, -s * 0.1);
  p.bezierCurveTo(-s * 0.58, -s * 0.28, -s * 0.66, -s * 0.86, -s * 0.21, -s * 1.0);
  p.lineTo(0, -s * 0.83);
  p.lineTo(s * 0.21, -s * 1.0);
  p.bezierCurveTo(s * 0.66, -s * 0.86, s * 0.58, -s * 0.28, 0, -s * 0.1);
  p.closePath();
  return p;
}

const FUJI_BASE = 0.64;

function fujiPath(g: EmblemGeo) {
  const { X, Y } = unit(g);
  const p = new Path2D();
  p.moveTo(X(-1.3), Y(FUJI_BASE));
  p.bezierCurveTo(X(-0.62), Y(0.47), X(-0.3), Y(-0.08), X(-0.13), Y(-0.34));
  // crater rim: three soft bumps
  p.quadraticCurveTo(X(-0.09), Y(-0.375), X(-0.05), Y(-0.335));
  p.quadraticCurveTo(X(0), Y(-0.385), X(0.05), Y(-0.335));
  p.quadraticCurveTo(X(0.09), Y(-0.375), X(0.13), Y(-0.34));
  p.bezierCurveTo(X(0.3), Y(-0.08), X(0.62), Y(0.47), X(1.3), Y(FUJI_BASE));
  p.closePath();
  return p;
}

function polyPath(g: EmblemGeo, pts: number[][]) {
  const { X, Y } = unit(g);
  const p = new Path2D();
  pts.forEach(([u, v], i) => (i ? p.lineTo(X(u), Y(v)) : p.moveTo(X(u), Y(v))));
  p.closePath();
  return p;
}

const SNOW = [
  [-0.6, -0.6], [0.6, -0.6], [0.6, -0.1],
  [0.44, -0.11], [0.37, -0.02], [0.3, -0.13], [0.22, -0.05], [0.15, -0.17], [0.07, 0.01],
  [-0.01, -0.15], [-0.09, -0.03], [-0.17, -0.16], [-0.25, -0.06], [-0.33, -0.14], [-0.42, -0.09], [-0.6, -0.1],
];
// Shaded (eastern) face of the mountain, split along a wandering ridge.
const SHADE = [[0.015, -0.42], [0.06, -0.22], [0.025, -0.03], [0.11, 0.18], [0.07, 0.42], [0.15, 0.7], [1.4, 0.7], [1.4, -0.42]];

const MIST: [number, number, number, number][] = [
  // x0, x1, yCentre, thickness (× R)
  [-0.46, 0.6, 0.3, 0.1],
  [-0.14, 0.44, 0.47, 0.085],
];

const SUN = { u: 0.34, v: -0.37, r: 0.27 };
const BLOSSOMS = [
  { u: -0.7, v: 0.6, r: 0.4, rot: -0.25 },
  { u: -0.24, v: 0.9, r: 0.19, rot: 0.6 },
];
const PETALS = [
  { u: -0.52, v: -0.42, s: 0.085, rot: 0.7 },
  { u: -0.32, v: -0.64, s: 0.065, rot: -0.5 },
  { u: 0.66, v: 0.08, s: 0.06, rot: 1.9 },
];
const SEAL = { u: 0.72, v: 0.64, s: 0.44, rot: -0.08 };

/* Kasumi (suyari-gasumi) band: a long cloud that tapers to fine points. */
function kasumi(x0: number, x1: number, y: number, t: number) {
  const L = x1 - x0;
  const p = new Path2D();
  p.moveTo(x0, y);
  p.bezierCurveTo(x0 + L * 0.22, y - t * 0.78, x1 - L * 0.3, y - t * 0.74, x1, y - t * 0.06);
  p.bezierCurveTo(x1 - L * 0.24, y + t * 0.5, x0 + L * 0.3, y + t * 0.52, x0, y);
  p.closePath();
  return p;
}

/* ── Layers ─────────────────────────────────────────────────────────────── */

export type LayerName = "base" | "sun" | "fuji" | "mist" | "frame" | "front";
const LAYER_DEPTH: Record<LayerName, number> = { base: FRAME_DEPTH, sun: 0, fuji: 0.35, mist: 0.55, frame: FRAME_DEPTH, front: 1.25 };
const CLIPPED: LayerName[] = ["sun", "fuji", "mist"];

function drawBase(ctx: Ctx, g: EmblemGeo) {
  const { cx, cy, R } = g;
  // The medallion rests on the paper: ambient + contact shadows.
  ctx.save();
  ctx.fillStyle = "#f3f6fc";
  shadow(ctx, "rgba(38, 43, 61, .2)", R * 0.2, R * 0.03, R * 0.1);
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  shadow(ctx, "rgba(38, 43, 61, .28)", R * 0.035, 0, R * 0.02);
  ctx.fill();
  ctx.restore();
  // Sky: a pale, slightly cool washi.
  const sky = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.55, 0, cx, cy, R * 1.25);
  sky.addColorStop(0, "#ffffff");
  sky.addColorStop(0.55, "#f1f5fd");
  sky.addColorStop(1, "#dbe6f8");
  ctx.fillStyle = sky;
  ctx.beginPath();
  ctx.arc(cx, cy, R * RING_IN + 1, 0, Math.PI * 2);
  ctx.fill();
}

function drawSun(ctx: Ctx, g: EmblemGeo, mode: Mode) {
  const { X, Y } = unit(g);
  const x = X(SUN.u), y = Y(SUN.v), r = SUN.r * g.R;
  if (mode === "mask") {
    ctx.fillStyle = rgb("sun");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const halo = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 1.9);
  halo.addColorStop(0, "rgba(255, 96, 72, .28)");
  halo.addColorStop(1, "rgba(255, 96, 72, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.9, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r * 1.04);
  body.addColorStop(0, "#ff9a78");
  body.addColorStop(0.45, "#f43a2c");
  body.addColorStop(1, "#bf1d21");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function wave(ctx: Ctx, g: EmblemGeo, v: number, u0: number, u1: number, amp: number) {
  const { X, Y } = unit(g);
  ctx.beginPath();
  for (let k = 0; k <= 32; k++) {
    const t = k / 32;
    const px = X(u0 + (u1 - u0) * t);
    const py = Y(v) + Math.sin(t * Math.PI * 5) * amp * g.R;
    if (k) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
}

function drawFuji(ctx: Ctx, g: EmblemGeo, mode: Mode) {
  const { R } = g;
  const { X, Y } = unit(g);
  const fuji = fujiPath(g);
  const snow = polyPath(g, SNOW);
  const shade = polyPath(g, SHADE);
  const waves: [number, number, number][] = [[0.75, -0.42, 0.52], [0.85, -0.3, 0.42]];

  if (mode === "mask") {
    ctx.fillStyle = rgb("fuji");
    ctx.fill(fuji);
    ctx.save();
    ctx.clip(fuji);
    ctx.fillStyle = rgb("snow");
    ctx.fill(snow);
    ctx.restore();
    ctx.strokeStyle = rgb("fuji");
    ctx.lineWidth = R * 0.03;
    ctx.lineCap = "round";
    for (const [v, a, b] of waves) {
      wave(ctx, g, v, a, b, 0.012);
      ctx.stroke();
    }
    return;
  }

  // Lake below the mountain, with a faint reflection.
  const lake = ctx.createLinearGradient(0, Y(FUJI_BASE), 0, Y(1));
  lake.addColorStop(0, "#cfe0fb");
  lake.addColorStop(1, "#e9f1fd");
  ctx.fillStyle = lake;
  ctx.fillRect(X(-1.1), Y(FUJI_BASE), R * 2.2, R * 0.5);
  ctx.save();
  ctx.translate(0, Y(FUJI_BASE) * 1.55);
  ctx.scale(1, -0.55);
  ctx.fillStyle = "rgba(37, 87, 214, .16)";
  ctx.fill(fuji);
  ctx.restore();
  ctx.lineCap = "round";
  for (const [v, a, b] of waves) {
    ctx.strokeStyle = "rgba(255, 255, 255, .9)";
    ctx.lineWidth = R * 0.016;
    ctx.save();
    ctx.translate(0, -R * 0.012);
    wave(ctx, g, v, a, b, 0.012);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = "#3a6fe6";
    ctx.lineWidth = R * 0.022;
    wave(ctx, g, v, a, b, 0.012);
    ctx.stroke();
  }

  // Mountain body, lit from the upper left.
  const body = ctx.createLinearGradient(0, Y(-0.36), 0, Y(FUJI_BASE));
  body.addColorStop(0, "#4b86ff");
  body.addColorStop(1, "#1d44b0");
  ctx.fillStyle = body;
  ctx.fill(fuji);
  ctx.save();
  ctx.clip(fuji);
  const dark = ctx.createLinearGradient(X(0), Y(-0.36), X(0.9), Y(FUJI_BASE));
  dark.addColorStop(0, "#21449f");
  dark.addColorStop(1, "#122a6c");
  ctx.fillStyle = dark;
  ctx.fill(shade);
  // ridges / gullies
  ctx.lineWidth = R * 0.008;
  const gullies: [number, number, number, number, string][] = [
    [-0.2, 0.0, -0.42, 0.5, "rgba(255,255,255,.16)"],
    [-0.08, 0.02, -0.18, 0.55, "rgba(255,255,255,.12)"],
    [0.18, 0.0, 0.36, 0.5, "rgba(0,10,40,.25)"],
    [0.3, 0.0, 0.62, 0.52, "rgba(0,10,40,.2)"],
  ];
  for (const [u0, v0, u1, v1, c] of gullies) {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.moveTo(X(u0), Y(v0));
    ctx.quadraticCurveTo(X((u0 + u1) / 2 + 0.03), Y((v0 + v1) / 2), X(u1), Y(v1));
    ctx.stroke();
  }
  // Snowcap with a little thickness (its own shadow on the rock).
  ctx.save();
  shadow(ctx, "rgba(8, 24, 80, .45)", R * 0.025, R * 0.004, R * 0.012);
  ctx.fillStyle = "#ffffff";
  ctx.fill(snow);
  ctx.restore();
  ctx.save();
  ctx.clip(snow);
  const cold = ctx.createLinearGradient(X(0), Y(-0.36), X(0.5), Y(0));
  cold.addColorStop(0, "#dbe5f8");
  cold.addColorStop(1, "#b7c9ee");
  ctx.fillStyle = cold;
  ctx.fill(shade);
  ctx.restore();
  ctx.restore();
  // Rim light along the crater.
  ctx.strokeStyle = "rgba(255,255,255,.9)";
  ctx.lineWidth = R * 0.01;
  ctx.beginPath();
  ctx.moveTo(X(-0.13), Y(-0.338));
  ctx.quadraticCurveTo(X(-0.09), Y(-0.373), X(-0.05), Y(-0.333));
  ctx.stroke();
}

function drawMist(ctx: Ctx, g: EmblemGeo, mode: Mode) {
  const { X, Y } = unit(g);
  const R = g.R;
  ctx.save();
  if (mode === "mask") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
  } else {
    shadow(ctx, "rgba(20, 45, 120, .25)", R * 0.05, R * 0.006, R * 0.022);
    ctx.fillStyle = "#ffffff";
  }
  for (const [u0, u1, v, t] of MIST) ctx.fill(kasumi(X(u0), X(u1), Y(v), t * R));
  ctx.restore();
  if (mode === "art") {
    // a faint cool underside gives each band a little volume
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(120, 150, 220, .4)";
    ctx.lineWidth = Math.max(1, R * 0.006);
    for (const [u0, u1, v, t] of MIST) {
      const L = u1 - u0;
      ctx.beginPath();
      ctx.moveTo(X(u0 + L * 0.18), Y(v + t * 0.22));
      ctx.bezierCurveTo(X(u0 + L * 0.4), Y(v + t * 0.36), X(u1 - L * 0.35), Y(v + t * 0.34), X(u1 - L * 0.12), Y(v + t * 0.12));
      ctx.stroke();
    }
  }
}

function ringPath(g: EmblemGeo) {
  const p = new Path2D();
  p.arc(g.cx, g.cy, g.R, 0, Math.PI * 2);
  p.arc(g.cx, g.cy, g.R * RING_IN, 0, Math.PI * 2, true);
  return p;
}

function drawFrame(ctx: Ctx, g: EmblemGeo, mode: Mode) {
  const { cx, cy, R } = g;
  const ring = ringPath(g);
  if (mode === "mask") {
    ctx.fillStyle = rgb("ring");
    ctx.fill(ring);
    return;
  }
  // Inner shadow cast by the frame onto the scene behind it.
  const vig = ctx.createRadialGradient(cx, cy + R * 0.04, R * 0.72, cx, cy + R * 0.04, R * RING_IN);
  vig.addColorStop(0, "rgba(16, 22, 48, 0)");
  vig.addColorStop(1, "rgba(16, 22, 48, .3)");
  ctx.fillStyle = vig;
  ctx.beginPath();
  ctx.arc(cx, cy, R * RING_IN, 0, Math.PI * 2);
  ctx.fill();
  // Lacquered sumi torus.
  const lac = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  lac.addColorStop(0, "#56607f");
  lac.addColorStop(0.45, "#262b3d");
  lac.addColorStop(1, "#0f1220");
  ctx.fillStyle = lac;
  ctx.fill(ring);
  // specular highlight on the upper left, soft bounce light on the lower right
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255, 255, 255, .6)";
  ctx.lineWidth = R * 0.014;
  ctx.beginPath();
  ctx.arc(cx, cy, R * (RING_IN + 1) / 2 - R * 0.006, Math.PI * 1.08, Math.PI * 1.42);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 255, 255, .22)";
  ctx.lineWidth = R * 0.008;
  ctx.beginPath();
  ctx.arc(cx, cy, R * (RING_IN + 1) / 2, Math.PI * 1.46, Math.PI * 1.62);
  ctx.stroke();
  ctx.strokeStyle = "rgba(110, 150, 255, .35)";
  ctx.lineWidth = R * 0.01;
  ctx.beginPath();
  ctx.arc(cx, cy, R * (RING_IN + 1) / 2, Math.PI * 0.12, Math.PI * 0.38);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, R * 0.005);
  ctx.strokeStyle = "rgba(255, 255, 255, .25)";
  ctx.beginPath();
  ctx.arc(cx, cy, R - R * 0.004, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0, 0, 0, .35)";
  ctx.beginPath();
  ctx.arc(cx, cy, R * RING_IN, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPetal(ctx: Ctx, g: EmblemGeo, p: (typeof PETALS)[number], mode: Mode) {
  const { X, Y } = unit(g);
  const s = p.s * g.R;
  ctx.save();
  ctx.translate(X(p.u), Y(p.v));
  ctx.rotate(p.rot);
  ctx.scale(1, 0.8);
  ctx.translate(0, s * 0.55);
  const path = petalPath(s);
  if (mode === "mask") {
    ctx.fillStyle = rgb("sakura");
  } else {
    shadow(ctx, "rgba(120, 30, 70, .25)", g.R * 0.03, g.R * 0.008, g.R * 0.025);
    const f = ctx.createLinearGradient(0, 0, 0, -s);
    f.addColorStop(0, "#ff6aa6");
    f.addColorStop(1, "#ffd9e8");
    ctx.fillStyle = f;
  }
  ctx.fill(path);
  ctx.restore();
}

function drawBlossom(ctx: Ctx, g: EmblemGeo, b: (typeof BLOSSOMS)[number], mode: Mode) {
  const { X, Y } = unit(g);
  const s = b.r * g.R;
  const R = g.R;
  const petal = petalPath(s);
  ctx.save();
  ctx.translate(X(b.u), Y(b.v));
  ctx.scale(1, 0.9); // tilted a touch towards the viewer
  ctx.rotate(b.rot);
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i * 2 * Math.PI) / 5);
    if (mode === "mask") {
      ctx.fillStyle = rgb("sakura");
      ctx.fill(petal);
    } else {
      ctx.save();
      shadow(ctx, "rgba(130, 25, 70, .3)", R * 0.055, R * 0.01, R * 0.035);
      const f = ctx.createRadialGradient(0, 0, s * 0.05, 0, 0, s * 1.02);
      f.addColorStop(0, "#ff3f8e");
      f.addColorStop(0.32, "#ff86b8");
      f.addColorStop(0.75, "#ffd2e4");
      f.addColorStop(1, "#fff1f7");
      ctx.fillStyle = f;
      ctx.fill(petal);
      ctx.restore();
      ctx.lineWidth = Math.max(0.8, s * 0.012);
      ctx.strokeStyle = "rgba(225, 70, 130, .45)";
      ctx.stroke(petal);
      // curl highlight along the lit edge, and fine veins
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255, 255, 255, .75)";
      ctx.lineWidth = s * 0.035;
      ctx.beginPath();
      ctx.moveTo(-s * 0.16, -s * 0.3);
      ctx.quadraticCurveTo(-s * 0.48, -s * 0.55, -s * 0.3, -s * 0.9);
      ctx.stroke();
      ctx.strokeStyle = "rgba(214, 60, 120, .28)";
      ctx.lineWidth = Math.max(0.6, s * 0.008);
      for (const k of [-0.15, 0, 0.15]) {
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.3);
        ctx.quadraticCurveTo(k * s * 0.6, -s * 0.6, k * s, -s * 0.82);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  // Heart of the flower
  if (mode === "mask") {
    ctx.fillStyle = rgb("core");
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgb("stamen");
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * s * 0.36, Math.sin(a) * s * 0.36, s * 0.075, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const core = ctx.createRadialGradient(-s * 0.05, -s * 0.06, 0, 0, 0, s * 0.26);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(1, "#ffc2da");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const ex = Math.cos(a) * s * 0.36, ey = Math.sin(a) * s * 0.36;
      ctx.strokeStyle = "#e0457b";
      ctx.lineWidth = Math.max(0.8, s * 0.018);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * s * 0.1, Math.sin(a) * s * 0.1);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.save();
      shadow(ctx, "rgba(90, 0, 20, .35)", R * 0.012, 0, R * 0.006);
      const an = ctx.createRadialGradient(ex - s * 0.025, ey - s * 0.03, 0, ex, ey, s * 0.07);
      an.addColorStop(0, "#ff8a8a");
      an.addColorStop(0.5, "#ff2d55");
      an.addColorStop(1, "#b3122f");
      ctx.fillStyle = an;
      ctx.beginPath();
      ctx.arc(ex, ey, s * 0.065, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawSeal(ctx: Ctx, g: EmblemGeo, mode: Mode) {
  const { X, Y } = unit(g);
  const R = g.R;
  const S = SEAL.s * R;
  const rr = (c: Ctx, dx = 0, dy = 0) => {
    c.beginPath();
    c.roundRect(-S / 2 + dx, -S / 2 + dy, S, S, S * 0.22);
  };
  ctx.save();
  ctx.translate(X(SEAL.u), Y(SEAL.v));
  ctx.rotate(SEAL.rot);
  const k = S / 58; // seal body spans 58 of the logo's 64 units
  const toLogo = () => {
    ctx.translate(-S / 2 - 3 * k, -S / 2 - 3 * k);
    ctx.scale(k, k);
  };
  const rPath = new Path2D(R_PATH);

  if (mode === "mask") {
    ctx.fillStyle = rgb("seal");
    rr(ctx);
    ctx.fill();
    toLogo();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill(rPath);
    ctx.restore();
    return;
  }

  // A carved stone block: cast shadow, extruded side, lit top face.
  const depth = S * 0.12;
  const steps = 8;
  ctx.save();
  shadow(ctx, "rgba(90, 10, 10, .38)", R * 0.08, R * 0.025, R * 0.06);
  ctx.fillStyle = "#8c1a17";
  rr(ctx, depth * 0.35, depth);
  ctx.fill();
  ctx.restore();
  for (let i = steps; i >= 1; i--) {
    const t = i / steps;
    ctx.fillStyle = `rgb(${Math.round(150 - 40 * t)}, ${Math.round(28 - 8 * t)}, ${Math.round(26 - 6 * t)})`;
    rr(ctx, depth * 0.35 * t, depth * t);
    ctx.fill();
  }
  const face = ctx.createLinearGradient(-S / 2, -S / 2, S / 2, S / 2);
  face.addColorStop(0, "#ff7258");
  face.addColorStop(0.5, "#ec372b");
  face.addColorStop(1, "#c8221f");
  ctx.fillStyle = face;
  rr(ctx);
  ctx.fill();
  const bevel = ctx.createLinearGradient(-S / 2, -S / 2, S / 2, S / 2);
  bevel.addColorStop(0, "rgba(255, 255, 255, .7)");
  bevel.addColorStop(0.5, "rgba(255, 255, 255, 0)");
  ctx.strokeStyle = bevel;
  ctx.lineWidth = Math.max(1, S * 0.03);
  rr(ctx);
  ctx.stroke();

  toLogo();
  // Debossed R: a dark inner lip, then the cream fill.
  ctx.save();
  ctx.translate(0.7, 0.9);
  ctx.fillStyle = "rgba(100, 8, 8, .55)";
  ctx.fill(rPath);
  ctx.restore();
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
  ctx.restore();
}

function drawFront(ctx: Ctx, g: EmblemGeo, mode: Mode) {
  for (const p of PETALS) drawPetal(ctx, g, p, mode);
  for (const b of BLOSSOMS) drawBlossom(ctx, g, b, mode);
  drawSeal(ctx, g, mode);
}

/** Flat region mask used to place the particles. */
export function drawMask(ctx: Ctx, g: EmblemGeo) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(g.cx, g.cy, g.R * RING_IN, 0, Math.PI * 2);
  ctx.clip();
  drawSun(ctx, g, "mask");
  drawFuji(ctx, g, "mask");
  drawMist(ctx, g, "mask");
  ctx.restore();
  drawFrame(ctx, g, "mask");
  drawFront(ctx, g, "mask");
}

/* ── Prerendered art + parallax compositor ──────────────────────────────── */

export type ArtLayers = {
  g: EmblemGeo;
  dpr: number;
  x0: number; y0: number; cw: number; ch: number;
  layers: Record<LayerName, HTMLCanvasElement>;
  comp: HTMLCanvasElement;
};

export function renderArtLayers(g: EmblemGeo, dpr: number): ArtLayers {
  const x0 = g.cx - g.R * 1.5, y0 = g.cy - g.R * 1.25;
  const cw = g.R * 3, ch = g.R * 2.65;
  const make = () => {
    const c = document.createElement("canvas");
    c.width = Math.ceil(cw * dpr);
    c.height = Math.ceil(ch * dpr);
    return c;
  };
  PX = dpr;
  const draw: Record<LayerName, (c: Ctx) => void> = {
    base: (c) => drawBase(c, g),
    sun: (c) => drawSun(c, g, "art"),
    fuji: (c) => drawFuji(c, g, "art"),
    mist: (c) => drawMist(c, g, "art"),
    frame: (c) => drawFrame(c, g, "art"),
    front: (c) => drawFront(c, g, "art"),
  };
  const layers = {} as Record<LayerName, HTMLCanvasElement>;
  (Object.keys(draw) as LayerName[]).forEach((name) => {
    const c = make();
    const cx = c.getContext("2d")!;
    cx.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr);
    draw[name](cx);
    noShadow(cx);
    layers[name] = c;
  });
  return { g, dpr, x0, y0, cw, ch, layers, comp: make() };
}

/**
 * Composite the layers with a camera offset `o` (px, at depth 1 relative to the
 * frame): the scene behind the porthole slides against the frame, the blossom
 * and seal slide the other way — a parallax read of real depth.
 */
export function compositeArt(ctx: Ctx, L: ArtLayers, o: { x: number; y: number }, alpha: number) {
  if (alpha <= 0) return;
  const c = L.comp.getContext("2d")!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, L.comp.width, L.comp.height);
  c.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
  const put = (name: LayerName) => {
    const d = LAYER_DEPTH[name] - FRAME_DEPTH;
    c.drawImage(L.layers[name], d * o.x, d * o.y, L.cw, L.ch);
  };
  put("base");
  c.save();
  c.beginPath();
  c.arc(L.g.cx - L.x0, L.g.cy - L.y0, L.g.R * RING_IN + 0.5, 0, Math.PI * 2);
  c.clip();
  CLIPPED.forEach(put);
  c.restore();
  put("frame");
  put("front");
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(L.comp, L.x0, L.y0, L.cw, L.ch);
  ctx.restore();
}

/** Name + title under the mark (drawn as type, not particles). */
export function drawCaption(ctx: Ctx, g: EmblemGeo, subtitle: string, alpha: number) {
  if (alpha <= 0) return;
  const { cx, cy, R } = g;
  const nameSize = Math.max(26, R * 0.26);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#262b3d";
  ctx.font = `600 ${nameSize}px ${displayFont()}`;
  const y = cy + R * 1.46;
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
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${Math.max(2, R * 0.022)}px`;
  ctx.fillText(subtitle.toUpperCase(), cx, y + nameSize * 0.95);
  ctx.restore();
}

/**
 * Sample the mask into ~n target points (uniform grid, jittered), each tagged
 * with its region. Small regions are weighted up so the ring, seal and the
 * flower's heart stay legible at particle resolution.
 */
export function sampleTargets(g: EmblemGeo, n: number, rand: () => number) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(g.w);
  c.height = Math.ceil(g.h);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  drawMask(ctx, g);
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);

  const classify = (i: number): Region | null => {
    if (data[i + 3] < 240) return null;
    const r = data[i], gg = data[i + 1], b = data[i + 2];
    for (const reg of REGIONS) {
      const m = MASK[reg];
      if (Math.abs(r - m[0]) + Math.abs(gg - m[1]) + Math.abs(b - m[2]) < 60) return reg;
    }
    return null;
  };

  const area = Object.fromEntries(REGIONS.map((r) => [r, 0])) as Record<Region, number>;
  for (let y = 0; y < height; y += 2)
    for (let x = 0; x < width; x += 2) {
      const reg = classify((y * width + x) * 4);
      if (reg) area[reg] += 4;
    }
  const weight: Record<Region, number> = { ring: 1.7, sun: 1, fuji: 0.85, snow: 1.25, sakura: 1.1, core: 2.4, stamen: 3.2, seal: 1.6 };
  const weighted = REGIONS.reduce((s, r) => s + area[r] * weight[r], 0) || 1;

  const out: { x: number; y: number; region: Region }[] = [];
  REGIONS.forEach((reg) => {
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
