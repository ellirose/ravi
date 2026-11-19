import {
  compositeArt, DARK, DEPTH, drawCaption, emblemGeometry, FRAME_DEPTH, HALO, PALETTE, REGIONS, renderArtLayers,
  sampleTargets, UNDER, type ArtLayers, type EmblemGeo, type Region,
} from "./emblem";

/*
 * Intro choreography (ms):
 *   wander    ≥ MIN_WANDER, until the page is ready (capped by MAX_WAIT)
 *             Charged sparks drift in Brownian motion (Ornstein–Uhlenbeck
 *             velocity + a slow flow field), trailing light; lightning arcs
 *             flicker between neighbours.
 *   converge  CONVERGE — each spark eases onto its target along a swirl: the
 *             sun ignites, snow pours down Fuji, the frame closes in a sweep,
 *             then the blossom and the seal. Arcs knit the arrived sparks.
 *   manifest  ART_FADE — a charge burst runs through the form and the lit 3D
 *             mark powers on beneath it, starting a gentle parallax sway.
 *             When it completes the site is revealed (onReveal).
 *   exit      the iris opens onto the page while a paper "moon" holds the
 *             mark for HOLD, then the sparks scatter and fade (EXIT).
 */
const MIN_WANDER = 1500;
const MAX_WAIT = 4500;
const CONVERGE = 2700;
const ART_FADE = 520;
const HOLD = 1200;
const EXIT = 1700;
const BG = "251, 247, 240"; // --color-washi
const ARC_COLORS = ["#2f6bff", "#4d8dff", "#2f6bff", "#ff4f98", "#ff3b30", "#7aa8ff"];

export type IntroOptions = {
  isReady: () => boolean;
  subtitle: () => string;
  onReveal: () => void;
  onDone: () => void;
  reduced: boolean;
};

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function gauss() {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

type Arc = { i: number; j: number; born: number; life: number; color: string; fork: boolean };

export function runIntro(canvas: HTMLCanvasElement, opts: IntroOptions) {
  const ctx = canvas.getContext("2d")!;
  let dpr = 1, w = 1, h = 1;
  let geo: EmblemGeo = emblemGeometry(window.innerWidth, window.innerHeight);
  const fit = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    geo = emblemGeometry(w, h);
  };
  fit();

  /* ── Particles (struct-of-arrays for speed) ─────────────────────────── */
  const N = Math.round(Math.min(2200, Math.max(700, (w * h) / 600)));
  const initial = sampleTargets(geo, N, Math.random); // proportions per region
  const n = initial.length;
  const x = new Float32Array(n), y = new Float32Array(n);
  const px = new Float32Array(n), py = new Float32Array(n);
  const fx = new Float32Array(n), fy = new Float32Array(n); // free (Brownian) position
  const vx = new Float32Array(n), vy = new Float32Array(n);
  const tx = new Float32Array(n), ty = new Float32Array(n);
  const delay = new Float32Array(n), swirl = new Float32Array(n), life = new Float32Array(n);
  const arrived = new Float32Array(n);
  const region: Region[] = initial.map((p) => p.region);
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
    x[i] = fx[i] = px[i] = Math.random() * w;
    y[i] = fy[i] = py[i] = Math.random() * h;
    const a = Math.random() * Math.PI * 2;
    vx[i] = Math.cos(a) * 60;
    vy[i] = Math.sin(a) * 60;
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
      styles.push({ color, width: s ? 2.4 : 1.35, halo: HALO[reg], under: UNDER[reg] ?? null, core: !DARK[reg] });
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
    REGIONS.forEach((r) => {
      const list = byRegion[r];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    });
    const used = Object.fromEntries(REGIONS.map((r) => [r, 0])) as Record<Region, number>;
    const peak = geo.cy - geo.R * 0.38;
    for (let i = 0; i < n; i++) {
      const r = region[i];
      const list = byRegion[r];
      if (!list.length) { tx[i] = geo.cx; ty[i] = geo.cy; continue; }
      const k = used[r]++;
      const p = list[k % list.length];
      // If a region has fewer points than particles, overlap with a hair of offset.
      const extra = k >= list.length ? 0.8 : 0;
      tx[i] = p.x + (Math.random() - 0.5) * extra;
      ty[i] = p.y + (Math.random() - 0.5) * extra;
      // Arrival order: sun ignites, snow pours down the mountain, the frame
      // closes in a sweep, then the blossom and the seal land in front.
      const ang = (Math.atan2(ty[i] - geo.cy, tx[i] - geo.cx) + Math.PI) / (Math.PI * 2);
      const fall = clamp01((ty[i] - peak) / (geo.R * 1.1));
      delay[i] =
        r === "sun" ? Math.random() * 0.06
        : r === "snow" || r === "fuji" ? 0.04 + fall * 0.16 + Math.random() * 0.04
        : r === "ring" ? 0.1 + ang * 0.2 + Math.random() * 0.03
        : r === "seal" ? 0.3 + Math.random() * 0.08
        : r === "sakura" ? 0.25 + Math.random() * 0.07
        : 0.31 + Math.random() * 0.06;
      swirl[i] = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.7);
    }
    buildGrid();
  };

  /* ── Lit 3D artwork, prerendered once as depth layers ────────────────── */
  let art: ArtLayers | null = null;
  const renderArt = () => { art = renderArtLayers(geo, dpr); };

  /* ── Timeline ─────────────────────────────────────────────────────────── */
  type Phase = "wander" | "converge" | "manifest" | "exit" | "done";
  let phase: Phase = opts.reduced ? "manifest" : "wander";
  const t0 = performance.now();
  let tConverge = 0, tManifest = 0, tExit = 0, last = t0;
  let raf = 0;
  let revealed = false;

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

  const brownian = (i: number, dt: number, t: number, amp: number) => {
    const a = flowAngle(fx[i], fy[i], t);
    vx[i] += (Math.cos(a) * 78 - vx[i]) * 1.2 * dt + gauss() * 120 * amp * Math.sqrt(dt);
    vy[i] += (Math.sin(a) * 78 - vy[i]) * 1.2 * dt + gauss() * 120 * amp * Math.sqrt(dt);
    fx[i] += vx[i] * dt;
    fy[i] += vy[i] * dt;
  };

  /* Trails: a short ring buffer of past positions per particle, redrawn each
     frame with older segments fading out. (Low-alpha "wash" trails leave 8-bit
     residue that tints the paper; this stays crisp and tapers gracefully.) */
  const K = 12; // samples per trail
  const hx = new Float32Array(n * K), hy = new Float32Array(n * K);
  let head = 0, frameNo = 0;
  const resetTrail = (i: number) => {
    for (let k = 0; k < K; k++) { hx[i * K + k] = x[i]; hy[i * K + k] = y[i]; }
  };
  for (let i = 0; i < n; i++) resetTrail(i);
  const pushTrail = () => {
    for (let i = 0; i < n; i++) { hx[i * K + head] = x[i]; hy[i * K + head] = y[i]; }
    head = (head + 1) % K;
  };
  const strokeTrails = (alphaMul: number, ages = K - 1, maxSeg = Infinity) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const max2 = maxSeg * maxSeg;
    // age 0 = newest stored sample; segment (age+1 → age), plus newest → live position
    for (let age = Math.min(K - 2, ages); age >= -1; age--) {
      const fade = Math.pow(1 - (age + 1) / (ages + 2), 1.7);
      const sNew = age < 0 ? -1 : (head - 1 - age + K * 2) % K;
      const sOld = (head - 1 - (age + 1) + K * 2) % K;
      for (let b = 0; b < buckets.length; b++) {
        const idx = buckets[b];
        const st = styles[b];
        const path = new Path2D();
        for (let k = 0; k < idx.length; k++) {
          const i = idx[k];
          const o = i * K;
          const ax = hx[o + sOld], ay = hy[o + sOld];
          const bx = sNew < 0 ? x[i] : hx[o + sNew], by = sNew < 0 ? y[i] : hy[o + sNew];
          if ((bx - ax) * (bx - ax) + (by - ay) * (by - ay) > max2) continue; // no long straight streaks
          path.moveTo(ax, ay);
          path.lineTo(bx, by);
        }
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
      for (let k = 0; k < idx.length; k++) {
        const i = idx[k];
        // Clamp to a short spark: fast frames must not draw long straight lines.
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
      }
      const fl = 0.6 + Math.random() * 0.4;
      // Charge glow only on the larger sparks — wide strokes are the costly part.
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

  /* ── Lightning arcs ───────────────────────────────────────────────────── */
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
  const spawnArc = (i: number, j: number, now: number, lifeMs = 120 + Math.random() * 180) => {
    const c = region[i] === "sakura" || region[i] === "core" || region[i] === "stamen" ? "#ff4f98"
      : region[i] === "sun" || region[i] === "seal" ? "#ff3b30"
      : ARC_COLORS[Math.floor(Math.random() * ARC_COLORS.length)];
    arcs.push({ i, j, born: now, life: lifeMs, color: c, fork: Math.random() < 0.4 });
  };
  /** A random neighbour of i in free space (wander) — rejection sampling. */
  const freeNeighbour = (i: number) => {
    for (let a = 0; a < 22; a++) {
      const j = Math.floor(Math.random() * n);
      const d2 = (x[j] - x[i]) ** 2 + (y[j] - y[i]) ** 2;
      if (j !== i && d2 > 900 && d2 < 14400) return j;
    }
    return -1;
  };
  /** A neighbour of i on the formed shape — via the target grid. */
  const shapeNeighbour = (i: number, minD = 10, maxD = 64) => {
    const gx = Math.floor(tx[i] / CELL), gy = Math.floor(ty[i] / CELL);
    for (let a = 0; a < 6; a++) {
      const list = grid.get(gx + Math.floor(Math.random() * 3 - 1) + (gy + Math.floor(Math.random() * 3 - 1)) * 4096);
      if (!list) continue;
      const j = list[Math.floor(Math.random() * list.length)];
      const d = Math.hypot(tx[j] - tx[i], ty[j] - ty[i]);
      if (j !== i && d > minD && d < maxD && arrived[j] > 0.85) return j;
    }
    return -1;
  };
  const drawArcs = (now: number, alphaMul = 1) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
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
        const sx = main[m], sy = main[m + 1];
        addPolyline(path, bolt(sx, sy, sx + Math.cos(ang) * fl, sy + Math.sin(ang) * fl, 3, 0.3).slice());
      }
      const fade = (1 - age) * (0.55 + Math.random() * 0.45) * alphaMul;
      ctx.strokeStyle = arc.color;
      ctx.globalAlpha = 0.16 * fade;
      ctx.lineWidth = 5;
      ctx.stroke(path);
      ctx.globalAlpha = 0.85 * fade;
      ctx.lineWidth = 1.5;
      ctx.stroke(path);
      ctx.strokeStyle = "#ffffff";
      ctx.globalAlpha = fade;
      ctx.lineWidth = 0.6;
      ctx.stroke(path);
    }
    ctx.globalAlpha = 1;
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

  const frame = (now: number) => {
    // rAF timestamps can precede t0 on the first frame; a negative dt would make
    // sqrt(dt) in the Brownian step NaN and poison every particle.
    const dt = Math.min(0.033, Math.max(0, (now - last) / 1000));
    last = now;
    const t = now - t0;
    ctx.globalCompositeOperation = "source-over";

    if (phase === "wander" || phase === "converge") {
      if (phase === "wander" && t >= MIN_WANDER && (opts.isReady() || t >= MIN_WANDER + MAX_WAIT)) {
        assignTargets();
        phase = "converge";
        tConverge = now;
        arcs.length = 0;
      }
      const cp = phase === "converge" ? clamp01((now - tConverge) / CONVERGE) : 0;
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      const amp = phase === "converge" ? Math.pow(1 - cp, 2) : 1;
      for (let i = 0; i < n; i++) {
        px[i] = x[i];
        py[i] = y[i];
        brownian(i, dt, t, amp);
        if (phase === "wander") {
          // soft wrap at the edges; reset the trail so no line crosses the screen
          let wrapped = false;
          if (fx[i] < -20) { fx[i] = w + 20; wrapped = true; }
          else if (fx[i] > w + 20) { fx[i] = -20; wrapped = true; }
          if (fy[i] < -20) { fy[i] = h + 20; wrapped = true; }
          else if (fy[i] > h + 20) { fy[i] = -20; wrapped = true; }
          x[i] = fx[i];
          y[i] = fy[i];
          if (wrapped) { resetTrail(i); px[i] = x[i]; py[i] = y[i]; }
        } else {
          const e = easeInOut(clamp01((cp - delay[i]) / 0.6));
          arrived[i] = e;
          const rot = swirl[i] * (1 - e) * (1 - e);
          const dx = tx[i] - geo.cx, dy = ty[i] - geo.cy;
          const rx = geo.cx + dx * Math.cos(rot) - dy * Math.sin(rot);
          const ry = geo.cy + dx * Math.sin(rot) + dy * Math.cos(rot);
          x[i] = fx[i] + (rx - fx[i]) * e;
          y[i] = fy[i] + (ry - fy[i]) * e;
        }
      }
      if (phase === "converge") {
        // Converging sparks move fast: sample every frame and keep only a
        // short comet tail so the paths read as curves, not string-art lines.
        pushTrail();
        strokeTrails(1, Math.max(2, Math.round(7 - cp * 4)), 36);
        strokeHeads(1, 1 - cp * 0.4);
        // Arcs begin to knit the sparks that have landed.
        const tries = cp < 0.35 ? 0 : 1 + Math.round(cp * 4);
        for (let a = 0; a < tries && arcs.length < 34; a++) {
          const i = Math.floor(Math.random() * n);
          if (arrived[i] < 0.85) continue;
          const j = shapeNeighbour(i);
          if (j >= 0) spawnArc(i, j, now);
        }
      } else {
        if (frameNo++ % 2 === 0) pushTrail();
        const fadeIn = Math.min(1, t / 700);
        strokeTrails(fadeIn);
        strokeHeads(fadeIn);
        for (let a = 0; a < 3 && arcs.length < 22; a++) {
          if (Math.random() > 0.5 || t < 400) continue;
          const i = Math.floor(Math.random() * n);
          const j = freeNeighbour(i);
          if (j >= 0) spawnArc(i, j, now);
        }
      }
      drawArcs(now);
      if (phase === "converge" && cp >= 1) {
        renderArt();
        phase = "manifest";
        tManifest = now;
        // Charge burst: the whole form lights up at once.
        for (let a = 0; a < 48; a++) {
          const i = Math.floor(Math.random() * n);
          const j = shapeNeighbour(i, 14, 80);
          if (j >= 0) spawnArc(i, j, now, 180 + Math.random() * 260);
        }
      }
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
      const te = now - tExit;
      const tb = te - hold; // time since the sparks let go (negative while holding)
      const dur = opts.reduced ? 700 : hold + EXIT;
      const p = clamp01(te / dur);
      const o = camera(now);
      if (!burst && !opts.reduced && tb >= 0) scatter();
      ctx.clearRect(0, 0, w, h);
      // Paper with a feathered iris opening from the mark's heart onto the site.
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      const irisDur = opts.reduced ? 700 : 1500;
      const ip = easeInOut(clamp01(te / irisDur));
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
      if (moonA > 0) {
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
      const artA = opts.reduced ? 1 - ip : 1 - easeOut(clamp01(tb / 380));
      if (art) compositeArt(ctx, art, o, artA);
      drawCaption(ctx, geo, opts.subtitle(), opts.reduced ? 1 - ip : 1 - easeOut(clamp01(tb / 420)));
      if (!opts.reduced && !burst) {
        // Holding: faint sparks keep shimmering over the mark, arcs crawl.
        settle(now, o);
        strokeHeads(0.3, 0);
        crawl(now, 0.3 * (1 - clamp01(te / hold)));
        drawArcs(now, 0.8);
      } else if (!opts.reduced) {
        const td = Math.max(0, tb);
        const bd = EXIT;
        for (let i = 0; i < n; i++) {
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
