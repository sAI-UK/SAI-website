"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { SketchBox } from "@/components/ballpoint/sketch";
import { INK, bbox, drawTree, fit, inkPoly, mulberry32, onPixelRatioChange, shade, type Point } from "@/lib/ballpoint/pen";

type Mark =
  | { type: "tree"; x: number; y: number; R: number; seed: number }
  | { type: "shape" | "line"; pts: Point[]; seed: number };

function resample(pts: Point[], step = 3) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = out[out.length - 1];
    if (Math.hypot(pts[i][0] - x0, pts[i][1] - y0) >= step) out.push(pts[i]);
  }
  return out;
}

function smooth(p: Point[]): Point[] {
  return p.map((_, i) => {
    const a = p[Math.max(0, i - 1)], b = p[i], c = p[Math.min(p.length - 1, i + 1)];
    return [(a[0] + 2 * b[0] + c[0]) / 4, (a[1] + 2 * b[1] + c[1]) / 4];
  });
}

/** Children draw an outline; the pen adds the light and shadow. Nothing leaves the browser. */
export function PenPad() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const marks = useRef<Mark[]>([]);
  const current = useRef<Point[] | null>(null);
  const view = useRef<ReturnType<typeof fit> | null>(null);
  const [hasMarks, setHasMarks] = useState(false);
  const [drawing, setDrawing] = useState(false);

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const v = fit(canvas);
    view.current = v;
    for (const mark of marks.current) {
      const rand = mulberry32(mark.seed);
      if (mark.type === "tree") drawTree(v.ctx, mark.x, mark.y, mark.R, rand);
      else if (mark.type === "shape") {
        const b = bbox(mark.pts);
        shade(v.ctx, mark.pts, rand, Math.min(b.w, b.h) * 0.88, { outline: { w: 1.5, passes: 2 } });
      } else {
        v.ctx.globalCompositeOperation = "multiply";
        inkPoly(v.ctx, mark.pts, rand, { w: 1.5, passes: 1, closed: false });
        v.ctx.globalCompositeOperation = "source-over";
      }
    }
    setHasMarks(marks.current.length > 0);
  }

  // The redraw only touches refs and a state setter, so it is safe to set this up once.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = new ResizeObserver(redraw);
    resize.observe(canvas);
    const stopWatchingPixels = onPixelRatioChange(redraw);
    return () => {
      resize.disconnect();
      stopWatchingPixels();
    };
  }, []);

  const position = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  };

  function start(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    current.current = [position(event)];
    setDrawing(true);
  }

  function move(event: ReactPointerEvent<HTMLCanvasElement>) {
    const pts = current.current;
    const ctx = view.current?.ctx;
    if (!pts || !ctx) return;
    const point = position(event), last = pts[pts.length - 1];
    if (Math.hypot(point[0] - last[0], point[1] - last[1]) < 2) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(point[0], point[1]); ctx.stroke();
    ctx.globalAlpha = 1;
    pts.push(point);
  }

  function finish() {
    const raw = current.current;
    if (!raw) return;
    current.current = null;
    setDrawing(false);
    if (raw.length > 6) {
      const pts = smooth(resample(raw));
      const b = bbox(pts);
      const gap = Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]);
      const closed = b.w > 24 && b.h > 24 && gap < 0.5 * Math.max(b.w, b.h);
      marks.current.push({ type: closed ? "shape" : "line", pts, seed: Math.floor(Math.random() * 1e9) });
    }
    redraw();
  }

  function addTree() {
    const v = view.current;
    if (!v) return;
    marks.current.push({
      type: "tree",
      x: v.w * (0.12 + Math.random() * 0.76),
      y: v.h * (0.3 + Math.random() * 0.55),
      R: (v.w < 600 ? 30 : 40) + Math.random() * 30,
      seed: Math.floor(Math.random() * 1e9),
    });
    redraw();
  }

  return (
    <div className="pen-pad">
      <div className="pen-pad-surface">
        <SketchBox variant={1} />
        <canvas
          ref={canvasRef}
          aria-label="Drawing area: draw a closed shape and it will be shaded with hatching"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={finish}
        />
        {!hasMarks && !drawing && (
          <p className="pen-pad-hint hand-note">
            Draw a closed shape: a cloud, an apple, a face…
            <br />
            then lift your pen.
          </p>
        )}
      </div>
      <div className="pen-pad-tools">
        <button className="ink-button ink-button-solid" type="button" onClick={addTree}>Add a tree</button>
        <button className="ink-button" type="button" onClick={() => { marks.current.pop(); redraw(); }}>
          <SketchBox variant={2} />
          Undo
        </button>
        <button className="ink-button" type="button" onClick={() => { marks.current = []; redraw(); }}>
          <SketchBox variant={0} />
          Clear page
        </button>
        <span className="hand-note pen-pad-note">Children draw the idea. The tool only adds shading.</span>
      </div>
    </div>
  );
}
