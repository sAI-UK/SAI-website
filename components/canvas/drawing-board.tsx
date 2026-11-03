"use client";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { paintBackground, paintCharacter } from "./sample-art";

// The drawing surface for SAI Canvas.
// Two 2D layers (background and character) hold the finished drawing. A WebGL canvas on top
// renders the stroke in progress with p5.brush (standalone build); when a stroke ends it is
// copied into the active layer. This keeps undo, the eraser and exporting simple.

export const BOARD_W = 1280;
export const BOARD_H = 720;

export type Layer = "background" | "character";
export type BoardExport = {
  background: string | null;
  hero: { src: string; x: number; y: number; w: number; h: number } | null;
  preview: string;
};
export type DrawingBoardHandle = { exportLayers: () => BoardExport; isEmpty: () => boolean; drawSample: () => boolean };

type BrushModule = typeof import("p5.brush/standalone");
type Tool = { id: string; label: string; brush: string | null };

// To change the brushes children can use, edit this list. Names come from p5.brush.
const tools: Tool[] = [
  { id: "pencil", label: "Pencil", brush: "2B" },
  { id: "crayon", label: "Crayon", brush: "cpencil" },
  { id: "pen", label: "Pen", brush: "pen" },
  { id: "marker", label: "Marker", brush: "marker" },
  { id: "charcoal", label: "Charcoal", brush: "charcoal" },
  { id: "spray", label: "Spray", brush: "spray" },
  { id: "eraser", label: "Eraser", brush: null },
];
const colours = ["#2a211b", "#e63946", "#f4a261", "#f6d32d", "#2a9d8f", "#3a86ff", "#8338ec", "#ff70a6", "#8d5524", "#7a8691", "#ffffff"];
const sizes = [
  { id: "small", label: "Small", weight: 1.5, eraser: 10 },
  { id: "medium", label: "Medium", weight: 3, eraser: 24 },
  { id: "large", label: "Large", weight: 6, eraser: 48 },
];
const brushScale = 2.5;
const chunkPoints = 120;
const maxUndo = 12;

function hasInk(ctx: CanvasRenderingContext2D) {
  const data = ctx.getImageData(0, 0, BOARD_W, BOARD_H).data;
  for (let i = 3; i < data.length; i += 16) if (data[i] > 8) return true;
  return false;
}

function inkBounds(ctx: CanvasRenderingContext2D) {
  const data = ctx.getImageData(0, 0, BOARD_W, BOARD_H).data;
  let minX = BOARD_W, minY = BOARD_H, maxX = -1, maxY = -1;
  for (let y = 0; y < BOARD_H; y += 2) {
    for (let x = 0; x < BOARD_W; x += 2) {
      if (data[(y * BOARD_W + x) * 4 + 3] > 8) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const pad = 6;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(BOARD_W, maxX + pad); maxY = Math.min(BOARD_H, maxY + pad);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// brush.clear() with no colour clears to "transparent white", which shows as a white veil on a
// premultiplied canvas. Reset the brush state with it, then clear to fully transparent black.
function wipe(lib: BrushModule, canvas: HTMLCanvasElement) {
  lib.clear();
  const gl = canvas.getContext("webgl2");
  if (!gl) return;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

export const DrawingBoard = forwardRef<DrawingBoardHandle, { overlay?: React.ReactNode }>(function DrawingBoard({ overlay }, ref) {
  const backgroundCanvas = useRef<HTMLCanvasElement>(null);
  const characterCanvas = useRef<HTMLCanvasElement>(null);
  const brushHolder = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const brushRef = useRef<{ lib: BrushModule; canvas: HTMLCanvasElement } | null>(null);
  const stroke = useRef<{ points: number[][]; seed: number; last: number[]; dirty: boolean } | null>(null);
  const history = useRef<{ layer: Layer; image: ImageData }[]>([]);

  const [layer, setLayer] = useState<Layer>("character");
  const [tool, setTool] = useState(tools[0]);
  const [colour, setColour] = useState(colours[0]);
  const [size, setSize] = useState(sizes[1]);
  const [brushError, setBrushError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const layerCtx = useCallback((which: Layer) => (which === "background" ? backgroundCanvas : characterCanvas).current!.getContext("2d", { willReadFrequently: true })!, []);

  // Load p5.brush once, in the browser only.
  useEffect(() => {
    let cancelled = false;
    import("p5.brush/standalone").then((lib) => {
      if (cancelled || !brushHolder.current) return;
      const canvas = document.createElement("canvas");
      canvas.width = BOARD_W;
      canvas.height = BOARD_H;
      canvas.className = "pointer-events-none absolute inset-0 h-full w-full";
      brushHolder.current.appendChild(canvas);
      lib.load(canvas);
      lib.scaleBrushes(brushScale);
      brushRef.current = { lib, canvas };
      setReady(true);
    }).catch(() => setBrushError("The brushes could not start in this browser. Try Chrome or Edge."));
    return () => { cancelled = true; brushRef.current?.canvas.remove(); brushRef.current = null; };
  }, []);

  const renderStroke = useCallback(() => {
    const current = stroke.current;
    const b = brushRef.current;
    if (!current || !b || !current.dirty || !tool.brush) return;
    current.dirty = false;
    const { lib } = b;
    wipe(lib, b.canvas);
    lib.push();
    lib.translate(-BOARD_W / 2, -BOARD_H / 2);
    lib.seed(current.seed);
    lib.set(tool.brush, colour, size.weight);
    const pts = current.points;
    if (pts.length === 1) lib.line(pts[0][0], pts[0][1], pts[0][0] + 0.5, pts[0][1] + 0.5);
    else lib.spline(pts, 0.5);
    lib.pop();
    lib.render();
  }, [tool, colour, size]);

  const commitStroke = useCallback(() => {
    const b = brushRef.current;
    if (!b) return;
    layerCtx(layer).drawImage(b.canvas, 0, 0);
    wipe(b.lib, b.canvas);
  }, [layer, layerCtx]);

  // Render the stroke in progress once per animation frame.
  useEffect(() => {
    let frame = 0;
    const loop = () => { renderStroke(); frame = requestAnimationFrame(loop); };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [renderStroke]);

  const toBoard = (event: React.PointerEvent) => {
    const rect = surface.current!.getBoundingClientRect();
    return [((event.clientX - rect.left) / rect.width) * BOARD_W, ((event.clientY - rect.top) / rect.height) * BOARD_H];
  };

  const remember = () => {
    history.current.push({ layer, image: layerCtx(layer).getImageData(0, 0, BOARD_W, BOARD_H) });
    if (history.current.length > maxUndo) history.current.shift();
    setCanUndo(true);
  };

  const eraseTo = (from: number[], to: number[]) => {
    const ctx = layerCtx(layer);
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = size.eraser;
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
    ctx.restore();
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0 || (!brushRef.current && tool.brush)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    remember();
    const point = toBoard(event);
    stroke.current = { points: [point], seed: Math.floor(Math.random() * 1e9), last: point, dirty: true };
    if (!tool.brush) eraseTo(point, [point[0] + 0.1, point[1]]);
  };
  const onPointerMove = (event: React.PointerEvent) => {
    const current = stroke.current;
    if (!current) return;
    const events = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
    for (const e of events) {
      const rect = surface.current!.getBoundingClientRect();
      const point = [((e.clientX - rect.left) / rect.width) * BOARD_W, ((e.clientY - rect.top) / rect.height) * BOARD_H];
      if (Math.hypot(point[0] - current.last[0], point[1] - current.last[1]) < 3) continue;
      if (!tool.brush) eraseTo(current.last, point);
      else current.points.push(point);
      current.last = point;
      current.dirty = true;
    }
    // Long strokes are committed in pieces so redrawing stays fast.
    if (tool.brush && current.points.length > chunkPoints) {
      current.dirty = true;
      renderStroke();
      commitStroke();
      current.points = current.points.slice(-2);
      current.seed += 1;
    }
  };
  const onPointerUp = () => {
    if (!stroke.current) return;
    if (tool.brush) { stroke.current.dirty = true; renderStroke(); commitStroke(); }
    stroke.current = null;
  };

  const undo = () => {
    const last = history.current.pop();
    if (last) layerCtx(last.layer).putImageData(last.image, 0, 0);
    setCanUndo(history.current.length > 0);
  };
  const clearLayer = () => {
    remember();
    layerCtx(layer).clearRect(0, 0, BOARD_W, BOARD_H);
  };

  useImperativeHandle(ref, () => ({
    drawSample: () => {
      history.current = [];
      setCanUndo(false);
      const bg = layerCtx("background");
      const character = layerCtx("character");
      bg.clearRect(0, 0, BOARD_W, BOARD_H);
      character.clearRect(0, 0, BOARD_W, BOARD_H);
      paintBackground(bg);
      paintCharacter(character);
      return true;
    },
    isEmpty: () => !hasInk(layerCtx("background")) && !hasInk(layerCtx("character")),
    exportLayers: () => {
      const bg = layerCtx("background");
      const character = layerCtx("character");
      const background = hasInk(bg) ? backgroundCanvas.current!.toDataURL("image/png") : null;
      let hero: BoardExport["hero"] = null;
      const box = inkBounds(character);
      if (box) {
        const crop = document.createElement("canvas");
        crop.width = box.w; crop.height = box.h;
        crop.getContext("2d")!.drawImage(characterCanvas.current!, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
        hero = { src: crop.toDataURL("image/png"), x: (box.x + box.w / 2) / BOARD_W, y: (box.y + box.h / 2) / BOARD_H, w: box.w / BOARD_W, h: box.h / BOARD_H };
      }
      const small = document.createElement("canvas");
      small.width = 640; small.height = 360;
      const ctx = small.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 640, 360);
      ctx.drawImage(backgroundCanvas.current!, 0, 0, 640, 360);
      ctx.drawImage(characterCanvas.current!, 0, 0, 640, 360);
      return { background, hero, preview: small.toDataURL("image/jpeg", 0.8) };
    },
  }), [layerCtx]);

  const chip = (active: boolean) => `rounded border px-2.5 py-1.5 text-sm transition ${active ? "border-forest bg-forest text-paper" : "border-sand bg-paper text-ink/80 hover:border-forest/50"}`;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 rounded border border-sand bg-paper px-3 py-2" role="toolbar" aria-label="Drawing tools">
        <div className="flex items-center gap-2" role="group" aria-label="Layer">
          <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink/60">Drawing on</span>
          <button type="button" className={chip(layer === "character")} aria-pressed={layer === "character"} onClick={() => setLayer("character")}>Character</button>
          <button type="button" className={chip(layer === "background")} aria-pressed={layer === "background"} onClick={() => setLayer("background")}>Background</button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Brush">
          {tools.map((t) => <button key={t.id} type="button" className={chip(tool.id === t.id)} aria-pressed={tool.id === t.id} onClick={() => setTool(t)}>{t.label}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Colour">
          {colours.map((c) => <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={colour === c} onClick={() => setColour(c)} className={`h-7 w-7 rounded-full border-2 ${colour === c ? "border-forest ring-2 ring-forest/40" : "border-sand"}`} style={{ backgroundColor: c }} />)}
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Size">
          {sizes.map((s) => <button key={s.id} type="button" className={chip(size.id === s.id)} aria-pressed={size.id === s.id} onClick={() => setSize(s)}>{s.label}</button>)}
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" className={chip(false)} onClick={undo} disabled={!canUndo}>Undo</button>
          <button type="button" className={chip(false)} onClick={clearLayer}>Clear {layer}</button>
        </div>
      </div>
      {brushError && <p role="alert" className="text-sm text-coral">{brushError}</p>}
      {/* The canvas keeps its 16:9 shape and grows to the largest size that fits the space it is given. */}
      <div className="relative flex aspect-video w-full items-center justify-center lg:aspect-auto lg:min-h-0 lg:flex-1" style={{ containerType: "size" }}>
      <div
        ref={surface}
        className="relative aspect-video w-[min(100cqw,calc(100cqh*16/9))] touch-none select-none overflow-hidden rounded border border-sand bg-white"
        style={{ cursor: ready ? "crosshair" : "progress" }}
        data-ready={ready}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <canvas ref={backgroundCanvas} width={BOARD_W} height={BOARD_H} className={`absolute inset-0 h-full w-full transition-opacity ${layer === "character" ? "opacity-90" : ""}`} />
        <canvas ref={characterCanvas} width={BOARD_W} height={BOARD_H} className={`absolute inset-0 h-full w-full transition-opacity ${layer === "background" ? "opacity-60" : ""}`} />
        <div ref={brushHolder} />
        {!ready && !brushError && <p className="absolute left-3 top-3 rounded bg-paper/90 px-3 py-1.5 text-sm text-ink/70">Getting the brushes ready…</p>}
        {overlay && <div className="contents" onPointerDown={(event) => event.stopPropagation()}>{overlay}</div>}
      </div>
      </div>
    </div>
  );
});
