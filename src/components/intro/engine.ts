import {
  compositeArt, DARK, DEPTH, drawCaption, emblemGeometry, FRAME_DEPTH, HALO, PALETTE, REGIONS, renderArtLayers,
  sampleTargets, UNDER, type ArtLayers, type EmblemGeo, type Region,
} from "./emblem";

/*
 * Intro choreography
 *   duet      Five charged sparks — blue, pink, white, red, black — are born
 *             from a single point of light and waltz in 3D. They dance in
 *             pairs (partners rotate; one waits its turn on a figure-eight),
 *             each pair orbiting on a tilted, precessing plane so their trails
 *             braid into double helices. Perspective, depth fog, twisting
 *             ribbon trails, painter-sorted segments and soft shadows cast on
 *             the paper give the paths their depth.
 *   separate  At a moment when the pairs are bonded, partners part. Each spark
 *             flies to its part of the mark and paints it, shedding the sparks
 *             that fill its region (blue → Fuji, white → snow, red → sun and
 *             seal, pink → blossom, black → the frame, drawn in one circle).
 *   manifest  ART_FADE — a charge burst runs through the form and the lit 3D
 *             mark powers on beneath it, starting a gentle parallax sway.
 *             When it completes the site is revealed (onReveal).
 *   exit      the iris opens onto the page while a paper "moon" holds the
 *             mark for HOLD, then the sparks scatter and fade (EXIT).
 */
const MIN_DUET = 2600; // ms of dancing before the pairs may part
const MAX_WAIT = 3500; // part anyway if the page is still not ready
const PERIOD = 1.5; // s per pairing
const BLEND = 0.75; // s to change partners
const FLIGHT_MIN = 380;
const FLIGHT_VAR = 260;
const ART_FADE = 520;
const HOLD = 1200;
const EXIT = 1700;
const F = 1100; // focal length of the virtual camera (px)
const BG = "251, 247, 240"; // --color-washi
const ARC_COLORS = ["#2f6bff", "#4d8dff", "#2f6bff", "#ff4f98", "#ff3b30", "#7aa8ff"];

export type IntroOptions = {
  isReady: () => boolean;
  subtitle: () => string;
  onReveal: () => void;
  onDone: () => void;
  reduced: boolean;
};

type V3 = [number, number, number];
type UV = [number, number];

/* The five lead sparks. */
type LeadDef = {
  color: string; light: string; shade: string; halo: string; edge?: string;
  coreIn: string; coreOut: string; regions: Region[]; duration: number;
};
const LEADS: LeadDef[] = [
  { color: "#2563ff", light: "#9cc2ff", shade: "#0d2a86", halo: "77, 141, 255", coreIn: "#ffffff", coreOut: "#2563ff", regions: ["fuji"], duration: 1750 },
  { color: "#ff4f98", light: "#ffc2da", shade: "#a8195a", halo: "255, 127, 182", coreIn: "#ffffff", coreOut: "#ff4f98", regions: ["sakura"], duration: 1700 },
  { color: "#ffffff", light: "#ffffff", shade: "#9fb3dc", halo: "143, 176, 255", edge: "#9db5ea", coreIn: "#ffffff", coreOut: "#dfe8ff", regions: ["snow", "core"], duration: 1600 },
  { color: "#ff3b30", light: "#ffb09c", shade: "#9e1218", halo: "255, 106, 74", coreIn: "#ffffff", coreOut: "#ff3b30", regions: ["sun", "seal", "stamen"], duration: 1700 },
  { color: "#1b1f30", light: "#6a7396", shade: "#05060b", halo: "77, 125, 255", coreIn: "#7d88b3", coreOut: "#10131f", regions: ["ring"], duration: 1900 },
];
const LEAD_OF = {} as Record<Region, number>;
LEADS.forEach((l, k) => l.regions.forEach((r) => (LEAD_OF[r] = k)));

/* Who dances with whom: [pairA0, pairA1, pairB0, pairB1, solo] per pairing. */
const PAIRINGS = [
  [0, 2, 1, 3, 4], // blue·white, pink·red — black waits
  [2, 1, 3, 4, 0], // white·pink, red·black — blue waits
  [0, 4, 1, 2, 3], // blue·black, pink·white — red waits
  [3, 0, 4, 1, 2], // red·blue, black·pink — white waits
];
const roleOf = (set: number, k: number) => PAIRINGS[set % PAIRINGS.length].indexOf(k);

/* Paths each spark paints in the mark (units of R from the mark's centre). */
const loop = (cu: number, cv: number, r: number, n: number, a0 = -Math.PI / 2): UV[] =>
  Array.from({ length: n + 1 }, (_, k) => {
    const a = a0 + (k * Math.PI * 2) / n;
    return [cu + Math.cos(a) * r, cv + Math.sin(a) * r];
  });
const WAYPOINTS: UV[][] = [
  // blue: up the western slope, over the crater, down the east, then across the body and the lake
  [[-0.8, 0.62], [-0.42, 0.22], [-0.14, -0.25], [0.14, -0.25], [0.42, 0.22], [0.8, 0.62], [0.36, 0.42], [-0.32, 0.4], [-0.06, 0.74], [0.32, 0.8]],
  // pink: drifting petals, then a slow spiral through each blossom
  [[0.66, 0.08], [-0.32, -0.64], [-0.52, -0.42], ...loop(-0.7, 0.6, 0.27, 7), ...loop(-0.24, 0.9, 0.11, 5)],
  // white: the snowcap, then the hearts of the flowers
  [[-0.4, -0.1], [-0.18, -0.22], [0, -0.34], [0.18, -0.22], [0.4, -0.1], [0.05, -0.13], [-0.7, 0.6], [-0.24, 0.9]],
  // red: circles the sun, stamps the seal, touches the stamens
  [...loop(0.34, -0.37, 0.17, 6), ...loop(0.72, 0.64, 0.13, 5), [-0.24, 0.9], [-0.7, 0.6]],
  // black: set per run — one full turn of the frame, starting where it arrives
  [],
];

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function gauss() {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Uniform Catmull–Rom through 3D control points. */
function catmull(pts: V3[], per: number): V3[] {
  const out: V3[] = [];
  const P = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      const q = [0, 1, 2].map(
        (a) => 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3),
      ) as V3;
      out.push(q);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

type LeadState = {
  pos: V3; prev: V3; dir: [number, number]; phase: number;
  path: V3[]; cum: Float32Array; total: number; first: number; ts: number; p: number;
};
type Arc = { i: number; j: number; born: number; life: number; color: string; fork: boolean };

export function runIntro(canvas: HTMLCanvasElement, opts: IntroOptions) {
  const ctx = canvas.getContext("2d")!;
  let dpr = 1, w = 1, h = 1, ox = 0, oy = 0, S = 1, Ax = 1, Ay = 1, Az = 1;
  let geo: EmblemGeo = emblemGeometry(window.innerWidth, window.innerHeight);
  // Shadows are drawn at quarter resolution and scaled up: a free, soft blur.
  const shadowC = document.createElement("canvas");
  const sctx = shadowC.getContext("2d")!;
  const fit = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    geo = emblemGeometry(w, h);
    ox = w / 2;
    oy = h * 0.45;
    S = Math.min(w, h);
    Ax = w * 0.3;
    Ay = h * 0.26;
    Az = S * 0.45;
    shadowC.width = Math.ceil(w / 4);
    shadowC.height = Math.ceil(h / 4);
    sctx.setTransform(0.25, 0, 0, 0.25, 0, 0);
  };
  fit();
  const persp = (z: number) => F / (F + z);

  /* ── Mark particles (struct-of-arrays) ─────────────────────────────── */
  const N = Math.round(Math.min(2200, Math.max(700, (w * h) / 600)));
  const initial = sampleTargets(geo, N, Math.random); // proportions per region
  const n = initial.length;
  const x = new Float32Array(n), y = new Float32Array(n);
  const px = new Float32Array(n), py = new Float32Array(n);
  const fx = new Float32Array(n), fy = new Float32Array(n);
  const vx = new Float32Array(n), vy = new Float32Array(n);
  const tx = new Float32Array(n), ty = new Float32Array(n);
  const sx = new Float32Array(n), sy = new Float32Array(n), sz = new Float32Array(n); // flight start (3D)
  const qx = new Float32Array(n), qy = new Float32Array(n), qz = new Float32Array(n); // flight control point
  const te = new Float32Array(n), fd = new Float32Array(n), sParam = new Float32Array(n);
  const emitted = new Uint8Array(n);
  const life = new Float32Array(n), arrived = new Float32Array(n);
  const region: Region[] = initial.map((p) => p.region);
  const leadOf = Uint8Array.from(region, (r) => LEAD_OF[r]);
  const depth = Float32Array.from(region, (r) => DEPTH[r] - FRAME_DEPTH);

  // Colour + size buckets so each frame is a few dozen strokes, not thousands.
  type Style = { color: string; width: number; halo: string; under: string | null; core: boolean };
  const keys: string[] = [];
  REGIONS.forEach((r) => PALETTE[r].forEach((c) => keys.push(`${r}|${c}`)));
  const colorOf = new Uint16Array(n);
  const sizeOf = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const pal = PALETTE[region[i]];
    colorOf[i] = keys.indexOf(`${region[i]}|${pal[Math.floor(Math.random() * pal.length)]}`);
    sizeOf[i] = Math.random() < (region[i] === "fuji" || region[i] === "sakura" ? 0.3 : 0.45) ? 1 : 0;
  }
  const buckets: Int32Array[] = [];
  const styles: Style[] = [];
  keys.forEach((key, ci) => {
    const [reg, color] = key.split("|") as [Region, string];
    [0, 1].forEach((s) => {
      const idx: number[] = [];
      for (let i = 0; i < n; i++) if (colorOf[i] === ci && sizeOf[i] === s) idx.push(i);
      if (!idx.length) return;
      buckets.push(Int32Array.from(idx));
      styles.push({ color, width: s ? 2.2 : 1.3, halo: HALO[reg], under: UNDER[reg] ?? null, core: !DARK[reg] });
    });
  });

  /* Spatial hash over the targets, for picking neighbours to arc between. */
  const CELL = 44;
  let grid = new Map<number, number[]>();
  const cellKey = (X: number, Y: number) => Math.floor(X / CELL) + Math.floor(Y / CELL) * 4096;
  const buildGrid = () => {
    grid = new Map();
    for (let i = 0; i < n; i++) {
      const k = cellKey(tx[i], ty[i]);
      const list = grid.get(k);
      if (list) list.push(i);
      else grid.set(k, [i]);
    }
  };

  const assignTargets = () => {
    const pts = sampleTargets(geo, n, Math.random);
    const byRegion = Object.fromEntries(REGIONS.map((r) => [r, [] as { x: number; y: number }[]])) as Record<Region, { x: number; y: number }[]>;
    pts.forEach((p) => byRegion[p.region].push(p));
    const used = Object.fromEntries(REGIONS.map((r) => [r, 0])) as Record<Region, number>;
    for (let i = 0; i < n; i++) {
      const r = region[i];
      const list = byRegion[r];
      if (!list.length) { tx[i] = geo.cx; ty[i] = geo.cy; continue; }
      const k = used[r]++;
      const p = list[k % list.length];
      const extra = k >= list.length ? 0.8 : 0;
      tx[i] = p.x + (Math.random() - 0.5) * extra;
      ty[i] = p.y + (Math.random() - 0.5) * extra;
    }
    buildGrid();
  };

  /* ── Lit 3D artwork, prerendered once as depth layers ────────────────── */
  let art: ArtLayers | null = null;
  const renderArt = () => { art = renderArtLayers(geo, dpr); };

  /* ── The duet ─────────────────────────────────────────────────────────── */
  const leads: LeadState[] = LEADS.map((_, k) => ({
    pos: [0, 0, 0], prev: [0, 0, 0], dir: [1, 0], phase: k * 1.3,
    path: [], cum: new Float32Array(0), total: 1, first: 0, ts: 0, p: 0,
  }));

  /** Position of a dance slot at time τ (s): two pairs and a soloist. */
  const slotPos = (slot: number, tau: number): V3 => {
    if (slot === 4) {
      // the one waiting its turn traces a slow figure-eight through depth
      const a = 0.62 * tau + 2.4;
      return [w * 0.36 * Math.cos(a), h * 0.2 * Math.sin(2 * a), Az * 0.9 * Math.sin(a + 0.8)];
    }
    const pair = slot >> 1, m = slot & 1;
    const c: V3 = pair === 0
      ? [Ax * Math.sin(0.55 * tau + 0.3), Ay * Math.sin(0.83 * tau + 1.1), Az * Math.sin(0.41 * tau + 2.0)]
      : [Ax * Math.sin(0.49 * tau + 3.5), Ay * Math.sin(0.71 * tau + 4.4), Az * Math.sin(0.53 * tau + 0.7)];
    // partners orbit their common centre on a tilted plane that precesses
    const r = S * 0.075 * (0.8 + 0.35 * Math.sin(1.2 * tau + pair * 2));
    const th = 2.5 * tau + pair * 1.7 + m * Math.PI;
    const beta = 1.15, al = 0.45 * tau + pair * 1.3;
    const x0 = r * Math.cos(th), y0 = r * Math.sin(th) * Math.cos(beta), z0 = r * Math.sin(th) * Math.sin(beta);
    return [c[0] + x0 * Math.cos(al) + z0 * Math.sin(al), c[1] + y0, c[2] - x0 * Math.sin(al) + z0 * Math.cos(al)];
  };
  const pairing = (tau: number) => {
    const set = Math.floor(tau / PERIOD);
    const within = tau - set * PERIOD;
    return { set, blend: set > 0 && within < BLEND ? easeInOut(within / BLEND) : 1 };
  };
  const dancePos = (k: number, tau: number): V3 => {
    const { set, blend } = pairing(tau);
    let p = slotPos(roleOf(set, k), tau);
    if (blend < 1) {
      const q = slotPos(roleOf(set - 1, k), tau);
      p = [q[0] + (p[0] - q[0]) * blend, q[1] + (p[1] - q[1]) * blend, q[2] + (p[2] - q[2]) * blend];
    }
    const born = easeOut(clamp01(tau / 1.1)); // all five spring from one point of light
    return [p[0] * born, p[1] * born, p[2] * born];
  };

  /* ── Timeline ─────────────────────────────────────────────────────────── */
  type Phase = "duet" | "separate" | "manifest" | "exit" | "done";
  let phase: Phase = opts.reduced ? "manifest" : "duet";
  const t0 = performance.now();
  let tSep = 0, tManifest = 0, tExit = 0, last = t0, lastDt = 1 / 60;
  let raf = 0;
  let revealed = false;
  let partedPairs: [number, number][] = [];

  if (opts.reduced) {
    renderArt();
    tManifest = t0;
  }

  /** Camera sway once the mark has formed: drives the depth parallax. */
  const camera = (now: number) => {
    if (opts.reduced || !tManifest) return { x: 0, y: 0 };
    const s = (now - tManifest) / 1000;
    const A = geo.R * 0.08 * easeOut(clamp01(s / 1.2));
    return { x: A * Math.sin(s * 1.3), y: A * 0.55 * Math.sin(s * 0.95 + 0.4) };
  };

  const flowAngle = (X: number, Y: number, t: number) =>
    Math.sin(X * 0.0021 + t * 0.00031) * 2.1 + Math.cos(Y * 0.0027 - t * 0.00023) * 1.9 + Math.sin((X + Y) * 0.0011 + t * 0.00017) * 1.3;

  /* ── Separation: each lead gets a path through its part of the mark ─── */
  const toSpace = ([u, v]: UV): V3 => [geo.cx + u * geo.R - ox, geo.cy + v * geo.R - oy, 0];
  const startSeparate = (now: number) => {
    assignTargets();
    const { set } = pairing((now - t0) / 1000);
    const pr = PAIRINGS[set % PAIRINGS.length];
    partedPairs = [[pr[0], pr[1]], [pr[2], pr[3]]];
    leads.forEach((L, k) => {
      const P = L.pos;
      const vel = [0, 1, 2].map((a) => (P[a] - L.prev[a]) / lastDt) as V3;
      const vl = Math.hypot(vel[0], vel[1], vel[2]) || 1;
      const reach = Math.min(S * 0.22, vl * 0.3);
      const ahead: V3 = [P[0] + (vel[0] / vl) * reach, P[1] + (vel[1] / vl) * reach, P[2] + (vel[2] / vl) * reach];
      let wp = WAYPOINTS[k];
      if (k === 4) {
        // the frame: one full turn, joining the circle where the spark arrives
        const f = persp(P[2]);
        const rx = ox + P[0] * f - geo.cx, ry = oy + P[1] * f - geo.cy;
        const a0 = Math.atan2(ry, rx);
        const dir = rx * vel[1] - ry * vel[0] > 0 ? 1 : -1;
        wp = Array.from({ length: 17 }, (_, j) => {
          const a = a0 + dir * j * (Math.PI / 8);
          return [Math.cos(a) * 0.9425, Math.sin(a) * 0.9425] as UV;
        });
      }
      const per = 14;
      L.path = catmull([P, ahead, ...wp.map(toSpace)], per);
      L.first = 2 * per;
      L.cum = new Float32Array(L.path.length);
      for (let j = 1; j < L.path.length; j++) {
        const a = L.path[j - 1], b = L.path[j];
        L.cum[j] = L.cum[j - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      }
      L.total = L.cum[L.path.length - 1] || 1;
      L.ts = now;
      L.p = 0;
    });
    // Each particle is shed where its lead passes closest to its target.
    for (let i = 0; i < n; i++) {
      const L = leads[leadOf[i]];
      const X = tx[i] - ox, Y = ty[i] - oy;
      let best = Infinity, bj = L.first;
      for (let j = L.first; j < L.path.length; j++) {
        const d = (L.path[j][0] - X) ** 2 + (L.path[j][1] - Y) ** 2;
        if (d < best) { best = d; bj = j; }
      }
      sParam[i] = Math.min(0.999, Math.max(0, L.cum[bj] / L.total + (Math.random() - 0.5) * 0.04));
      emitted[i] = 0;
      arrived[i] = 0;
    }
    tSep = now;
    phase = "separate";
  };
  const pathAt = (L: LeadState, p: number): V3 => {
    const target = p * L.total;
    let lo = 0, hi = L.path.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (L.cum[mid] < target) lo = mid;
      else hi = mid;
    }
    const seg = L.cum[hi] - L.cum[lo] || 1;
    const f = clamp01((target - L.cum[lo]) / seg);
    const a = L.path[lo], b = L.path[hi];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  };

  const emit = (i: number, now: number) => {
    const L = leads[leadOf[i]];
    const P = L.pos;
    sx[i] = P[0] + gauss() * 3;
    sy[i] = P[1] + gauss() * 3;
    sz[i] = P[2];
    const X = tx[i] - ox, Y = ty[i] - oy;
    const dx = X - sx[i], dy = Y - sy[i];
    const d = Math.hypot(dx, dy) || 1;
    // Sparks peel off the brush along its stroke, then curl softly onto their
    // place — a stream behind the lead rather than a burst around it.
    const side = Math.random() < 0.5 ? -1 : 1;
    const bend = side * (d * 0.28 + 10 + Math.random() * 14);
    const fling = d * 0.3 + 14 + Math.random() * 18;
    qx[i] = sx[i] + dx * 0.5 + L.dir[0] * fling - (dy / d) * bend;
    qy[i] = sy[i] + dy * 0.5 + L.dir[1] * fling + (dx / d) * bend;
    qz[i] = sz[i] * 0.5 + (Math.random() - 0.5) * S * 0.1;
    te[i] = now;
    fd[i] = FLIGHT_MIN + Math.random() * FLIGHT_VAR;
    emitted[i] = 1;
    flightAt(i, now);
    px[i] = x[i];
    py[i] = y[i];
  };

  /** Where particle i is on its flight at time tAbs (writes fxy). */
  const fxy = [0, 0];
  const flightPos = (i: number, tAbs: number) => {
    const e = clamp01((tAbs - te[i]) / fd[i]);
    const q = easeOut(e);
    const a = (1 - q) * (1 - q), b = 2 * (1 - q) * q, c = q * q;
    const X = a * sx[i] + b * qx[i] + c * (tx[i] - ox);
    const Y = a * sy[i] + b * qy[i] + c * (ty[i] - oy);
    const f = persp(a * sz[i] + b * qz[i]);
    fxy[0] = ox + X * f;
    fxy[1] = oy + Y * f;
    return e;
  };
  function flightAt(i: number, tAbs: number) {
    const e = flightPos(i, tAbs);
    x[i] = fxy[0];
    y[i] = fxy[1];
    return e;
  }

  /* Flight trails are analytic too: each comet tail is sampled along the
     spark's own curve, so it stays a smooth arc at any frame rate. */
  const TAIL_N = 6, TAIL_DT = 26;
  const strokeTrails = (now: number, alphaMul: number) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let age = TAIL_N - 1; age >= 0; age--) {
      const fade = Math.pow(1 - age / TAIL_N, 1.6);
      const tNew = now - age * TAIL_DT, tOld = tNew - TAIL_DT;
      for (let b = 0; b < buckets.length; b++) {
        const idx = buckets[b];
        const st = styles[b];
        const path = new Path2D();
        let any = false;
        for (let k = 0; k < idx.length; k++) {
          const i = idx[k];
          if (!emitted[i] || tOld < te[i] || tOld > te[i] + fd[i]) continue;
          flightPos(i, tOld);
          const ax = fxy[0], ay = fxy[1];
          flightPos(i, tNew);
          path.moveTo(ax, ay);
          path.lineTo(fxy[0], fxy[1]);
          any = true;
        }
        if (!any) continue;
        const lw = st.width * (0.5 + 0.5 * fade);
        if (st.under) {
          ctx.strokeStyle = st.under;
          ctx.globalAlpha = alphaMul * fade * 0.75;
          ctx.lineWidth = lw + 1.4;
          ctx.stroke(path);
        }
        ctx.strokeStyle = st.color;
        ctx.globalAlpha = alphaMul * fade;
        ctx.lineWidth = lw;
        ctx.stroke(path);
      }
    }
    ctx.globalAlpha = 1;
  };

  /* Spark heads: a coloured charge glow with a white-hot core that flickers. */
  const HEAD = 9;
  const strokeHeads = (alphaMul: number, glow = 1) => {
    ctx.lineCap = "round";
    for (let b = 0; b < buckets.length; b++) {
      const idx = buckets[b];
      const st = styles[b];
      const path = new Path2D();
      let any = false;
      for (let k = 0; k < idx.length; k++) {
        const i = idx[k];
        if (!emitted[i]) continue;
        let ax = px[i], ay = py[i];
        const dx = x[i] - ax, dy = y[i] - ay;
        const d2 = dx * dx + dy * dy;
        if (d2 > HEAD * HEAD) {
          const s = HEAD / Math.sqrt(d2);
          ax = x[i] - dx * s;
          ay = y[i] - dy * s;
        }
        path.moveTo(ax, ay);
        path.lineTo(x[i] + 0.01, y[i]);
        any = true;
      }
      if (!any) continue;
      const fl = 0.6 + Math.random() * 0.4;
      if (st.width > 2 && glow > 0) {
        ctx.strokeStyle = st.halo;
        ctx.globalAlpha = alphaMul * 0.24 * fl * glow;
        ctx.lineWidth = st.width * 3;
        ctx.stroke(path);
      }
      ctx.strokeStyle = st.color;
      ctx.globalAlpha = alphaMul;
      ctx.lineWidth = st.width * 1.1;
      ctx.stroke(path);
      if (st.core) {
        ctx.strokeStyle = "#ffffff";
        ctx.globalAlpha = alphaMul * fl;
        ctx.lineWidth = st.width * 0.45;
        ctx.stroke(path);
      }
    }
    ctx.globalAlpha = 1;
  };

  /* ── Lead ribbons: 3D, depth-sorted, twisting, with shadows on paper ── */
  type Seg = { z: number; ax: number; ay: number; bx: number; by: number; w: number; k: number; face: number; a: number; off: number };
  type Orb = { z: number; x: number; y: number; r: number; k: number; a: number; off: number };
  const ribbonW = () => Math.max(4.5, S * 0.008);
  const shadowOff = (z: number) => 5 + (Az * 1.4 - z) * 0.032;
  const fog = (z: number) => 1 - 0.5 * clamp01((z + Az) / (2 * Az));

  /* A lead's motion is analytic (dance, then its path), so its trail is
     sampled at fine, fixed time steps — smooth curves at any frame rate. */
  const progress = (k: number, tAbs: number) => {
    const u = clamp01((tAbs - leads[k].ts) / LEADS[k].duration);
    return 0.45 * u + 0.55 * u * u * (3 - 2 * u);
  };
  const leadAt = (k: number, tAbs: number): V3 => {
    const L = leads[k];
    if (phase === "duet" || !L.path.length || tAbs < L.ts) return dancePos(k, Math.max(0, tAbs - t0) / 1000);
    return pathAt(L, progress(k, tAbs));
  };
  const STEP = 10; // ms between trail samples

  const buildLeadGeometry = (now: number, trailMs: number, leadAlpha: number[]) => {
    const segs: Seg[] = [];
    const orbs: Orb[] = [];
    const W = ribbonW();
    leads.forEach((L, k) => {
      const la = leadAlpha[k];
      if (la <= 0) return;
      const count = Math.ceil(trailMs / STEP);
      let A = leadAt(k, now - count * STEP);
      for (let j = count - 1; j >= 0; j--) {
        const tB = now - j * STEP;
        const B = leadAt(k, tB);
        const fade = 1 - (j * STEP) / trailMs;
        const fA = persp(A[2]), fB = persp(B[2]);
        const z = (A[2] + B[2]) / 2;
        const f = (fA + fB) / 2;
        const face = Math.cos(((tB - t0) / 1000) * 3.2 + L.phase);
        segs.push({
          z, k, face,
          ax: ox + A[0] * fA, ay: oy + A[1] * fA, bx: ox + B[0] * fB, by: oy + B[1] * fB,
          w: W * f * Math.pow(fade, 0.7) * (0.3 + 0.7 * Math.abs(face)),
          a: Math.pow(fade, 1.2) * fog(z) * la,
          off: shadowOff(z),
        });
        A = B;
      }
      const [X, Y, Z] = L.pos;
      const f = persp(Z);
      orbs.push({ z: Z, k, x: ox + X * f, y: oy + Y * f, r: Math.max(3.4, S * 0.0048) * f, a: la * fog(Z) * 0.5 + la * 0.5, off: shadowOff(Z) });
    });
    return { segs, orbs };
  };

  const drawShadows = (segs: Seg[], orbs: Orb[]) => {
    sctx.save();
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.clearRect(0, 0, shadowC.width, shadowC.height);
    sctx.restore();
    sctx.lineCap = "butt";
    sctx.strokeStyle = "rgb(38, 43, 61)";
    for (const s of segs) {
      sctx.globalAlpha = 0.13 * s.a;
      sctx.lineWidth = s.w * 1.5 + 2;
      sctx.beginPath();
      sctx.moveTo(s.ax + s.off * 0.6, s.ay + s.off);
      sctx.lineTo(s.bx + s.off * 0.6, s.by + s.off);
      sctx.stroke();
    }
    sctx.fillStyle = "rgb(38, 43, 61)";
    for (const o of orbs) {
      sctx.globalAlpha = 0.18 * o.a;
      sctx.beginPath();
      sctx.arc(o.x + o.off * 0.6, o.y + o.off, o.r * 2.4, 0, Math.PI * 2);
      sctx.fill();
    }
    sctx.globalAlpha = 1;
    ctx.save();
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(shadowC, 0, 0, w, h);
    ctx.restore();
  };

  const drawSeg = (s: Seg) => {
    const L = LEADS[s.k];
    ctx.beginPath();
    ctx.moveTo(s.ax, s.ay);
    ctx.lineTo(s.bx, s.by);
    if (L.edge) {
      ctx.strokeStyle = L.edge;
      ctx.globalAlpha = s.a * 0.85;
      ctx.lineWidth = s.w + 1.6;
      ctx.stroke();
    }
    ctx.strokeStyle = L.color;
    ctx.globalAlpha = s.a;
    ctx.lineWidth = s.w;
    ctx.stroke();
    // the ribbon's lit face carries a specular stripe; its back turns to shade
    if (s.face > 0.2) {
      ctx.strokeStyle = L.light;
      ctx.globalAlpha = s.a * (s.face - 0.2) * 0.9;
      ctx.lineWidth = s.w * 0.42;
      ctx.stroke();
    } else if (s.face < -0.2) {
      ctx.strokeStyle = L.shade;
      ctx.globalAlpha = s.a * (-s.face - 0.2) * 0.45;
      ctx.lineWidth = s.w;
      ctx.stroke();
    }
  };
  const drawOrb = (o: Orb, now: number) => {
    const L = LEADS[o.k];
    const fl = 0.85 + Math.sin(now * 0.031 + o.k * 2.1) * 0.08 + Math.random() * 0.07;
    const R = o.r * 6.5 * fl;
    const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, R);
    g.addColorStop(0, `rgba(${L.halo}, ${0.5 * o.a})`);
    g.addColorStop(0.35, `rgba(${L.halo}, ${0.16 * o.a})`);
    g.addColorStop(1, `rgba(${L.halo}, 0)`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(o.x, o.y, R, 0, Math.PI * 2);
    ctx.fill();
    const c = ctx.createRadialGradient(o.x - o.r * 0.35, o.y - o.r * 0.4, 0, o.x, o.y, o.r);
    c.addColorStop(0, L.coreIn);
    c.addColorStop(1, L.coreOut);
    ctx.globalAlpha = o.a;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
    if (L.edge) {
      ctx.strokeStyle = L.edge;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  /** Painter's algorithm: far segments first. `side` splits around the mark plane. */
  const drawLeads = (segs: Seg[], orbs: Orb[], now: number, side: "back" | "front") => {
    const items: (Seg | Orb)[] = [];
    for (const s of segs) if ((s.z > 0) === (side === "back")) items.push(s);
    for (const o of orbs) if ((o.z > 0) === (side === "back")) items.push(o);
    items.sort((a, b) => b.z - a.z);
    ctx.lineCap = "butt";
    for (const it of items) {
      if ("ax" in it) drawSeg(it);
      else drawOrb(it, now);
    }
    ctx.globalAlpha = 1;
  };

  /* ── Lightning ────────────────────────────────────────────────────────── */
  const arcs: Arc[] = [];
  const pts: number[] = [];
  const bolt = (ax: number, ay: number, bx: number, by: number, levels: number, rough: number) => {
    pts.length = 0;
    pts.push(ax, ay, bx, by);
    for (let l = 0; l < levels; l++) {
      const next: number[] = [];
      for (let k = 0; k < pts.length - 2; k += 2) {
        const x1 = pts[k], y1 = pts[k + 1], x2 = pts[k + 2], y2 = pts[k + 3];
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const off = (Math.random() * 2 - 1) * len * rough;
        next.push(x1, y1, (x1 + x2) / 2 - (dy / len) * off, (y1 + y2) / 2 + (dx / len) * off);
      }
      next.push(pts[pts.length - 2], pts[pts.length - 1]);
      pts.length = 0;
      pts.push(...next);
    }
    return pts;
  };
  const addPolyline = (p: Path2D, a: number[]) => {
    p.moveTo(a[0], a[1]);
    for (let k = 2; k < a.length; k += 2) p.lineTo(a[k], a[k + 1]);
  };
  const strokeBolt = (path: Path2D, color: string, alpha: number, widthMul = 1) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.16 * alpha;
    ctx.lineWidth = 5 * widthMul;
    ctx.stroke(path);
    ctx.globalAlpha = 0.85 * alpha;
    ctx.lineWidth = 1.5 * widthMul;
    ctx.stroke(path);
    ctx.strokeStyle = "#ffffff";
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 0.6 * widthMul;
    ctx.stroke(path);
    ctx.globalAlpha = 1;
  };
  const spawnArc = (i: number, j: number, now: number, lifeMs = 120 + Math.random() * 180) => {
    const c = region[i] === "sakura" || region[i] === "core" || region[i] === "stamen" ? "#ff4f98"
      : region[i] === "sun" || region[i] === "seal" ? "#ff3b30"
      : ARC_COLORS[Math.floor(Math.random() * ARC_COLORS.length)];
    arcs.push({ i, j, born: now, life: lifeMs, color: c, fork: Math.random() < 0.4 });
  };
  /** A neighbour of i on the formed shape — via the target grid. */
  const shapeNeighbour = (i: number, minD = 10, maxD = 64) => {
    const gx = Math.floor(tx[i] / CELL), gy = Math.floor(ty[i] / CELL);
    for (let a = 0; a < 6; a++) {
      const list = grid.get(gx + Math.floor(Math.random() * 3 - 1) + (gy + Math.floor(Math.random() * 3 - 1)) * 4096);
      if (!list) continue;
      const j = list[Math.floor(Math.random() * list.length)];
      const d = Math.hypot(tx[j] - tx[i], ty[j] - ty[i]);
      if (j !== i && d > minD && d < maxD && arrived[j] >= 1) return j;
    }
    return -1;
  };
  const drawArcs = (now: number, alphaMul = 1) => {
    for (let a = arcs.length - 1; a >= 0; a--) {
      const arc = arcs[a];
      const age = (now - arc.born) / arc.life;
      if (age >= 1) { arcs.splice(a, 1); continue; }
      const { i, j } = arc;
      const len = Math.hypot(x[j] - x[i], y[j] - y[i]);
      if (len > 180) { arcs.splice(a, 1); continue; }
      const path = new Path2D();
      const main = bolt(x[i], y[i], x[j], y[j], 4, 0.26);
      addPolyline(path, main);
      if (arc.fork) {
        const m = Math.floor(main.length / 4) * 2;
        const ang = Math.atan2(y[j] - y[i], x[j] - x[i]) + (Math.random() < 0.5 ? -0.7 : 0.7);
        const fl = len * (0.3 + Math.random() * 0.25);
        const bx = main[m], by = main[m + 1];
        addPolyline(path, bolt(bx, by, bx + Math.cos(ang) * fl, by + Math.sin(ang) * fl, 3, 0.3));
      }
      strokeBolt(path, arc.color, (1 - age) * (0.55 + Math.random() * 0.45) * alphaMul);
    }
  };
  /** The charge between partners: a filament that flickers while they are bonded. */
  const drawBond = (a: number, b: number, alpha: number) => {
    if (alpha <= 0 || Math.random() < 0.3) return;
    const A = leads[a].pos, B = leads[b].pos;
    const fA = persp(A[2]), fB = persp(B[2]);
    const ax = ox + A[0] * fA, ay = oy + A[1] * fA, bx = ox + B[0] * fB, by = oy + B[1] * fB;
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 6 || len > S * 0.45) return;
    const path = new Path2D();
    addPolyline(path, bolt(ax, ay, bx, by, 4, 0.22));
    strokeBolt(path, `rgb(${LEADS[a].halo})`, alpha * (0.35 + Math.random() * 0.35), (fA + fB) / 2);
  };

  /* ── Power-on: charge ripple + a soft bloom behind the mark ──────────── */
  const powerOn = (tm: number) => {
    const bp = clamp01(tm / 600);
    if (bp < 1) {
      const g = ctx.createRadialGradient(geo.cx, geo.cy, 0, geo.cx, geo.cy, geo.R * 1.6);
      g.addColorStop(0, `rgba(120, 165, 255, ${0.3 * (1 - bp)})`);
      g.addColorStop(0.6, `rgba(255, 130, 180, ${0.12 * (1 - bp)})`);
      g.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(geo.cx - geo.R * 1.6, geo.cy - geo.R * 1.6, geo.R * 3.2, geo.R * 3.2);
    }
    const rings: [number, string][] = [[0, "47, 107, 255"], [160, "255, 79, 152"], [320, "255, 59, 48"]];
    for (const [d, col] of rings) {
      const p = clamp01((tm - d) / 1100);
      if (p <= 0 || p >= 1) continue;
      ctx.strokeStyle = `rgba(${col}, ${0.38 * (1 - p) * (1 - p)})`;
      ctx.lineWidth = 1.8 * (1 - p) + 0.6;
      ctx.beginPath();
      ctx.arc(geo.cx, geo.cy, geo.R * (1.02 + easeOut(p) * 0.3), 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  /** Settled sparks, offset by depth so they ride the parallax with the art. */
  const settle = (now: number, o: { x: number; y: number }) => {
    for (let i = 0; i < n; i++) {
      px[i] = x[i] = tx[i] + depth[i] * o.x + Math.sin(now * 0.004 + i) * 0.35;
      py[i] = y[i] = ty[i] + depth[i] * o.y + Math.cos(now * 0.0035 + i * 1.7) * 0.35;
    }
  };
  const crawl = (now: number, rate: number) => {
    if (arcs.length < 8 && Math.random() < rate) {
      const i = Math.floor(Math.random() * n);
      const j = shapeNeighbour(i, 8, 46);
      if (j >= 0) spawnArc(i, j, now, 90 + Math.random() * 130);
    }
  };

  let hold = 0; // how long the finished mark stays intact after the reveal
  let burst = false;
  const scatter = () => {
    burst = true;
    arcs.length = 0;
    for (let i = 0; i < n; i++) {
      if (!emitted[i]) { life[i] = -1; continue; }
      // Sparks are thrown outward from the heart of the mark, with a breeze.
      const dx = x[i] - geo.cx, dy = y[i] - geo.cy;
      const d = Math.hypot(dx, dy) || 1;
      const s = (90 + Math.random() * 260) * (0.6 + Math.min(1.6, d / geo.R));
      vx[i] = (dx / d) * s + 40 + gauss() * 30;
      vy[i] = (dy / d) * s - 30 + gauss() * 30;
      life[i] = 0.75 + Math.random() * 0.5;
      fx[i] = x[i];
      fy[i] = y[i];
    }
  };

  const startExit = (now: number) => {
    if (phase === "exit" || phase === "done") return;
    // Skipped before the form completed: no mark to hold, burst straight away.
    hold = phase === "manifest" && !opts.reduced ? HOLD : 0;
    if (!art) renderArt();
    if (!revealed) { revealed = true; opts.onReveal(); }
    phase = "exit";
    tExit = now;
    if (!hold && !opts.reduced) scatter();
  };

  const toManifest = (now: number) => {
    renderArt();
    phase = "manifest";
    tManifest = now;
    for (let i = 0; i < n; i++) { emitted[i] = 1; arrived[i] = 1; }
    // Charge burst: the whole form lights up at once.
    for (let a = 0; a < 48; a++) {
      const i = Math.floor(Math.random() * n);
      const j = shapeNeighbour(i, 14, 80);
      if (j >= 0) spawnArc(i, j, now, 180 + Math.random() * 260);
    }
  };

  const frame = (now: number) => {
    // rAF timestamps can precede t0 on the first frame; clamp dt to ≥ 0.
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (dt > 0) lastDt = dt;
    const t = now - t0;
    const tau = Math.max(0, t) / 1000;
    ctx.globalCompositeOperation = "source-over";

    if (phase === "duet" || phase === "separate") {
      if (phase === "duet") {
        const { blend } = pairing(tau);
        if (t >= MIN_DUET && ((blend >= 1 && opts.isReady()) || t >= MIN_DUET + MAX_WAIT)) startSeparate(now);
      }
      // Move the leads.
      const leadAlpha = [1, 1, 1, 1, 1];
      leads.forEach((L, k) => {
        L.prev = L.pos;
        if (phase === "duet") {
          L.pos = dancePos(k, tau);
        } else {
          L.p = progress(k, now);
          L.pos = leadAt(k, now);
          leadAlpha[k] = 1 - clamp01((now - L.ts - LEADS[k].duration) / 350);
        }
        const fP = persp(L.pos[2]), fQ = persp(L.prev[2]);
        const dx = ox + L.pos[0] * fP - (ox + L.prev[0] * fQ), dy = oy + L.pos[1] * fP - (oy + L.prev[1] * fQ);
        const d = Math.hypot(dx, dy);
        if (d > 0.01) L.dir = [dx / d, dy / d];
      });
      // The dance lines dissolve as the pairs part; each brush keeps a short stroke.
      const sepT = phase === "separate" ? now - tSep : 0;
      const trailMs = phase === "duet" ? 1500 : 1500 - 1050 * easeOut(clamp01(sepT / 700));

      // Mark particles: shed by their lead, then fly home.
      let done = 0;
      if (phase === "separate") {
        for (let i = 0; i < n; i++) {
          const L = leads[leadOf[i]];
          if (!emitted[i]) {
            if (L.p >= sParam[i]) emit(i, now);
            else continue;
          }
          // the head segment is also taken from the curve (a fixed 18 ms back)
          flightAt(i, Math.max(te[i], now - 18));
          px[i] = x[i];
          py[i] = y[i];
          const e = flightAt(i, now);
          arrived[i] = e;
          if (e >= 1) { x[i] = px[i] = tx[i]; y[i] = py[i] = ty[i]; done++; }
        }
      }

      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      const { segs, orbs } = buildLeadGeometry(now, trailMs, leadAlpha);
      drawShadows(segs, orbs);
      drawLeads(segs, orbs, now, "back");
      if (phase === "separate") {
        strokeTrails(now, 1);
        strokeHeads(1, 0.8);
        // Arcs begin to knit the sparks that have landed.
        const tries = 1 + Math.round(clamp01(done / n) * 4);
        for (let a = 0; a < tries && arcs.length < 30; a++) {
          const i = Math.floor(Math.random() * n);
          if (arrived[i] < 1) continue;
          const j = shapeNeighbour(i);
          if (j >= 0) spawnArc(i, j, now);
        }
        drawArcs(now);
      }
      drawLeads(segs, orbs, now, "front");
      if (phase === "duet") {
        const { set, blend } = pairing(tau);
        const pr = PAIRINGS[set % PAIRINGS.length];
        const bondA = blend >= 1 ? 1 : 0;
        const born = clamp01((tau - 0.6) / 0.6);
        drawBond(pr[0], pr[1], bondA * born);
        drawBond(pr[2], pr[3], bondA * born);
      } else if (sepT < 320) {
        // the bond stretches and snaps as partners part
        for (const [a, b] of partedPairs) drawBond(a, b, 1 - sepT / 320);
      }

      const allLanded = done === n && leads.every((L, k) => now - L.ts >= LEADS[k].duration);
      if (phase === "separate" && (allLanded || sepT > 4200)) toManifest(now);
    } else if (phase === "manifest") {
      const tm = now - tManifest;
      const a = easeOut(clamp01(tm / ART_FADE));
      const o = camera(now);
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      if (!opts.reduced) powerOn(tm);
      if (art) compositeArt(ctx, art, o, a);
      if (!opts.reduced) {
        // Sparks settle into a shimmer over the lit mark and dim as it powers on.
        settle(now, o);
        strokeHeads(1 - 0.7 * a, 1 - a);
        crawl(now, 0.4);
        drawArcs(now);
      }
      drawCaption(ctx, geo, opts.subtitle(), a);
      if (tm >= ART_FADE + (opts.reduced ? 650 : 0)) startExit(now);
    } else if (phase === "exit") {
      const te0 = now - tExit;
      const tb = te0 - hold; // time since the sparks let go (negative while holding)
      const dur = opts.reduced ? 700 : hold + EXIT;
      const p = clamp01(te0 / dur);
      const o = camera(now);
      if (!burst && !opts.reduced && tb >= 0) scatter();
      ctx.clearRect(0, 0, w, h);
      // Paper with a feathered iris opening from the mark's heart onto the site.
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      const irisDur = opts.reduced ? 700 : 1500;
      const ip = easeInOut(clamp01(te0 / irisDur));
      const maxR = Math.hypot(Math.max(geo.cx, w - geo.cx), Math.max(geo.cy, h - geo.cy)) + 80;
      const r = ip * maxR;
      ctx.globalCompositeOperation = "destination-out";
      if (r > 1) {
        const feather = Math.min(140, r * 0.5);
        const g = ctx.createRadialGradient(geo.cx, geo.cy, Math.max(0, r - feather), geo.cx, geo.cy, r);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(geo.cx, geo.cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      // A paper "moon" keeps the finished mark legible while the page opens
      // around it, then dissolves as the sparks scatter.
      const moonA = opts.reduced ? 1 - ip : 1 - easeOut(clamp01(tb / 700));
      if (moonA > 0 && hold > 0) {
        const mcx = geo.cx, mcy = geo.cy + geo.R * 0.3, mr = geo.R * 2.05;
        const g = ctx.createRadialGradient(mcx, mcy, mr * 0.72, mcx, mcy, mr);
        g.addColorStop(0, `rgba(${BG}, ${moonA})`);
        g.addColorStop(1, `rgba(${BG}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mcx, mcy, mr, 0, Math.PI * 2);
        ctx.fill();
      }
      // Artwork lets go first, leaving the sparks to carry the shape away.
      if (hold > 0 || opts.reduced) {
        const artA = opts.reduced ? 1 - ip : 1 - easeOut(clamp01(tb / 380));
        if (art) compositeArt(ctx, art, o, artA);
        drawCaption(ctx, geo, opts.subtitle(), opts.reduced ? 1 - ip : 1 - easeOut(clamp01(tb / 420)));
      }
      if (!opts.reduced && !burst) {
        // Holding: faint sparks keep shimmering over the mark, arcs crawl.
        settle(now, o);
        strokeHeads(0.3, 0);
        crawl(now, 0.3 * (1 - clamp01(te0 / hold)));
        drawArcs(now, 0.8);
      } else if (!opts.reduced) {
        const td = Math.max(0, tb);
        const bd = EXIT;
        for (let i = 0; i < n; i++) {
          if (life[i] < 0) continue;
          const a = flowAngle(fx[i], fy[i], t);
          vx[i] = vx[i] * 0.985 + Math.cos(a) * 14 * dt * 60 * 0.05;
          vy[i] = vy[i] * 0.985 + (Math.sin(a) * 14 * 0.05 + 0.9) * dt * 60;
          fx[i] += vx[i] * dt;
          fy[i] += vy[i] * dt;
          px[i] = x[i];
          py[i] = y[i];
          x[i] = fx[i];
          y[i] = fy[i];
        }
        // Fade sparks individually by their life span.
        ctx.lineCap = "round";
        for (let b = 0; b < buckets.length; b++) {
          const idx = buckets[b];
          const st = styles[b];
          for (const tier of [0, 1]) {
            const alpha = Math.max(0, 1 - td / (bd * (tier ? 1.05 : 0.8)));
            if (alpha <= 0) continue;
            const path = new Path2D();
            for (let k = tier; k < idx.length; k += 2) {
              const i = idx[k];
              if (td / bd > life[i]) continue;
              path.moveTo(px[i], py[i]);
              path.lineTo(x[i], y[i]);
            }
            if (st.under) {
              ctx.strokeStyle = st.under;
              ctx.globalAlpha = alpha * 0.7;
              ctx.lineWidth = st.width * 1.15 + 1.4;
              ctx.stroke(path);
            }
            ctx.strokeStyle = st.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = st.width * 1.15;
            ctx.stroke(path);
          }
        }
        ctx.globalAlpha = 1;
      }
      if (p >= 1) {
        phase = "done";
        ctx.clearRect(0, 0, w, h);
        opts.onDone();
        return;
      }
    }
    raf = requestAnimationFrame(frame);
  };

  const onResize = () => {
    const old = geo;
    fit();
    const k = geo.R / old.R;
    for (let i = 0; i < n; i++) {
      tx[i] = geo.cx + (tx[i] - old.cx) * k;
      ty[i] = geo.cy + (ty[i] - old.cy) * k;
    }
    buildGrid();
    if (art) renderArt();
  };
  window.addEventListener("resize", onResize);
  raf = requestAnimationFrame(frame);

  return {
    skip: () => startExit(performance.now()),
    stop: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    },
  };
}
