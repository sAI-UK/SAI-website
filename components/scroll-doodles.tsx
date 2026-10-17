"use client";

import { useEffect, useRef } from "react";

export function ScrollDoodles() {
  const line = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
      line.current?.style.setProperty("transform", `scaleX(${progress})`);
      frame = 0;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    // Content stays visible without JavaScript. Animate each section just once.
    const animations = new Set<Animation>();
    const observer = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer?.unobserve(entry.target);
        if (motion.matches || !("animate" in entry.target)) return;
        const animation = entry.target.animate(
          [{ opacity: 0.3, transform: "translateY(20px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)" },
        );
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { threshold: 0.05 }) : null;
    document.querySelectorAll(".home-content > section:not(#home) > div").forEach((section) => observer?.observe(section));
    const stopMotion = () => { if (motion.matches) animations.forEach((animation) => animation.cancel()); };
    motion.addEventListener("change", stopMotion);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", stopMotion);
    };
  }, []);

  return <div className="crayon-progress" aria-hidden="true"><div ref={line} /></div>;
}
