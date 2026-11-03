"use client";

import { useEffect, useRef } from "react";

import { drawBird, fit, mulberry32, onPixelRatioChange } from "@/lib/ballpoint/pen";

type BirdFlockProps = {
  count: number;
  seed: number;
  /** How far across the page the flock starts, from 0 to 1. */
  start: number;
  scale?: number;
  /** Moves at its own speed while the page scrolls. Turn off for flocks inside the fixed meadow. */
  drift?: boolean;
  className?: string;
};

/** A flock crossing the lower sky. Only animates while on screen; holds still for reduced motion. */
export function BirdFlock({ count, seed, start, scale = 1, drift = true, className = "" }: BirdFlockProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas?.getContext("2d") || typeof ResizeObserver === "undefined" || typeof IntersectionObserver === "undefined") return;
    const rand = mulberry32(seed);
    const birds = Array.from({ length: count }, () => ({ ox: rand() * 130 - 65, oy: rand() * 46 - 23, phase: rand() * 6.28, flapSpeed: 0.8 + rand() * 0.4 }));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let view = fit(canvas);

    const render = (t: number) => {
      const { ctx, w, h } = view;
      ctx.clearRect(0, 0, w, h);
      const span = w + 300;
      const flockX = ((t * 0.042 + start * span) % span) - 150;
      for (const bird of birds) {
        const x = flockX + bird.ox + Math.sin(t * 0.0007 + bird.phase) * 6;
        const y = h / 2 + bird.oy + Math.sin(t * 0.0011 + bird.phase) * 4;
        const gliding = Math.sin(t * 0.0006 + bird.phase * 3) > 0.72;
        drawBird(ctx, x, y, scale, gliding ? 0.5 : t * 0.017 * bird.flapSpeed + bird.phase, -0.06 + Math.sin(t * 0.0009 + bird.phase) * 0.07);
      }
    };
    const redraw = () => {
      view = fit(canvas);
      if (reduced) render(20000);
    };
    if (reduced) render(20000);

    const resize = new ResizeObserver(redraw);
    resize.observe(canvas);
    const stopWatchingPixels = onPixelRatioChange(redraw);

    let visible = false;
    let frame = 0;
    const tick = (t: number) => {
      if (visible) render(t);
      frame = requestAnimationFrame(tick);
    };
    const seen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    seen.observe(canvas);
    if (!reduced) frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      seen.disconnect();
      stopWatchingPixels();
    };
  }, [count, seed, start, scale]);

  return <canvas ref={canvasRef} className={`bird-flock ${className}`} data-drift={drift ? "-0.2" : undefined} aria-hidden="true" />;
}
