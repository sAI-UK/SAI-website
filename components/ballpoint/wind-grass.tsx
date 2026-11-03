"use client";

import { useEffect, useRef } from "react";

import { INK, mulberry32, onPixelRatioChange } from "@/lib/ballpoint/pen";

type Blade = { x: number; y: number; h: number; lean: number; phase: number };

const STYLES = [
  { width: 0.8, alpha: 0.5 },
  { width: 1, alpha: 0.66 },
  { width: 1.2, alpha: 0.8 },
];
const POINTER_REACH = 120;
const FRAME_MS = 1000 / 30;

/**
 * Pen-drawn grass that sways in the wind and parts around the pointer.
 * Sits over the foreground of the meadow and the ground below it. Only runs while on screen, and is left out for reduced motion.
 */
export function WindGrass() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const zone = canvas?.parentElement;
    if (!canvas || !zone || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let blades: Blade[][] = [];
    let width = 0;
    let height = 0;

    const setUp = () => {
      const meadow = zone.querySelector<HTMLElement>(".meadow-scene");
      const pin = zone.querySelector<HTMLElement>(".meadow-pin");
      const top = (pin?.offsetHeight ?? 0) - (meadow?.offsetHeight ?? 0) * 0.26;
      canvas.style.top = `${top}px`;
      width = zone.offsetWidth;
      height = zone.offsetHeight - top;
      const scale = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas.style.height = `${height}px`;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.lineCap = "round";
      ctx.strokeStyle = INK;

      const rand = mulberry32(2026);
      const count = Math.min(2400, Math.round(width * height * 0.0012));
      const sets: Blade[][] = STYLES.map(() => []);
      // Blades grow quickly from the back of the band, then stay full size across the ground below.
      const fullSizeBy = Math.max(1, (meadow?.offsetHeight ?? height) * 0.26);
      for (let i = 0; i < count; i++) {
        const y = rand() * (height + 6);
        const depth = Math.min(1, y / fullSizeBy);
        const blade = { x: rand() * width, y, h: (7 + 12 * depth + rand() * 22 * depth) * (0.75 + rand() * 0.45), lean: 0.06 + rand() * 0.18, phase: rand() * 6.28 };
        sets[Math.floor(rand() * STYLES.length)].push(blade);
      }
      blades = sets;
    };

    const pointer = { x: -9999, y: -9999, strength: 0, target: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.target = 1;
    };
    const onPointerLeave = () => { pointer.target = 0; };

    const render = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = document.documentElement.dataset.mode === "dark" ? "#c9d6fb" : INK;
      pointer.strength += (pointer.target - pointer.strength) * 0.12;
      // A slow gust that builds and dies away on top of the steady breeze
      const gust = 0.5 + 0.5 * Math.sin(t * 0.00043);
      blades.forEach((set, index) => {
        ctx.lineWidth = STYLES[index].width;
        ctx.globalAlpha = STYLES[index].alpha;
        ctx.beginPath();
        for (const blade of set) {
          const wind = Math.sin(blade.x * 0.0035 - t * 0.0011 + blade.phase * 0.25) * (0.42 + 0.5 * gust) + Math.sin(blade.x * 0.013 - t * 0.0029 + blade.phase) * 0.2;
          let tipX = blade.x + blade.h * (blade.lean + wind);
          if (pointer.strength > 0.01) {
            const dx = blade.x - pointer.x, dy = blade.y - blade.h / 2 - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance < POINTER_REACH) tipX += (dx >= 0 ? 1 : -1) * (1 - distance / POINTER_REACH) * blade.h * 0.9 * pointer.strength;
          }
          ctx.moveTo(blade.x, blade.y);
          ctx.quadraticCurveTo(blade.x + (tipX - blade.x) * 0.2, blade.y - blade.h * 0.6, tipX, blade.y - blade.h);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    };

    setUp();
    const resize = new ResizeObserver(setUp);
    resize.observe(zone);
    const stopWatchingPixels = onPixelRatioChange(setUp);
    zone.addEventListener("pointermove", onPointerMove, { passive: true });
    zone.addEventListener("pointerleave", onPointerLeave);

    let visible = false;
    let frame = 0;
    let last = 0;
    const tick = (t: number) => {
      if (visible && t - last >= FRAME_MS) { last = t; render(t); }
      frame = requestAnimationFrame(tick);
    };
    const seen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    seen.observe(canvas);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      seen.disconnect();
      stopWatchingPixels();
      zone.removeEventListener("pointermove", onPointerMove);
      zone.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="wind-grass" aria-hidden="true" />;
}
