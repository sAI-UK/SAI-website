"use client";

import { useEffect } from "react";

import { findSnap } from "@/lib/ballpoint/scroll-snap";

// The feel of scrolling on the homepage. Raise or lower these to taste.
/** How quickly wheel scrolling catches up, in milliseconds: lower is snappier, higher is floatier. */
const WHEEL_EASE_MS = 85;
/** How quickly the page settles onto a section. */
const SNAP_EASE_MS = 130;
/** How long after the last movement the page settles. */
const SETTLE_MS = 130;
/** How close a section's top must be to settle onto it, in screen heights. Set to 0 to turn this off. */
const SNAP_RANGE = 0.3;
/** Extra scroll when heading down, at the very bottom of the page: 0.7 means 70% further per wheel movement. */
const GRAVITY = 0.7;
/** How much scrolling back up is held back near the ground: 0.5 means it takes twice as much effort. */
const GROUND_STICK = 0.5;
/** How close to the ground, in screen heights, the page gets pulled the rest of the way down. */
const PULL_RANGE = 0.45;
/** How far above the ground, in screen heights, it starts being harder to scroll back up. */
const STICK_RANGE = 1.1;

const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));

/**
 * Smooth wheel scrolling for the homepage: movement eases rather than jumps, gains speed on the way down, settles onto
 * a section when it stops close to one, pulls onto the meadow and resists leaving it. Keyboard, scrollbar and
 * link scrolling are left alone. Off for reduced motion.
 */
export function GravityScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pin = document.querySelector<HTMLElement>(".meadow-pin");
    if (!pin) return;

    const pageTop = (element: HTMLElement) => element.getBoundingClientRect().top + window.scrollY;
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
    /** The scroll position where the meadow has fully landed. */
    const groundAt = () => pageTop(pin) + pin.offsetHeight - window.innerHeight;
    const headerHeight = () => document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
    const snapPoints = () => Array.from(document.querySelectorAll<HTMLElement>(".home-sky > section")).map((section) => Math.max(0, pageTop(section) - headerHeight()));

    let target = window.scrollY;
    let ease = WHEEL_EASE_MS;
    let frame = 0;
    let lastTime = 0;
    let expectedY = window.scrollY;
    let lastY = window.scrollY;
    let goingDown = true;
    let touching = false;
    // Only wheel and touch settle onto sections, so dragging the scrollbar or following a link is never overridden
    let settleAllowed = false;
    let settleTimer = 0;

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    };
    const run = (time: number) => {
      const elapsed = lastTime ? Math.min(time - lastTime, 50) : 16;
      lastTime = time;
      const y = window.scrollY;
      // Something else moved the page since the last frame, so hand over to it
      if (Math.abs(y - expectedY) > 2) {
        stop();
        settleAllowed = false;
        target = y;
        return;
      }
      const gap = target - y;
      if (Math.abs(gap) < 1.5) {
        window.scrollTo({ top: target, behavior: "instant" });
        expectedY = window.scrollY;
        stop();
        queueSettle();
        return;
      }
      // At least a pixel each frame, because browsers can round smaller steps away and the motion would never finish
      const step = gap * (1 - Math.exp(-elapsed / ease));
      window.scrollTo({ top: y + Math.sign(gap) * Math.max(1, Math.abs(step)), behavior: "instant" });
      expectedY = window.scrollY;
      frame = requestAnimationFrame(run);
    };
    const moveTo = (y: number, easeMs: number) => {
      target = Math.round(clamp(y, 0, maxScroll()));
      ease = easeMs;
      if (!frame) {
        expectedY = window.scrollY;
        frame = requestAnimationFrame(run);
      }
    };

    const settle = () => {
      if (!settleAllowed || touching || frame) return;
      settleAllowed = false;
      const y = window.scrollY, screen = window.innerHeight, ground = groundAt();
      const toGround = ground - y;
      if (goingDown && toGround > 1 && toGround < screen * PULL_RANGE) {
        moveTo(ground, SNAP_EASE_MS);
        return;
      }
      if (y > ground - 1) return;
      const snap = findSnap(y, snapPoints(), screen * SNAP_RANGE, goingDown);
      if (snap !== null) moveTo(snap, SNAP_EASE_MS);
    };
    const queueSettle = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, SETTLE_MS);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.shiftKey || event.deltaY === 0) return;
      if ((event.target as Element | null)?.closest?.('[class*="overflow-"]')) return;
      event.preventDefault();
      const screen = window.innerHeight;
      const scale = event.deltaMode === 1 ? 32 : event.deltaMode === 2 ? screen : 1;
      let delta = event.deltaY * scale;
      const from = frame ? target : window.scrollY;
      if (delta > 0) {
        const descent = clamp(from / Math.max(1, maxScroll()));
        delta *= 1 + GRAVITY * descent * descent;
      } else if (from > groundAt() - screen * STICK_RANGE && from <= groundAt() + screen * 0.25) {
        delta *= 1 - GROUND_STICK;
      }
      goingDown = delta > 0;
      settleAllowed = true;
      moveTo(from + delta, WHEEL_EASE_MS);
      queueSettle();
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (!frame) {
        if (y !== lastY) goingDown = y > lastY;
        target = y;
      }
      lastY = y;
      if (settleAllowed) queueSettle();
    };
    const onTouchStart = () => { touching = true; stop(); };
    const onTouchEnd = () => { touching = false; settleAllowed = true; queueSettle(); };
    // Anything else taking over the scroll stops the motion straight away
    const handOver = () => { stop(); settleAllowed = false; window.clearTimeout(settleTimer); };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", handOver);
    window.addEventListener("pointerdown", handOver);
    return () => {
      stop();
      window.clearTimeout(settleTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", handOver);
      window.removeEventListener("pointerdown", handOver);
    };
  }, []);

  return null;
}
