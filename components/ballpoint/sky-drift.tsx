"use client";

import { useEffect } from "react";

// Pointer: clouds ease away from it, and the stars shift slightly with it.
const POINTER_REACH = 300;
const MOST_PUSH = 22;
// The feeling of falling. Raise these for a stronger effect, or lower them for a calmer one.
/** How much faster near clouds move by the bottom of the page: 0.8 means 1.8 times their starting difference. */
const ACCELERATION = 0.8;
/** How slowly the stars leave: 0.5 means they scroll at half the page's speed. */
const MEADOW_SKY_LAG = 170;
const STAR_LAG = 0.5;
/** How much the meadow grows as it approaches, on wide and narrow screens. */
const GROUND_GROWTH = 0.18;
const GROUND_GROWTH_NARROW = 0.1;

const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));

/**
 * Makes scrolling feel like descending from space to the ground. Text is never moved.
 * Far things (data-drift below 0) lag behind the page; near clouds (above 0) overtake it, faster the lower you get.
 * The meadow then grows as it arrives, with its sky lagging behind the land, and holds in view for a moment.
 */
export function SkyDrift() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wideScreen = window.matchMedia("(min-width: 1321px)");
    const phone = window.matchMedia("(max-width: 719px)");
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-drift]")).map((element) => ({ element, speed: Number(element.dataset.drift), pushX: 0, pushY: 0 }));
    const stars = document.querySelector<HTMLElement>(".sky-stars");
    const starMotion = document.querySelector<HTMLElement>(".star-motion");
    const pin = document.querySelector<HTMLElement>(".meadow-pin");
    const stage = document.querySelector<HTMLElement>(".meadow-stage");
    const meadowSky = document.querySelector<HTMLElement>(".meadow-clouds");
    const pageTop = (element: HTMLElement) => {
      let top = 0;
      for (let at: HTMLElement | null = element; at; at = at.offsetParent as HTMLElement | null) top += at.offsetTop;
      return top;
    };
    const pointer = { x: -9999, y: -9999, active: false };
    let starX = 0, starY = 0;
    let frame = 0;

    const draw = () => {
      frame = 0;
      let settling = false;
      const scroll = window.scrollY, screen = window.innerHeight;
      const descent = clamp(scroll / Math.max(1, document.documentElement.scrollHeight - screen));

      {
        const middle = scroll + screen / 2;
        const speedUp = 1 + ACCELERATION * descent * descent;
        for (const item of items) {
          const { element, speed } = item;
          if (!element.offsetParent) continue; // Hidden at this screen size
          const top = pageTop(element), centre = top + element.offsetHeight / 2;
          // Capped so nothing far off screen can stretch the page's scroll height
          const driftY = Math.round(clamp((centre - middle) * speed * (speed > 0 ? speedUp : 1), -screen * 1.2, screen * 1.2));
          let wantX = 0, wantY = 0;
          if (speed > 0 && pointer.active && wideScreen.matches) {
            const left = element.getBoundingClientRect().left;
            const dx = left + element.offsetWidth / 2 - pointer.x, dy = centre + driftY - scroll - pointer.y;
            const distance = Math.hypot(dx, dy) || 1;
            if (distance < POINTER_REACH) {
              const push = (1 - distance / POINTER_REACH) * MOST_PUSH;
              wantX = (dx / distance) * push;
              wantY = (dy / distance) * push;
            }
          }
          item.pushX += (wantX - item.pushX) * 0.08;
          item.pushY += (wantY - item.pushY) * 0.08;
          if (Math.abs(wantX - item.pushX) > 0.1 || Math.abs(wantY - item.pushY) > 0.1) settling = true;
          element.style.transform = `translate(${item.pushX.toFixed(1)}px, ${(driftY + item.pushY).toFixed(1)}px)`;
        }
      }

      // The stars are the furthest thing away, so they are the slowest to leave
      if (stars) {
        const wantX = pointer.active ? (pointer.x / window.innerWidth - 0.5) * -10 : 0;
        const wantY = pointer.active ? (pointer.y / screen - 0.5) * -6 : 0;
        starX += (wantX - starX) * 0.06;
        starY += (wantY - starY) * 0.06;
        if (Math.abs(wantX - starX) > 0.05 || Math.abs(wantY - starY) > 0.05) settling = true;
        const lag = Math.min(scroll, screen * 1.5) * STAR_LAG;
        stars.style.transform = `translate(${starX.toFixed(2)}px, ${(starY + lag).toFixed(2)}px)`;
        if (starMotion) starMotion.style.transform = `translateY(${lag.toFixed(1)}px)`;
      }

      // The landing
      if (pin && stage) {
        const pinTop = pageTop(pin), pinHeight = pin.offsetHeight;
        const approach = clamp((scroll - (pinTop - screen)) / pinHeight);
        const growth = phone.matches ? GROUND_GROWTH_NARROW : GROUND_GROWTH;
        stage.style.transform = `scale(${(1 + growth * approach * approach).toFixed(4)})`;
        if (meadowSky) meadowSky.style.transform = `translateY(${((approach - 1) * MEADOW_SKY_LAG).toFixed(1)}px)`;
      }

      if (settling) queue();
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      queue();
    };
    const onPointerLeave = () => { pointer.active = false; queue(); };

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    queue();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      // The footer stays on other pages, so leave it as it was found
      if (stage) stage.style.transform = "";
      if (meadowSky) meadowSky.style.transform = "";
    };
  }, []);

  return null;
}
