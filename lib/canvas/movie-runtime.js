/*
 * SAI movie runtime. Runs inside the sandboxed player iframe only.
 *
 * A movie script (a template or AI-written code) calls the helpers below to
 * build a timeline, then this file plays it with p5. The look is set by
 * movie.style(): paper cut-out, watercolour, neon, chalk, comic, pixel, ink,
 * stop-motion, dreamy or storybook, each tweakable (outline, texture, frame
 * rate, colour filters, sky colours...). Scripts can also draw anything they
 * like with movie.draw() and actor().
 *
 * If you add or change a helper here, update lib/canvas/movie-api.ts too:
 * that file explains the helpers to the LLM.
 */
(function () {
  "use strict";

  const W = 1280;
  const H = 720;
  const LIMITS = { scenes: 10, seconds: 120, actors: 40, effects: 30, draws: 20, text: 220, sounds: 60 };
  const post = (type, data) => window.parent.postMessage(Object.assign({ source: "sai-movie", type }, data || {}), "*");
  const FONTS = {
    serif: "Georgia, 'Times New Roman', serif",
    hand: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive",
    round: "'Trebuchet MS', Verdana, sans-serif",
    mono: "'Courier New', Courier, monospace",
    comic: "'Comic Sans MS', 'Chalkboard SE', 'Trebuchet MS', sans-serif",
  };
  const INK = "#3a2c28";
  const PAPER = "#fffaf0";

  // Loop guard. The server adds __saiGuard() calls inside every loop of AI code.
  let guardCount = 0;
  let guardLimit = 2000000;
  window.__saiGuard = () => {
    if (++guardCount > guardLimit) throw new Error("A loop in the movie ran for too long.");
  };

  // ---------- small helpers ----------
  const num = (value, fallback) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const lerp = (a, b, k) => a + (b - a) * k;
  const text = (value) => String(value == null ? "" : value).slice(0, LIMITS.text);
  const colourOf = (value, fallback) => (typeof value === "string" && /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]{3,20})$/i.test(value.trim()) ? value.trim() : fallback);
  const easings = {
    linear: (k) => k,
    gentle: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    quick: (k) => 1 - (1 - k) * (1 - k),
    bouncy: (k) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
  };
  const easeOf = (name, fallback) => easings[name] || easings[fallback || "gentle"];
  function seeded(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const makeCanvas = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const hexToRgb = (hex) => {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return "255,233,168";
    const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
    const n = parseInt(h, 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  };

  // ---------- textures ----------
  function tile(size, seed, paint) { const c = makeCanvas(size, size); paint(c.getContext("2d"), seeded(seed), size); return c; }
  const grainTile = tile(256, 7, (g, rand, n) => {
    const img = g.createImageData(n, n);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (rand() - 0.5) * 90 + (rand() < 0.02 ? (rand() - 0.5) * 160 : 0);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
  const speckleTile = tile(256, 11, (g, rand, n) => {
    for (let i = 0; i < 1400; i++) { g.fillStyle = rand() < 0.5 ? "rgba(255,255,255,0.35)" : "rgba(60,40,30,0.18)"; g.fillRect(rand() * n, rand() * n, 1 + rand() * 1.5, 1 + rand() * 1.5); }
  });
  const washTile = tile(512, 21, (g, rand, n) => {
    for (let i = 0; i < 26; i++) {
      const x = rand() * n, y = rand() * n, r = 40 + rand() * 120;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      const dark = rand() < 0.5;
      grad.addColorStop(0, dark ? "rgba(90,70,60,0.22)" : "rgba(255,255,255,0.3)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) { g.save(); g.translate(dx, dy); g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
    }
  });
  const chalkTile = tile(256, 31, (g, rand, n) => {
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,255,255,${0.05 + rand() * 0.25})`; g.fillRect(rand() * n, rand() * n, 1, 1); }
    g.strokeStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 40; i++) { const x = rand() * n, y = rand() * n; g.lineWidth = 1 + rand() * 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rand() - 0.5) * 120, y + (rand() - 0.5) * 30); g.stroke(); }
  });
  const halftoneTile = tile(12, 41, (g) => { g.fillStyle = "rgba(0,0,0,0.5)"; g.beginPath(); g.arc(3, 3, 1.6, 0, Math.PI * 2); g.arc(9, 9, 1.6, 0, Math.PI * 2); g.fill(); });
  function makeVignette() {
    const c = makeCanvas(W, H);
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    grad.addColorStop(0, "rgba(20,10,30,0)");
    grad.addColorStop(1, "rgba(20,10,30,1)");
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    return c;
  }
  const vignette = makeVignette();

  // ---------- styles ----------
  // A look is a starting point; scripts can override any field with movie.style(look, { ... }).
  const parchment = { day: ["#ecdcb8", "#f6ecd6"], dawn: ["#e9cfae", "#f5e6cc"], sunset: ["#e2b88e", "#f1d9b4"], night: ["#3a3124", "#5c4c36"], storm: ["#8a7e6a", "#b3a68c"], space: ["#2a2318", "#463a28"], underwater: ["#b9c4a8", "#dbe0c4"] };
  const blackboard = { day: ["#24453a", "#2f5848"], dawn: ["#2a4a3f", "#36594b"], sunset: ["#2c4538", "#3b5646"], night: ["#14261f", "#1f3a30"], storm: ["#1d2e29", "#2a3f38"], space: ["#0f1c18", "#1a2c26"], underwater: ["#1d3d3f", "#2a5052"] };
  const neonSkies = { day: ["#2b1055", "#d53a9d"], dawn: ["#3a0ca3", "#f72585"], sunset: ["#240046", "#ff6d00"], night: ["#05010f", "#240046"], storm: ["#0b0b1f", "#3c096c"], space: ["#000000", "#10002b"], underwater: ["#03045e", "#0077b6"] };
  const risoSkies = { day: ["#4f86e0", "#a9c8ff"], dawn: ["#ff7fbf", "#ffe08a"], sunset: ["#ff4fa3", "#ffb347"], night: ["#1b1d5c", "#3a2f8f"], storm: ["#2a2c66", "#5b5f9e"], space: ["#0d0b2e", "#2b1d6e"], underwater: ["#1f5fb8", "#3fb3c8"] };
  const looks = {
    riso: { treatment: "riso", texture: "riso", grain: 0.55, vignette: 0.22, bloom: 1.5, darkness: 0.85, caption: "riso", font: "round", transition: "iris", filter: { saturate: 1.25, contrast: 1.06 }, skies: risoSkies },
    paper: { treatment: "cutout", texture: "paper", grain: 0.55, vignette: 0.38, bloom: 1, caption: "paper", font: "serif" },
    watercolour: { treatment: "soft", texture: "watercolour", grain: 0.5, vignette: 0.3, bloom: 1.35, caption: "paper", font: "serif", filter: { saturate: 1.05 } },
    storybook: { treatment: "outline", outline: "#3a2c28", outlineWidth: 2.5, texture: "paper", grain: 0.4, vignette: 0.3, bloom: 1.1, caption: "paper", font: "serif" },
    neon: { treatment: "outline", outline: "#7df9ff", outlineWidth: 3, outlineGlow: 16, texture: "film", grain: 0.25, vignette: 0.55, bloom: 2, caption: "neon", font: "round", filter: { saturate: 1.35, contrast: 1.08 }, skies: neonSkies },
    chalk: { treatment: "outline", outline: "#f4f1e8", outlineWidth: 2, texture: "chalk", grain: 0.8, vignette: 0.45, bloom: 0.9, darkness: 0.35, caption: "chalk", font: "hand", filter: { saturate: 0.8 }, skies: blackboard },
    comic: { treatment: "outline", outline: "#141414", outlineWidth: 5, texture: "halftone", grain: 0.35, vignette: 0.2, bloom: 0.9, caption: "comic", font: "comic", filter: { saturate: 1.3, contrast: 1.12 } },
    pixel: { treatment: "outline", outline: "#1a1a2e", outlineWidth: 2, texture: "none", grain: 0, vignette: 0.25, bloom: 1, pixel: 4, fps: 12, caption: "pixel", font: "mono", filter: { saturate: 1.2 } },
    ink: { treatment: "outline", outline: "#4a3424", outlineWidth: 2, texture: "paper", grain: 0.6, vignette: 0.45, bloom: 0.9, fps: 12, boil: 1, caption: "ink", font: "serif", filter: { sepia: 0.45, saturate: 0.9 }, skies: parchment },
    stopmotion: { treatment: "cutout", texture: "paper", grain: 0.55, vignette: 0.38, bloom: 1, fps: 10, boil: 1.5, caption: "paper", font: "round" },
    dream: { treatment: "soft", texture: "none", grain: 0.2, vignette: 0.3, bloom: 2, halo: true, caption: "minimal", font: "round", filter: { saturate: 1.15, brightness: 1.04 } },
  };
  function resolveStyle(name, overrides) {
    const base = looks[name] || looks.paper;
    const o = overrides || {};
    const s = Object.assign({ name: looks[name] ? name : "paper", outline: null, outlineWidth: 0, outlineGlow: 0, pixel: 0, fps: 0, boil: 0, halo: false, darkness: 1, skies: null, filter: {}, transition: "fade" }, base);
    if (o.treatment && ["cutout", "outline", "soft", "plain", "riso"].includes(o.treatment)) s.treatment = o.treatment;
    if (o.transition && ["fade", "iris", "cut"].includes(o.transition)) s.transition = o.transition;
    if (o.outline === false) { s.outline = null; if (s.treatment === "outline") s.treatment = "plain"; }
    else if (o.outline) { s.outline = colourOf(o.outline, s.outline || INK); if (s.treatment !== "cutout") s.treatment = "outline"; }
    if (s.treatment === "outline" && !s.outline) s.outline = INK;
    if (o.outlineWidth != null) s.outlineWidth = clamp(num(o.outlineWidth, 2), 0.5, 10);
    if (s.treatment === "outline" && !s.outlineWidth) s.outlineWidth = 2.5;
    if (o.glow != null) s.outlineGlow = clamp(num(o.glow, 0), 0, 40);
    if (o.texture && ["paper", "watercolour", "chalk", "halftone", "film", "riso", "none"].includes(o.texture)) s.texture = o.texture;
    for (const key of ["grain", "vignette"]) if (o[key] != null) s[key] = clamp(num(o[key], s[key]), 0, 1);
    if (o.bloom != null) s.bloom = clamp(num(o.bloom, 1), 0, 3);
    if (o.darkness != null) s.darkness = clamp(num(o.darkness, 1), 0, 1.5);
    if (o.fps != null) s.fps = o.fps ? clamp(Math.round(num(o.fps, 12)), 4, 30) : 0;
    if (o.boil != null) s.boil = clamp(num(o.boil, 0), 0, 4);
    if (o.pixel != null) s.pixel = o.pixel ? clamp(Math.round(num(o.pixel, 4)), 2, 10) : 0;
    if (o.halo != null) s.halo = !!o.halo;
    if (o.caption && ["paper", "comic", "neon", "chalk", "pixel", "minimal", "ink", "riso"].includes(o.caption)) s.caption = o.caption;
    if (o.font && FONTS[o.font]) s.font = o.font;
    if (o.filter && typeof o.filter === "object") s.filter = Object.assign({}, s.filter, o.filter);
    if (o.skies && typeof o.skies === "object") {
      s.skies = Object.assign({}, s.skies);
      for (const [key, value] of Object.entries(o.skies)) {
        if (value && typeof value === "object") s.skies[key] = [colourOf(value.top, "#88aadd"), colourOf(value.bottom, "#ddeeff")];
      }
    }
    return s;
  }
  function filterCss(f) {
    const parts = [];
    const add = (name, value, low, high, unit) => { if (typeof value === "number" && Number.isFinite(value)) parts.push(`${name}(${clamp(value, low, high)}${unit})`); };
    add("saturate", f.saturate, 0, 3, "");
    add("contrast", f.contrast, 0.5, 2, "");
    add("brightness", f.brightness, 0.5, 1.6, "");
    add("sepia", f.sepia, 0, 1, "");
    add("grayscale", f.grayscale, 0, 1, "");
    add("hue-rotate", f.hueRotate, -180, 180, "deg");
    add("blur", f.blur, 0, 3, "px");
    return parts.join(" ");
  }
  let style = resolveStyle("paper");
  let styleLocked = false;

  // ---------- sprite treatments ----------
  // Silhouette of a drawing on a small grid: dilated, with holes filled so outlines become solid shapes.
  function silhouette(src, pad, dilate, fill) {
    const w = src.width + pad * 2;
    const h = src.height + pad * 2;
    const scale = Math.min(1, 220 / Math.max(w, h));
    const gw = Math.max(2, Math.round(w * scale));
    const gh = Math.max(2, Math.round(h * scale));
    const small = makeCanvas(gw, gh);
    const sg = small.getContext("2d");
    sg.drawImage(src, pad * scale, pad * scale, src.width * scale, src.height * scale);
    const data = sg.getImageData(0, 0, gw, gh);
    const ink = new Uint8Array(gw * gh);
    for (let i = 0; i < ink.length; i++) ink[i] = data.data[i * 4 + 3] > 24 ? 1 : 0;
    const r = Math.max(1, Math.round(dilate * Math.max(1, scale * 2)));
    const tmp = new Uint8Array(gw * gh);
    const grown = new Uint8Array(gw * gh);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { let v = 0; for (let d = -r; d <= r && !v; d++) { const xx = x + d; if (xx >= 0 && xx < gw && ink[y * gw + xx]) v = 1; } tmp[y * gw + x] = v; }
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { let v = 0; for (let d = -r; d <= r && !v; d++) { const yy = y + d; if (yy >= 0 && yy < gh && tmp[yy * gw + x]) v = 1; } grown[y * gw + x] = v; }
    const outside = new Uint8Array(gw * gh);
    const stack = [];
    const pushIf = (x, y) => { const i = y * gw + x; if (!grown[i] && !outside[i]) { outside[i] = 1; stack.push(i); } };
    for (let x = 0; x < gw; x++) { pushIf(x, 0); pushIf(x, gh - 1); }
    for (let y = 0; y < gh; y++) { pushIf(0, y); pushIf(gw - 1, y); }
    while (stack.length) {
      const i = stack.pop();
      const x = i % gw;
      const y = (i - x) / gw;
      if (x > 0) pushIf(x - 1, y);
      if (x < gw - 1) pushIf(x + 1, y);
      if (y > 0) pushIf(x, y - 1);
      if (y < gh - 1) pushIf(x, y + 1);
    }
    const img = sg.createImageData(gw, gh);
    const rgb = hexToRgb(fill).split(",").map(Number);
    for (let i = 0; i < outside.length; i++) if (!outside[i]) { img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; img.data[i * 4 + 3] = 255; }
    sg.clearRect(0, 0, gw, gh);
    sg.putImageData(img, 0, 0);
    return small;
  }

  // Draws the silhouette stamped around a ring of offsets: a torn paper edge, or an outline.
  function stampRing(g, mask, w, h, radius, count, rand, jitter) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (rand ? rand() * 0.3 : 0);
      const d = radius * (jitter ? 0.55 + rand() * 0.6 : 1);
      g.drawImage(mask, Math.cos(a) * d, Math.sin(a) * d, w, h);
    }
  }

  // Turns a drawing (transparent canvas) into a sprite in the current style.
  function treat(src, seed) {
    const size = Math.max(src.width, src.height);
    const pad = Math.round(size * 0.07 + 10 + (style.outlineGlow || 0));
    const w = src.width + pad * 2;
    const h = src.height + pad * 2;
    const out = makeCanvas(w, h);
    const g = out.getContext("2d");
    const rand = seeded(seed || 3);

    if (style.treatment === "cutout") {
      const mask = silhouette(src, pad, 3, "#fffaf0");
      const backing = makeCanvas(w, h);
      stampRing(backing.getContext("2d"), mask, w, h, pad * 0.42, 14, rand, true);
      g.shadowColor = "rgba(35,20,45,0.38)"; g.shadowBlur = pad * 0.55; g.shadowOffsetY = pad * 0.22;
      g.drawImage(backing, 0, 0);
      g.shadowColor = "transparent";
      g.drawImage(src, pad, pad);
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = g.createPattern(speckleTile, "repeat");
      g.fillRect(0, 0, w, h);
    } else if (style.treatment === "outline") {
      const line = Math.max(1, style.outlineWidth * (size / 300));
      const mask = silhouette(src, pad, 1, style.outline);
      const ring = makeCanvas(w, h);
      stampRing(ring.getContext("2d"), mask, w, h, line, 16, style.boil ? rand : null, false);
      if (style.outlineGlow) { g.shadowColor = style.outline; g.shadowBlur = style.outlineGlow * (size / 300); g.drawImage(ring, 0, 0); g.drawImage(ring, 0, 0); g.shadowColor = "transparent"; }
      else { g.shadowColor = "rgba(20,10,30,0.25)"; g.shadowBlur = 6; g.shadowOffsetY = 3; g.drawImage(ring, 0, 0); g.shadowColor = "transparent"; }
      g.drawImage(src, pad, pad);
      if (style.texture === "halftone") { g.globalCompositeOperation = "source-atop"; g.globalAlpha = 0.18; g.fillStyle = g.createPattern(halftoneTile, "repeat"); g.fillRect(0, 0, w, h); }
    } else if (style.treatment === "riso") {
      // Screen print: a misregistered pink ink layer peeks out from under the drawing, with a halftone screen on top.
      const k = Math.max(1, size / 300);
      const ink = makeCanvas(w, h);
      const ig = ink.getContext("2d");
      ig.drawImage(src, pad, pad);
      ig.globalCompositeOperation = "source-atop";
      ig.fillStyle = "#ff4fa3";
      ig.fillRect(0, 0, w, h);
      g.globalAlpha = 0.6;
      g.drawImage(ink, 3 * k, 2.2 * k);
      g.globalAlpha = 1;
      g.drawImage(src, pad, pad);
      g.globalCompositeOperation = "source-atop";
      g.globalAlpha = 0.14;
      g.fillStyle = g.createPattern(halftoneTile, "repeat");
      g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.6;
      g.fillStyle = g.createPattern(speckleTile, "repeat");
      g.fillRect(0, 0, w, h);
    } else if (style.treatment === "soft") {
      // Watercolour: a soft bleed of the drawing's own colours, then the drawing, then paper speckles.
      g.filter = `blur(${Math.max(2, size / 90)}px)`;
      g.globalAlpha = 0.45;
      g.drawImage(src, pad, pad);
      g.filter = "none";
      g.globalAlpha = 1;
      g.shadowColor = "rgba(30,20,40,0.18)"; g.shadowBlur = pad * 0.4; g.shadowOffsetY = pad * 0.12;
      g.drawImage(src, pad, pad);
      g.shadowColor = "transparent";
      g.globalCompositeOperation = "source-atop";
      g.globalAlpha = 0.7;
      g.fillStyle = g.createPattern(speckleTile, "repeat");
      g.fillRect(0, 0, w, h);
    } else {
      g.shadowColor = "rgba(20,10,30,0.25)"; g.shadowBlur = pad * 0.35; g.shadowOffsetY = pad * 0.12;
      g.drawImage(src, pad, pad);
    }
    return { canvas: out, pad, contentW: src.width, contentH: src.height };
  }

  function tinted(sprite, colour, amount) {
    const c = makeCanvas(sprite.canvas.width, sprite.canvas.height);
    const g = c.getContext("2d");
    g.drawImage(sprite.canvas, 0, 0);
    g.globalCompositeOperation = "source-atop";
    g.globalAlpha = amount;
    g.fillStyle = colour;
    g.fillRect(0, 0, c.width, c.height);
    return Object.assign({}, sprite, { canvas: c });
  }

  function tornRect(g, x, y, w, h, rand, amp) {
    g.beginPath();
    const step = 16;
    g.moveTo(x, y);
    for (let px = x; px < x + w; px += step) g.lineTo(px, y + (rand() - 0.5) * amp);
    for (let py = y; py < y + h; py += step) g.lineTo(x + w + (rand() - 0.5) * amp, py);
    for (let px = x + w; px > x; px -= step) g.lineTo(px, y + h + (rand() - 0.5) * amp);
    for (let py = y + h; py > y; py -= step) g.lineTo(x + (rand() - 0.5) * amp, py);
    g.closePath();
  }
  function wrapLines(g, words, maxWidth) {
    const lines = [];
    let line = "";
    for (const word of String(words).split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (g.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }

  // ---------- built-in props, drawn with the 2D canvas into a w × h box centred at 0,0 ----------
  function face(g, cx, cy, s, blink) {
    g.fillStyle = INK;
    g.strokeStyle = INK;
    g.lineCap = "round";
    g.lineWidth = s * 0.035;
    for (const dx of [-0.17, 0.17]) {
      if (blink) { g.beginPath(); g.arc(cx + dx * s, cy, s * 0.05, Math.PI * 0.1, Math.PI * 0.9); g.stroke(); }
      else { g.beginPath(); g.ellipse(cx + dx * s, cy, s * 0.04, s * 0.055, 0, 0, Math.PI * 2); g.fill(); }
    }
    g.fillStyle = "rgba(240,130,140,0.55)";
    for (const dx of [-0.28, 0.28]) { g.beginPath(); g.ellipse(cx + dx * s, cy + s * 0.1, s * 0.07, s * 0.045, 0, 0, Math.PI * 2); g.fill(); }
    g.beginPath();
    g.arc(cx, cy + s * 0.06, s * 0.1, Math.PI * 0.15, Math.PI * 0.85);
    g.stroke();
  }
  function blob(g, circles, fill) {
    g.fillStyle = fill;
    g.beginPath();
    for (const [x, y, r] of circles) { g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2); }
    g.fill();
  }
  const scaled = (list, s) => list.map(([x, y, r]) => [x * s, y * s, r * s]);
  const propKinds = {
    sun: { aspect: 1, lit: true, lights: [[0, 0, 1.1, "255,210,120"]], draw(g, w, h, v, c) {
      const s = h;
      g.fillStyle = "#f4a259";
      for (let i = 0; i < 12; i++) { g.save(); g.rotate((i * Math.PI) / 6); g.beginPath(); g.moveTo(-s * 0.06, -s * 0.33); g.lineTo(0, -s * 0.5); g.lineTo(s * 0.06, -s * 0.33); g.fill(); g.restore(); }
      g.fillStyle = c || "#f9c74f"; g.beginPath(); g.arc(0, 0, s * 0.32, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(255,255,255,0.25)"; g.beginPath(); g.arc(-s * 0.08, -s * 0.1, s * 0.12, 0, Math.PI * 2); g.fill();
      if (v.face) face(g, 0, 0, s * 0.62, v.blink);
    } },
    moon: { aspect: 1, lit: true, lights: [[0, 0, 1.5, "255,240,190"]], draw(g, w, h, v, c) {
      const s = h;
      g.fillStyle = c || "#f6e3a1"; g.beginPath(); g.arc(0, 0, s * 0.46, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(200,170,90,0.45)";
      for (const [x, y, r] of [[-0.16, -0.12, 0.08], [0.15, 0.1, 0.06], [0.05, -0.24, 0.045], [-0.1, 0.2, 0.05], [0.22, -0.12, 0.035]]) { g.beginPath(); g.arc(x * s, y * s, r * s, 0, Math.PI * 2); g.fill(); }
      if (v.face) face(g, 0, s * 0.02, s * 0.75, v.blink);
    } },
    star: { aspect: 1, lit: true, lights: [[0, 0, 0.9, "255,230,150"]], draw(g, w, h, v, c) {
      const s = h;
      g.fillStyle = c || "#ffd95a"; g.beginPath();
      for (let i = 0; i < 10; i++) { const r = (i % 2 ? 0.2 : 0.48) * s; const a = -Math.PI / 2 + (i * Math.PI) / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fill();
      if (v.face) face(g, 0, s * 0.04, s * 0.45, v.blink);
    } },
    cloud: { aspect: 1.7, draw(g, w, h, v, c) {
      const s = h;
      blob(g, scaled([[-0.5, 0.08, 0.26], [-0.2, -0.1, 0.34], [0.2, -0.14, 0.36], [0.52, 0.06, 0.27], [0, 0.12, 0.3]], s), c || "#fbf7ef");
      if (v.face) face(g, 0, s * 0.02, s * 0.7, v.blink);
    } },
    tree: { aspect: 0.75, draw(g, w, h, v, c) {
      const s = h;
      g.fillStyle = "#8a5a3b"; g.fillRect(-s * 0.06, 0, s * 0.12, s * 0.48);
      blob(g, scaled([[0, -0.22, 0.24], [-0.17, -0.06, 0.19], [0.17, -0.06, 0.19], [0, -0.02, 0.2]], s), c || "#5f9e6e");
      blob(g, scaled([[-0.08, -0.26, 0.08], [0.1, -0.1, 0.07]], s), "rgba(255,255,255,0.15)");
    } },
    flower: { aspect: 0.6, draw(g, w, h, v, c) {
      const s = h;
      g.strokeStyle = "#5f9e6e"; g.lineWidth = s * 0.05; g.beginPath(); g.moveTo(0, -s * 0.1); g.lineTo(0, s * 0.48); g.stroke();
      g.fillStyle = "#5f9e6e"; g.beginPath(); g.ellipse(s * 0.1, s * 0.22, s * 0.1, s * 0.05, -0.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = c || "#f28fad";
      for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; g.beginPath(); g.ellipse(Math.cos(a) * s * 0.13, -s * 0.18 + Math.sin(a) * s * 0.13, s * 0.1, s * 0.07, a, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = "#f9c74f"; g.beginPath(); g.arc(0, -s * 0.18, s * 0.07, 0, Math.PI * 2); g.fill();
    } },
    heart: { aspect: 1, draw(g, w, h, v, c) {
      const k = h * 0.5;
      g.fillStyle = c || "#ef6f8e"; g.beginPath(); g.moveTo(0, k * 0.7);
      g.bezierCurveTo(-k * 1.2, -k * 0.1, -k * 0.6, -k * 1.0, 0, -k * 0.4);
      g.bezierCurveTo(k * 0.6, -k * 1.0, k * 1.2, -k * 0.1, 0, k * 0.7); g.fill();
    } },
    house: { aspect: 0.8, lights: [[-0.13, 0.02, 0.35, "255,200,110"], [0.13, 0.02, 0.35, "255,200,110"]], draw(g, w, h, v, c) {
      const s = h;
      g.fillStyle = c || "#6b4f86"; g.fillRect(-s * 0.32, -s * 0.12, s * 0.64, s * 0.6);
      g.fillStyle = "#4a3560"; g.beginPath(); g.moveTo(-s * 0.4, -s * 0.1); g.lineTo(0, -s * 0.48); g.lineTo(s * 0.4, -s * 0.1); g.fill();
      g.fillRect(s * 0.16, -s * 0.42, s * 0.07, s * 0.16);
      g.fillStyle = "#f6c56b";
      for (const x of [-0.2, 0.06]) g.fillRect(x * s, -s * 0.04, s * 0.14, s * 0.14);
      g.fillStyle = "#3d2b4f"; g.fillRect(-s * 0.06, s * 0.26, s * 0.12, s * 0.22);
    } },
    buddy: { aspect: 0.9, draw(g, w, h, v, c) {
      const s = h;
      g.fillStyle = c || "#8ecae6"; g.beginPath(); g.ellipse(0, s * 0.03, s * 0.4, s * 0.44, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(255,255,255,0.22)"; g.beginPath(); g.ellipse(-s * 0.12, -s * 0.16, s * 0.12, s * 0.08, -0.4, 0, Math.PI * 2); g.fill();
      face(g, 0, -s * 0.02, s * 0.8, v.blink);
    } },
    firefly: { aspect: 1, lit: true, lights: [[0, 0.12, 1.4, "255,236,120"]], draw(g, w, h, v, c) {
      const s = h;
      g.fillStyle = "rgba(230,240,255,0.85)";
      g.beginPath(); g.ellipse(-s * 0.18, -s * 0.12, s * 0.2, s * 0.12, -0.6, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(s * 0.18, -s * 0.12, s * 0.2, s * 0.12, 0.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#5a4636"; g.beginPath(); g.ellipse(0, -s * 0.02, s * 0.12, s * 0.16, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = c || "#ffe873"; g.beginPath(); g.ellipse(0, s * 0.17, s * 0.13, s * 0.15, 0, 0, Math.PI * 2); g.fill();
      face(g, 0, -s * 0.05, s * 0.35, v.blink);
    } },
    rainbow: { aspect: 2, draw(g, w, h) {
      const s = h;
      ["#e5636b", "#f2a65a", "#f6d36b", "#7cc39a", "#6aa6d8", "#9b84cf"].forEach((col, i) => { g.strokeStyle = col; g.lineWidth = s * 0.075; g.beginPath(); g.arc(0, s * 0.45, s * (0.88 - i * 0.075), Math.PI, 0); g.stroke(); });
      blob(g, scaled([[-0.8, 0.4, 0.13], [-0.66, 0.42, 0.11], [0.8, 0.4, 0.13], [0.66, 0.42, 0.11]], s), "#fbf7ef");
    } },
    balloon: { aspect: 0.55, draw(g, w, h, v, c) {
      const s = h;
      g.strokeStyle = "#7a6a5a"; g.lineWidth = s * 0.012; g.beginPath(); g.moveTo(0, s * 0.12); g.bezierCurveTo(s * 0.06, s * 0.25, -s * 0.06, s * 0.36, 0, s * 0.48); g.stroke();
      g.fillStyle = c || "#e5636b"; g.beginPath(); g.ellipse(0, -s * 0.16, s * 0.22, s * 0.28, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(-s * 0.03, s * 0.13); g.lineTo(s * 0.03, s * 0.13); g.lineTo(0, s * 0.09); g.fill();
      g.fillStyle = "rgba(255,255,255,0.3)"; g.beginPath(); g.ellipse(-s * 0.08, -s * 0.26, s * 0.05, s * 0.09, -0.4, 0, Math.PI * 2); g.fill();
    } },
    whale: { aspect: 1.9, draw(g, w, h, v, c) {
      const s = h;
      const body = c || "#8fb3ea";
      g.fillStyle = body;
      g.beginPath();
      g.moveTo(-0.9 * s, 0.05 * s);
      g.bezierCurveTo(-0.9 * s, -0.4 * s, -0.1 * s, -0.42 * s, 0.35 * s, -0.12 * s);
      g.bezierCurveTo(0.5 * s, -0.04 * s, 0.6 * s, -0.08 * s, 0.7 * s, -0.25 * s);
      g.bezierCurveTo(0.78 * s, -0.36 * s, 0.95 * s, -0.36 * s, 0.92 * s, -0.24 * s);
      g.bezierCurveTo(0.86 * s, -0.12 * s, 0.82 * s, -0.02 * s, 0.94 * s, 0.06 * s);
      g.bezierCurveTo(0.8 * s, 0.1 * s, 0.68 * s, 0.04 * s, 0.6 * s, 0.02 * s);
      g.bezierCurveTo(0.4 * s, 0.3 * s, -0.5 * s, 0.4 * s, -0.9 * s, 0.05 * s);
      g.fill();
      g.fillStyle = "rgba(225,238,248,0.95)";
      g.beginPath(); g.ellipse(-0.35 * s, 0.17 * s, 0.42 * s, 0.11 * s, 0.05, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "rgba(120,150,190,0.7)"; g.lineWidth = s * 0.015;
      for (const x of [-0.6, -0.45, -0.3, -0.15]) { g.beginPath(); g.moveTo(x * s, 0.1 * s); g.lineTo((x + 0.02) * s, 0.25 * s); g.stroke(); }
      g.fillStyle = body; g.beginPath(); g.ellipse(-0.25 * s, 0.22 * s, 0.14 * s, 0.05 * s, 0.6, 0, Math.PI * 2); g.fill();
      if (v.blink) { g.strokeStyle = INK; g.lineWidth = s * 0.025; g.beginPath(); g.arc(-0.58 * s, -0.05 * s, s * 0.035, 0.2, Math.PI - 0.2); g.stroke(); }
      else { g.fillStyle = INK; g.beginPath(); g.arc(-0.58 * s, -0.05 * s, s * 0.035, 0, Math.PI * 2); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(-0.57 * s, -0.06 * s, s * 0.012, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = INK; g.lineWidth = s * 0.02; g.beginPath(); g.arc(-0.72 * s, 0.02 * s, s * 0.08, 0.3, 1.3); g.stroke();
      g.fillStyle = "rgba(240,130,140,0.5)"; g.beginPath(); g.ellipse(-0.5 * s, 0.04 * s, s * 0.05, s * 0.03, 0, 0, Math.PI * 2); g.fill();
    } },
    fish: { aspect: 1.6, draw(g, w, h, v, c) {
      const s = h;
      g.fillStyle = c || "#f2a65a";
      g.beginPath(); g.ellipse(-0.1 * s, 0, 0.5 * s, 0.32 * s, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(0.3 * s, 0); g.lineTo(0.75 * s, -0.3 * s); g.lineTo(0.75 * s, 0.3 * s); g.fill();
      g.fillStyle = "rgba(255,255,255,0.45)"; g.fillRect(-0.05 * s, -0.3 * s, 0.1 * s, 0.6 * s);
      g.fillStyle = INK; g.beginPath(); g.arc(-0.38 * s, -0.06 * s, 0.05 * s, 0, Math.PI * 2); g.fill();
    } },
    bird: { aspect: 1.6, draw(g, w, h, v, c) {
      const s = h;
      g.fillStyle = c || "#f4f1ea";
      g.beginPath(); g.ellipse(0, 0.05 * s, 0.32 * s, 0.16 * s, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(-0.1 * s, 0); g.quadraticCurveTo(-0.4 * s, -0.5 * s, -0.75 * s, -0.25 * s); g.quadraticCurveTo(-0.4 * s, -0.2 * s, 0, 0.05 * s); g.fill();
      g.beginPath(); g.moveTo(0.1 * s, 0); g.quadraticCurveTo(0.4 * s, -0.5 * s, 0.75 * s, -0.25 * s); g.quadraticCurveTo(0.4 * s, -0.2 * s, 0, 0.05 * s); g.fill();
      g.fillStyle = "#f2a65a"; g.beginPath(); g.moveTo(-0.3 * s, 0.02 * s); g.lineTo(-0.45 * s, 0.06 * s); g.lineTo(-0.3 * s, 0.09 * s); g.fill();
      g.fillStyle = INK; g.beginPath(); g.arc(-0.2 * s, 0, 0.025 * s, 0, Math.PI * 2); g.fill();
    } },
    boat: { aspect: 1.3, draw(g, w, h, v, c) {
      const s = h;
      g.fillStyle = c || "#b5653f"; g.beginPath(); g.moveTo(-0.6 * s, 0.15 * s); g.lineTo(0.6 * s, 0.15 * s); g.lineTo(0.42 * s, 0.4 * s); g.lineTo(-0.42 * s, 0.4 * s); g.fill();
      g.fillStyle = "#6b4a3a"; g.fillRect(-0.02 * s, -0.48 * s, 0.04 * s, 0.64 * s);
      g.fillStyle = "#f7f1e3"; g.beginPath(); g.moveTo(0.04 * s, -0.45 * s); g.lineTo(0.45 * s, 0.1 * s); g.lineTo(0.04 * s, 0.1 * s); g.fill();
      g.fillStyle = "#e5636b"; g.beginPath(); g.moveTo(-0.04 * s, -0.4 * s); g.lineTo(-0.35 * s, 0.08 * s); g.lineTo(-0.04 * s, 0.08 * s); g.fill();
    } },
    lantern: { aspect: 0.6, lit: true, lights: [[0, 0.08, 1.3, "255,205,110"]], draw(g, w, h, v, c) {
      const s = h;
      g.strokeStyle = "#3a2c28"; g.lineWidth = s * 0.03; g.beginPath(); g.arc(0, -0.32 * s, 0.12 * s, Math.PI, 0); g.stroke();
      g.fillStyle = "#3a2c28"; g.beginPath(); g.moveTo(-0.18 * s, -0.22 * s); g.lineTo(0, -0.34 * s); g.lineTo(0.18 * s, -0.22 * s); g.fill();
      g.fillStyle = c || "#ffd36b"; g.fillRect(-0.16 * s, -0.22 * s, 0.32 * s, 0.5 * s);
      g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.ellipse(0, 0.08 * s, 0.05 * s, 0.1 * s, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#3a2c28"; g.strokeRect(-0.16 * s, -0.22 * s, 0.32 * s, 0.5 * s);
      g.fillRect(-0.2 * s, 0.28 * s, 0.4 * s, 0.06 * s);
    } },
    butterfly: { aspect: 1.2, draw(g, w, h, v, c) {
      const s = h;
      g.fillStyle = c || "#9b84cf";
      for (const side of [-1, 1]) { g.beginPath(); g.ellipse(side * 0.25 * s, -0.12 * s, 0.25 * s, 0.2 * s, side * 0.5, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(side * 0.2 * s, 0.15 * s, 0.17 * s, 0.14 * s, -side * 0.4, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = "rgba(255,255,255,0.4)"; for (const side of [-1, 1]) { g.beginPath(); g.arc(side * 0.27 * s, -0.14 * s, 0.07 * s, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = INK; g.fillRect(-0.03 * s, -0.25 * s, 0.06 * s, 0.5 * s);
    } },
    // An invisible light: use it to make windows, lamps or magic glow at night.
    glow: { aspect: 1, lit: true, invisible: true, lights: [[0, 0, 0.6, null]], draw() {} },
  };

  // Sprites are cached by kind, colour, variant and resolution (the style never changes during a movie).
  const spriteCache = new Map();
  function propSprite(kind, colour, variant, heightPx) {
    const res = clamp(Math.ceil((heightPx * DPR * 1.25) / 64) * 64, 96, 768);
    const key = `${kind}|${colour}|${variant.face ? 1 : 0}${variant.blink ? 1 : 0}|${res}`;
    let sprite = spriteCache.get(key);
    if (!sprite) {
      const spec = propKinds[kind];
      const src = makeCanvas(res * spec.aspect, res);
      const g = src.getContext("2d");
      g.translate(src.width / 2, src.height / 2);
      spec.draw(g, src.width, src.height, variant, colour);
      sprite = treat(src, kind.length * 7 + res);
      spriteCache.set(key, sprite);
    }
    return sprite;
  }

  // ---------- timeline state ----------
  const scenes = [];
  const actors = [];
  const effectList = [];
  const draws = [];
  const captions = [];
  const bubbles = [];
  const cues = [];
  const focuses = [];
  let building = null;
  let cursor = 0;
  let order = 0;
  let endText = "The End";

  function requireScene(what) {
    if (!building) throw new Error(`${what} must be called inside movie.scene(...).`);
    return building;
  }
  function span(options, fallbackDuration, what) {
    const scene = requireScene(what);
    const o = options || {};
    const at = clamp(num(o.at, 0), 0, scene.duration);
    const rest = scene.duration - at;
    const duration = clamp(num(o.duration, fallbackDuration == null ? rest : fallbackDuration), 0, rest);
    return { start: scene.start + at, end: scene.start + at + duration, scene };
  }
  function cue(name, time) { if (cues.length < LIMITS.sounds) cues.push({ name, time }); }

  // ---------- actors ----------
  function makeRecord(look, o, persistent) {
    if (actors.length >= LIMITS.actors) throw new Error("Too many characters and props in one movie.");
    const follow = o.follow && o.follow.__record;
    const record = {
      look,
      base: { x: num(o.x, 0.5), y: num(o.y, 0.6), size: clamp(num(o.size, 0.3), 0.01, 3), rotation: num(o.rotation, 0), opacity: o.hidden ? 0 : 1, flip: o.flip ? -1 : 1, scale: 1 },
      tracks: [],
      moves: [],
      layer: o.layer === "back" ? 0 : o.layer === "front" ? 2 : 1,
      order: order++,
      from: persistent ? 0 : building.start,
      until: persistent || o.keep ? Infinity : building.start + building.duration,
      colour: colourOf(o.color, null),
      face: o.face === true,
      phase: Math.random() * Math.PI * 2,
      follow: follow ? { target: follow, dx: num(o.dx, 0), dy: num(o.dy, 0) } : null,
    };
    if (record.follow) record.layer = follow.layer;
    actors.push(record);
    return record;
  }

  function track(record, prop, value, op, range, ease) {
    record.tracks.push({ prop, value, op, start: range.start, end: range.end, ease: easeOf(ease), order: order++ });
  }

  function actorApi(record, name) {
    const api = {
      place(x, y, o) { const r = span(o, 0, `${name}.place`); track(record, "x", num(x, record.base.x), "set", r); track(record, "y", num(y, record.base.y), "set", r); if (o && o.size != null) track(record, "size", clamp(num(o.size, 0.3), 0.01, 3), "set", r); return api; },
      moveTo(x, y, o) { const r = span(o, null, `${name}.moveTo`); const e = (o && o.ease) || "gentle"; track(record, "x", num(x, 0.5), "set", r, e); track(record, "y", num(y, 0.6), "set", r, e); return api; },
      moveBy(dx, dy, o) { const r = span(o, null, `${name}.moveBy`); const e = (o && o.ease) || "gentle"; track(record, "x", num(dx, 0), "add", r, e); track(record, "y", num(dy, 0), "add", r, e); return api; },
      resize(size, o) { track(record, "size", clamp(num(size, 0.3), 0.01, 3), "set", span(o, 1, `${name}.resize`), (o && o.ease) || "gentle"); return api; },
      rotateTo(degrees, o) { track(record, "rotation", num(degrees, 0), "set", span(o, 1, `${name}.rotateTo`), (o && o.ease) || "gentle"); return api; },
      flip(o) { track(record, "flip", -1, "mul", span(o, 0.35, `${name}.flip`), "gentle"); return api; },
      fadeIn(o) { track(record, "opacity", 1, "set", span(o, 0.6, `${name}.fadeIn`), "linear"); return api; },
      fadeOut(o) { track(record, "opacity", 0, "set", span(o, 0.6, `${name}.fadeOut`), "linear"); return api; },
      show(o) { track(record, "opacity", 1, "set", span(o, 0, `${name}.show`)); return api; },
      hide(o) { track(record, "opacity", 0, "set", span(o, 0, `${name}.hide`)); return api; },
      hop(o) { const r = span(o, 1, `${name}.hop`); record.moves.push({ type: "hop", start: r.start, end: r.end, height: clamp(num(o && o.height, 0.08), 0, 0.4), times: Math.max(1, Math.round(num(o && o.times, 2))) }); cue("hop", r.start); return api; },
      shake(o) { const r = span(o, 0.8, `${name}.shake`); record.moves.push({ type: "shake", start: r.start, end: r.end, strength: clamp(num(o && o.strength, 0.012), 0, 0.05) }); return api; },
      spin(o) { const r = span(o, 1, `${name}.spin`); record.moves.push({ type: "spin", start: r.start, end: r.end, turns: clamp(num(o && o.turns, 1), -5, 5) }); cue("whoosh", r.start); return api; },
      wiggle(o) { const r = span(o, 1.5, `${name}.wiggle`); record.moves.push({ type: "wiggle", start: r.start, end: r.end, angle: clamp(num(o && o.angle, 10), 0, 45) }); return api; },
      float(o) { const r = span(o, null, `${name}.float`); record.moves.push({ type: "float", start: r.start, end: r.end, height: clamp(num(o && o.height, 0.015), 0, 0.1) }); return api; },
      swim(o) { const r = span(o, null, `${name}.swim`); record.moves.push({ type: "swim", start: r.start, end: r.end, height: clamp(num(o && o.height, 0.02), 0, 0.1) }); return api; },
      pulse(o) { const r = span(o, 1, `${name}.pulse`); record.moves.push({ type: "pulse", start: r.start, end: r.end, amount: clamp(num(o && o.amount, 0.12), 0, 1) }); return api; },
      glow(o) { const r = span(o, null, `${name}.glow`); record.moves.push({ type: "glow", start: r.start, end: r.end, colour: colourOf(o && o.color, "#ffe9a8") }); return api; },
      lightUp(o) { const r = span(o, 1.5, `${name}.lightUp`); record.moves.push({ type: "lightUp", start: r.start, end: building.start + building.duration, ramp: Math.max(0.1, r.end - r.start), colour: colourOf(o && o.color, "#ffd36b") }); cue("magic", r.start); return api; },
      say(words, o) { const r = span(o, 2.5, `${name}.say`); bubbles.push({ record, text: text(words), start: r.start, end: r.end }); cue("blip", r.start); return api; },
    };
    return api;
  }

  function finalizeRecord(record) {
    record.tracks.sort((a, b) => a.start - b.start || a.order - b.order);
    record.byProp = {};
    for (const tr of record.tracks) {
      const list = record.byProp[tr.prop] || (record.byProp[tr.prop] = []);
      tr.from = valueFrom(record.base[tr.prop], list, tr.start);
      tr.to = tr.op === "add" ? tr.from + tr.value : tr.op === "mul" ? tr.from * tr.value : tr.value;
      list.push(tr);
    }
  }
  function valueFrom(base, list, time) {
    let value = base;
    for (const tr of list) {
      if (time < tr.start) break;
      const k = tr.end <= tr.start ? 1 : clamp((time - tr.start) / (tr.end - tr.start), 0, 1);
      value = lerp(tr.from, tr.to, tr.ease(k));
    }
    return value;
  }
  function baseState(record, time) {
    const s = {};
    for (const key of Object.keys(record.base)) s[key] = valueFrom(record.base[key], (record.byProp && record.byProp[key]) || [], time);
    return s;
  }
  function stateOf(record, time, depth) {
    const s = baseState(record, time);
    if (record.follow && (depth || 0) < 4) {
      const t = stateOf(record.follow.target, time, (depth || 0) + 1);
      s.x = t.x + t.dx + record.follow.dx * t.flip;
      s.y = t.y + t.dy + record.follow.dy;
    }
    s.dx = 0; s.dy = 0; s.spin = 0; s.sx = 1; s.sy = 1; s.glow = null; s.light = 0; s.lightColour = null;
    // Lean gently into the direction of travel.
    if (record.byProp && record.byProp.x && !record.follow) {
      const before = valueFrom(record.base.x, record.byProp.x, time - 0.08);
      s.spin += clamp((s.x - before) * 220, -9, 9);
    }
    for (const m of record.moves) {
      if (time < m.start || time > m.end) continue;
      const k = m.end <= m.start ? 1 : (time - m.start) / (m.end - m.start);
      const local = time - m.start;
      if (m.type === "hop") {
        const h = Math.abs(Math.sin(Math.PI * m.times * k));
        s.dy -= m.height * h;
        const squash = Math.pow(1 - h, 6);
        s.sy *= 1 - 0.16 * squash + 0.07 * h * (1 - h) * 4;
        s.sx *= 1 + 0.13 * squash - 0.03 * h * (1 - h) * 4;
      }
      if (m.type === "shake") s.dx += Math.sin(local * 45) * m.strength * (1 - k);
      if (m.type === "spin") s.spin += 360 * m.turns * easings.gentle(k);
      if (m.type === "wiggle") s.spin += Math.sin(local * 9) * m.angle * Math.sin(Math.PI * k);
      if (m.type === "float") s.dy += Math.sin(local * 2.4) * m.height;
      if (m.type === "swim") { s.dy += Math.sin(local * 2) * m.height; s.spin += Math.cos(local * 2) * 6; }
      if (m.type === "pulse") { const p = 1 + m.amount * Math.sin(Math.PI * k); s.sx *= p; s.sy *= p; }
      if (m.type === "glow") s.glow = m.colour;
      if (m.type === "lightUp") { s.light = clamp(local / m.ramp, 0, 1); s.lightColour = m.colour; }
    }
    // Idle breathing keeps every piece gently alive.
    const breath = Math.sin(time * 2.1 + record.phase);
    s.sy *= 1 + 0.018 * breath;
    s.sx *= 1 - 0.008 * breath;
    return s;
  }
  const isLit = (record, s) => record.lit || !!s.glow || s.light > 0.2;

  // ---------- sky ----------
  const skies = {
    day: { top: [140, 196, 236], bottom: [233, 243, 238], dark: 0, tint: [255, 255, 255] },
    dawn: { top: [238, 170, 190], bottom: [252, 228, 200], dark: 0.12, tint: [255, 200, 210] },
    sunset: { top: [232, 120, 110], bottom: [250, 200, 140], dark: 0.18, tint: [255, 170, 130] },
    night: { top: [22, 30, 66], bottom: [52, 52, 104], dark: 0.55, tint: [70, 80, 150] },
    storm: { top: [70, 78, 100], bottom: [130, 136, 152], dark: 0.4, tint: [110, 118, 150] },
    space: { top: [8, 8, 26], bottom: [30, 20, 64], dark: 0.6, tint: [60, 50, 120] },
    underwater: { top: [30, 110, 150], bottom: [90, 180, 196], dark: 0.3, tint: [110, 190, 210] },
  };
  const grounds = { grass: ["#7fb27a", "#5f9e6e", "#9cc58d"], sand: ["#ead19a", "#d9b978", "#f2e0b5"], snow: ["#f2f6fb", "#dbe6f2", "#ffffff"], water: ["#5d9fd0", "#3f84bb", "#86bde3"] };
  const rgbList = (hex) => hexToRgb(hex).split(",").map(Number);
  function skyOf(name, scene) {
    const base = skies[name];
    const custom = scene.colors;
    const styled = style.skies && style.skies[name];
    return {
      top: custom ? custom.top : styled ? rgbList(styled[0]) : base.top,
      bottom: custom ? custom.bottom : styled ? rgbList(styled[1]) : base.bottom,
      dark: (scene.darkness != null ? scene.darkness : base.dark) * style.darkness,
      tint: base.tint,
    };
  }
  function skyMix(scene, k) {
    const a = skyOf(scene.sky, scene);
    const b = scene.skyTo ? skyOf(scene.skyTo, scene) : a;
    const mix = (x, y) => x.map((v, i) => lerp(v, y[i], k));
    return { top: mix(a.top, b.top), bottom: mix(a.bottom, b.bottom), dark: lerp(a.dark, b.dark, k), tint: mix(a.tint, b.tint) };
  }

  // Halftone dots that deepen towards the top of the sky (riso look), drawn once.
  let skyDotsCanvas = null;
  function skyDots() {
    if (skyDotsCanvas) return skyDotsCanvas;
    const c = makeCanvas(W, H);
    const g = c.getContext("2d");
    g.fillStyle = "#262a6e";
    g.beginPath();
    const step = 7;
    for (let y = 0; y < H; y += step) {
      for (let x = (y / step) % 2 ? step / 2 : 0; x < W; x += step) {
        const a = Math.max(0, 0.75 - y / (H * 0.85));
        if (a < 0.05) continue;
        const r = step * 0.5 * Math.sqrt(a);
        g.moveTo(x + r, y);
        g.arc(x, y, r, 0, Math.PI * 2);
      }
    }
    g.fill();
    skyDotsCanvas = c;
    return c;
  }

  const starField = (() => { const rand = seeded(99); return Array.from({ length: 90 }, () => ({ x: rand() * W, y: rand() * H * 0.7, r: 0.8 + rand() * 1.8, p: rand() * 6, sparkle: rand() < 0.12 })); })();
  function sparkleShape(g, x, y, r) {
    g.beginPath();
    for (let j = 0; j < 8; j++) { const rr = j % 2 ? r * 0.28 : r; const a = (j * Math.PI) / 4; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath();
    g.fill();
  }
  function drawSky(g, sky, time) {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `rgb(${sky.top.map(Math.round).join(",")})`);
    grad.addColorStop(1, `rgb(${sky.bottom.map(Math.round).join(",")})`);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    if (style.texture === "riso") { g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.45; g.drawImage(skyDots(), 0, 0, W, H); g.restore(); }
    // Stars come out by themselves as the sky darkens.
    const show = clamp((sky.dark / Math.max(0.2, style.darkness) - 0.3) / 0.25, 0, 1);
    if (show > 0) {
      g.fillStyle = style.name === "chalk" ? "#f4f1e8" : "#fff6d8";
      for (const s of starField) {
        g.globalAlpha = show * (0.45 + 0.55 * Math.abs(Math.sin(time * 1.3 + s.p)));
        if (s.sparkle) sparkleShape(g, s.x, s.y, s.r * 3.2);
        else { g.beginPath(); g.arc(s.x, s.y, s.r, 0, Math.PI * 2); g.fill(); }
      }
      g.globalAlpha = 1;
    }
  }

  const groundCache = new Map();
  function groundSprite(kind) {
    if (groundCache.has(kind)) return groundCache.get(kind);
    const colours = grounds[kind];
    const c = makeCanvas(W * DPR, H * 0.45 * DPR);
    const g = c.getContext("2d");
    g.scale(DPR, DPR);
    [[0.55, 0.12, colours[2], 0.9], [0.68, 0.1, colours[0], 1.4], [0.8, 0.07, colours[1], 2.1]].forEach(([base, amp, col, freq], i) => {
      const rand = seeded(30 + i);
      g.beginPath();
      g.moveTo(0, H * 0.45);
      for (let x = 0; x <= W; x += 12) g.lineTo(x, H * 0.45 * base - Math.sin((x / W) * Math.PI * freq + i) * H * amp * 0.5 + (rand() - 0.5) * 3);
      g.lineTo(W, H * 0.45);
      g.closePath();
      g.save();
      g.shadowColor = "rgba(35,20,45,0.3)"; g.shadowBlur = 12; g.shadowOffsetY = -3;
      g.fillStyle = col; g.fill();
      g.restore();
      if (style.outline) { g.strokeStyle = style.outline; g.lineWidth = style.outlineWidth; g.stroke(); }
      g.save(); g.clip(); g.globalAlpha = 0.6; g.fillStyle = g.createPattern(speckleTile, "repeat"); g.fillRect(0, 0, W, H); g.restore();
    });
    groundCache.set(kind, c);
    return c;
  }

  // ---------- the public helpers given to movie scripts ----------
  const movie = {
    W, H,
    style(look, overrides) {
      if (styleLocked) throw new Error("movie.style must be called before the first scene.");
      if (look && typeof look === "object") { overrides = look; look = look.look; }
      style = resolveStyle(look, overrides);
    },
    title(words, o) {
      const name = text(words);
      movie.scene(Object.assign({ duration: 3.5, sky: "day" }, o, { caption: null }), () => {});
      scenes[scenes.length - 1].title = name;
      cue("chime", scenes[scenes.length - 1].start + 0.3);
    },
    scene(o, build) {
      o = o || {};
      styleLocked = true;
      if (building) throw new Error("movie.scene cannot be inside another scene.");
      if (scenes.length >= LIMITS.scenes) throw new Error("A movie can have at most 10 scenes.");
      const duration = clamp(num(o.duration, 6), 2, 15);
      if (cursor + duration > LIMITS.seconds) throw new Error("The movie is longer than two minutes.");
      const scene = {
        start: cursor, duration,
        sky: skies[o.sky] ? o.sky : "day",
        skyTo: skies[o.skyTo] ? o.skyTo : null,
        colors: o.colors && typeof o.colors === "object" ? { top: rgbList(colourOf(o.colors.top, "#88aadd")), bottom: rgbList(colourOf(o.colors.bottom, "#ddeeff")) } : null,
        darkness: o.darkness != null ? clamp(num(o.darkness, 0), 0, 1) : null,
        backdrop: o.backdrop === "plain" ? "plain" : "drawing",
        ground: grounds[o.ground] ? o.ground : o.ground === "none" ? "none" : null,
        transition: ["fade", "cut", "iris"].includes(o.transition) ? o.transition : null,
      };
      scenes.push(scene);
      building = scene;
      for (const prop of ["zoom", "cx", "cy"]) track(cameraRecord, prop, prop === "zoom" ? 1 : 0.5, "set", { start: scene.start, end: scene.start });
      if (o.caption) captions.push({ text: text(o.caption), start: scene.start + 0.4, end: scene.start + duration - 0.15 });
      try { if (typeof build === "function") build(); } finally { building = null; }
      cursor += duration;
    },
    draw(fn, o) {
      if (typeof fn !== "function") throw new Error("movie.draw needs a function.");
      if (draws.length >= LIMITS.draws) throw new Error("Too many custom drawings.");
      const r = span(o, null, "movie.draw");
      const layer = o && o.layer === "back" ? 0 : o && o.layer === "front" ? 2 : 1;
      draws.push({ fn, start: r.start, end: r.end, layer, glow: !!(o && o.glow) });
    },
    end(words) { endText = words === false ? null : text(words || "The End"); },
  };

  const cameraRecord = { base: { zoom: 1, cx: 0.5, cy: 0.5 }, tracks: [], moves: [] };
  const camera = {
    zoom(scale, o) { const r = span(o, 1.5, "camera.zoom"); const e = (o && o.ease) || "gentle"; track(cameraRecord, "zoom", clamp(num(scale, 1), 0.5, 4), "set", r, e); if (o && o.x != null) track(cameraRecord, "cx", num(o.x, 0.5), "set", r, e); if (o && o.y != null) track(cameraRecord, "cy", num(o.y, 0.5), "set", r, e); return camera; },
    pan(x, y, o) { const r = span(o, 1.5, "camera.pan"); const e = (o && o.ease) || "gentle"; track(cameraRecord, "cx", num(x, 0.5), "set", r, e); track(cameraRecord, "cy", num(y, 0.5), "set", r, e); return camera; },
    focus(target, o) {
      const record = target && target.__record;
      if (!record) throw new Error("camera.focus needs a hero, prop or actor.");
      const r = span(o, 1.5, "camera.focus");
      focuses.push({ record, range: r, zoom: clamp(num(o && o.zoom, 1.6), 1, 4), ease: (o && o.ease) || "gentle" });
      return camera;
    },
    reset(o) { const r = span(o, 1, "camera.reset"); for (const prop of ["zoom", "cx", "cy"]) track(cameraRecord, prop, prop === "zoom" ? 1 : 0.5, "set", r); return camera; },
    shake(o) { const r = span(o, 0.6, "camera.shake"); cameraRecord.moves.push({ type: "shake", start: r.start, end: r.end, strength: clamp(num(o && o.strength, 0.012), 0, 0.05) }); cue("rumble", r.start); return camera; },
  };

  const soundNames = ["chime", "sparkle", "pop", "boing", "whoosh", "twinkle", "magic", "blip", "rumble", "hop", "thunder", "splash", "sing"];
  function sound(name, o) {
    const r = span(o, 0, "sound");
    if (!soundNames.includes(name)) throw new Error(`Unknown sound "${name}". Use one of: ${soundNames.join(", ")}.`);
    cue(name, r.start);
  }

  const effectNames = ["rain", "snow", "stars", "sparkles", "hearts", "confetti", "bubbles", "leaves", "fireflies", "lightning", "notes"];
  const litEffects = { stars: true, sparkles: true, fireflies: true, lightning: true, notes: true };
  const effectSounds = { sparkles: "twinkle", stars: "twinkle", fireflies: "twinkle", confetti: "sparkle", hearts: "sparkle", bubbles: "pop", rain: "rumble", notes: "sing" };
  const effects = {};
  for (const name of effectNames) {
    effects[name] = (o) => {
      if (effectList.length >= LIMITS.effects) throw new Error("Too many effects.");
      const r = span(o, null, `effects.${name}`);
      const target = o && o.around && o.around.__record;
      const e = { type: name, start: r.start, end: r.end, amount: clamp(Math.round(num(o && o.amount, defaultAmount(name))), 1, 300), colour: colourOf(o && o.color, null), target: target || null, seed: Math.floor(Math.random() * 1e9), layer: name === "stars" ? 0 : 2, lit: !!litEffects[name] };
      effectList.push(e);
      if (effectSounds[name]) cue(effectSounds[name], r.start);
      if (name === "lightning") for (const t of flashTimes(e)) cue("thunder", t + 0.15);
    };
  }
  function defaultAmount(name) { return { rain: 120, snow: 90, stars: 60, sparkles: 24, hearts: 18, confetti: 90, bubbles: 30, leaves: 30, fireflies: 22, lightning: 3, notes: 10 }[name]; }
  function flashTimes(e) {
    const rand = seeded(e.seed + 5);
    const times = [];
    let t = e.start + 0.3 + rand() * 0.6;
    while (t < e.end - 0.3 && times.length < e.amount) { times.push(t); t += 1.2 + rand() * 1.6; }
    return times;
  }

  const props = {};
  for (const kind of Object.keys(propKinds)) {
    props[kind] = (o) => {
      o = o || {};
      requireScene(`props.${kind}`);
      const record = makeRecord({ kind }, Object.assign({ size: 0.2 }, o), false);
      record.lit = !!propKinds[kind].lit;
      if (kind === "buddy" || kind === "firefly") record.face = true;
      const api = actorApi(record, kind);
      api.__record = record;
      return api;
    };
  }
  function actor(drawFn, o) {
    if (typeof drawFn !== "function") throw new Error("actor(...) needs a drawing function.");
    requireScene("actor");
    const record = makeRecord({ custom: drawFn }, o || {}, false);
    record.lit = !!(o && o.lit);
    const api = actorApi(record, "actor");
    api.__record = record;
    return api;
  }

  // ---------- rendering ----------
  let heroImage = null;
  let heroSprite = null;
  let backgroundImage = null;
  let backgroundLayer = null;
  let p5ref = null;

  function heroTreated() {
    if (!heroSprite && heroImage) {
      const k = Math.min(1, 700 / Math.max(heroImage.width, heroImage.height));
      const src = makeCanvas(heroImage.width * k, heroImage.height * k);
      src.getContext("2d").drawImage(heroImage, 0, 0, src.width, src.height);
      heroSprite = treat(src, 17);
    }
    return heroSprite;
  }
  function backgroundTreated() {
    if (!backgroundLayer && backgroundImage) {
      const c = makeCanvas(W * DPR, H * DPR);
      const g = c.getContext("2d");
      g.scale(DPR, DPR);
      if (style.treatment === "soft") { g.filter = "blur(3px)"; g.globalAlpha = 0.35; g.drawImage(backgroundImage, 0, 0, W, H); g.filter = "none"; g.globalAlpha = 1; }
      g.shadowColor = "rgba(35,20,45,0.28)"; g.shadowBlur = 8; g.shadowOffsetY = 3;
      g.drawImage(backgroundImage, 0, 0, W, H);
      g.shadowColor = "transparent";
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = g.createPattern(speckleTile, "repeat");
      g.fillRect(0, 0, W, H);
      if (style.texture === "halftone") { g.globalAlpha = 0.15; g.fillStyle = g.createPattern(halftoneTile, "repeat"); g.fillRect(0, 0, W, H); }
      backgroundLayer = c;
    }
    return backgroundLayer;
  }

  // Custom actors are redrawn a few times a second, like stop-motion.
  function customSprite(record, time) {
    const frame = Math.floor(time * 8);
    if (record.cache && record.cache.frame === frame) return record.cache.sprite;
    const res = 320;
    if (!record.graphics) record.graphics = p5ref.createGraphics(res * 1.6, res * 1.6);
    const gfx = record.graphics;
    gfx.clear();
    gfx.push();
    gfx.translate(gfx.width / 2, gfx.height / 2);
    record.look.custom(gfx, res, time - record.from, record.colour);
    gfx.pop();
    const src = makeCanvas(gfx.width, gfx.height);
    src.getContext("2d").drawImage(gfx.elt || gfx.canvas, 0, 0, gfx.width, gfx.height);
    const sprite = treat(src, record.order + 1);
    sprite.contentH = res;
    record.cache = { frame, sprite };
    return sprite;
  }

  function spriteFor(record, s, time, sizePx) {
    if (record.look.hero) return heroTreated();
    if (record.look.custom) return customSprite(record, time);
    if (propKinds[record.look.kind].invisible) return null;
    const blink = (time + record.phase) % 4.2 < 0.14;
    return propSprite(record.look.kind, record.colour, { face: record.face, blink }, sizePx);
  }

  function drawActor(g, record, time) {
    if (time < record.from || time >= record.until) return;
    const s = stateOf(record, time);
    if (s.opacity <= 0.01) return;
    const sizePx = s.size * H;
    const sprite = spriteFor(record, s, time, sizePx);
    if (!sprite) return;
    const k = sizePx / sprite.contentH;
    const w = sprite.canvas.width * k;
    const h = sprite.canvas.height * k;
    g.save();
    g.globalAlpha *= clamp(s.opacity, 0, 1);
    g.translate((s.x + s.dx) * W, (s.y + s.dy) * H);
    if (style.boil) {
      const rand = seeded(Math.floor(time * (style.fps || 12)) * 31 + record.order);
      g.translate((rand() - 0.5) * style.boil * 3, (rand() - 0.5) * style.boil * 3);
      g.rotate((rand() - 0.5) * style.boil * 0.02);
    }
    g.rotate(((s.rotation + s.spin) * Math.PI) / 180);
    g.scale(s.flip * s.sx, s.sy);
    g.translate(0, (sizePx / 2) * (1 - 1 / Math.max(0.5, s.sy)));
    g.drawImage(sprite.canvas, -w / 2, -h / 2, w, h);
    if (s.light > 0) {
      record.tintCache = record.tintCache && record.tintCache.base === sprite ? record.tintCache : { base: sprite, sprite: tinted(sprite, s.lightColour, 0.3) };
      g.globalAlpha *= s.light;
      g.drawImage(record.tintCache.sprite.canvas, -w / 2, -h / 2, w, h);
    }
    g.restore();
  }

  function glowAt(g, x, y, radius, rgb, strength) {
    strength *= style.bloom;
    if (strength <= 0.01 || radius <= 1) return;
    const grad = g.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, `rgba(${rgb},${Math.min(1, 0.55 * strength)})`);
    grad.addColorStop(0.4, `rgba(${rgb},${Math.min(1, 0.22 * strength)})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function drawLights(g, record, time, dark) {
    if (time < record.from || time >= record.until) return;
    const s = stateOf(record, time);
    if (s.opacity <= 0.01) return;
    const size = s.size * H;
    const cx = (s.x + s.dx) * W;
    const cy = (s.y + s.dy) * H;
    const strength = (0.35 + dark * 1.1) * s.opacity;
    const kind = record.look.kind && propKinds[record.look.kind];
    const lights = (kind && kind.lights) || [];
    if (record.lit || s.glow || s.light > 0 || (lights.length && dark > 0.25)) {
      for (const [lx, ly, lr, rgb] of lights) glowAt(g, cx + lx * size * s.flip, cy + ly * size, lr * size, rgb || hexToRgb(record.colour || "#ffcf70"), record.lit ? strength * (0.85 + 0.15 * Math.sin(time * 3 + record.phase)) : dark);
    }
    if (s.glow) glowAt(g, cx, cy, size * 1.1, hexToRgb(s.glow), strength);
    if (s.light > 0) glowAt(g, cx, cy, size * 1.2, hexToRgb(s.lightColour), strength * s.light);
    if (style.halo && !kind?.invisible) glowAt(g, cx, cy, size * 0.9, "255,245,230", 0.25);
  }

  function noteShape(g, x, y, s) {
    g.beginPath(); g.ellipse(x, y, s * 0.42, s * 0.3, -0.4, 0, Math.PI * 2); g.fill();
    g.fillRect(x + s * 0.3, y - s * 1.3, s * 0.12, s * 1.3);
    g.beginPath(); g.moveTo(x + s * 0.42, y - s * 1.3); g.quadraticCurveTo(x + s * 0.95, y - s * 1.0, x + s * 0.7, y - s * 0.55); g.quadraticCurveTo(x + s * 0.8, y - s * 0.95, x + s * 0.42, y - s * 1.0); g.fill();
  }

  function drawEffect(g, e, time) {
    if (time < e.start || time > e.end) return;
    const fade = clamp(Math.min((time - e.start) / 0.6, (e.end - time) / 0.6), 0, 1);
    const t = time - e.start;
    const rand = seeded(e.seed);
    g.save();
    g.globalAlpha *= fade;
    let cx = W / 2, cy = H / 2, spread = 1;
    if (e.target) { const s = stateOf(e.target, time); cx = (s.x + s.dx) * W; cy = (s.y + s.dy) * H; spread = s.size; }
    if (e.type === "lightning") {
      g.globalAlpha = 1;
      for (const ft of flashTimes(e)) {
        const age = time - ft;
        if (age < 0 || age > 0.45) continue;
        const env = age < 0.06 ? age / 0.06 : Math.max(0, 1 - (age - 0.06) / 0.39);
        g.fillStyle = `rgba(235,240,255,${0.55 * env})`;
        g.fillRect(-W, -H, W * 3, H * 3);
        const br = seeded(Math.floor(ft * 1000));
        let x = W * (0.2 + br() * 0.6), y = -10;
        g.strokeStyle = e.colour || "#f4f7ff"; g.lineWidth = 4; g.shadowColor = "#cfe0ff"; g.shadowBlur = 20; g.globalAlpha = env;
        g.beginPath(); g.moveTo(x, y);
        while (y < H * 0.62) { x += (br() - 0.5) * 70; y += 30 + br() * 40; g.lineTo(x, y); }
        g.stroke();
        g.shadowBlur = 0;
      }
      g.restore();
      return;
    }
    const confetti = ["#e5636b", "#f2a65a", "#f6d36b", "#7cc39a", "#6aa6d8", "#9b84cf", "#f28fad"];
    for (let i = 0; i < e.amount; i++) {
      const r1 = rand(), r2 = rand(), r3 = rand(), r4 = rand();
      g.save();
      if (e.type === "rain") {
        const x = ((r1 + t * 0.12) % 1) * W * 1.2 - W * 0.1;
        const y = (((r2 + t * (1.4 + r3 * 0.6)) % 1.1) - 0.05) * H;
        g.strokeStyle = e.colour || "rgba(210,228,250,0.75)"; g.lineWidth = 2.5; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + 22); g.stroke();
      } else if (e.type === "snow") {
        const y = (((r2 + t * (0.08 + r3 * 0.06)) % 1.1) - 0.05) * H;
        const x = r1 * W + Math.sin(t * (1 + r4) + i) * 24;
        g.fillStyle = e.colour || "#ffffff"; g.beginPath(); g.arc(x, y, 3 + r3 * 5, 0, Math.PI * 2); g.fill();
      } else if (e.type === "stars") {
        g.fillStyle = e.colour || "#fff3c4";
        g.globalAlpha *= 0.4 + 0.6 * Math.abs(Math.sin(t * (1 + r3 * 2) + r4 * 6));
        sparkleShape(g, r1 * W, r2 * H * 0.6, 3 + r3 * 7);
      } else if (e.type === "sparkles") {
        const life = (t * (0.8 + r3) + r4) % 1;
        const x = e.target ? cx + (r1 - 0.5) * spread * H * 1.3 : r1 * W;
        const y = e.target ? cy + (r2 - 0.5) * spread * H * 1.3 : r2 * H;
        g.fillStyle = e.colour || "#fff1a8";
        sparkleShape(g, x, y, Math.sin(Math.PI * life) * (7 + r3 * 10));
      } else if (e.type === "notes") {
        const life = (t * (0.35 + r3 * 0.25) + r4) % 1;
        const x = (e.target ? cx : W / 2) + (r1 - 0.5) * 80 + Math.sin(life * 6 + i) * 30 + life * (r2 - 0.3) * 260;
        const y = (e.target ? cy - spread * H * 0.3 : H * 0.6) - life * 260;
        g.globalAlpha *= Math.sin(Math.PI * life);
        g.fillStyle = e.colour || "#ffd36b";
        g.shadowColor = e.colour || "#ffd36b"; g.shadowBlur = 12;
        noteShape(g, x, y, 12 + r3 * 8);
      } else if (e.type === "hearts") {
        const y = (1.1 - ((r2 + t * (0.1 + r3 * 0.08)) % 1.2)) * H;
        const x = r1 * W + Math.sin(t * 2 + i) * 20;
        const sp = propSprite("heart", e.colour || null, {}, 40);
        const k = (22 + r3 * 22) / sp.contentH;
        g.translate(x, y); g.rotate(Math.sin(t * 2 + i) * 0.3);
        g.drawImage(sp.canvas, (-sp.canvas.width * k) / 2, (-sp.canvas.height * k) / 2, sp.canvas.width * k, sp.canvas.height * k);
      } else if (e.type === "confetti") {
        const y = (((r2 + t * (0.18 + r3 * 0.12)) % 1.1) - 0.05) * H;
        const x = r1 * W + Math.sin(t * 3 + i) * 18;
        g.translate(x, y); g.rotate(t * (2 + r4 * 4) + i); g.scale(1, Math.cos(t * 5 + i));
        g.fillStyle = e.colour || confetti[i % confetti.length]; g.fillRect(-6, -3.5, 12, 7);
      } else if (e.type === "bubbles") {
        const y = (1.1 - ((r2 + t * (0.07 + r3 * 0.06)) % 1.2)) * H;
        const x = r1 * W + Math.sin(t * 1.5 + i) * 16;
        const rr = 7 + r3 * 14;
        g.strokeStyle = e.colour || "rgba(235,248,255,0.9)"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.stroke();
        g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.arc(x - rr * 0.35, y - rr * 0.35, rr * 0.22, 0, Math.PI * 2); g.fill();
      } else if (e.type === "leaves") {
        const y = (((r2 + t * (0.07 + r3 * 0.05)) % 1.1) - 0.05) * H;
        const x = ((r1 + t * 0.03) % 1) * W + Math.sin(t * 2 + i) * 30;
        g.translate(x, y); g.rotate(Math.sin(t * 2 + i) * 1.2); g.fillStyle = e.colour || (i % 2 ? "#e07a5f" : "#8ab17d"); g.beginPath(); g.ellipse(0, 0, 12, 5.5, 0, 0, Math.PI * 2); g.fill();
      } else if (e.type === "fireflies") {
        const x = r1 * W + Math.sin(t * (0.5 + r3) + i) * 60;
        const y = H * 0.25 + r2 * H * 0.6 + Math.cos(t * (0.4 + r4) + i) * 40;
        const f = 0.6 + 0.4 * Math.sin(t * 6 + i);
        glowAt(g, x, y, 26 + r3 * 14, hexToRgb(e.colour || "#ffec78"), f);
        g.fillStyle = e.colour || "#fff7c2"; g.beginPath(); g.arc(x, y, 2.5 + r3 * 1.5, 0, Math.PI * 2); g.fill();
      }
      g.restore();
    }
    g.restore();
  }

  // ---------- captions, speech bubbles and title cards, styled to match the look ----------
  const themes = {
    riso: { box: "#f6efe0", text: "#262a6e", shape: "torn", offsetInk: "#ff4fa3" },
    paper: { box: PAPER, text: INK, shape: "torn", shadow: true },
    ink: { box: "#f3e6c8", text: "#4a3424", shape: "torn", shadow: true, italic: true },
    comic: { box: "#fff5b8", text: "#141414", border: "#141414", borderWidth: 3, shape: "rect", upper: true },
    neon: { box: "rgba(12,6,32,0.72)", text: "#f0feff", border: "#7df9ff", borderWidth: 2, glow: "#7df9ff", shape: "round" },
    chalk: { box: null, text: "#f4f1e8", shape: "none", chalky: true },
    pixel: { box: "#141420", text: "#ffffff", border: "#ffffff", borderWidth: 4, shape: "rect" },
    minimal: { box: null, text: "#ffffff", shape: "none", textShadow: true },
  };
  const themeOf = () => Object.assign({}, themes[style.caption] || themes.paper, style.outline && style.caption === "neon" ? { border: style.outline, glow: style.outline } : {});
  function panel(g, x, y, w, h, theme, seed) {
    if (theme.shape === "none" || !theme.box) return;
    g.save();
    if (theme.shadow) { g.shadowColor = "rgba(35,20,45,0.35)"; g.shadowBlur = 14; g.shadowOffsetY = 5; }
    if (theme.glow) { g.shadowColor = theme.glow; g.shadowBlur = 18; }
    g.fillStyle = theme.box;
    g.beginPath();
    if (theme.shape === "torn") tornRect(g, x, y, w, h, seeded(seed), 5);
    else if (theme.shape === "round" && g.roundRect) g.roundRect(x, y, w, h, 18);
    else g.rect(x, y, w, h);
    g.fill();
    g.shadowColor = "transparent";
    if (theme.border) { g.strokeStyle = theme.border; g.lineWidth = theme.borderWidth; if (theme.glow) { g.shadowColor = theme.glow; g.shadowBlur = 12; } g.stroke(); }
    if (theme.shape === "torn") { g.clip(); g.fillStyle = g.createPattern(speckleTile, "repeat"); g.globalAlpha = 0.8; g.fillRect(x - 10, y - 10, w + 20, h + 20); }
    g.restore();
  }
  function writeText(g, lines, cx, y, lineH, theme, sizePx, bold) {
    g.save();
    g.font = `${theme.italic ? "italic " : ""}${bold ? "bold " : ""}${sizePx}px ${FONTS[style.font] || FONTS.serif}`;
    g.textAlign = "center"; g.textBaseline = "top";
    if (theme.glow) { g.shadowColor = theme.glow; g.shadowBlur = 10; }
    if (theme.textShadow) { g.shadowColor = "rgba(0,0,0,0.6)"; g.shadowBlur = 8; g.shadowOffsetY = 2; }
    g.fillStyle = theme.text;
    lines.forEach((line, i) => {
      const words = theme.upper ? line.toUpperCase() : line;
      if (theme.offsetInk) { g.save(); g.fillStyle = theme.offsetInk; g.globalAlpha = 0.75; g.fillText(words, cx + 2.2, y + i * lineH + 1.6); g.restore(); }
      if (theme.chalky) { g.globalAlpha = 0.85; g.fillText(words, cx + 0.8, y + i * lineH + 0.6); g.globalAlpha = 0.5; }
      g.fillText(words, cx, y + i * lineH);
    });
    g.restore();
  }
  const textCache = new Map();
  function captionSprite(words) {
    const key = `c|${words}`;
    if (textCache.has(key)) return textCache.get(key);
    const theme = themeOf();
    const size = style.font === "mono" ? 28 : 32;
    const probe = makeCanvas(10, 10).getContext("2d");
    probe.font = `${theme.italic ? "italic " : ""}${size}px ${FONTS[style.font] || FONTS.serif}`;
    const lines = wrapLines(probe, theme.upper ? words.toUpperCase() : words, 960);
    const w = Math.min(1060, Math.max(...lines.map((l) => probe.measureText(l).width)) + 90);
    const h = lines.length * (size + 14) + 36;
    const c = makeCanvas((w + 40) * DPR, (h + 40) * DPR);
    const g = c.getContext("2d");
    g.scale(DPR, DPR);
    panel(g, 20, 20, w, h, theme, words.length);
    writeText(g, lines, 20 + w / 2, 20 + 18, size + 14, theme, size, false);
    const sprite = { canvas: c, w: w + 40, h: h + 40 };
    textCache.set(key, sprite);
    return sprite;
  }
  function bubbleSprite(words) {
    const key = `b|${words}`;
    if (textCache.has(key)) return textCache.get(key);
    const theme = Object.assign({}, themeOf());
    if (!theme.box) { theme.box = style.caption === "chalk" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)"; theme.border = theme.text; theme.borderWidth = 2; theme.shape = "round"; if (style.caption === "minimal") theme.text = INK; }
    const probe = makeCanvas(10, 10).getContext("2d");
    probe.font = `italic 27px ${FONTS[style.font] || FONTS.serif}`;
    const lines = wrapLines(probe, theme.upper ? words.toUpperCase() : words, 330);
    const w = Math.min(390, Math.max(...lines.map((l) => probe.measureText(l).width)) + 44);
    const h = lines.length * 35 + 26;
    const c = makeCanvas((w + 40) * DPR, (h + 64) * DPR);
    const g = c.getContext("2d");
    g.scale(DPR, DPR);
    panel(g, 20, 20, w, h, Object.assign({}, theme, { shape: theme.shape === "torn" ? "round" : theme.shape }), words.length + 3);
    g.save();
    g.fillStyle = theme.box;
    if (theme.glow) { g.shadowColor = theme.glow; g.shadowBlur = 12; }
    g.beginPath(); g.moveTo(20 + w / 2 - 13, 20 + h - 1); g.lineTo(20 + w / 2, 20 + h + 24); g.lineTo(20 + w / 2 + 13, 20 + h - 1); g.fill();
    if (theme.border) { g.strokeStyle = theme.border; g.lineWidth = theme.borderWidth; g.beginPath(); g.moveTo(20 + w / 2 - 13, 20 + h); g.lineTo(20 + w / 2, 20 + h + 24); g.lineTo(20 + w / 2 + 13, 20 + h); g.stroke(); }
    g.restore();
    writeText(g, lines, 20 + w / 2, 20 + 13, 35, Object.assign({}, theme, { italic: style.caption !== "pixel" }), 27, false);
    const sprite = { canvas: c, w: w + 40, h: h + 64, tail: 20 + h + 24 };
    textCache.set(key, sprite);
    return sprite;
  }
  function titleSprite(words) {
    const key = `t|${words}`;
    if (textCache.has(key)) return textCache.get(key);
    const theme = themeOf();
    const size = style.font === "mono" ? 58 : 68;
    const probe = makeCanvas(10, 10).getContext("2d");
    probe.font = `bold ${size}px ${FONTS[style.font] || FONTS.serif}`;
    const lines = wrapLines(probe, theme.upper ? words.toUpperCase() : words, 1000);
    const w = Math.max(...lines.map((l) => probe.measureText(l).width)) + 120;
    const h = lines.length * (size + 18) + 60;
    const c = makeCanvas((w + 60) * DPR, (h + 60) * DPR);
    const g = c.getContext("2d");
    g.scale(DPR, DPR);
    panel(g, 30, 30, w, h, theme, words.length + 1);
    if (theme.shape === "torn") { g.strokeStyle = "rgba(180,140,100,0.5)"; g.lineWidth = 2; g.setLineDash([6, 6]); g.strokeRect(46, 46, w - 32, h - 32); g.setLineDash([]); }
    writeText(g, lines, 30 + w / 2, 30 + 32, size + 18, Object.assign({}, theme, { italic: false, textShadow: theme.textShadow || theme.shape === "none" }), size, true);
    const sprite = { canvas: c, w: w + 60, h: h + 60 };
    textCache.set(key, sprite);
    return sprite;
  }

  function drawCaption(g, c, time) {
    if (time < c.start || time > c.end) return;
    const sp = captionSprite(c.text);
    const k = clamp(Math.min((time - c.start) / 0.5, (c.end - time) / 0.35), 0, 1);
    g.save();
    g.globalAlpha = easings.quick(k);
    g.drawImage(sp.canvas, W / 2 - sp.w / 2, H - sp.h - 10 + (1 - easings.quick(k)) * 14, sp.w, sp.h);
    g.restore();
  }
  function drawBubble(g, b, time) {
    const r = b.record;
    if (time < b.start || time > b.end || time < r.from || time >= r.until) return;
    const s = stateOf(r, time);
    const sp = bubbleSprite(b.text);
    const ax = (s.x + s.dx) * W;
    const ay = (s.y + s.dy) * H - (s.size * H) / 2;
    const x = clamp(ax - sp.w / 2, 10, W - sp.w - 10);
    const y = clamp(ay - sp.tail - 8, 10, H - sp.h - 10);
    const pop = easings.bouncy(clamp((time - b.start) / 0.3, 0, 1));
    const out = clamp((b.end - time) / 0.2, 0, 1);
    g.save();
    g.globalAlpha = out;
    g.translate(x + sp.w / 2, y + sp.tail);
    g.scale(pop * out, pop * out);
    g.drawImage(sp.canvas, -sp.w / 2, -sp.tail, sp.w, sp.h);
    g.restore();
  }
  function drawTitle(g, words, age) {
    const sp = titleSprite(words);
    const k = easings.bouncy(clamp(age / 0.7, 0, 1));
    g.save();
    g.globalAlpha = clamp(age / 0.3, 0, 1);
    g.translate(W / 2, H / 2);
    g.rotate(-0.02);
    g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
    g.drawImage(sp.canvas, -sp.w / 2, -sp.h / 2, sp.w, sp.h);
    g.restore();
  }

  // ---------- frame ----------
  function sceneAt(time) {
    for (const scene of scenes) if (time >= scene.start && time < scene.start + scene.duration) return scene;
    return scenes[scenes.length - 1];
  }
  // Depth for parallax: far things (layer "back") move less with the camera, "front" moves more.
  // The child's drawing and the middle layer share a depth so characters stay put on the scenery.
  const layerDepth = [0.6, 1, 1.18];
  function enterLayer(g, cam, depth) {
    const zoom = 1 + (cam.zoom - 1) * depth;
    const cx = 0.5 + (cam.cx - 0.5) * depth;
    const cy = 0.5 + (cam.cy - 0.5) * depth;
    g.translate(W / 2 + cam.shake * W * depth, H / 2);
    g.scale(zoom, zoom);
    g.translate(-cx * W, -cy * H);
  }
  function withLayer(g, cam, layer, fn) { g.save(); enterLayer(g, cam, layerDepth[layer]); fn(); g.restore(); }
  function runDraw(p, d, time) {
    if (time < d.start || time > d.end) return;
    p.push();
    d.fn(p, time - d.start, d.end > d.start ? (time - d.start) / (d.end - d.start) : 1);
    p.pop();
  }
  function texture(g, time) {
    const t = style.texture;
    if (t === "none" && !style.grain) return;
    g.save();
    if (t === "paper" || t === "watercolour" || t === "film") {
      g.globalCompositeOperation = "soft-light";
      g.globalAlpha = style.grain;
      g.fillStyle = g.createPattern(grainTile, "repeat");
      if (t === "film") { const r = seeded(Math.floor(time * 24)); g.translate(r() * 256, r() * 256); g.fillRect(-256, -256, W + 512, H + 512); }
      else g.fillRect(0, 0, W, H);
    }
    if (t === "watercolour") { g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.35; g.fillStyle = g.createPattern(washTile, "repeat"); g.fillRect(0, 0, W, H); }
    if (t === "chalk") { g.globalCompositeOperation = "screen"; g.globalAlpha = style.grain * 0.6; g.fillStyle = g.createPattern(chalkTile, "repeat"); g.fillRect(0, 0, W, H); }
    if (t === "halftone") { g.globalCompositeOperation = "multiply"; g.globalAlpha = style.grain * 0.3; g.fillStyle = g.createPattern(halftoneTile, "repeat"); g.fillRect(0, 0, W, H); }
    if (t === "riso") {
      g.globalCompositeOperation = "soft-light"; g.globalAlpha = style.grain; g.fillStyle = g.createPattern(grainTile, "repeat"); g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.1; g.fillStyle = g.createPattern(halftoneTile, "repeat"); g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 0.45; g.fillStyle = g.createPattern(speckleTile, "repeat"); g.fillRect(0, 0, W, H);
    }
    g.restore();
  }

  let lastTime = -1;
  let lastScene = -1;
  function render(p, time, total) {
    guardCount = 0;
    guardLimit = 200000;
    const g = p.drawingContext;
    const px = p.pixelDensity() * (p.width / W);
    g.save();
    g.setTransform(px, 0, 0, px, 0, 0);
    g.imageSmoothingEnabled = !style.pixel;
    const isEnd = endText && time >= cursor;
    const scene = isEnd ? scenes[scenes.length - 1] : sceneAt(time);
    const sceneIndex = isEnd ? -2 : scenes.indexOf(scene);
    if (sceneIndex !== lastScene) { lastScene = sceneIndex; post("scene", { sky: scene.skyTo || scene.sky, index: sceneIndex }); }
    const k = isEnd ? 1 : clamp((time - scene.start) / scene.duration, 0, 1);
    const sky = skyMix(scene, k);
    drawSky(g, sky, time);

    // Camera: script moves plus a slow, automatic drift that keeps every shot alive.
    const cam = baseState(cameraRecord, time);
    cam.zoom *= 1 + 0.045 * easings.gentle(k);
    cam.shake = cameraRecord.moves.filter((m) => time >= m.start && time <= m.end).reduce((sum, m) => sum + Math.sin((time - m.start) * 50) * m.strength * (1 - (time - m.start) / Math.max(0.01, m.end - m.start)), 0);

    const visible = actors.filter((r) => time >= r.from && time < r.until).sort((a, b) => a.layer - b.layer || a.order - b.order);
    const lit = new Set(visible.filter((r) => isLit(r, stateOf(r, time))));
    const drawsFor = (layer, glow) => { for (const d of draws) if (d.layer === layer && d.glow === glow) { g.save(); enterLayer(g, cam, layerDepth[layer]); if (glow) g.globalCompositeOperation = "lighter"; runDraw(p, d, time); g.restore(); } };

    // Far layer: sky props behind the child's background.
    withLayer(g, cam, 0, () => {
      for (const e of effectList) if (e.layer === 0 && !e.lit) drawEffect(g, e, time);
      for (const r of visible) if (r.layer === 0 && !lit.has(r)) drawActor(g, r, time);
    });
    drawsFor(0, false);
    // Middle: the child's background drawing, ground, characters.
    withLayer(g, cam, 1, () => {
      const bg = scene.backdrop === "drawing" ? backgroundTreated() : null;
      if (bg) g.drawImage(bg, 0, 0, W, H);
      const ground = scene.ground || (bg ? "none" : "grass");
      if (ground !== "none") g.drawImage(groundSprite(ground), 0, H * 0.55, W, H * 0.45);
      for (const r of visible) if (r.layer === 1 && !lit.has(r)) drawActor(g, r, time);
    });
    drawsFor(1, false);

    // Night: darken everything drawn so far, then add light.
    if (sky.dark > 0.01) {
      g.save();
      g.globalCompositeOperation = "multiply";
      const t = sky.tint.map((v) => Math.round(lerp(255, v, clamp(sky.dark * 1.25, 0, 1))));
      g.fillStyle = `rgb(${t.join(",")})`;
      g.fillRect(0, 0, W, H);
      g.restore();
    }
    g.save();
    g.globalCompositeOperation = "screen";
    for (const r of visible) withLayer(g, cam, r.layer, () => drawLights(g, r, time, sky.dark));
    g.restore();
    for (const r of visible) if (lit.has(r) && r.layer < 2) withLayer(g, cam, r.layer, () => drawActor(g, r, time));
    drawsFor(0, true);
    drawsFor(1, true);
    for (const e of effectList) if (e.lit && e.type !== "lightning") withLayer(g, cam, e.layer, () => drawEffect(g, e, time));

    // Front layer.
    withLayer(g, cam, 2, () => {
      for (const r of visible) if (r.layer === 2) drawActor(g, r, time);
      for (const e of effectList) if (e.layer === 2 && !e.lit) drawEffect(g, e, time);
    });
    drawsFor(2, false);
    drawsFor(2, true);
    withLayer(g, cam, 1, () => { for (const b of bubbles) drawBubble(g, b, time); });
    for (const e of effectList) if (e.type === "lightning") drawEffect(g, e, time);

    texture(g, time);
    if (style.vignette) { g.globalAlpha = style.vignette; g.drawImage(vignette, 0, 0, W, H); g.globalAlpha = 1; }

    for (const c of captions) drawCaption(g, c, time);
    if (!isEnd && scene.title) drawTitle(g, scene.title, time - scene.start);
    if (isEnd) drawTitle(g, endText, time - cursor);

    // Scene transitions: a dip to dusk ("fade"), or a circular iris that closes and opens like a lens ("iris").
    let dip = 0;
    let open = 1;
    scenes.forEach((s, i) => {
      const kind = s.transition || style.transition;
      if (kind === "fade") dip = Math.max(dip, 1 - Math.abs(time - s.start) / 0.4);
      if (kind === "iris") {
        const d = time - s.start;
        if (d >= 0 && d < 0.65) open = Math.min(open, d / 0.65);
        if (i > 0 && d < 0 && d > -0.45) open = Math.min(open, -d / 0.45);
      }
    });
    if (style.transition === "iris") open = Math.min(open, (total - time) / 0.8);
    else dip = Math.max(dip, 1 - (total - time) / 0.8);
    if (dip > 0) { g.fillStyle = `rgba(20,16,36,${clamp(dip, 0, 1) * 0.92})`; g.fillRect(0, 0, W, H); }
    if (open < 1) {
      const r = Math.max(0, easings.gentle(clamp(open, 0, 1)) * (Math.hypot(W, H) / 2 + 30));
      g.save();
      g.beginPath();
      g.rect(0, 0, W, H);
      g.arc(W / 2, H / 2, r, 0, Math.PI * 2);
      g.fillStyle = "#f3ede1";
      g.fill("evenodd");
      g.strokeStyle = "#2f62c8";
      g.lineWidth = 3;
      for (const k of [1, 1.18, 1.42]) { g.globalAlpha = k === 1 ? 1 : 0.6; g.beginPath(); g.arc(W / 2, H / 2, r * k + (k - 1) * 40, 0, Math.PI * 2); g.stroke(); }
      g.globalAlpha = 1;
      if (r < 30) { g.fillStyle = "#262a6e"; g.beginPath(); g.arc(W / 2, H / 2, 6, 0, Math.PI * 2); g.fill(); }
      g.restore();
    }

    g.fillStyle = "rgba(255,250,240,0.5)";
    g.fillRect(0, H - 4, W * clamp(time / total, 0, 1), 4);
    g.restore();

    for (const c of cues) if (c.time > lastTime && c.time <= time) post("sound", { name: c.name });
    lastTime = time;
  }

  // ---------- boot ----------
  function loadImage(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function fail(phase, error) {
    const message = error && error.message ? error.message : String(error);
    post("error", { phase, message: message.slice(0, 400) });
    if (p5ref) p5ref.noLoop();
  }

  window.addEventListener("error", (event) => fail("play", event.error || event.message));
  window.addEventListener("message", async (event) => {
    if (event.source !== window.parent || !event.data || event.data.type !== "assets") return;
    try {
      const assets = event.data;
      [backgroundImage, heroImage] = await Promise.all([loadImage(assets.background), loadImage(assets.hero && assets.hero.src)]);
      const box = assets.hero || { x: 0.5, y: 0.62, h: 0.4 };
      const heroRecord = { look: heroImage ? { hero: true } : { kind: "buddy" }, base: { x: num(box.x, 0.5), y: num(box.y, 0.62), size: clamp(num(box.h, 0.4), 0.05, 1), rotation: 0, opacity: 1, flip: 1, scale: 1 }, tracks: [], moves: [], layer: 1, order: order++, from: 0, until: Infinity, colour: null, face: !heroImage, phase: 0.7, follow: null };
      actors.push(heroRecord);
      const hero = actorApi(heroRecord, "hero");
      hero.__record = heroRecord;
      hero.home = { x: heroRecord.base.x, y: heroRecord.base.y, size: heroRecord.base.size };
      const sentences = String(assets.story || "").split(/(?<=[.!?]["”']?)\s+/).map((s) => s.trim()).filter(Boolean);
      const story = { text: String(assets.story || ""), lines: sentences, line: (i, fallback) => text(sentences[i] || fallback || "") };
      const drawing = { hasBackground: !!backgroundImage, hasHero: !!heroImage };
      const ease = (name, k) => easeOf(name, "linear")(clamp(num(k, 0), 0, 1));

      if (typeof window.__saiMovieScript !== "function") return fail("build", new Error("The movie script could not be loaded."));
      try {
        window.__saiMovieScript(movie, hero, props, effects, camera, actor, story, drawing, ease, W, H, sound);
      } catch (error) { return fail("build", error); }
      if (!scenes.length) return fail("build", new Error("The movie has no scenes."));
      for (const record of actors) finalizeRecord(record);
      for (const f of focuses) {
        const s = baseState(f.record, f.range.end);
        track(cameraRecord, "zoom", f.zoom, "set", f.range, f.ease);
        track(cameraRecord, "cx", s.x, "set", f.range, f.ease);
        track(cameraRecord, "cy", s.y, "set", f.range, f.ease);
      }
      finalizeRecord(cameraRecord);
      const total = cursor + (endText ? 2.8 : 0);
      post("started", { duration: total, style: style.name });
      startPlayback(total);
    } catch (error) { fail("build", error); }
  });

  function startPlayback(total) {
    const Sketch = window.p5;
    let startedAt = 0;
    let lastBeat = 0;
    let lastDrawn = -1;
    let done = false;
    p5ref = new Sketch((p) => {
      const fit = () => {
        const w = Math.min(window.innerWidth, (window.innerHeight * W) / H);
        const h = (w * H) / W;
        if (style.pixel) {
          p.resizeCanvas(Math.max(64, Math.floor(w / style.pixel)), Math.max(36, Math.floor(h / style.pixel)));
          p.canvas.style.width = `${Math.floor(w)}px`;
          p.canvas.style.height = `${Math.floor(h)}px`;
        } else p.resizeCanvas(Math.floor(w), Math.floor(h));
        lastDrawn = -1;
      };
      p.setup = () => {
        p.createCanvas(10, 10);
        p.pixelDensity(style.pixel ? 1 : DPR);
        p.canvas.style.imageRendering = style.pixel ? "pixelated" : "auto";
        p.canvas.style.filter = filterCss(style.filter || {});
        fit();
        startedAt = p.millis();
      };
      p.windowResized = fit;
      p.draw = () => {
        const now = p.millis();
        const real = Math.min(total, (now - startedAt) / 1000);
        if (now - lastBeat > 1000) { lastBeat = now; post("heartbeat", { time: real }); }
        // Stepped frame rates (stop-motion, pixel, ink) only redraw when the frame changes.
        const time = style.fps ? Math.floor(real * style.fps) / style.fps : real;
        if (time !== lastDrawn) {
          lastDrawn = time;
          try { render(p, time, total); } catch (error) { return fail("play", error); }
        }
        if (real >= total && !done) { done = true; post("finished"); p.noLoop(); }
      };
    });
  }

  // Called by the last script tag, once the movie script has been defined.
  window.__saiReady = () => post("ready");
})();
