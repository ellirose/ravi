import { drawCaption, drawEmblem, emblemGeometry, PALETTE, sampleTargets, type EmblemGeo, type Region } from "./emblem";

/*
 * Intro choreography (ms):
 *   wander    ≥ MIN_WANDER, until the page is ready (capped by MAX_WAIT)
 *             Brownian motion (Ornstein–Uhlenbeck velocity + a slow flow
 *             field) leaves fading ink trails.
 *   converge  CONVERGE — each particle eases onto its target along a swirl;
 *             petals bloom in a rotating sweep, then the seal, then 桜.
 *   manifest  ART_FADE — crisp artwork fades in under the particles, ripple,
 *             caption. When it completes the site is revealed (onReveal).
 *   exit      the iris opens from the flower's heart onto the page while a
 *             paper "moon" holds the finished emblem for HOLD, then the
 *             blossom scatters into drifting petals (EXIT).
 */
const MIN_WANDER = 1500;
const MAX_WAIT = 4500;
const CONVERGE = 2700;
const ART_FADE = 450;
const HOLD = 1100;
const EXIT = 1700;
const BG = "251, 247, 240"; // --color-washi

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
  const region: Region[] = initial.map((p) => p.region);

  // Colour + size buckets so each frame is a few dozen strokes, not thousands.
  const colors: string[] = [];
  const colorOf = new Uint16Array(n);
  const sizeOf = new Uint8Array(n);
  (Object.keys(PALETTE) as Region[]).forEach((r) => PALETTE[r].forEach((c) => colors.push(`${r}|${c}`)));
  for (let i = 0; i < n; i++) {
    const pal = PALETTE[region[i]];
    const c = pal[Math.floor(Math.random() * pal.length)];
    colorOf[i] = colors.indexOf(`${region[i]}|${c}`);
    sizeOf[i] = Math.random() < (region[i] === "petal" ? 0.3 : 0.45) ? 1 : 0;
    x[i] = fx[i] = px[i] = Math.random() * w;
    y[i] = fy[i] = py[i] = Math.random() * h;
    const a = Math.random() * Math.PI * 2;
    vx[i] = Math.cos(a) * 60;
    vy[i] = Math.sin(a) * 60;
  }
  const buckets: Int32Array[] = [];
  const bucketStyle: { color: string; width: number }[] = [];
  colors.forEach((key, ci) => {
    [0, 1].forEach((s) => {
      const idx: number[] = [];
      for (let i = 0; i < n; i++) if (colorOf[i] === ci && sizeOf[i] === s) idx.push(i);
      if (idx.length) {
        buckets.push(Int32Array.from(idx));
        bucketStyle.push({ color: key.split("|")[1], width: s ? 2.5 : 1.4 });
      }
    });
  });

  const assignTargets = () => {
    const pts = sampleTargets(geo, n, Math.random);
    const byRegion: Record<Region, { x: number; y: number }[]> = { petal: [], seal: [], stamen: [], kanji: [] };
    pts.forEach((p) => byRegion[p.region].push(p));
    (Object.keys(byRegion) as Region[]).forEach((r) => {
      const list = byRegion[r];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    });
    const used: Record<Region, number> = { petal: 0, seal: 0, stamen: 0, kanji: 0 };
    for (let i = 0; i < n; i++) {
      const list = byRegion[region[i]];
      if (!list.length) { tx[i] = geo.cx; ty[i] = geo.cy; continue; }
      const k = used[region[i]]++;
      const p = list[k % list.length];
      // If a region has fewer points than particles, overlap with a hair of offset.
      const extra = k >= list.length ? 0.8 : 0;
      tx[i] = p.x + (Math.random() - 0.5) * extra;
      ty[i] = p.y + (Math.random() - 0.5) * extra;
      // Arrival order: petals sweep around the flower, then seal, then kanji.
      const ang = (Math.atan2(ty[i] - geo.cy, tx[i] - geo.cx) + Math.PI) / (Math.PI * 2);
      delay[i] =
        region[i] === "petal" ? ang * 0.24 + Math.random() * 0.06
        : region[i] === "stamen" ? 0.22 + Math.random() * 0.06
        : region[i] === "seal" ? 0.26 + Math.random() * 0.08
        : 0.32 + Math.random() * 0.08;
      swirl[i] = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.7);
    }
  };

  /* ── Crisp artwork, prerendered once ─────────────────────────────────── */
  let art: HTMLCanvasElement | null = null;
  const renderArt = () => {
    art = document.createElement("canvas");
    art.width = canvas.width;
    art.height = canvas.height;
    const a = art.getContext("2d")!;
    a.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawEmblem(a, geo, "art");
  };

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

  const flowAngle = (X: number, Y: number, t: number) =>
    Math.sin(X * 0.0021 + t * 0.00031) * 2.1 + Math.cos(Y * 0.0027 - t * 0.00023) * 1.9 + Math.sin((X + Y) * 0.0011 + t * 0.00017) * 1.3;

  const brownian = (i: number, dt: number, t: number, amp: number) => {
    const a = flowAngle(fx[i], fy[i], t);
    vx[i] += (Math.cos(a) * 72 - vx[i]) * 1.2 * dt + gauss() * 110 * amp * Math.sqrt(dt);
    vy[i] += (Math.sin(a) * 72 - vy[i]) * 1.2 * dt + gauss() * 110 * amp * Math.sqrt(dt);
    fx[i] += vx[i] * dt;
    fy[i] += vy[i] * dt;
  };

  const strokeBuckets = (alphaMul = 1) => {
    ctx.lineCap = "round";
    for (let b = 0; b < buckets.length; b++) {
      const idx = buckets[b];
      ctx.strokeStyle = bucketStyle[b].color;
      ctx.lineWidth = bucketStyle[b].width;
      ctx.globalAlpha = alphaMul;
      ctx.beginPath();
      for (let k = 0; k < idx.length; k++) {
        const i = idx[k];
        ctx.moveTo(px[i], py[i]);
        ctx.lineTo(x[i], y[i]);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
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
        ctx.strokeStyle = bucketStyle[b].color;
        ctx.lineWidth = bucketStyle[b].width * (0.55 + 0.45 * fade);
        ctx.globalAlpha = alphaMul * fade;
        ctx.beginPath();
        for (let k = 0; k < idx.length; k++) {
          const i = idx[k];
          const o = i * K;
          const ax = hx[o + sOld], ay = hy[o + sOld];
          const bx = sNew < 0 ? x[i] : hx[o + sNew], by = sNew < 0 ? y[i] : hy[o + sNew];
          if ((bx - ax) * (bx - ax) + (by - ay) * (by - ay) > max2) continue; // no long straight streaks
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  const ripple = (tm: number) => {
    const rings: [number, string][] = [[0, "224, 74, 60"], [180, "193, 154, 78"]];
    for (const [d, col] of rings) {
      const p = clamp01((tm - d) / 1300);
      if (p <= 0 || p >= 1) continue;
      ctx.strokeStyle = `rgba(${col}, ${0.35 * (1 - p)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(geo.cx, geo.cy, geo.R * (0.4 + easeOut(p) * 1.3), 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  let hold = 0; // how long the finished emblem stays intact after the reveal
  let burst = false;
  const scatter = () => {
    burst = true;
    for (let i = 0; i < n; i++) {
      // Petals are blown outward from the heart of the flower, with a breeze.
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
    // Skipped before the form completed: no emblem to hold, burst straight away.
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
          if (wrapped) resetTrail(i);
        } else {
          const e = easeInOut(clamp01((cp - delay[i]) / 0.6));
          const rot = swirl[i] * (1 - e) * (1 - e);
          const dx = tx[i] - geo.cx, dy = ty[i] - geo.cy;
          const rx = geo.cx + dx * Math.cos(rot) - dy * Math.sin(rot);
          const ry = geo.cy + dx * Math.sin(rot) + dy * Math.cos(rot);
          x[i] = fx[i] + (rx - fx[i]) * e;
          y[i] = fy[i] + (ry - fy[i]) * e;
        }
      }
      if (phase === "converge") {
        // Converging particles move fast: sample every frame and keep only a
        // short comet tail so the paths read as curves, not string-art lines.
        pushTrail();
        strokeTrails(1, Math.max(2, Math.round(7 - cp * 4)), 60);
      } else {
        if (frameNo++ % 2 === 0) pushTrail();
        strokeTrails(Math.min(1, t / 700));
      }
      if (phase === "converge" && cp >= 1) {
        renderArt();
        phase = "manifest";
        tManifest = now;
      }
    } else if (phase === "manifest") {
      const tm = now - tManifest;
      const a = easeOut(clamp01(tm / ART_FADE));
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      if (art) {
        ctx.globalAlpha = a;
        ctx.drawImage(art, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }
      if (!opts.reduced) {
        // Particles settle into a gentle shimmer over the artwork.
        for (let i = 0; i < n; i++) {
          const tw = Math.sin(now * 0.004 + i) * 0.35;
          px[i] = x[i] = tx[i] + tw;
          py[i] = y[i] = ty[i] + Math.cos(now * 0.0035 + i * 1.7) * 0.35;
        }
        strokeBuckets(1 - 0.45 * a);
        ripple(tm);
      }
      drawCaption(ctx, geo, opts.subtitle(), a);
      if (tm >= ART_FADE + (opts.reduced ? 650 : 0)) startExit(now);
    } else if (phase === "exit") {
      const te = now - tExit;
      const tb = te - hold; // time since the blossom let go (negative while holding)
      const dur = opts.reduced ? 700 : hold + EXIT;
      const p = clamp01(te / dur);
      if (!burst && !opts.reduced && tb >= 0) scatter();
      ctx.clearRect(0, 0, w, h);
      // Paper with a feathered iris opening from the flower's heart onto the site.
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
      // A paper "moon" keeps the finished emblem legible while the page opens
      // around it, then dissolves as the blossom scatters.
      const moonA = opts.reduced ? 1 - ip : 1 - easeOut(clamp01(tb / 700));
      if (moonA > 0) {
        const mcx = geo.cx, mcy = geo.cy + geo.R * 0.32, mr = geo.R * 1.95;
        const g = ctx.createRadialGradient(mcx, mcy, mr * 0.72, mcx, mcy, mr);
        g.addColorStop(0, `rgba(${BG}, ${moonA})`);
        g.addColorStop(1, `rgba(${BG}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mcx, mcy, mr, 0, Math.PI * 2);
        ctx.fill();
      }
      // Artwork lets go first, leaving the particles to carry the shape away.
      const artA = opts.reduced ? 1 - ip : 1 - easeOut(clamp01(tb / 380));
      if (art && artA > 0) {
        ctx.globalAlpha = artA;
        ctx.drawImage(art, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }
      drawCaption(ctx, geo, opts.subtitle(), opts.reduced ? 1 - ip : 1 - easeOut(clamp01(tb / 420)));
      if (!opts.reduced && !burst) {
        // Holding: the settled particles keep shimmering over the artwork.
        for (let i = 0; i < n; i++) {
          px[i] = x[i] = tx[i] + Math.sin(now * 0.004 + i) * 0.35;
          py[i] = y[i] = ty[i] + Math.cos(now * 0.0035 + i * 1.7) * 0.35;
        }
        strokeBuckets(0.55);
        ripple(now - tManifest);
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
        // Fade petals individually by their life span.
        ctx.lineCap = "round";
        for (let b = 0; b < buckets.length; b++) {
          const idx = buckets[b];
          ctx.strokeStyle = bucketStyle[b].color;
          ctx.lineWidth = bucketStyle[b].width * 1.15;
          for (const tier of [0, 1]) {
            ctx.globalAlpha = Math.max(0, 1 - td / (bd * (tier ? 1.05 : 0.8)));
            ctx.beginPath();
            for (let k = tier; k < idx.length; k += 2) {
              const i = idx[k];
              if (td / bd > life[i]) continue;
              ctx.moveTo(px[i], py[i]);
              ctx.lineTo(x[i], y[i]);
            }
            ctx.stroke();
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
