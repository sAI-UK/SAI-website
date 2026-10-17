"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

const crayons = [
  { name: "Berry", ink: "#AE4160" },
  { name: "Ocean", ink: "#346A91" },
  { name: "Leaf", ink: "#56772D" },
  { name: "Sunshine", ink: "#C8901E" },
  { name: "Plum", ink: "#6B4E8F" },
];

/** A small drawing pad for visitors. Drawings stay in the browser and are never saved or sent anywhere. */
export function DoodleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [crayon, setCrayon] = useState(crayons[0]);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Keep the canvas sharp and keep the drawing when the layout changes size.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = Math.round(canvas.clientWidth * ratio);
      const height = Math.round(canvas.clientHeight * ratio);
      if (width === canvas.width && height === canvas.height) return;
      const copy = document.createElement("canvas");
      copy.width = canvas.width;
      copy.height = canvas.height;
      if (canvas.width && canvas.height) copy.getContext("2d")?.drawImage(canvas, 0, 0);
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (context && copy.width) context.drawImage(copy, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  function pointFrom(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * canvas.width,
      y: ((event.clientY - box.top) / box.height) * canvas.height,
    };
  }

  function drawTo(point: { x: number; y: number }) {
    const context = canvasRef.current?.getContext("2d");
    const from = lastPoint.current ?? point;
    if (!context) return;
    const ratio = window.devicePixelRatio || 1;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = crayon.ink;
    // A few slightly offset strokes give a waxy, crayon-like texture.
    const passes = [
      { width: 5, alpha: 0.75, offset: 0 },
      { width: 2, alpha: 0.35, offset: 1.6 },
      { width: 1.5, alpha: 0.3, offset: -1.8 },
    ];
    for (const pass of passes) {
      const jitter = (Math.random() - 0.5) * ratio;
      context.globalAlpha = pass.alpha;
      context.lineWidth = pass.width * ratio;
      context.beginPath();
      context.moveTo(from.x + pass.offset * ratio, from.y + jitter);
      context.lineTo(point.x + pass.offset * ratio, point.y - jitter);
      context.stroke();
    }
    context.globalAlpha = 1;
    lastPoint.current = point;
  }

  function startDrawing(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPoint.current = null;
    drawTo(pointFrom(event));
    setHasDrawn(true);
  }

  function keepDrawing(event: PointerEvent<HTMLCanvasElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    drawTo(pointFrom(event));
  }

  function stopDrawing() {
    lastPoint.current = null;
  }

  function clearPage() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  return (
    <div className="doodle-pad" style={{ "--crayon-ink": crayon.ink } as CSSProperties}>
      <div className="doodle-surface">
        <canvas
          ref={canvasRef}
          aria-label="A small drawing space. Use a mouse, finger or stylus to doodle."
          onPointerDown={startDrawing}
          onPointerMove={keepDrawing}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
        />
        {!hasDrawn && (
          <p className="doodle-prompt" aria-hidden="true">
            Your page. Draw a character, a star, a dream…
          </p>
        )}
      </div>
      <div className="doodle-tools">
        <div className="doodle-crayons" role="group" aria-label="Choose a crayon colour">
          {crayons.map((item) => (
            <button
              key={item.name}
              type="button"
              aria-label={`${item.name} crayon`}
              aria-pressed={crayon.name === item.name}
              onClick={() => setCrayon(item)}
              style={{ "--swatch": item.ink } as CSSProperties}
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
        <button type="button" className="doodle-clear" onClick={clearPage} disabled={!hasDrawn}>
          Fresh page
        </button>
      </div>
    </div>
  );
}
