"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { useTheme } from "@/components/theme-provider";
import type { ThemeId } from "@/lib/themes";

// How many shapes float around on wide and narrow screens.
const desktopCount = 14;
const mobileCount = 6;

type Colours = { ink: string; fill: string };
type Shape = { draw: (colours: Colours) => ReactNode; spin?: boolean };

// Each shape is drawn on a 64 × 64 grid.
const butterfly: Shape = {
  draw: ({ ink, fill }) => (
    <g stroke={ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <g className="butterfly-wings" fill={fill}>
        <path d="M31 31C13 3 0 13 8 29c3 6 10 8 18 9C6 36 12 59 23 50c5-4 7-11 8-19Z" />
        <path d="M33 31C51 3 64 13 56 29c-3 6-10 8-18 9 20-2 14 21 3 12-5-4-7-11-8-19Z" />
        <g fill="none" opacity=".65" strokeWidth="1.3">
          <path d="m13 19 12 10m-13-4 14 8m-10 9 9-2m-7 6 8-5M51 19 39 29m13-4-14 8m10 9-9-2m7 6-8-5" />
          <path d="M29 29C15 9 5 16 12 28M35 29c14-20 24-13 17-1" />
        </g>
      </g>
      <path d="M31 27q1 12 1 19M32 28q-8-9-7-13m7 13q8-9 7-13" fill="none" stroke="#67513B" />
      <circle cx="32" cy="28" r="2.5" fill="#67513B" stroke="none" />
    </g>
  ),
};

const spider: Shape = {
  draw: ({ ink, fill }) => (
    <g stroke={ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 0v18" strokeWidth="1" opacity=".55" />
      <path d="M26 34 12 26l-4 6M26 38l-15 0-3 7M27 42l-12 8-1 7M29 45l-7 11M38 34l14-8 4 6M38 38h15l3 7M37 42l12 8 1 7M35 45l7 11" fill="none" />
      <ellipse cx="32" cy="39" rx="10" ry="9" fill={fill} />
      <circle cx="32" cy="26" r="7" fill={fill} />
      <circle cx="29" cy="25" r="2.6" fill="#fff" strokeWidth="1.2" />
      <circle cx="35" cy="25" r="2.6" fill="#fff" strokeWidth="1.2" />
      <path d="M29 30q3 2 6 0" fill="none" strokeWidth="1.4" />
    </g>
  ),
};

const web: Shape = {
  spin: true,
  draw: ({ ink }) => (
    <g stroke={ink} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".8">
      <path d="M32 4v56M4 32h56M12 12l40 40M52 12 12 52" />
      <path d="M32 24 38 26 40 32 38 38 32 40 26 38 24 32 26 26Z" />
      <path d="M32 15 44 20 49 32 44 44 32 49 20 44 15 32 20 20Z" />
      <path d="M32 6 50 14 58 32 50 50 32 58 14 50 6 32 14 14Z" opacity=".7" />
    </g>
  ),
};

const snowflake: Shape = {
  spin: true,
  draw: ({ ink, fill }) => (
    <g stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none">
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <path key={angle} transform={`rotate(${angle} 32 32)`} d="M32 32V5m0 9-6-5m6 5 6-5m-6 14-7-5m7 5 7-5" />
      ))}
      <circle cx="32" cy="32" r="4" fill={fill} />
    </g>
  ),
};

const hibiscus: Shape = {
  spin: true,
  draw: ({ ink, fill }) => (
    <g stroke={ink} strokeWidth="1.8" strokeLinejoin="round">
      {[0, 72, 144, 216, 288].map((angle) => (
        <path key={angle} transform={`rotate(${angle} 32 32)`} d="M32 32C22 26 20 8 32 6c12 2 10 20 0 26Z" fill={fill} />
      ))}
      <circle cx="32" cy="32" r="5" fill="#F3C64A" />
      <path d="M32 32 44 22" fill="none" strokeWidth="2" />
      <circle cx="45" cy="21" r="2" fill="#F3C64A" />
    </g>
  ),
};

const leaf: Shape = {
  draw: ({ ink, fill }) => (
    <g stroke={ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 6C12 20 14 46 32 58 50 46 52 20 32 6Z" fill={fill} />
      <path d="M32 12v46M32 24l-9-6m9 16-12-7m12 18-11-8M32 24l9-6m-9 16 12-7M32 44l11-8" fill="none" />
    </g>
  ),
};

const heart: Shape = {
  draw: ({ ink, fill }) => (
    <path d="M32 54C10 38 6 22 18 15c7-4 12 0 14 6 2-6 7-10 14-6 12 7 8 23-14 39Z" fill={fill} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
  ),
};

const star: Shape = {
  spin: true,
  draw: ({ ink, fill }) => (
    <path d="m32 6 7 17 18 1-14 12 5 18-16-10-16 10 5-18L7 24l18-1Z" fill={fill} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
  ),
};

const miniRainbow: Shape = {
  draw: () => (
    <g fill="none" strokeLinecap="round" strokeWidth="4.5">
      <path d="M8 46a24 24 0 0 1 48 0" stroke="#E2434B" />
      <path d="M14 46a18 18 0 0 1 36 0" stroke="#F2A230" />
      <path d="M20 46a12 12 0 0 1 24 0" stroke="#4CAF50" />
      <path d="M26 46a6 6 0 0 1 12 0" stroke="#3B8FD9" />
    </g>
  ),
};

/** What floats around the page for each theme. */
const floaterSets: Record<ThemeId, { name: string; motion: "wander" | "fall"; shapes: Shape[]; colours: Colours[] }> = {
  crayon: {
    name: "butterflies",
    motion: "wander",
    shapes: [butterfly],
    colours: [
      { ink: "#AE4160", fill: "#E8A0A5" },
      { ink: "#346A91", fill: "#A5C7DE" },
      { ink: "#956514", fill: "#F3D781" },
      { ink: "#56772D", fill: "#AFCAA3" },
      { ink: "#6B4E8F", fill: "#CDBDE2" },
      { ink: "#B0502C", fill: "#F2B894" },
    ],
  },
  web: {
    name: "spiders",
    motion: "wander",
    shapes: [spider, web],
    colours: [
      { ink: "#1E409B", fill: "#E0313B" },
      { ink: "#C0202E", fill: "#2F55C0" },
    ],
  },
  ice: {
    name: "snowflakes",
    motion: "fall",
    shapes: [snowflake],
    colours: [
      { ink: "#4A9BD1", fill: "#DCEEFB" },
      { ink: "#1F5E8C", fill: "#FFFFFF" },
      { ink: "#8C76C4", fill: "#EEE6FA" },
      { ink: "#7FC4EA", fill: "#FFFFFF" },
    ],
  },
  island: {
    name: "flowers",
    motion: "wander",
    shapes: [hibiscus, hibiscus, leaf],
    colours: [
      { ink: "#B8306A", fill: "#F59BC2" },
      { ink: "#2652A8", fill: "#8EB8F0" },
      { ink: "#0D786E", fill: "#8FD3C2" },
    ],
  },
  rainbow: {
    name: "rainbows",
    motion: "wander",
    shapes: [heart, star, miniRainbow],
    colours: [
      { ink: "#C2303A", fill: "#F78A8F" },
      { ink: "#B87400", fill: "#FFD45E" },
      { ink: "#2E8B46", fill: "#9BDDA6" },
      { ink: "#2D72B8", fill: "#94C8F5" },
      { ink: "#7446B8", fill: "#C9AEF0" },
    ],
  },
};

type Flyer = { x: number; y: number; vx: number; vy: number; tx: number; ty: number; speed: number; scale: number; phase: number; angle: number; spinRate: number };

const randomTarget = () => ({ tx: Math.random() * window.innerWidth, ty: Math.random() * window.innerHeight });

/** Themed shapes that float around the page and drift away from the pointer. They never block clicks. */
export function ThemeFloaters() {
  const { theme } = useTheme();
  const set = floaterSets[theme];
  const [count, setCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const elements = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 640px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setCount(narrow.matches ? mobileCount : desktopCount);
    const respectPreference = () => { if (reduced.matches) setPaused(true); };
    update();
    respectPreference();
    narrow.addEventListener("change", update);
    reduced.addEventListener("change", respectPreference);
    return () => {
      narrow.removeEventListener("change", update);
      reduced.removeEventListener("change", respectPreference);
    };
  }, []);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    if (!count) return;
    const falling = set.motion === "fall";
    const flyers: Flyer[] = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: 0,
      vy: 0,
      ...randomTarget(),
      speed: 0.6 + Math.random() * 0.8,
      scale: 0.6 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      angle: Math.random() * 360,
      spinRate: set.shapes[index % set.shapes.length].spin ? (Math.random() - 0.5) * 1.2 : 0,
    }));
    const pointer = { x: -9999, y: -9999 };
    const trackPointer = (event: PointerEvent) => { pointer.x = event.clientX; pointer.y = event.clientY; };
    window.addEventListener("pointermove", trackPointer, { passive: true });

    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(now - last, 50) / 16.67;
      last = now;
      const width = window.innerWidth;
      const height = window.innerHeight;
      flyers.forEach((flyer, index) => {
        if (!pausedRef.current) {
          const wobble = Math.sin(now / 420 + flyer.phase) * 0.6;
          let desiredX: number;
          let desiredY: number;
          if (falling) {
            desiredX = wobble * 0.9;
            desiredY = flyer.speed * 0.9;
          } else {
            let dx = flyer.tx - flyer.x;
            let dy = flyer.ty - flyer.y;
            const distance = Math.hypot(dx, dy);
            if (distance < 30 || flyer.tx > width || flyer.ty > height) Object.assign(flyer, randomTarget());
            dx /= distance || 1;
            dy /= distance || 1;
            desiredX = dx * flyer.speed - dy * wobble;
            desiredY = dy * flyer.speed + dx * wobble;
          }
          // Drift gently away when the pointer comes close.
          const px = flyer.x - pointer.x;
          const py = flyer.y - pointer.y;
          const near = Math.hypot(px, py);
          const flee = near < 110 ? (110 - near) / 110 : 0;
          desiredX += (px / (near || 1)) * flee * 4;
          desiredY += (py / (near || 1)) * flee * 4;
          flyer.vx += (desiredX - flyer.vx) * 0.04 * dt;
          flyer.vy += (desiredY - flyer.vy) * 0.04 * dt;
          flyer.x = Math.min(Math.max(flyer.x + flyer.vx * dt, -20), width - 20);
          flyer.y += flyer.vy * dt;
          if (falling && flyer.y > height + 20) {
            flyer.y = -50;
            flyer.x = Math.random() * width;
          }
          flyer.y = Math.min(Math.max(flyer.y, -50), height + 20);
          flyer.angle += flyer.spinRate * dt;
        }
        const tilt = flyer.spinRate ? flyer.angle : Math.max(-28, Math.min(28, flyer.vx * 14));
        const element = elements.current[index];
        if (element) element.style.transform = `translate(${flyer.x}px, ${flyer.y}px) rotate(${tilt}deg) scale(${flyer.scale})`;
      });
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", trackPointer);
    };
  }, [count, set]);

  return (
    <div className="floater-layer" data-paused={paused}>
      {Array.from({ length: count }, (_, index) => {
        const shape = set.shapes[index % set.shapes.length];
        const colours = set.colours[Math.floor(index / set.shapes.length) % set.colours.length];
        return (
          <span
            key={`${theme}-${index}`}
            ref={(element) => { elements.current[index] = element; }}
            className="floater"
            aria-hidden="true"
            style={{ "--flutter-delay": `${index * -0.37}s` } as CSSProperties}
          >
            <svg viewBox="0 0 64 64" focusable="false">{shape.draw(colours)}</svg>
          </span>
        );
      })}
      <button className="floater-pause" type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>
        {paused ? `Resume ${set.name}` : `Pause ${set.name}`}
      </button>
    </div>
  );
}
