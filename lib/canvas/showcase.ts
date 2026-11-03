// The gold sample for demos and pitches: a story, an animation-style prompt, and a hand-made movie script for the
// sample drawing (components/canvas/sample-drawing.ts). The hand-made script shows the player at its best; the same
// story and style can also be sent to the AI to show what it writes from a child's prompt.
// Positions refer to the sample drawing: the lighthouse lamp is at (235, 134) on the 1280 × 720 stage,
// Mira's lantern at (481, 262), and the sea starts at y = 470.

export const sampleStory =
  "Mira lived in the lighthouse at the edge of the world, where the sea sang lullabies to the rocks. One stormy night, lightning cracked the great lamp, and the lighthouse went dark. Out in the waves, a little lost whale was calling for its family, but it could not see the way home. So Mira lifted her lantern and sang, and her song turned into ribbons of golden light across the water. The little whale followed the light past the rocks, all the way back to its family. And from that night on, whenever the sea was dark, the whales sang back to Mira.";

export const sampleStyle =
  "Risograph screen-print storybook: vivid fluorescent pink, sunshine yellow and deep blue inks, halftone dots, grainy paper and slightly misprinted edges, with circular lens transitions between scenes. The storm is deep blue with rain and lightning. The lighthouse beam and Mira's song are bright yellow light, and her song becomes ribbons of light that drift across the waves. Slow camera moves that push in on Mira for the big moments. End with the whole bay full of glowing sparkles.";

export const showcaseScript = `movie.style("riso", { bloom: 1.7 });
movie.title("The Lighthouse that Sang", { sky: "sunset" });

// Things the drawing needs that no preset has: a lamp beam, a rolling sea, ribbons of song and glints of light.
const LAMP = { x: 235, y: 134 };
const LANTERN = { x: 481, y: 262 };
const shore = (y) => (y < 500 ? 545 : y < 560 ? 525 : y < 612 ? 470 : y < 652 ? 380 : y < 690 ? 240 : 120);
function waves(p, t, rough) {
  const g = p.drawingContext;
  g.lineCap = "round";
  for (let i = 0; i < 7; i++) {
    const y0 = H * (0.68 + i * 0.045);
    const amp = (3 + i * 1.6) * rough;
    g.strokeStyle = "rgba(235,245,255," + (0.16 + i * 0.05) + ")";
    g.lineWidth = 1.5 + i * 0.5;
    g.beginPath();
    const start = shore(y0);
    for (let x = start; x <= W + 32; x += 32) {
      const y = y0 + Math.sin(x * 0.012 + t * (1.1 + rough * 0.7) + i * 1.7) * amp;
      if (x === start) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
}
// A screen-printed lamp beam: a yellow wedge that fades out in halftone dots.
function beam(p, angle, power) {
  if (power <= 0.01) return;
  const g = p.drawingContext;
  const len = 1150, spread = 0.09;
  g.save();
  g.beginPath();
  g.moveTo(LAMP.x, LAMP.y);
  g.lineTo(LAMP.x + Math.cos(angle - spread) * len, LAMP.y + Math.sin(angle - spread) * len);
  g.lineTo(LAMP.x + Math.cos(angle + spread) * len, LAMP.y + Math.sin(angle + spread) * len);
  g.closePath();
  g.clip();
  const grad = g.createRadialGradient(LAMP.x, LAMP.y, 0, LAMP.x, LAMP.y, len * 0.6);
  grad.addColorStop(0, "rgba(255,230,90," + 0.75 * power + ")");
  grad.addColorStop(1, "rgba(255,230,90,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,236,120," + 0.8 * power + ")";
  for (let d = 60; d < len; d += 22) {
    for (let a = -spread; a <= spread; a += 16 / d) {
      const r = 4.2 * Math.max(0, 1 - d / len);
      g.beginPath();
      g.arc(LAMP.x + Math.cos(angle + a) * d, LAMP.y + Math.sin(angle + a) * d, r, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
}
function ribbons(p, t, from, to, reach) {
  const g = p.drawingContext;
  g.lineCap = "round";
  g.shadowColor = "#ffd36b";
  g.shadowBlur = 18;
  for (let s = 0; s < 4; s++) {
    g.strokeStyle = s % 2 ? "rgba(255,214,120,0.55)" : "rgba(255,240,190,0.45)";
    g.lineWidth = 6 - s;
    g.beginPath();
    for (let i = 0; i <= 48; i++) {
      const u = (i / 48) * reach;
      const x = from.x + (to.x - from.x) * u;
      const y = from.y + (to.y - from.y) * u - Math.sin(u * Math.PI) * 110 + Math.sin(u * 9 - t * 2.4 + s * 1.3) * (12 + s * 5);
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
}
function glints(p, t, amount) {
  const g = p.drawingContext;
  for (let i = 0; i < amount; i++) {
    const x = 560 + ((i * 97.3) % 700);
    const y = 495 + ((i * 53.7) % 215);
    if (x < shore(y)) continue;
    const a = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7);
    g.fillStyle = "rgba(190,235,255," + 0.65 * a + ")";
    g.beginPath();
    g.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
    g.fill();
  }
}

let lamp = null;

// 1. A calm evening: the lamp sweeps the sea and the cottage windows glow.
movie.scene({ sky: "sunset", duration: 8, caption: story.line(0, "Mira lived in the lighthouse at the edge of the world.") }, () => {
  movie.draw((p, t) => waves(p, t, 1));
  movie.draw((p, t) => beam(p, 0.15 + Math.sin(t * 0.6) * 0.35, 0.7), { glow: true });
  lamp = props.glow({ x: LAMP.x / W, y: LAMP.y / H, size: 0.22, color: "#ffe39a", keep: true });
  props.glow({ x: 0.2516, y: 0.4417, size: 0.08, color: "#ffcf70", keep: true });
  props.glow({ x: 0.2875, y: 0.4417, size: 0.08, color: "#ffcf70", keep: true });
  props.bird({ x: 0.62, y: 0.3, size: 0.05, layer: "back" }).moveBy(0.25, -0.05, { ease: "linear" }).float({ height: 0.01 });
  props.cloud({ x: 0.7, y: 0.14, size: 0.12, layer: "back" }).moveBy(0.06, 0, { ease: "linear" });
  hero.float({ height: 0.006 });
  camera.zoom(1.14, { x: 0.32, y: 0.42, duration: 8, ease: "linear" });
});

// 2. The storm: lightning cracks the lamp and the light goes out.
movie.scene({ sky: "storm", duration: 8, caption: story.line(1, "One stormy night, lightning cracked the great lamp.") }, () => {
  movie.draw((p, t) => waves(p, t, 3.2));
  movie.draw((p, t) => { const flicker = t < 1.6 ? 0.7 : t < 2.4 ? (Math.sin(t * 60) > 0 ? 0.6 : 0.05) : 0; beam(p, 0.25 + Math.sin(t * 0.9) * 0.3, flicker); }, { glow: true });
  effects.rain({ amount: 160 });
  effects.lightning({ at: 1.8, duration: 6, amount: 3 });
  lamp.fadeOut({ at: 2.3, duration: 0.3 });
  camera.shake({ at: 2.0, duration: 0.8, strength: 0.012 });
  hero.shake({ at: 2.1, duration: 0.9, strength: 0.008 });
  hero.say("Oh no! The lamp!", { at: 3, duration: 2.6 });
  camera.zoom(1.3, { x: 0.25, y: 0.38, at: 2.4, duration: 3 });
});

// 3. A lost little whale calls in the dark.
movie.scene({ sky: "storm", skyTo: "night", duration: 8, caption: story.line(2, "Out in the waves, a little lost whale was calling for its family.") }, () => {
  movie.draw((p, t, k) => waves(p, t, 3 - k * 1.6));
  effects.rain({ amount: 70, duration: 4.5 });
  const little = props.whale({ x: 0.66, y: 0.84, size: 0.1, flip: true, hidden: true, color: "#ff8fc8" });
  little.fadeIn({ at: 0.6, duration: 1.2 }).swim();
  little.say("Mama? Where are you?", { at: 2.6, duration: 3 });
  sound("splash", { at: 1 });
  camera.zoom(1.7, { x: 0.66, y: 0.78, at: 0.4, duration: 3 });
});

// 4. The magic moment: Mira lifts her lantern and sings.
movie.scene({ sky: "night", duration: 9, caption: story.line(3, "So Mira lifted her lantern and sang.") }, () => {
  movie.draw((p, t) => waves(p, t, 1.4));
  props.glow({ follow: hero, dx: 0.031, dy: -0.021, size: 0.16, color: "#ffd36b", hidden: true, keep: true }).fadeIn({ at: 0.6, duration: 1.2 });
  const little = props.whale({ x: 0.66, y: 0.84, size: 0.1, flip: true, color: "#ff8fc8" });
  little.swim();
  camera.focus(hero, { zoom: 1.85, at: 0.3, duration: 2.6 });
  effects.notes({ around: hero, at: 2.4, amount: 12 });
  hero.lightUp({ at: 3, duration: 1.6, color: "#ffd36b" });
  movie.draw((p, t, k) => ribbons(p, t, LANTERN, { x: 0.66 * W, y: 0.82 * H }, Math.min(1, t / 3)), { at: 4.2, glow: true });
  camera.zoom(1.15, { x: 0.45, y: 0.55, at: 5, duration: 3.5 });
});

// 5. The little whale follows the light home.
movie.scene({ sky: "night", duration: 9, caption: story.line(4, "The little whale followed the light, all the way back to its family.") }, () => {
  movie.draw((p, t) => waves(p, t, 1.2));
  hero.lightUp({ duration: 0.1, color: "#ffd36b" });
  const little = props.whale({ x: 0.66, y: 0.84, size: 0.1, flip: true, color: "#ff8fc8" });
  little.moveTo(0.8, 0.74, { at: 0.8, duration: 5.5 }).swim();
  movie.draw((p, t) => { const s = 0.66 + Math.min(1, t / 6.3) * 0.14; ribbons(p, t, LANTERN, { x: (s + 0.04) * W, y: (0.84 - (s - 0.66) * 0.7) * H }, 1); }, { glow: true });
  const mum = props.whale({ x: 0.93, y: 0.71, size: 0.16, hidden: true, color: "#9fc3ff" });
  const dad = props.whale({ x: 0.99, y: 0.75, size: 0.18, hidden: true, color: "#7ea6ee" });
  mum.fadeIn({ at: 3.5, duration: 1.5 }).swim({ at: 3.5 });
  dad.fadeIn({ at: 4, duration: 1.5 }).swim({ at: 4 });
  effects.sparkles({ around: little, at: 6, duration: 3, amount: 28 });
  little.say("Mama! Papa!", { at: 6.2, duration: 2.5 });
  camera.zoom(1.45, { x: 0.8, y: 0.68, at: 0.5, duration: 6 });
});

// 6. Ever after: the whales sing back and the whole bay sparkles.
movie.scene({ sky: "night", duration: 10, caption: story.line(5, "And whenever the sea was dark, the whales sang back to Mira.") }, () => {
  movie.draw((p, t) => waves(p, t, 1));
  movie.draw((p, t, k) => glints(p, t, Math.floor(20 + k * 140)), { glow: true });
  const little = props.whale({ x: 0.8, y: 0.74, size: 0.1, flip: true, color: "#ff8fc8" });
  const mum = props.whale({ x: 0.93, y: 0.71, size: 0.16, color: "#9fc3ff" });
  little.swim(); mum.swim();
  effects.notes({ around: mum, at: 1, color: "#bfe3ff", amount: 10 });
  effects.notes({ around: hero, at: 3, amount: 8 });
  effects.fireflies({ at: 2, amount: 26, color: "#bfe3ff" });
  hero.lightUp({ duration: 0.1, color: "#ffd36b" }).say("Goodnight, little whale!", { at: 5, duration: 3 });
  camera.zoom(1.25, { x: 0.5, y: 0.55, duration: 0.1 });
  camera.zoom(1.0, { x: 0.5, y: 0.5, at: 0.2, duration: 9 });
});

movie.end("The End");`;
