// The upper sky, exported to images by render.mjs: stars and sun, the aeroplane and its trail, wispy high cloud.
(() => {
  const { INK, mulberry32, bbox, hatch, inkPoly, shade } = Pen;
  const { stroke, clipTo } = Scenes;

  // ---------- stars ----------
  function dot(ctx, x, y, r, alpha) {
    ctx.fillStyle = INK; ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
    ctx.globalAlpha = 1;
  }
  function cross(ctx, x, y, r, rand) {
    const a = rand() * 0.5;
    for (const t of [a, a + Math.PI / 2]) {
      const dx = Math.cos(t) * r, dy = Math.sin(t) * r;
      stroke(ctx, [[x - dx, y - dy], [x + dx, y + dy]], { w: 0.95, alpha: 0.72 });
    }
  }
  function spiky(x, y, outer, inner, points, turn) {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const a = turn + (i / (points * 2)) * Math.PI * 2, r = i % 2 ? inner : outer;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
    return pts;
  }
  function sparkle(ctx, x, y, r, rand) {
    shade(ctx, spiky(x, y, r, r * 0.24, 4, -Math.PI / 2 + (rand() - 0.5) * 0.2), rand, r * 0.5, { tone: 0.7, outline: { w: 1, alpha: 0.88, passes: 1 } });
  }
  function fivePoint(ctx, x, y, r, rand) {
    shade(ctx, spiky(x, y, r, r * 0.44, 5, -Math.PI / 2 + (rand() - 0.5) * 0.5), rand, r * 0.42, { tone: 0.85, outline: { w: 1.1, alpha: 0.9 } });
  }

  // The Plough, joined up the way you would in a notebook.
  const PLOUGH = [[0, 0.02], [0.19, 0.07], [0.35, 0.17], [0.5, 0.25], [0.54, 0.49], [0.83, 0.49], [0.87, 0.2]];
  const PLOUGH_LINES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]];
  function plough(ctx, x, y, size, rand) {
    const at = (i) => [x + PLOUGH[i][0] * size, y + PLOUGH[i][1] * size];
    PLOUGH_LINES.forEach(([a, b]) => {
      const [x0, y0] = at(a), [x1, y1] = at(b);
      const L = Math.hypot(x1 - x0, y1 - y0), gapFromStar = 11;
      for (let s = gapFromStar; s < L - gapFromStar; s += 9) {
        const e = Math.min(s + 5, L - gapFromStar);
        stroke(ctx, [[x0 + ((x1 - x0) * s) / L, y0 + ((y1 - y0) * s) / L], [x0 + ((x1 - x0) * e) / L, y0 + ((y1 - y0) * e) / L]], { w: 0.85, alpha: 0.5 });
      }
    });
    PLOUGH.forEach((_, i) => { const [px, py] = at(i); sparkle(ctx, px, py, 7 + rand() * 3, rand); });
  }

  // Densest at the top and thinning out as you come down. `clear` keeps larger stars away from text.
  function drawStarField(ctx, W, H, seed, { counts, clear = null, moonAt = null, ploughAt = null, fade = 1.3, sizes = 1 }) {
    const rand = mulberry32(seed);
    const inClear = (x, y) => clear && x > clear[0] * W && x < clear[2] * W && y > clear[1] * H && y < clear[3] * H;
    const placed = [];
    const place = (count, gap, draw, allowInClear = false) => {
      let made = 0, tries = 0;
      while (made < count && tries++ < count * 90) {
        const x = rand() * W, y = rand() * H;
        if (rand() > Math.pow(1 - y / H, fade)) continue;
        if (!allowInClear && inClear(x, y)) continue;
        if (placed.some((p) => Math.hypot(p[0] - x, p[1] - y) < Math.max(gap, p[2]))) continue;
        placed.push([x, y, gap]);
        draw(x, y);
        made++;
      }
    };
    if (moonAt) placed.push([moonAt[0] * W, moonAt[1] * H, moonAt[2] * 1.9]);
    if (ploughAt) for (let i = 0; i < PLOUGH.length; i++) placed.push([ploughAt[0] * W + PLOUGH[i][0] * ploughAt[2], ploughAt[1] * H + PLOUGH[i][1] * ploughAt[2], 30]);
    if (ploughAt) plough(ctx, ploughAt[0] * W, ploughAt[1] * H, ploughAt[2], rand);
    place(counts.five, 70, (x, y) => fivePoint(ctx, x, y, (9 + rand() * 7) * sizes, rand));
    place(counts.sparkle, 44, (x, y) => sparkle(ctx, x, y, (6 + rand() * 7) * sizes, rand));
    place(counts.cross, 26, (x, y) => cross(ctx, x, y, (2.4 + rand() * 2.4) * sizes, rand));
    place(counts.dot, 11, (x, y) => dot(ctx, x, y, 0.8 + rand() * 0.9, inClear(x, y) ? 0.3 : 0.62 + rand() * 0.3), true);
  }

  // ---------- the aeroplane ----------
  function drawPlane(ctx, W, H, seed) {
    const rand = mulberry32(seed);
    const s = 0.82, ox = W - 205, oy = H * 0.5;
    ctx.save();
    ctx.translate(ox, oy); ctx.rotate(-0.045); ctx.scale(s, s);

    // Vapour trails: firm near the engines, breaking up towards the far end
    for (const [ty, spread] of [[23, 1.2], [29, 1]]) {
      let x = 90;
      while (x > -ox / s - 20) {
        const u = Math.max(0, Math.min(1, (x + ox / s) / (ox / s + 90)));
        const len = 16 + rand() * 40;
        const blur = (1 - u) * 11 * spread;
        if (rand() < 0.2 + u * 0.8) {
          const y = ty + (rand() - 0.5) * blur + (1 - u) * 5;
          stroke(ctx, [[x, y], [x - len / 2, y + (rand() - 0.5) * 0.8], [x - len, y + (rand() - 0.5) * 0.8]], { w: (0.75 + rand() * 0.4) / s, alpha: 0.2 + u * 0.55 });
        }
        x -= len * (0.7 + rand() * 0.5);
      }
    }

    const tone = { tone: 0.72, outline: { w: 1.25, alpha: 0.92 } };
    const line = { tone: 0.72, outline: { w: 1.15, alpha: 0.9, passes: 1 } };
    // Far wing and far tailplane behind the body
    shade(ctx, [[126, -9], [97, -29], [87, -29], [102, -9]], rand, 7, line);
    shade(ctx, [[20, -7], [-4, -19], [-13, -19], [4, -6]], rand, 5, line);
    // Tail fin
    shade(ctx, [[8, -7], [-14, -49], [7, -49], [48, -11]], rand, 8, line);
    // Body
    const body = Scenes.spline([[-2, -5], [56, -12], [168, -12], [204, -9], [222, -2], [229, 4], [216, 9], [150, 12], [58, 12], [12, 7]], 7);
    shade(ctx, body, rand, 8, tone);
    // Near tailplane, wing and engine in front of the body
    shade(ctx, [[8, 0], [-19, 11], [-9, 13], [29, 3]], rand, 5, line);
    shade(ctx, [[134, 5], [70, 48], [55, 48], [92, 6]], rand, 8, line);
    const engine = Scenes.spline([[92, 21], [118, 20], [125, 25], [118, 31], [94, 31]], 4);
    shade(ctx, engine, rand, 6, { tone: 0.9, outline: { w: 1.1, alpha: 0.9, passes: 1 } });
    // Windows, cockpit and door
    for (let x = 42; x < 188; x += 6.4) if (Math.abs(x - 125) > 5) dot(ctx, x, -4.5, 1, 0.85);
    stroke(ctx, [[205, -5], [213, -3.5], [216, -0.6], [205, -1.6], [205, -5]], { w: 0.95, alpha: 0.9 });
    stroke(ctx, [[194, -7], [194, 2]], { w: 0.85, alpha: 0.65 });
    ctx.restore();
  }

  // ---------- the cloud deck under the aeroplane ----------
  // A thick layer of cloud seen from above. Repeats left to right, so it can drift for ever.
  function drawCloudDeck(ctx, W, H, seed) {
    const rand = mulberry32(seed);
    const tops = (x) => 90 + 30 * Math.sin((x / W) * Math.PI * 4 + 1) + 21 * Math.sin((x / W) * Math.PI * 10 + 2.4) + 12 * Math.sin((x / W) * Math.PI * 22);
    const puffs = [];
    const rows = 13;
    for (let row = 0; row < rows; row++) {
      const R = 34 + row * 5, count = Math.round(W / (R * 1.2));
      for (let i = 0; i < count; i++) {
        const x = ((i + rand() * 0.8) / count) * W;
        const y = tops(x) + (row / (rows - 1)) * (H - 130) + (rand() - 0.5) * 16;
        puffs.push({ x, y, R: R * (0.82 + rand() * 0.36), seed: rand() * 1e9, curls: rand() < 0.55 ? 1 : 0 });
      }
    }
    puffs.sort((a, b) => a.y - b.y).forEach((p) => {
      for (const dx of [-W, 0, W]) {
        if (p.x + dx < -p.R * 1.4 || p.x + dx > W + p.R * 1.4) continue;
        // The same seed each time, so copies either side of the seam match exactly
        const r = mulberry32(p.seed), x = p.x + dx;
        shade(ctx, Pen.blobPath(x, p.y, p.R, r, { squash: 0.8 }), r, p.R * 0.6, { curls: p.curls, cx: x, cy: p.y, R: p.R, tone: 0.6, outline: { w: 1.15, alpha: 0.85 } });
      }
    });
  }

  // Separate clumps that pass in front of the plane. Repeats left to right, with clear sky between clumps.
  function drawCloudClumps(ctx, W, H, seed) {
    const rand = mulberry32(seed);
    const clumps = [[0.07, 1], [0.27, 0.62], [0.46, 0.85], [0.68, 0.55], [0.87, 1]];
    const puffs = [];
    clumps.forEach(([u, tall]) => {
      const width = 150 + rand() * 90;
      for (let i = 0; i < 16; i++) {
        const v = rand(), a = (rand() - 0.5) * 2;
        const R = 28 + rand() * 26;
        const lowest = H - R * 0.9 - 3, highest = H - (H - R) * tall * (1 - Math.abs(a) * 0.55);
        puffs.push({ x: u * W + a * width, y: highest + (lowest - highest) * v, R, seed: rand() * 1e9, curls: rand() < 0.5 ? 1 : 0 });
      }
    });
    puffs.sort((a, b) => a.y - b.y).forEach((p) => {
      for (const dx of [-W, 0, W]) {
        if (p.x + dx < -p.R * 1.4 || p.x + dx > W + p.R * 1.4) continue;
        const r = mulberry32(p.seed), x = p.x + dx;
        shade(ctx, Pen.blobPath(x, p.y, p.R, r, { squash: 0.8 }), r, p.R * 0.6, { curls: p.curls, cx: x, cy: p.y, R: p.R, tone: 0.55, outline: { w: 1.15, alpha: 0.88 } });
      }
    });
  }

  // ---------- the hot-air balloon ----------
  function drawBalloon(ctx, W, H, seed) {
    const rand = mulberry32(seed), c = W / 2;
    const R = W * 0.42, cy = R + 3, neck = cy + R * 1.34;
    const envelope = Scenes.spline([[c, 3], [c + R * 0.74, cy - R * 0.7], [c + R, cy], [c + R * 0.72, cy + R * 0.76], [c + R * 0.17, neck], [c - R * 0.17, neck], [c - R * 0.72, cy + R * 0.76], [c - R, cy], [c - R * 0.74, cy - R * 0.7]], 7);
    shade(ctx, envelope, rand, R * 0.46, { tone: 0.75, outline: { w: 1.3, alpha: 0.94 } });
    clipTo(ctx, envelope, () => {
      // Panels, with every other one hatched
      for (let i = -3; i <= 3; i++) {
        const bow = (i / 3) * R * 1.08;
        const seam = [];
        for (let t = 0; t <= 1; t += 0.05) seam.push([c + bow * Math.sin(t * Math.PI * 0.82 + 0.1) , 3 + t * (neck - 3)]);
        stroke(ctx, seam, { w: 0.95, alpha: 0.82 });
        if (i % 2 === 0 && i < 3) {
          const next = ((i + 1) / 3) * R * 1.08, back = [];
          for (let t = 1; t >= 0; t -= 0.05) back.push([c + next * Math.sin(t * Math.PI * 0.82 + 0.1), 3 + t * (neck - 3)]);
          const panel = [...seam, ...back];
          clipTo(ctx, panel, () => hatch(ctx, bbox(panel), -1.05, 2.5, rand, { alpha: 0.62, min: 5, max: 13, skip: 0.1 }));
        }
      }
    });
    const by = H - 15, bw = W * 0.14;
    stroke(ctx, [[c - R * 0.15, neck], [c - bw, by]], { w: 0.9, alpha: 0.85 });
    stroke(ctx, [[c + R * 0.15, neck], [c + bw, by]], { w: 0.9, alpha: 0.85 });
    const basket = [[c - bw, by], [c + bw, by], [c + bw * 0.86, H - 3], [c - bw * 0.86, H - 3]];
    shade(ctx, basket, rand, 3, { outline: { w: 1.1, alpha: 0.92, passes: 1 } });
    clipTo(ctx, basket, () => {
      hatch(ctx, bbox(basket), 0.8, 2.2, rand, { alpha: 0.72, min: 3, max: 7 });
      hatch(ctx, bbox(basket), -0.8, 2.2, rand, { alpha: 0.6, min: 3, max: 7 });
    });
  }

  // ---------- the sun ----------
  function drawSun(ctx, W, seed) {
    const rand = mulberry32(seed), c = W / 2, R = W * 0.23;
    const rays = 14;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + (rand() - 0.5) * 0.04, long = i % 2 === 0;
      const inner = R * 1.2, outer = (long ? R * 2.08 : R * 1.62) * (0.96 + rand() * 0.06), half = long ? 0.13 : 0.1;
      const ray = [[c + Math.cos(a - half) * inner, c + Math.sin(a - half) * inner], [c + Math.cos(a) * outer, c + Math.sin(a) * outer], [c + Math.cos(a + half) * inner, c + Math.sin(a + half) * inner]];
      shade(ctx, ray, rand, 3.4, { tone: 0.85, outline: { w: 1.15, alpha: 0.9, passes: 1 } });
    }
    const pts = [];
    for (let i = 0; i < 72; i++) { const a = (i / 72) * 6.283; pts.push([c + Math.cos(a) * R * (1 + Math.sin(a * 3 + 1) * 0.012), c + Math.sin(a) * R * (1 + Math.cos(a * 2) * 0.012)]); }
    shade(ctx, pts, rand, R * 0.42, { tone: 0.72, outline: { w: 1.35, alpha: 0.94 } });
  }

  // ---------- the rocket ----------
  // Pointing straight up; the page tilts it. The flame is animated on the page: see Rocket in components/ballpoint/sky.tsx.
  function drawRocket(ctx, W, H, seed) {
    const rand = mulberry32(seed);
    const cx = W / 2, S = W / 120;
    const P = (x, y) => [cx + x * S, y * S];
    const line = { tone: 0.8, outline: { w: 1.2, alpha: 0.92, passes: 1 } };
    // Fins and nozzle behind the body
    shade(ctx, [P(-26, 128), P(-52, 170), P(-50, 192), P(-24, 168)], rand, 7, line);
    shade(ctx, [P(26, 128), P(52, 170), P(50, 192), P(24, 168)], rand, 7, line);
    const nozzle = [P(-15, 176), P(15, 176), P(20, 196), P(-20, 196)];
    shade(ctx, nozzle, rand, 4, line);
    clipTo(ctx, nozzle, () => hatch(ctx, bbox(nozzle), 1.1, 2.1, rand, { alpha: 0.82, min: 4, max: 9, skip: 0.04 }));
    // Body
    const body = Scenes.spline([P(0, 4), P(16, 26), P(28, 62), P(31, 104), P(28, 146), P(20, 178), P(-20, 178), P(-28, 146), P(-31, 104), P(-28, 62), P(-16, 26)], 6);
    shade(ctx, body, rand, 11, { tone: 0.85, outline: { w: 1.35, alpha: 0.94 } });
    // Nose cone
    clipTo(ctx, body, () => {
      const nose = [P(-40, 0), P(40, 0), P(40, 45), P(0, 51), P(-40, 45)];
      clipTo(ctx, nose, () => {
        hatch(ctx, bbox(nose), -1.05, 2.5, rand, { alpha: 0.82, min: 6, max: 16, skip: 0.04 });
        hatch(ctx, bbox(nose), -0.55, 3.4, rand, { alpha: 0.46, min: 5, max: 12, skip: 0.2 });
      });
      const band = [];
      for (let x = -32; x <= 32; x += 4) band.push(P(x, 47.5 + (1 - (x / 32) ** 2) * 3.5));
      stroke(ctx, band, { w: 1.1, alpha: 0.9 });
      const belt = [];
      for (let x = -32; x <= 32; x += 4) belt.push(P(x, 144 + (1 - (x / 32) ** 2) * 4));
      stroke(ctx, belt, { w: 1, alpha: 0.82 });
      stroke(ctx, belt.map(([a, b]) => [a, b + 7 * S]), { w: 1, alpha: 0.82 });
      for (let x = -28; x <= 28; x += 7) dot(ctx, cx + x * S, (147 + (1 - (x / 32) ** 2) * 4 + 1) * S, 0.85, 0.85);
    });
    // Porthole
    const hole = (r) => { const pts = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * 6.283; pts.push(P(Math.cos(a) * r, 84 + Math.sin(a) * r)); } return pts; };
    shade(ctx, hole(14), rand, 3.2, { tone: 0.75, outline: { w: 1.25, alpha: 0.94 } });
    inkPoly(ctx, hole(10), rand, { w: 1, alpha: 0.9, passes: 1 });
    clipTo(ctx, hole(10), () => hatch(ctx, bbox(hole(10)), -1, 2.3, rand, { alpha: 0.5, min: 4, max: 9, skip: 0.15 }));
    stroke(ctx, [P(-5.5, 80), P(-2, 76)], { w: 1.2, alpha: 0.9 });
    // Middle fin, facing us
    const fin = [P(0, 128), P(5, 166), P(0, 194), P(-5, 166)];
    shade(ctx, fin, rand, 4, { tone: 0.9, outline: { w: 1.15, alpha: 0.92, passes: 1 } });
  }

  // ---------- wispy high cloud ----------
  function drawWisp(ctx, W, H, seed) {
    const rand = mulberry32(seed);
    const n = 13 + Math.floor(rand() * 6);
    for (let i = 0; i < n; i++) {
      const y0 = H * (0.3 + rand() * 0.62), x0 = W * (0.02 + rand() * 0.3), L = W * (0.34 + rand() * 0.5);
      const rise = H * (0.1 + rand() * 0.2), hook = H * (0.05 + rand() * 0.14);
      const pts = [];
      for (let u = 0; u <= 1; u += 0.04) {
        const x = x0 + L * u, y = y0 - rise * u * u - hook * Math.pow(u, 7) + Math.sin(u * 7 + i) * 0.9;
        pts.push([x, y]);
      }
      // Broken into runs, as a quick light pen stroke would be
      let at = 0;
      while (at < pts.length - 1) {
        const run = 4 + Math.floor(rand() * 11);
        if (rand() > 0.14) stroke(ctx, pts.slice(at, at + run + 1), { w: 0.7 + rand() * 0.5, alpha: 0.26 + rand() * 0.42 });
        at += run;
      }
    }
  }

  // ---------- the fence along the bottom of the page ----------
  // Both pieces repeat across the page. The tops carry the rail; the boards below carry the footer text, so their grain is faint.
  const BOARDS = 5;
  function drawFenceTop(ctx, W, H, seed) {
    const rand = mulberry32(seed), bw = W / BOARDS;
    for (let i = 0; i < BOARDS; i++) {
      const x = i * bw, peak = 3 + rand() * 7, shoulder = 24 + rand() * 6;
      const board = [[x + 0.6, H + 3], [x + 0.6, shoulder], [x + bw * 0.5 + (rand() - 0.5) * 3, peak], [x + bw - 0.6, shoulder + (rand() - 0.5) * 4], [x + bw - 0.6, H + 3]];
      shade(ctx, board, rand, 7, { tone: 0.5, outline: { w: 1.2, alpha: 0.9 } });
      for (let g = 0; g < 4; g++) {
        const gx = x + 8 + rand() * (bw - 16), y0 = shoulder + 6 + rand() * 20;
        stroke(ctx, [[gx, y0], [gx + 0.8, y0 + 14], [gx - 0.4, y0 + 30 + rand() * 12]], { w: 0.75, alpha: 0.26 });
      }
    }
    // The rail nailed across the boards
    const top = H - 40, bottom = H - 20;
    const rail = [[-4, top], [W + 4, top + 1], [W + 4, bottom + 1], [-4, bottom]];
    shade(ctx, rail, rand, 3.4, { tone: 0.62, outline: { w: 1.15, alpha: 0.9, passes: 1 } });
    clipTo(ctx, rail, () => {
      for (let g = 0; g < 16; g++) {
        const gx = rand() * W, gy = top + 3 + rand() * 14, L = 18 + rand() * 40;
        stroke(ctx, [[gx, gy], [gx + L, gy + (rand() - 0.5) * 1.2]], { w: 0.75, alpha: 0.3 });
      }
    });
    for (let i = 0; i < BOARDS; i++) {
      const nx = i * bw + bw * 0.5;
      dot(ctx, nx - 3 + rand() * 6, top + 6, 1.15, 0.85);
      dot(ctx, nx - 3 + rand() * 6, bottom - 6, 1.15, 0.85);
    }
  }
  function drawFenceBoards(ctx, W, H, seed) {
    const rand = mulberry32(seed), bw = W / BOARDS;
    for (let i = 0; i <= BOARDS; i++) {
      const pts = [];
      for (let y = -4; y <= H + 4; y += 12) pts.push([i * bw + Math.sin((y / H) * Math.PI * 2 + i) * 0.7, y]);
      stroke(ctx, pts, { w: 1, alpha: 0.2 });
    }
    for (let i = 0; i < 44; i++) {
      const gx = rand() * W, gy = rand() * (H - 50), L = 20 + rand() * 36;
      stroke(ctx, [[gx, gy], [gx + 0.7, gy + L / 2], [gx - 0.3, gy + L]], { w: 0.7, alpha: 0.13 + rand() * 0.07 });
    }
    // A knot or two
    for (let i = 0; i < 3; i++) {
      const kx = (rand() * BOARDS | 0) * bw + 18 + rand() * (bw - 36), ky = 30 + rand() * (H - 60);
      for (let r = 3; r <= 7; r += 2) {
        const ring = [];
        for (let a = 0; a <= 6.4; a += 0.45) ring.push([kx + Math.cos(a) * r * 0.7, ky + Math.sin(a) * r]);
        stroke(ctx, ring, { w: 0.7, alpha: 0.22 });
      }
    }
  }

  Object.assign(window.Scenes, { drawStarField, drawPlane, drawWisp, drawFenceTop, drawFenceBoards, drawRocket, drawSun, drawCloudDeck, drawCloudClumps, drawBalloon });
})();
