// The list of images to export. Change a size or seed here, then run render.mjs.
(() => {
  const WEBP_QUALITY = 0.78;
  const results = [];

  function canvasFor(w, h, d) {
    const c = document.createElement("canvas");
    c.width = Math.round(w * d); c.height = Math.round(h * d);
    const ctx = c.getContext("2d");
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    return { c, ctx };
  }
  function save(name, c, w, h) {
    results.push({ name, w: Math.round(w), h: Math.round(h), data: c.toDataURL("image/webp", WEBP_QUALITY) });
  }
  // Full canvas, keeping its exact size.
  function whole(name, W, H, d, draw) {
    const { c, ctx } = canvasFor(W, H, d);
    draw(ctx);
    save(name, c, W, H);
  }
  // Trimmed to its ink, for pieces placed freely on the page.
  function trimmed(name, W, H, d, draw) {
    const { c, ctx } = canvasFor(W, H, d);
    draw(ctx);
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      if (data[(y * c.width + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    }
    const crop = document.createElement("canvas");
    crop.width = x1 - x0 + 1; crop.height = y1 - y0 + 1;
    crop.getContext("2d").drawImage(c, -x0, -y0);
    save(name, crop, crop.width / d, crop.height / d);
  }

  // Space: the top of the page
  whole("stars", 1900, 900, 1.5, (ctx) => Scenes.drawStarField(ctx, 1900, 900, 58, {
    counts: { five: 9, sparkle: 26, cross: 74, dot: 300 },
    clear: [0.2, 0.1, 0.8, 0.86], moonAt: [0.875, 0.2, 58], ploughAt: [0.045, 0.14, 250],
  }));
  whole("stars-mobile", 640, 900, 2, (ctx) => Scenes.drawStarField(ctx, 640, 900, 31, {
    counts: { five: 3, sparkle: 8, cross: 22, dot: 120 },
    clear: [0, 0.145, 1, 1], moonAt: [0.82, 0.08, 34], sizes: 0.9,
  }));

  // High altitude
  whole("sun", 220, 220, 2, (ctx) => Scenes.drawSun(ctx, 220, 3));
  whole("rocket", 120, 200, 2.5, (ctx) => Scenes.drawRocket(ctx, 120, 200, 21));
  whole("cloud-deck", 1500, 720, 1.5, (ctx) => Scenes.drawCloudDeck(ctx, 1500, 720, 44));
  whole("cloud-deck-front", 1500, 230, 1.5, (ctx) => Scenes.drawCloudClumps(ctx, 1500, 230, 71));
  whole("balloon", 110, 170, 2, (ctx) => Scenes.drawBalloon(ctx, 110, 170, 8));
  whole("plane", 860, 130, 2, (ctx) => Scenes.drawPlane(ctx, 860, 130, 9));
  trimmed("wisp-1", 440, 130, 2, (ctx) => Scenes.drawWisp(ctx, 440, 130, 5));
  trimmed("wisp-2", 400, 120, 2, (ctx) => Scenes.drawWisp(ctx, 400, 120, 16));
  trimmed("wisp-3", 340, 110, 2, (ctx) => Scenes.drawWisp(ctx, 340, 110, 29));

  // Clouds grow as the page comes down towards the ground
  const cloud = (name, width, seed, d) => trimmed(name, width * 1.5, width * 0.95, d, (ctx) =>
    Scenes.drawCloud(ctx, width * 0.75, width * 0.95 - 34, width, Pen.mulberry32(seed)));
  [["a", 400, 11], ["b", 400, 23], ["c", 320, 37], ["d", 320, 41], ["e", 240, 53], ["f", 240, 67]].forEach(([n, w, seed]) => cloud(`cloud-${n}`, w, seed, 2));
  [["1", 170, 71], ["2", 170, 83], ["3", 170, 97]].forEach(([n, w, seed]) => cloud(`cloud-small-${n}`, w, seed, 2.5));

  // The ground
  whole("meadow", 1900, 790, 1.5, (ctx) => Scenes.drawMeadow(ctx, 1900, 790, 2026, Scenes.MEADOW_DESKTOP));
  whole("meadow-mobile", 640, 560, 2, (ctx) => Scenes.drawMeadow(ctx, 640, 560, 1820, Scenes.MEADOW_MOBILE));

  whole("ground", 1000, 640, 1.25, (ctx) => Scenes.drawGrassTile(ctx, 1000, 640, 88));

  whole("fence-top", 480, 104, 2, (ctx) => Scenes.drawFenceTop(ctx, 480, 104, 4));
  whole("fence-boards", 480, 320, 1.5, (ctx) => Scenes.drawFenceBoards(ctx, 480, 320, 12));

  // Small marks beside the values
  for (let i = 0; i < 4; i++) whole(`pebble-${i + 1}`, 52, 52, 3, (ctx) => Pen.drawTree(ctx, 26, 27, 15, Pen.mulberry32(77 + i * 13), { bumps: i % 2 === 0, curls: false }));

  document.getElementById("out").textContent = "@@START@@" + JSON.stringify(results) + "@@END@@";
})();
