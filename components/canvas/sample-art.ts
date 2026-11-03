// The gold sample artwork for demos and pitches, painted with the 2D canvas in a risograph / screen-print style:
// flat ink shapes, halftone dot shading, offset outlines and grain. "Fill in a sample" paints it onto the two layers.
// The sky is left empty so the movie can change it (sunset, storm, night...).
// Key positions (1280 × 720 board): lighthouse lamp (235, 134); cottage windows (322, 318) and (368, 318);
// Mira's lantern (481, 262); the sea starts at y = 470. lib/canvas/showcase.ts relies on these.

type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

const C = {
  navy: "#262a6e", blue: "#2f62c8", lightBlue: "#7ea6ee", pink: "#ff4fa3", yellow: "#ffe04a", orange: "#ff8a3d",
  teal: "#1fae96", green: "#3fb56b", cream: "#f6efe0", white: "#fffaf2", purple: "#4b3c96", violet: "#7a5cc8", skin: "#f6c3a2", hair: "#3b2a4a",
};

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function trace(ctx: Ctx, pts: Pt[], smooth = false, close = true) {
  ctx.beginPath();
  if (!smooth) pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  else {
    const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const list = close ? [...pts, pts[0], pts[1]] : pts;
    ctx.moveTo(...mid(list[0], list[1]));
    for (let i = 1; i < list.length - 1; i++) ctx.quadraticCurveTo(list[i][0], list[i][1], ...mid(list[i], list[i + 1]));
  }
  if (close) ctx.closePath();
}

/** Halftone dots inside the current clip; `amount(x, y)` (0–1) sets the dot size. */
function halftone(ctx: Ctx, box: [number, number, number, number], colour: string, spacing: number, amount: (x: number, y: number) => number, angle = 0.45) {
  const [x0, y0, x1, y1] = box;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const reach = Math.hypot(x1 - x0, y1 - y0) / 2 + spacing;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  ctx.fillStyle = colour;
  ctx.beginPath();
  for (let u = -reach; u <= reach; u += spacing) {
    for (let v = -reach; v <= reach; v += spacing) {
      const x = cx + u * cos - v * sin;
      const y = cy + u * sin + v * cos;
      if (x < x0 - spacing || x > x1 + spacing || y < y0 - spacing || y > y1 + spacing) continue;
      const a = Math.max(0, Math.min(1, amount(x, y)));
      if (a < 0.04) continue;
      const r = spacing * 0.52 * Math.sqrt(a);
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
  }
  ctx.fill();
}
/** A linear 0–1 ramp from point a to point b, scaled between low and high. */
const ramp = (a: Pt, b: Pt, low = 0, high = 1) => (x: number, y: number) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy);
  return low + (high - low) * Math.max(0, Math.min(1, t));
};
function bounds(pts: Pt[]): [number, number, number, number] {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

type ShapeOptions = { smooth?: boolean; outline?: string | null; width?: number; shade?: { colour: string; amount: (x: number, y: number) => number; spacing?: number; angle?: number }[] };
/** A flat ink shape with optional halftone shading and a slightly misregistered outline. */
function shape(ctx: Ctx, pts: Pt[], fill: string, o: ShapeOptions = {}) {
  trace(ctx, pts, o.smooth);
  ctx.fillStyle = fill;
  ctx.fill();
  if (o.shade) {
    ctx.save();
    trace(ctx, pts, o.smooth);
    ctx.clip();
    for (const s of o.shade) halftone(ctx, bounds(pts), s.colour, s.spacing ?? 6, s.amount, s.angle);
    ctx.restore();
  }
  if (o.outline !== null) {
    ctx.save();
    ctx.translate(1.3, 0.9);
    trace(ctx, pts, o.smooth);
    ctx.strokeStyle = o.outline ?? C.navy;
    ctx.lineWidth = o.width ?? 2.2;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
  }
}
const ellipse = (cx: number, cy: number, rx: number, ry: number, steps = 36): Pt[] => Array.from({ length: steps }, (_, i) => [cx + rx * Math.cos((i / steps) * Math.PI * 2), cy + ry * Math.sin((i / steps) * Math.PI * 2)]);
const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
function stroke(ctx: Ctx, pts: Pt[], colour: string, width: number, smooth = true) {
  trace(ctx, pts, smooth, false);
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

/** Ink speckles and paper grain over everything already painted on this layer. */
function grain(ctx: Ctx, seed: number) {
  const rand = seeded(seed);
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  for (let i = 0; i < 14000; i++) {
    ctx.fillStyle = rand() < 0.55 ? "rgba(255,250,240,0.35)" : "rgba(38,42,110,0.22)";
    ctx.fillRect(rand() * 1280, rand() * 720, 1 + rand() * 1.4, 1 + rand() * 1.4);
  }
  ctx.restore();
}

function towerX(y: number, side: -1 | 1) { return 235 + side * (35 - ((318 - y) / 158) * 13); }
const band = (top: number, bottom: number): Pt[] => [[towerX(top, -1), top], [towerX(top, 1), top], [towerX(bottom, 1), bottom], [towerX(bottom, -1), bottom]];
const shore = (y: number) => (y < 500 ? 545 : y < 560 ? 525 : y < 612 ? 470 : y < 652 ? 380 : y < 690 ? 240 : 120);

export function paintBackground(ctx: Ctx) {
  const rand = seeded(5);
  // Far island
  shape(ctx, [[880, 472], [940, 446], [1000, 432], [1062, 428], [1120, 440], [1180, 458], [1225, 472]], C.violet, { smooth: true, shade: [{ colour: C.navy, amount: ramp([1050, 430], [1050, 472], 0.1, 0.6), spacing: 5 }] });
  for (const [x, y, s] of [[985, 438, 1], [1012, 433, 1.2], [1046, 430, 0.9], [1092, 434, 1.1]] as const) shape(ctx, [[x - 9 * s, y + 6], [x, y - 26 * s], [x + 9 * s, y + 6]], C.teal, { width: 1.5 });

  // Sea: blue ink with deeper dots towards the bottom, a light horizon band and white waves
  const sea: Pt[] = [[0, 470], [1280, 470], [1280, 720], [0, 720]];
  shape(ctx, sea, C.blue, { outline: null, shade: [{ colour: C.navy, amount: ramp([0, 480], [0, 720], 0, 0.85), spacing: 6 }, { colour: C.lightBlue, amount: ramp([0, 520], [0, 470], 0, 0.9), spacing: 5, angle: 0.2 }] });
  for (let row = 0; row < 9; row++) {
    const y = 492 + row * 26 + row * row * 0.8;
    for (let x = shore(y) + rand() * 40; x < 1270; x += 70 + rand() * 50 - row * 3) {
      const w = 18 + row * 3 + rand() * 10;
      stroke(ctx, [[x, y], [x + w * 0.3, y - 4 - row * 0.4], [x + w * 0.65, y + 1], [x + w, y - 3]], row % 3 === 0 ? C.white : "rgba(255,250,242,0.75)", 1.6 + row * 0.25);
    }
  }
  for (let i = 0; i < 30; i++) { const y = 480 + rand() * 230; const x = Math.max(shore(y) + 20, 560 + rand() * 700); ctx.fillStyle = rand() < 0.5 ? C.pink : C.yellow; ctx.globalAlpha = 0.7; ctx.fillRect(x, y, 10 + rand() * 18, 2.5); ctx.globalAlpha = 1; }

  // Rocks with foam
  for (const pts of [[[688, 590], [702, 556], [730, 540], [768, 546], [792, 572], [788, 594]], [[772, 596], [784, 572], [808, 566], [828, 580], [834, 598]], [[878, 630], [890, 606], [916, 598], [940, 610], [948, 632]]] as Pt[][]) {
    const b = bounds(pts);
    shape(ctx, pts, C.purple, { shade: [{ colour: C.pink, amount: ramp([b[2], b[1]], [b[0], b[3]], 0.9, 0), spacing: 5 }] });
  }
  stroke(ctx, [[676, 598], [700, 590], [722, 599], [748, 591], [772, 600], [804, 593], [840, 601]], C.white, 3.2);
  stroke(ctx, [[870, 636], [896, 628], [922, 637], [954, 630]], C.white, 3);

  // Cliff: violet rock with pink light from the top right, teal grass with yellow dots
  const cliff: Pt[] = [[0, 332], [120, 302], [260, 312], [380, 336], [470, 378], [522, 438], [540, 498], [505, 560], [425, 612], [300, 652], [150, 682], [0, 700]];
  shape(ctx, cliff, C.purple, { smooth: true, shade: [{ colour: C.pink, amount: ramp([520, 380], [200, 640], 0.95, 0), spacing: 6 }, { colour: C.navy, amount: ramp([300, 420], [60, 700], 0, 0.8), spacing: 6, angle: 1.1 }] });
  for (const crack of [[[60, 420], [110, 450], [150, 445]], [[240, 470], [300, 500], [360, 492]], [[120, 560], [190, 590], [260, 585]], [[410, 452], [446, 500], [474, 522]]] as Pt[][]) stroke(ctx, crack, C.navy, 2.4);
  const grass: Pt[] = [[0, 332], [120, 302], [260, 312], [380, 336], [470, 378], [490, 402], [430, 384], [380, 360], [260, 336], [120, 328], [0, 356]];
  shape(ctx, grass, C.teal, { smooth: true, shade: [{ colour: C.yellow, amount: ramp([300, 300], [300, 360], 0.8, 0), spacing: 5 }] });
  stroke(ctx, [[512, 562], [470, 584], [430, 616], [380, 634]], C.white, 3);
  stroke(ctx, [[300, 352], [420, 420], [330, 470], [450, 530], [380, 580]], C.cream, 4, false);

  // Lighthouse: pink and white stripes, shaded on the right, yellow lamp room
  const tower: Pt[] = [[200, 318], [270, 318], [257, 160], [213, 160]];
  shape(ctx, tower, C.white, { outline: null });
  for (const [top, bottom] of [[160, 188], [216, 244], [272, 300]]) shape(ctx, band(top, bottom), C.pink, { outline: null });
  ctx.save(); trace(ctx, tower); ctx.clip(); halftone(ctx, [200, 160, 270, 318], C.navy, 5, ramp([238, 0], [272, 0], 0, 0.9)); ctx.restore();
  shape(ctx, tower, "rgba(0,0,0,0)");
  shape(ctx, rect(196, 148, 78, 12), C.navy);
  for (const x of [204, 216, 228, 240, 252, 264]) stroke(ctx, [[x, 136], [x, 148]], C.navy, 1.6, false);
  stroke(ctx, [[198, 136], [272, 136]], C.navy, 2, false);
  shape(ctx, rect(216, 114, 38, 34), C.yellow, { shade: [{ colour: C.white, amount: () => 0.6, spacing: 4 }] });
  stroke(ctx, [[235, 114], [235, 148]], C.navy, 1.6, false);
  shape(ctx, [[204, 116], [235, 88], [266, 116]], C.navy);
  shape(ctx, ellipse(235, 84, 6, 6, 14), C.pink);
  shape(ctx, rect(227, 290, 16, 28), C.navy);
  for (const y of [232, 190]) shape(ctx, rect(229, y, 12, 16), C.yellow, { width: 1.6 });

  // Keeper's cottage
  shape(ctx, rect(300, 300, 90, 48), C.cream, { shade: [{ colour: C.orange, amount: ramp([300, 300], [390, 348], 0, 0.5), spacing: 5 }] });
  shape(ctx, [[290, 302], [345, 260], [400, 302]], C.blue, { shade: [{ colour: C.navy, amount: ramp([345, 260], [400, 302], 0, 0.8), spacing: 5 }] });
  shape(ctx, rect(366, 264, 12, 22), C.navy);
  for (const x of [314, 360]) shape(ctx, rect(x, 310, 16, 16), C.yellow, { width: 1.6 });
  shape(ctx, rect(337, 320, 14, 28), C.pink, { width: 1.6 });
  for (const [x, y, r] of [[374, 250, 7], [381, 236, 9], [373, 220, 11]] as const) shape(ctx, ellipse(x, y, r, r * 0.8, 16), C.white, { width: 1.4 });

  // Fence and grass tufts
  [412, 430, 448, 466].forEach((x, i) => stroke(ctx, [[x, 342 + i * 9], [x, 362 + i * 9]], C.navy, 2.2, false));
  stroke(ctx, [[408, 350], [472, 379]], C.navy, 1.8, false);
  for (const [x, y] of [[40, 336], [90, 318], [150, 318], [280, 330], [445, 374]]) for (const dx of [-6, 0, 6]) stroke(ctx, [[x + dx, y + 8], [x + dx * 1.3 + 2, y - 7]], C.green, 2, false);
  for (const [x, y, c] of [[60, 342, C.pink], [128, 324, C.yellow], [168, 326, C.white], [290, 338, C.pink]] as const) shape(ctx, ellipse(x, y, 5, 5, 12), c, { width: 1.2 });

  // Gulls
  for (const [x, y, k] of [[640, 190, 1], [700, 160, 0.8], [780, 208, 0.9], [1150, 250, 0.7]]) stroke(ctx, [[x - 18 * k, y - 4 * k], [x - 8 * k, y - 10 * k], [x, y], [x + 8 * k, y - 10 * k], [x + 18 * k, y - 4 * k]], C.navy, 2.4);

  grain(ctx, 9);
}

export function paintCharacter(ctx: Ctx) {
  // Wellies
  shape(ctx, [[406, 342], [424, 342], [424, 362], [400, 362], [400, 354]], C.navy);
  shape(ctx, [[436, 342], [454, 342], [460, 354], [460, 362], [436, 362]], C.navy);
  // Arms behind the coat
  shape(ctx, [[408, 270], [394, 300], [390, 318], [402, 321], [413, 296]], C.yellow, { shade: [{ colour: C.orange, amount: () => 0.45, spacing: 4 }] });
  shape(ctx, ellipse(396, 323, 6.5, 6.5, 14), C.skin, { width: 1.6 });
  shape(ctx, [[446, 268], [466, 256], [478, 244], [488, 251], [474, 270], [452, 284]], C.yellow, { shade: [{ colour: C.orange, amount: () => 0.35, spacing: 4 }] });
  shape(ctx, ellipse(483, 243, 7, 7, 14), C.skin, { width: 1.6 });
  // Raincoat with orange halftone shading on the right
  const coat: Pt[] = [[414, 262], [446, 262], [458, 300], [472, 342], [430, 349], [388, 342], [402, 300]];
  shape(ctx, coat, C.yellow, { shade: [{ colour: C.orange, amount: ramp([420, 0], [472, 0], 0, 0.85), spacing: 4.5 }] });
  for (const y of [282, 302, 322]) shape(ctx, ellipse(430, y, 3.2, 3.2, 10), C.navy, { outline: null });
  stroke(ctx, [[400, 318], [418, 320], [418, 334]], C.orange, 2, false);
  // Scarf
  shape(ctx, [[408, 257], [452, 257], [454, 268], [406, 268]], C.pink);
  shape(ctx, [[438, 266], [449, 266], [454, 294], [441, 292]], C.pink);
  // Hood and face
  shape(ctx, ellipse(430, 226, 34, 35), C.yellow, { shade: [{ colour: C.orange, amount: ramp([430, 200], [462, 250], 0, 0.7), spacing: 4.5 }] });
  shape(ctx, ellipse(430, 231, 24, 25), C.skin, { width: 1.8 });
  shape(ctx, [[407, 224], [411, 208], [424, 201], [438, 202], [451, 211], [453, 226], [441, 216], [430, 221], [418, 216]], C.hair, { width: 1.6 });
  for (const x of [421, 439]) { shape(ctx, ellipse(x, 234, 3.2, 3.8, 12), C.navy, { outline: null }); shape(ctx, ellipse(x + 1, 233, 1.1, 1.1, 8), C.white, { outline: null }); }
  for (const x of [413, 447]) { ctx.save(); trace(ctx, ellipse(x, 243, 6, 4, 14)); ctx.clip(); halftone(ctx, [x - 6, 239, x + 6, 247], C.pink, 2.6, () => 0.9); ctx.restore(); }
  stroke(ctx, [[424, 246], [430, 250], [436, 246]], C.navy, 1.8);
  // Lantern
  stroke(ctx, [[474, 249], [481, 237], [488, 249]], C.navy, 2);
  shape(ctx, [[471, 250], [491, 250], [481, 241]], C.navy);
  shape(ctx, rect(471, 250, 20, 26), C.yellow, { shade: [{ colour: C.white, amount: ramp([481, 263], [471, 250], 0.95, 0.2), spacing: 3.5 }] });
  for (const x of [476, 486]) stroke(ctx, [[x, 250], [x, 276]], C.navy, 1.4, false);
  shape(ctx, rect(468, 276, 26, 5), C.navy);
  grain(ctx, 13);
}
