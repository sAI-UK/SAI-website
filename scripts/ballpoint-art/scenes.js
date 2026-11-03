// Illustrations exported to images by render.mjs rather than drawn in the visitor's
// browser: side clouds and the Northumberland meadow in the footer. See sky.js for the upper sky.
(() => {
  const { INK, BLACK, mulberry32, poly, bbox, hatch, inkPoly, blobPath, shade, drawTree } = Pen;

  // ---------- small drawing helpers ----------
  // Erase instead of painting paper, so the page's own paper shows through the hills.
  function knockout(ctx, pts) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    ctx.beginPath(); poly(ctx, pts); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  function clipTo(ctx, pts, draw) {
    ctx.save();
    ctx.beginPath(); poly(ctx, pts); ctx.clip();
    draw();
    ctx.restore();
  }
  function stroke(ctx, pts, { w = 1, alpha = 0.8 } = {}) {
    ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.globalAlpha = alpha;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Smooth closed curve through hand-placed points.
  function spline(p, seg = 6) {
    const out = [], n = p.length;
    for (let i = 0; i < n; i++) {
      const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], d = p[(i + 2) % n];
      for (let j = 0; j < seg; j++) {
        const t = j / seg, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((k) => 0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t3)));
      }
    }
    return out;
  }
  function rolling(base, waves) {
    return (x) => waves.reduce((y, [amp, len, ph]) => y + amp * Math.sin((x / len) * Math.PI * 2 + ph), base);
  }
  function hillShape(fn, W, H) {
    const pts = [];
    for (let x = -10; x <= W + 10; x += 8) pts.push([x, fn(x)]);
    pts.push([W + 10, H + 10], [-10, H + 10]);
    return pts;
  }

  // Broken lines that follow the lie of the land, heavier on slopes facing away from the light.
  function contours(ctx, fn, W, rand, { from = 6, to = 60, gap = 7, grow = 1.08, alpha = 0.35, x0 = -10, x1 = W + 10, min = 14, max = 70, skip = 0.45 } = {}) {
    ctx.strokeStyle = INK;
    let g = gap;
    for (let d = from; d < to; d += g, g *= grow) {
      let x = x0 - rand() * 40;
      while (x < x1) {
        const len = min + rand() * (max - min);
        const lee = Math.max(-1, Math.min(1, (fn(x + 10) - fn(x - 10)) * 0.6));
        if (rand() > skip - lee * 0.35) {
          const pts = [], jit = (rand() - 0.5) * 2;
          for (let s = 0; s <= len; s += 8) pts.push([x + s, fn(x + s) + d + jit + Math.sin(s * 0.09) * 0.6]);
          stroke(ctx, pts, { w: 0.8 + rand() * 0.4, alpha: alpha * (0.6 + rand() * 0.4 + Math.max(0, lee) * 0.6) });
        }
        x += len + rand() * 26;
      }
    }
  }

  // A dry stone wall: two wobbling courses with stones ticked in between.
  function wall(ctx, pts, rand, t = 3) {
    const f = rand() * 6;
    const line = (off) => pts.map(([x, y], i) => [x, y + off + Math.sin(i * 0.7 + f) * 0.5]);
    stroke(ctx, line(0), { w: 1.05, alpha: 0.85 });
    stroke(ctx, line(t), { w: 1.05, alpha: 0.85 });
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const L = Math.hypot(x1 - x0, y1 - y0);
      for (let s = rand() * 3; s < L; s += 3 + rand() * 5) {
        const u = s / L, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
        stroke(ctx, [[x, y], [x + (rand() - 0.5) * 1.6, y + t]], { w: 0.75, alpha: 0.65 });
      }
    }
  }

  // ---------- clouds ----------
  function drawCloud(ctx, cx, base, width, rand) {
    const puffs = [];
    const n = Math.max(5, Math.round(width / 34));
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, dome = Math.sin(u * Math.PI);
      const R = (width * 0.085 + width * 0.12 * dome) * (0.8 + rand() * 0.4);
      puffs.push({ x: cx + (u - 0.5) * width + (rand() - 0.5) * 12, y: base - R * 0.55, R });
      if (dome > 0.55) puffs.push({ x: cx + (u - 0.5) * width * 0.8 + (rand() - 0.5) * 24, y: base - R * (1.3 + rand() * 0.5), R: R * (0.7 + rand() * 0.3) });
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(cx - width, base - width, width * 2, width + 2 + rand() * 2); ctx.clip();
    puffs.sort((a, b) => a.y - b.y).forEach((p) => {
      const pts = blobPath(p.x, p.y, p.R, rand, { squash: 0.84 });
      shade(ctx, pts, rand, p.R * 0.62, { curls: rand() < 0.6 ? 1 : 0, cx: p.x, cy: p.y, R: p.R, tone: 0.62, outline: { w: 1.15, alpha: 0.85 } });
    });
    ctx.restore();
    // Soft flat underside
    const pts = [];
    for (let x = cx - width * 0.56; x <= cx + width * 0.56; x += 10) pts.push([x, base + 2 + Math.sin(x * 0.03) * 1.2]);
    stroke(ctx, pts, { w: 1, alpha: 0.5 });
    for (let i = 0; i < 3; i++) {
      const a = cx - width * (0.3 - i * 0.2), L = width * (0.14 + rand() * 0.1);
      stroke(ctx, [[a, base + 8 + i * 5], [a + L, base + 8 + i * 5 + rand()]], { w: 0.8, alpha: 0.28 });
    }
  }

  // ---------- cows ----------
  const COW = {
    standing: [[-52, -68], [-44, -76], [-34, -76], [-15, -73], [10, -73], [30, -78], [42, -83], [54, -89], [62, -93], [70, -92], [80, -80], [86, -70], [86, -63], [80, -58], [70, -61], [62, -60], [56, -48], [50, -33], [40, -25], [15, -22], [-10, -21], [-28, -26], [-44, -33], [-55, -50]],
    grazing: [[-52, -68], [-44, -76], [-34, -76], [-15, -73], [10, -73], [28, -76], [40, -74], [54, -57], [64, -39], [72, -27], [80, -16], [85, -6], [84, 2], [74, 4], [66, -4], [58, -14], [50, -22], [40, -25], [15, -22], [-10, -21], [-28, -26], [-44, -33], [-55, -50]],
  };
  const LEG_FRONT = [[30, -42], [44, -42], [42.5, -17], [40.5, -12], [41.5, 0], [33.5, 0], [34, -12], [32.5, -17]];
  const LEG_REAR = [[-52, -54], [-26, -42], [-31, -24], [-39, -14], [-37.5, 0], [-45.5, 0], [-45.5, -12], [-50, -26]];

  // type: "belted" (dark with a white band), "patched" (black and white) or "dark"
  function drawCow(ctx, x, y, s, rand, { dir = 1, pose = "grazing", type = "patched" } = {}) {
    const P = (pt, dx = 0, dy = 0) => [x + dir * s * (pt[0] + dx), y + s * (pt[1] + dy)];
    const heavy = { gap: Math.max(1.6, 2.4 * Math.min(1, s)), min: 7, max: 20 };
    const sizeShade = Math.max(3, 15 * s);

    // Shadow on the grass, falling away from the light
    const shadow = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      shadow.push([x + (dir * 4 + 12) * s + Math.cos(a) * 66 * s, y + 1.5 * s + Math.sin(a) * 7 * s]);
    }
    clipTo(ctx, shadow, () => hatch(ctx, bbox(shadow), 0.04, Math.max(1.7, 2.8 * s), rand, { alpha: 0.5, min: 8, max: 24 }));

    const leg = (shape, dx, dy, far) => {
      const pts = shape.map((pt) => P(pt, dx, dy));
      shade(ctx, pts, rand, sizeShade * 0.5, { outline: { w: Math.min(1.25, 0.8 + s * 0.3), alpha: 0.85, passes: 1 } });
      clipTo(ctx, pts, () => {
        if (far) hatch(ctx, bbox(pts), -1.05, heavy.gap, rand, { alpha: 0.75, min: 3, max: 9 });
        // Hoof
        const hb = bbox(pts);
        ctx.beginPath(); ctx.rect(hb.x - 2, hb.y + hb.h - 5 * s, hb.w + 4, 6 * s); ctx.clip();
        hatch(ctx, hb, 1.2, heavy.gap * 0.8, rand, { alpha: 0.95, min: 3, max: 8, skip: 0 });
      });
    };

    const step = pose === "grazing" ? 5 : 0;
    leg(LEG_FRONT, 7 - step, -2, true);
    leg(LEG_REAR, 13, -2, true);

    // Tail
    const tail = [P([-51, -68]), P([-57, -58]), P([-58, -42]), P([-56, -28])];
    stroke(ctx, tail, { w: Math.max(1, 1.7 * s), alpha: 0.85 });
    const tuft = [P([-58, -30]), P([-52, -30]), P([-53, -15]), P([-59, -17])];
    clipTo(ctx, tuft, () => hatch(ctx, bbox(tuft), 1.45, heavy.gap, rand, { alpha: 0.9, min: 3, max: 8, skip: 0 }));

    // Udder, tucked in front of the far hind leg
    if (type === "patched") {
      const udder = spline([[-27, -28], [-9, -26], [-11, -17], [-17, -14], [-24, -17]], 3).map((pt) => P(pt));
      shade(ctx, udder, rand, sizeShade * 0.35, { tone: 0.7, outline: { w: 1, alpha: 0.85, passes: 1 } });
    }

    leg(LEG_REAR, 0, 0, false);
    leg(LEG_FRONT, step, 0, false);

    const body = spline(COW[pose]).map((pt) => P(pt));
    const b = bbox(body);
    shade(ctx, body, rand, sizeShade, { tone: 0.8, outline: { w: Math.min(1.35, 0.85 + s * 0.35), alpha: 0.92 } });

    // Coat: dense pen work inside the outline, leaving highlights along the back
    const zones = [];
    const head = pose === "grazing"
      ? [[60, -44], [92, -12], [92, 8], [66, 8], [52, -16]]
      : [[58, -100], [96, -80], [96, -54], [66, -58], [56, -70]];
    if (type === "belted") {
      zones.push([[-62, -80], [-14, -80], [-20, -22], [-62, -22]], [[16, -84], [62, -100], [60, -24], [10, -24]], head);
    } else if (type === "dark") {
      zones.push([[-62, -80], [100, -100], [100, 8], [-62, 8]]);
    } else {
      const n = 3 + Math.floor(rand() * 2);
      for (let i = 0; i < n; i++) {
        const px = -40 + (i + 0.5) * (84 / n) + (rand() - 0.5) * 8, py = -56 - rand() * 14, r = 11 + rand() * 9;
        zones.push(spline(Array.from({ length: 7 }, (_, k) => {
          const a = (k / 7) * Math.PI * 2, q = r * (0.72 + rand() * 0.5);
          return [px + Math.cos(a) * q * 1.2, py + Math.sin(a) * q];
        }), 3));
      }
      zones.push(head);
    }
    clipTo(ctx, body, () => {
      zones.forEach((z) => {
        const pts = z.map((pt) => P(pt));
        ctx.save();
        ctx.beginPath(); poly(ctx, pts); ctx.clip();
        const zb = bbox(pts);
        hatch(ctx, zb, -1.05, heavy.gap, rand, { alpha: 0.86, min: heavy.min, max: heavy.max, skip: 0.03 });
        hatch(ctx, zb, -0.62, heavy.gap * 1.6, rand, { alpha: 0.5, min: heavy.min, max: heavy.max, skip: 0.2 });
        ctx.restore();
      });
    });

    // Face and ear; small cows at a distance do not need them
    if (s > 0.3) {
      const face = pose === "grazing"
        ? { ear: [[62, -35], [52, -44], [49, -35], [59, -29]], eye: [73, -18], nose: [80, -1], mouth: [[72, 0], [78, 2]] }
        : { ear: [[60, -89], [50, -96], [47, -88], [57, -83]], eye: [71, -81], nose: [83, -66], mouth: [[75, -60], [82, -61]] };
      const ear = spline(face.ear, 3).map((pt) => P(pt));
      shade(ctx, ear, rand, sizeShade * 0.3, { outline: { w: 1, alpha: 0.9, passes: 1 } });
      clipTo(ctx, ear, () => hatch(ctx, bbox(ear), -1.05, heavy.gap, rand, { alpha: 0.75, min: 3, max: 6 }));
      const dot = (pt, r) => {
        const [X, Y] = P(pt);
        ctx.fillStyle = BLACK; ctx.globalAlpha = 0.88;
        ctx.beginPath(); ctx.arc(X, Y, Math.max(0.7, r * s), 0, 6.3); ctx.fill();
        ctx.globalAlpha = 1;
      };
      if (type !== "dark") dot(face.eye, 1.7);
      // Light muzzle
      const m = pose === "grazing" ? [[75, -9], [86, -5], [84, 4], [72, 4]] : [[78, -73], [88, -67], [87, -58], [77, -60]];
      const muzzle = spline(m, 3).map((pt) => P(pt));
      clipTo(ctx, body, () => knockoutPaper(ctx, muzzle));
      stroke(ctx, [...muzzle, muzzle[0]], { w: 0.8, alpha: 0.5 });
      dot(face.nose, 1.1);
      stroke(ctx, face.mouth.map((pt) => P(pt)), { w: 0.9, alpha: 0.75 });
    }
    return b;
  }
  function knockoutPaper(ctx, pts) {
    ctx.fillStyle = Pen.PAPER;
    ctx.beginPath(); poly(ctx, pts); ctx.fill();
  }

  // ---------- grass and trees ----------
  function tuft(ctx, x, y, h, rand, { alpha = 0.8, blades = 4 } = {}) {
    ctx.strokeStyle = INK;
    const lean = 0.1 + rand() * 0.28;
    for (let i = 0; i < blades; i++) {
      const u = blades > 1 ? i / (blades - 1) - 0.5 : 0, bh = h * (0.65 + rand() * 0.5);
      const tx = x + u * h * 0.9 + lean * bh, ty = y - bh;
      ctx.globalAlpha = alpha * (0.6 + rand() * 0.4);
      ctx.lineWidth = Math.min(1.35, 0.7 + h * 0.018) * (0.8 + rand() * 0.35);
      ctx.beginPath();
      ctx.moveTo(x + u * h * 0.22, y);
      ctx.quadraticCurveTo(x + u * h * 0.3, y - bh * 0.62, tx, ty);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function flower(ctx, x, y, h, rand) {
    stroke(ctx, [[x, y], [x + 1, y - h * 0.5], [x + (rand() - 0.5) * 3, y - h]], { w: 0.85, alpha: 0.72 });
    const hx = x + (rand() - 0.5) * 2, hy = y - h, r = 1.7 + h * 0.055;
    if (rand() < 0.68) {
      // Daisy
      const n = 7;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.28 + rand() * 0.2;
        stroke(ctx, [[hx + Math.cos(a) * r * 0.45, hy + Math.sin(a) * r * 0.36], [hx + Math.cos(a) * r * 1.5, hy + Math.sin(a) * r * 1.1]], { w: 0.9, alpha: 0.85 });
      }
      ctx.fillStyle = INK; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(hx, hy, r * 0.42, 0, 6.3); ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // Clover head
      const pts = blobPath(hx, hy, r * 1.15, rand, { squash: 0.95 });
      inkPoly(ctx, pts, rand, { w: 0.85, alpha: 0.85, passes: 1 });
      clipTo(ctx, pts, () => hatch(ctx, bbox(pts), -1.05, 1.5, rand, { alpha: 0.75, min: 2, max: 4, skip: 0.15 }));
    }
  }
  // A windswept field tree, leaning away from the prevailing wind.
  function fieldTree(ctx, x, y, size, rand) {
    const lean = size * 0.32;
    const shadow = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * 6.28;
      shadow.push([x + size * 0.85 + Math.cos(a) * size * 1.25, y + 1 + Math.sin(a) * size * 0.14]);
    }
    clipTo(ctx, shadow, () => hatch(ctx, bbox(shadow), 0.03, 2.4, rand, { alpha: 0.52, min: 6, max: 20 }));
    const tw = Math.max(1.6, size * 0.11), th = size * 1.15;
    const trunk = [[x - tw, y + 1], [x + lean * 0.55 - tw * 0.6, y - th], [x + lean * 0.55 + tw * 0.6, y - th], [x + tw, y + 1]];
    shade(ctx, trunk, rand, tw, { outline: { w: 1, alpha: 0.9, passes: 1 } });
    clipTo(ctx, trunk, () => hatch(ctx, bbox(trunk), 1.25, 2, rand, { alpha: 0.8, min: 3, max: 8 }));
    const cx = x + lean, cy = y - th - size * 0.3;
    const puffs = [[-0.72, 0.22, 0.56], [0.72, 0.28, 0.58], [-0.3, -0.42, 0.62], [0.42, -0.34, 0.6], [0.06, 0.2, 0.76]];
    puffs.forEach(([dx, dy, r]) => drawTree(ctx, cx + dx * size, cy + dy * size, size * r, rand, { curls: size > 22 }));
  }

  // ---------- farm details ----------
  function drawSheep(ctx, x, y, s, rand, dir = 1) {
    const P = (px, py) => [x + dir * s * px, y + s * py];
    const shadow = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.28; shadow.push([x + 5 * s + Math.cos(a) * 25 * s, y + 1 * s + Math.sin(a) * 3.5 * s]); }
    clipTo(ctx, shadow, () => hatch(ctx, bbox(shadow), 0.04, Math.max(1.6, 2.4 * s), rand, { alpha: 0.45, min: 4, max: 12 }));
    for (const lx of [-13, -7, 8, 14]) stroke(ctx, [P(lx, -12), P(lx + 0.5, 0)], { w: Math.max(1, 1.8 * s), alpha: 0.9 });
    const fleece = blobPath(x, y - 21 * s, 21 * s, rand, { squash: 0.72 });
    shade(ctx, fleece, rand, 9 * s, { tone: 0.55, curls: s > 0.5 ? 2 : 0, cx: x, cy: y - 21 * s, R: 21 * s, outline: { w: 1.05, alpha: 0.88 } });
    const head = spline([P(17, -29), P(25, -30), P(31, -21), P(27, -16), P(19, -19)], 3);
    shade(ctx, head, rand, 3 * s, { outline: { w: 1, alpha: 0.9, passes: 1 } });
    clipTo(ctx, head, () => hatch(ctx, bbox(head), -1.05, Math.max(1.3, 1.9 * s), rand, { alpha: 0.9, min: 3, max: 7, skip: 0 }));
    stroke(ctx, [P(18, -28), P(13, -32)], { w: Math.max(1, 1.6 * s), alpha: 0.85 });
  }

  function drawFarmhouse(ctx, x, y, s, rand) {
    const P = (px, py) => [x + s * px, y + s * py];
    const stones = (pts) => clipTo(ctx, pts, () => {
      const b = bbox(pts);
      for (let i = 0; i < b.w * b.h * 0.014; i++) {
        const sx = b.x + rand() * b.w, sy = b.y + rand() * b.h;
        stroke(ctx, [[sx, sy], [sx + 3 + rand() * 4, sy + (rand() - 0.5) * 0.8]], { w: 0.75, alpha: 0.5 });
      }
    });
    const roof = (pts, angle) => {
      shade(ctx, pts, rand, 5 * s, { tone: 0.7, outline: { w: 1.1, alpha: 0.9 } });
      clipTo(ctx, pts, () => hatch(ctx, bbox(pts), angle, 2.5, rand, { alpha: 0.72, min: 6, max: 18 }));
    };
    // Barn behind
    const barn = [P(38, -17), P(70, -17), P(70, 0), P(38, 0)];
    shade(ctx, barn, rand, 5 * s, { tone: 0.72, outline: { w: 1, alpha: 0.88, passes: 1 } });
    stones(barn);
    roof([P(36, -17), P(42, -27), P(66, -27), P(72, -17)], 0.05);
    const barnDoor = [P(47, -11), P(58, -11), P(58, 0), P(47, 0)];
    shade(ctx, barnDoor, rand, 2, { outline: { w: 0.9, alpha: 0.9, passes: 1 } });
    clipTo(ctx, barnDoor, () => hatch(ctx, bbox(barnDoor), 1.5, 2, rand, { alpha: 0.86, min: 4, max: 9, skip: 0 }));
    // Chimneys (the smoke is animated on the page: see components/ballpoint/chimney-smoke.tsx)
    for (const cx of [-23, 23]) {
      const c = [P(cx - 3, -46), P(cx + 3, -46), P(cx + 3, -33), P(cx - 3, -33)];
      shade(ctx, c, rand, 2, { outline: { w: 1, alpha: 0.9, passes: 1 } });
      clipTo(ctx, c, () => hatch(ctx, bbox(c), -1.05, 2, rand, { alpha: 0.72, min: 3, max: 7 }));
    }
    // House
    const walls = [P(-34, -22), P(34, -22), P(34, 0), P(-34, 0)];
    shade(ctx, walls, rand, 6 * s, { tone: 0.62, outline: { w: 1.1, alpha: 0.9 } });
    stones(walls);
    roof([P(-37, -22), P(-25, -38), P(25, -38), P(37, -22)], 0.05);
    const pane = (px, py, w, h) => {
      const p = [P(px, py), P(px + w, py), P(px + w, py + h), P(px, py + h)];
      shade(ctx, p, rand, 1.6, { outline: { w: 0.85, alpha: 0.9, passes: 1 } });
      clipTo(ctx, p, () => hatch(ctx, bbox(p), -1.05, 1.5, rand, { alpha: 0.82, min: 2, max: 5, skip: 0.05 }));
    };
    pane(-24, -18, 7, 7); pane(-3.5, -18, 7, 7); pane(17, -18, 7, 7); pane(-24, -9, 7, 6); pane(17, -9, 7, 6); pane(-4, -9, 8, 9);
  }

  function drawBale(ctx, x, y, r, rand) {
    const pts = spline([[x - r * 0.9, y - r * 1.5], [x + r * 0.5, y - r * 1.72], [x + r * 1.3, y - r], [x + r * 1.1, y], [x - r * 0.9, y]], 5);
    shade(ctx, pts, rand, r * 0.45, { tone: 0.75, outline: { w: 1, alpha: 0.88, passes: 1 } });
    const spiral = [];
    for (let a = 0; a < 15; a += 0.3) spiral.push([x - r * 0.55 + Math.cos(a) * r * 0.052 * a * 0.8, y - r * 0.8 + Math.sin(a) * r * 0.052 * a]);
    stroke(ctx, spiral, { w: 0.8, alpha: 0.75 });
  }

  // A five-bar gate with its posts, set into the near wall.
  function drawGate(ctx, x, y, s, rand) {
    const post = (px) => {
      const p = [[x + px * s - 2.4 * s, y - 34 * s], [x + px * s + 2.4 * s, y - 35 * s], [x + px * s + 2.4 * s, y + 3 * s], [x + px * s - 2.4 * s, y + 3 * s]];
      shade(ctx, p, rand, 2.2 * s, { outline: { w: 1.05, alpha: 0.92, passes: 1 } });
      clipTo(ctx, p, () => hatch(ctx, bbox(p), 1.45, 2.2, rand, { alpha: 0.72, min: 4, max: 10 }));
    };
    const rail = (x0, y0, x1, y1, w = 1.25) => {
      stroke(ctx, [[x0, y0], [x1, y1]], { w, alpha: 0.95 });
      stroke(ctx, [[x0, y0 + 1.5], [x1, y1 + 1.5]], { w: 0.8, alpha: 0.6 });
    };
    const left = x - 28 * s, right = x + 28 * s, top = y - 28 * s, bottom = y - 3 * s;
    for (let i = 0; i < 5; i++) { const ry = top + ((bottom - top) * i) / 4; rail(left, ry, right, ry); }
    rail(left, bottom, right, top, 1.15);
    rail(left + 18 * s, top, left + 18 * s, bottom, 1);
    post(-30); post(30);
  }

  // Foreground plants that rise above the grass.
  function cowParsley(ctx, x, y, h, rand) {
    const lean = 0.1 + rand() * 0.14;
    const tx = x + lean * h, ty = y - h;
    stroke(ctx, [[x, y], [x + lean * h * 0.35, y - h * 0.55], [tx, ty]], { w: 1, alpha: 0.85 });
    for (const dir of [-1, 1]) stroke(ctx, [[x + lean * h * 0.2, y - h * 0.34], [x + lean * h * 0.2 + dir * h * 0.13, y - h * 0.5]], { w: 0.8, alpha: 0.72 });
    const rays = 7 + Math.floor(rand() * 4), spread = h * 0.17;
    for (let i = 0; i < rays; i++) {
      const u = i / (rays - 1) - 0.5, ex = tx + u * spread * 2, ey = ty - spread * (0.7 - u * u * 1.4);
      stroke(ctx, [[tx, ty], [ex, ey]], { w: 0.75, alpha: 0.72 });
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = INK; ctx.globalAlpha = 0.86;
        ctx.beginPath(); ctx.arc(ex + (rand() - 0.5) * spread * 0.34, ey + (rand() - 0.6) * spread * 0.24, 0.9 + rand() * 0.45, 0, 6.3); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
  function thistle(ctx, x, y, h, rand) {
    const tx = x + h * 0.08, ty = y - h;
    stroke(ctx, [[x, y], [x + h * 0.03, y - h * 0.55], [tx, ty + h * 0.08]], { w: 1.1, alpha: 0.88 });
    for (const [at, dir] of [[0.32, 1], [0.48, -1], [0.66, 1]]) {
      const ly = y - h * at, len = h * 0.2;
      const leaf = [[x + h * 0.03, ly], [x + dir * len * 0.5, ly - len * 0.45], [x + dir * len, ly - len * 0.3], [x + dir * len * 0.62, ly - len * 0.16], [x + dir * len * 0.5, ly + len * 0.05]];
      inkPoly(ctx, leaf, rand, { w: 0.85, alpha: 0.82, passes: 1 });
    }
    const bulb = blobPath(tx, ty + h * 0.03, h * 0.075, rand, { bumps: false, squash: 1 });
    shade(ctx, bulb, rand, h * 0.03, { outline: { w: 0.95, alpha: 0.9, passes: 1 } });
    clipTo(ctx, bulb, () => {
      hatch(ctx, bbox(bulb), 0.75, 2, rand, { alpha: 0.72, min: 3, max: 6 });
      hatch(ctx, bbox(bulb), -0.75, 2, rand, { alpha: 0.6, min: 3, max: 6 });
    });
    for (let i = 0; i < 11; i++) {
      const u = i / 10 - 0.5;
      stroke(ctx, [[tx + u * h * 0.1, ty - h * 0.015], [tx + u * h * 0.2, ty - h * 0.1 - rand() * h * 0.03]], { w: 0.85, alpha: 0.85 });
    }
  }

  // ---------- fields ----------
  function fields(ctx, fn, W, rand, { rows, colMin, colMax, shear = 0.5, wallT = 3, trees = 0, treeSize = [10, 20], tone = 1, wander = 7, avoid = [] }) {
    const junctions = [];
    const rowY = (r, u) => fn(u) + rows[r] + (r ? wander * Math.sin(u / (W * 0.17) + r * 2.1) : 0);
    for (let r = 0; r < rows.length - 1; r++) {
      const a = rows[r], b = rows[r + 1];
      let x = -80 - rand() * 200, sL = shear * (0.4 + rand() * 1.1);
      while (x < W + 80) {
        const nx = x + colMin + rand() * (colMax - colMin), sR = shear * (0.4 + rand() * 1.1);
        const at = (u, d) => u + (sL + ((sR - sL) * (u - x)) / (nx - x)) * d;
        const top = [], bottom = [];
        for (let u = x; u <= nx; u += 12) { top.push([at(u, a), rowY(r, u)]); bottom.push([at(u, b), rowY(r + 1, u)]); }
        const cell = [...top, ...bottom.slice().reverse()];
        const style = rand();
        const cb = bbox(cell);
        clipTo(ctx, cell, () => {
          if (style < 0.3) {
            hatch(ctx, cb, 0.08 + rand() * 0.4, 4.8, rand, { alpha: 0.34 * tone, min: 14, max: 42, skip: 0.2 });
          } else if (style < 0.5) {
            hatch(ctx, cb, -0.9 - rand() * 0.3, 3.2, rand, { alpha: 0.46 * tone, min: 7, max: 18 });
          } else if (style < 0.59) {
            hatch(ctx, cb, -1, 3.1, rand, { alpha: 0.48 * tone, min: 7, max: 16 });
            hatch(ctx, cb, 0.35, 3.8, rand, { alpha: 0.4 * tone, min: 6, max: 14 });
          } else if (style < 0.8) {
            contours(ctx, (u) => rowY(r, u), W, rand, { from: 4, to: b - a + wander, gap: 6, grow: 1, alpha: 0.4 * tone, x0: cb.x, x1: cb.x + cb.w, min: 8, max: 36, skip: 0.5 });
          } else if (style < 0.95) {
            for (let i = 0; i < cb.w * cb.h * 0.003; i++) tuft(ctx, cb.x + rand() * cb.w, cb.y + rand() * cb.h, 3 + rand() * 2, rand, { alpha: 0.5, blades: 2 });
          }
        });
        if (rand() > 0.07) {
          const side = [];
          for (let t = 0; t <= 1; t += 0.2) {
            const d = a + (b - a) * t;
            side.push([nx + sR * d, rowY(r, nx) + (rowY(r + 1, nx) - rowY(r, nx)) * t]);
          }
          wall(ctx, side, rand, wallT * 0.72);
        }
        if (rand() > 0.08) wall(ctx, bottom, rand, wallT);
        junctions.push([nx + sR * b, rowY(r + 1, nx)]);
        x = nx; sL = sR;
      }
    }
    for (let i = 0; i < trees; i++) {
      const [tx, ty] = junctions[Math.floor(rand() * junctions.length)];
      if (avoid.some((ax) => Math.abs(ax - tx) < colMin * 0.5)) continue;
      fieldTree(ctx, tx + (rand() - 0.5) * 22, ty, treeSize[0] + rand() * (treeSize[1] - treeSize[0]), rand);
    }
  }

  // ---------- the ground under the footer text ----------
  // A tile that repeats in every direction, so the meadow's grass can carry on for as long as the footer is tall.
  function drawGrassTile(ctx, W, H, seed) {
    const rand = mulberry32(seed);
    const wave = (x, y) => 0.5 + 0.5 * Math.sin((x / W) * Math.PI * 4 + Math.sin((y / H) * Math.PI * 2) * 2) * Math.sin((y / H) * Math.PI * 6 + (x / W) * Math.PI * 2);
    const items = [];
    for (let i = 0; i < W * H * 0.0024; i++) {
      const x = rand() * W, y = rand() * H;
      if (rand() > 0.3 + 0.7 * wave(x, y)) continue;
      const big = rand();
      items.push({ x, y, kind: "tuft", h: 11 + big * big * 24, blades: big > 0.5 ? 5 : 4, seed: rand() * 1e9 });
    }
    for (let i = 0; i < W * H * 0.00016; i++) items.push({ x: rand() * W, y: rand() * H, kind: "flower", h: 11 + rand() * 13, seed: rand() * 1e9 });
    for (let i = 0; i < W * H * 0.000034; i++) items.push({ x: rand() * W, y: rand() * H, kind: rand() < 0.6 ? "parsley" : "thistle", h: 46 + rand() * 46, seed: rand() * 1e9 });
    for (let i = 0; i < 7; i++) items.push({ x: rand() * W, y: rand() * H, kind: "stone", h: 7 + rand() * 9, seed: rand() * 1e9 });
    // Sweeping long-grass strokes underneath everything
    for (let i = 0; i < W * H * 0.0012; i++) items.push({ x: rand() * W, y: rand() * H, kind: "sweep", h: 9 + rand() * 18, seed: rand() * 1e9, back: true });

    const margin = 110;
    items.sort((a, b) => (a.back ? -1 : 0) - (b.back ? -1 : 0) || a.y - b.y).forEach((o) => {
      for (const dx of [-W, 0, W]) for (const dy of [-H, 0, H]) {
        const x = o.x + dx, y = o.y + dy;
        if (x < -margin || x > W + margin || y < -margin || y > H + margin) continue;
        // The same seed each time, so copies either side of a seam line up exactly
        const r = mulberry32(o.seed);
        if (o.kind === "tuft") tuft(ctx, x, y, o.h, r, { alpha: 0.78, blades: o.blades });
        else if (o.kind === "flower") flower(ctx, x, y, o.h, r);
        else if (o.kind === "parsley") cowParsley(ctx, x, y, o.h, r);
        else if (o.kind === "thistle") thistle(ctx, x, y, o.h, r);
        else if (o.kind === "stone") shade(ctx, blobPath(x, y, o.h, r, { bumps: false, squash: 0.66 }), r, o.h * 0.55, { tone: 0.75, outline: { w: 1, alpha: 0.88, passes: 1 } });
        else stroke(ctx, [[x, y], [x + o.h * 0.22, y - o.h]], { w: 0.8, alpha: 0.2 + r() * 0.16 });
      }
    });
  }

  // ---------- the footer scene ----------
  // Positions are fractions of the width so the desktop and mobile versions share one recipe.
  function drawMeadow(ctx, W, H, seed, opt) {
    const rand = mulberry32(seed);
    const { clouds, farY, midY, nearY, foreY, cowsFar, cowsMid, cowsFore, foreTrees, scale, grass, farm, sheepMid, sheepFore, bales, gate } = opt;

    clouds.forEach(([u, base, width]) => drawCloud(ctx, u * W, base, width, rand));
    (opt.horizonClouds || []).forEach(([u, base, width]) => drawCloud(ctx, u * W, base, width, rand));
    // Birds are live on the page now. These draws are kept so the rest of the drawing stays exactly as it was.
    for (let i = 0; i < opt.spentDraws; i++) rand();

    // Cheviot-like hills on the horizon
    const far2 = rolling(farY - 54 * scale, [[44 * scale, W * 1.3, 2.5], [13 * scale, W * 0.37, 0.5]]);
    knockout(ctx, hillShape(far2, W, H));
    inkPoly(ctx, hillShape(far2, W, H).slice(0, -2), rand, { w: 1, alpha: 0.58, closed: false, passes: 1 });
    contours(ctx, far2, W, rand, { from: 5, to: 42 * scale, gap: 5, alpha: 0.26, min: 12, max: 52, skip: 0.55 });

    const far = rolling(farY, [[28 * scale, W * 1.05, 0.8], [9 * scale, W * 0.31, 3]]);
    knockout(ctx, hillShape(far, W, H));
    inkPoly(ctx, hillShape(far, W, H).slice(0, -2), rand, { w: 1.05, alpha: 0.72, closed: false, passes: 1 });
    fields(ctx, far, W, rand, { rows: [7 * scale, 26 * scale, 54 * scale], colMin: 90 * scale, colMax: 190 * scale, shear: 0.5, wallT: 1.6, trees: Math.round(7 * opt.density), treeSize: [5 * scale, 9 * scale], tone: 0.72, avoid: cowsFar.map(([u]) => u * W) });
    cowsFar.forEach(([u, d, sz, dir]) => drawCow(ctx, u * W, far(u * W) + d * scale, sz, rand, { dir, type: rand() < 0.5 ? "dark" : "patched", pose: rand() < 0.5 ? "grazing" : "standing" }));

    const mid = rolling(midY, [[32 * scale, W * 1.45, 3.6], [11 * scale, W * 0.41, 1.2]]);
    knockout(ctx, hillShape(mid, W, H));
    inkPoly(ctx, hillShape(mid, W, H).slice(0, -2), rand, { w: 1.2, alpha: 0.85, closed: false });
    fields(ctx, mid, W, rand, { rows: [12 * scale, 44 * scale, 92 * scale], colMin: 170 * scale, colMax: 340 * scale, shear: -0.7, wallT: 2.4, trees: Math.round(6 * opt.density), treeSize: [12 * scale, 21 * scale], tone: 0.86, avoid: cowsMid.map(([u]) => u * W) });
    cowsMid.forEach(([u, d, sz, dir, pose, type]) => drawCow(ctx, u * W, mid(u * W) + d * scale, sz, rand, { dir, pose, type }));

    drawFarmhouse(ctx, farm[0] * W, mid(farm[0] * W) + farm[1] * scale, farm[2], rand);
    fieldTree(ctx, (farm[0] - 0.052) * W, mid((farm[0] - 0.052) * W) + (farm[1] + 2) * scale, 30 * farm[2], rand);
    fieldTree(ctx, (farm[0] + 0.058) * W, mid((farm[0] + 0.058) * W) + (farm[1] + 5) * scale, 24 * farm[2], rand);
    bales.forEach(([u, d, r]) => drawBale(ctx, u * W, mid(u * W) + d * scale, r, rand));
    sheepMid.forEach(([u, d, sz, dir]) => drawSheep(ctx, u * W, mid(u * W) + d * scale, sz, rand, dir));

    const near = rolling(nearY, [[22 * scale, W * 1.7, 0.6], [7 * scale, W * 0.5, 2.2]]);
    knockout(ctx, hillShape(near, W, H));
    inkPoly(ctx, hillShape(near, W, H).slice(0, -2), rand, { w: 1.3, alpha: 0.9, closed: false });
    const wallLine = [];
    for (let x = -20; x < W + 20; x += 12) wallLine.push([x, near(x) + 3 * scale]);
    wall(ctx, wallLine, rand, 4 * scale);
    drawGate(ctx, gate * W, near(gate * W) + 8 * scale, 0.82 * scale, rand);
    contours(ctx, near, W, rand, { from: 12 * scale, to: H - nearY, gap: 8, grow: 1.12, alpha: 0.26, min: 16, max: 66, skip: 0.68 });

    const nearShape = hillShape(near, W, H);
    clipTo(ctx, nearShape, () => {
      for (let i = 0; i < 16 * opt.density + 3; i++) {
        const px = rand() * W, t = 0.12 + rand() * 0.8, py = nearY + (H - nearY) * t;
        const rx = (70 + rand() * 170) * scale, ry = (9 + 22 * t) * scale;
        const swathe = spline(Array.from({ length: 8 }, (_, k) => {
          const a = (k / 8) * Math.PI * 2, q = 0.7 + rand() * 0.5;
          return [px + Math.cos(a) * rx * q, py + Math.sin(a) * ry * q];
        }), 4);
        clipTo(ctx, swathe, () => hatch(ctx, bbox(swathe), -1.32, 3.4 + t * 2.4, rand, { alpha: 0.2 + t * 0.2, min: 5 + t * 9, max: 13 + t * 20, skip: 0.28 }));
      }
    });

    // A stream winding down through the near field
    const streamTop = near(W * 0.17) + 10 * scale;
    const streamAt = (t) => ({ x: W * (0.17 + 0.05 * Math.sin(t * 3.2) - 0.27 * t * t), half: (4 + 46 * t * t) * scale });
    const byStream = (x, y) => {
      const t = (y - streamTop) / (H - streamTop);
      if (t < 0 || t > 1.02) return false;
      const { x: sx, half } = streamAt(t);
      return Math.abs(x - sx) < half + 5;
    };
    const bankL = [], bankR = [];
    for (let t = 0; t <= 1.03; t += 0.015) {
      const { x, half } = streamAt(t), y = streamTop + (H - streamTop) * t;
      bankL.push([x - half + Math.sin(t * 40) * 1.5, y]);
      bankR.push([x + half + Math.sin(t * 34 + 2) * 1.5, y]);
    }
    const water = [...bankL, ...bankR.slice().reverse()];
    knockout(ctx, water);
    clipTo(ctx, water, () => {
      for (let i = 0; i < 300 * Math.max(0.5, scale); i++) {
        const t = rand(), y = streamTop + (H - streamTop) * t, { x, half } = streamAt(t);
        const rx = x + (rand() - 0.5) * half * 1.7, L = Math.min((5 + 26 * t) * (0.5 + rand()), half * 1.05);
        stroke(ctx, [[rx - L / 2, y], [rx, y + 0.9], [rx + L / 2, y - 0.3]], { w: 0.85, alpha: 0.4 + rand() * 0.4 });
      }
    });
    inkPoly(ctx, bankL, rand, { w: 1.15, alpha: 0.85, closed: false, passes: 1 });
    inkPoly(ctx, bankR, rand, { w: 1.15, alpha: 0.85, closed: false, passes: 1 });
    // Stones at the water's edge
    for (let i = 0; i < 14; i++) {
      const t = 0.22 + rand() * 0.72, side = rand() < 0.5 ? -1 : 1, { x, half } = streamAt(t), y = streamTop + (H - streamTop) * t, r = (2.5 + 7 * t) * Math.max(0.7, scale) * (0.7 + rand() * 0.5);
      const stone = blobPath(x + side * (half + r * 0.15), y, r, rand, { bumps: false, squash: 0.68 });
      shade(ctx, stone, rand, r * 0.55, { tone: 0.75, outline: { w: 0.95, alpha: 0.88, passes: 1 } });
    }

    // The foreground meadow: grass, flowers and cows are drawn back to front so they overlap properly.
    const fore = rolling(foreY, [[11 * scale, W * 0.8, 5], [4 * scale, W * 0.3, 1]]);
    const things = [];
    const clump = (x, y) => 0.5 + 0.5 * Math.sin(x / 140 + Math.sin(y / 46) * 2) * Math.sin(y / 31 + x / 410);
    const cowSpots = cowsFore.map(([u, d, sz]) => ({ x: u * W, y: near(u * W) + d * scale, s: sz }));
    const byCow = (x, y) => cowSpots.some((c) => Math.abs(x - c.x) < 82 * c.s && y > c.y - 90 * c.s && y < c.y + 14 * c.s);
    const area = W * (H - nearY);
    for (let i = 0; i < area * grass; i++) {
      const x = rand() * W;
      const top = near(x) + 14 * scale;
      const t = Math.pow(rand(), 0.8);
      const y = top + (H - 1 - top) * t;
      if (rand() > 0.22 + 0.78 * clump(x, y) || byCow(x, y) || byStream(x, y) || (t > 0.8 && rand() < 0.68)) continue;
      things.push({ y, draw: () => tuft(ctx, x, y, (4 + 19 * t * t) * Math.max(0.8, scale), rand, { alpha: 0.38 + 0.44 * t, blades: t < 0.3 ? 2 : t < 0.65 ? 3 : 5 }) });
    }
    for (let i = 0; i < W * 0.04; i++) {
      const x = rand() * W, t = Math.pow(rand(), 0.55), y = fore(x) + (H - fore(x) - 3) * t;
      if (byCow(x, y) || byStream(x, y)) continue;
      things.push({ y, draw: () => flower(ctx, x, y, (6 + 15 * t) * Math.max(0.85, scale), rand) });
    }
    foreTrees.forEach(([u, d, size]) => {
      const x = u * W, y = near(x) + d * scale;
      things.push({ y, draw: () => fieldTree(ctx, x, y, size * scale, rand) });
    });
    cowsFore.forEach(([u, d, sz, dir, pose, type]) => {
      const x = u * W, y = near(x) + d * scale;
      things.push({ y, draw: () => {
        drawCow(ctx, x, y, sz, rand, { dir, pose, type });
        // A few blades in front of the hooves so the cow stands in the grass, not on it
        for (let i = 0; i < 16; i++) tuft(ctx, x + (rand() - 0.5) * 140 * sz, y + rand() * 4 * sz, (3 + rand() * 6) * Math.max(0.7, sz), rand, { alpha: 0.72, blades: 3 });
      } });
    });
    sheepFore.forEach(([u, d, sz, dir]) => {
      const x = u * W, y = near(x) + d * scale;
      things.push({ y, draw: () => {
        drawSheep(ctx, x, y, sz, rand, dir);
        for (let i = 0; i < 7; i++) tuft(ctx, x + (rand() - 0.5) * 48 * sz, y + rand() * 3 * sz, (3 + rand() * 5) * Math.max(0.7, sz), rand, { alpha: 0.72, blades: 3 });
      } });
    });
    things.sort((a, b) => a.y - b.y).forEach((o) => o.draw());

    // Long grass framing the two lower corners
    const corner = (x0, x1) => {
      for (let i = 0; i < W * 0.022 * scale; i++) {
        const x = x0 + rand() * (x1 - x0);
        const edge = Math.min(Math.abs(x - x0), Math.abs(x - x1)) / Math.abs(x1 - x0);
        tuft(ctx, x, H - rand() * 150 * scale, (20 + rand() * 24) * scale * (1 - edge * 0.5), rand, { alpha: 0.62, blades: 4 });
      }
    };
    corner(-20, W * opt.corner);
    corner(W * (1 - opt.corner), W + 20);
    for (let i = 0; i < W * 0.017; i++) {
      const x = rand() * W, y = H - rand() * 120 * scale, h = (48 + rand() * 66) * Math.max(0.72, scale);
      if (cowSpots.some((c) => Math.abs(x - c.x) < 96 * c.s) || byStream(x, y - 4)) continue;
      (rand() < 0.62 ? cowParsley : thistle)(ctx, x, y, h, rand);
    }
  }

  const MEADOW_DESKTOP = {
    scale: 1, density: 1, grass: 0.0058, corner: 0.13,
    farY: 306, midY: 352, nearY: 440, foreY: 486,
    clouds: [],
    horizonClouds: [[0.21, 236, 110], [0.385, 222, 84], [0.63, 218, 118], [0.81, 240, 96]],
    spentDraws: 5,
    cowsFar: [[0.2, 30, 0.2, 1], [0.225, 36, 0.2, -1], [0.82, 28, 0.2, 1]],
    cowsMid: [[0.3, 62, 0.4, 1, "grazing", "patched"], [0.34, 74, 0.4, -1, "standing", "dark"], [0.655, 72, 0.4, -1, "grazing", "belted"], [0.885, 60, 0.4, 1, "standing", "patched"]],
    cowsFore: [[0.3, 62, 0.66, 1, "standing", "dark"], [0.41, 112, 0.92, 1, "grazing", "patched"], [0.53, 66, 0.72, -1, "standing", "belted"], [0.645, 142, 1.12, -1, "grazing", "belted"], [0.8, 84, 0.76, -1, "grazing", "patched"], [0.335, 236, 1.5, 1, "grazing", "patched"], [0.435, 218, 0.72, -1, "standing", "patched"], [0.84, 222, 1.34, -1, "standing", "dark"]],
    foreTrees: [[0.075, 30, 54], [0.935, 42, 48]],
    farm: [0.495, 58, 1], bales: [[0.565, 50, 8], [0.585, 58, 9], [0.605, 46, 7.5]],
    sheepMid: [[0.13, 66, 0.34, 1], [0.155, 74, 0.34, -1], [0.72, 60, 0.32, 1], [0.745, 70, 0.32, 1], [0.77, 56, 0.3, -1]],
    sheepFore: [[0.72, 58, 0.62, -1], [0.75, 76, 0.7, 1], [0.695, 92, 0.78, 1], [0.23, 120, 0.82, 1], [0.27, 136, 0.9, -1], [0.57, 214, 1.05, -1]],
    gate: 0.62,
  };
  const MEADOW_MOBILE = {
    scale: 0.72, density: 0.4, grass: 0.0095, corner: 0.14,
    farY: 200, midY: 236, nearY: 296, foreY: 326,
    clouds: [],
    spentDraws: 2,
    cowsFar: [[0.72, 22, 0.16, 1]],
    cowsMid: [[0.2, 44, 0.28, 1, "grazing", "dark"]],
    cowsFore: [[0.4, 58, 0.58, 1, "standing", "patched"], [0.76, 90, 0.78, -1, "grazing", "belted"], [0.42, 222, 1, 1, "grazing", "patched"], [0.63, 206, 0.5, -1, "standing", "patched"]],
    foreTrees: [[0.08, 18, 40]],
    farm: [0.56, 40, 0.62], bales: [[0.84, 28, 5.5], [0.885, 32, 6]],
    sheepMid: [[0.38, 44, 0.24, 1]],
    sheepFore: [[0.87, 200, 0.68, -1], [0.27, 96, 0.5, 1]],
    gate: 0.58,
  };

  window.Scenes = { drawMeadow, drawGrassTile, drawCloud, stroke, clipTo, spline, MEADOW_DESKTOP, MEADOW_MOBILE };
})();
