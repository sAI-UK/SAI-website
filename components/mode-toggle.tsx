"use client";

import { useEffect, useState } from "react";

const storageKey = "sai-mode";

/** Runs before the page paints, so a returning visitor never sees the wrong mode flash. */
export const modeBootScript = `try{if(localStorage.getItem("${storageKey}")==="dark")document.documentElement.dataset.mode="dark";}catch(e){}`;

/** Switches between the daytime notebook and the night sky. Shows a hand-drawn moon by day and a sun by night. */
export function ModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.mode === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.mode = "dark";
    else delete document.documentElement.dataset.mode;
    try {
      localStorage.setItem(storageKey, next ? "dark" : "light");
    } catch {
      // Storage can be blocked; the mode still applies for this visit.
    }
  }

  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button className="mode-toggle" type="button" onClick={toggle} aria-label={label} title={label}>
      {/* Both are always in the page and CSS shows the right one, so the first paint is correct. */}
      <svg className="mode-moon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M20.6 4.2C13.4 4.6 7.6 9.8 7.2 16.6 6.8 23.4 12.4 28.4 19 27.9 22.2 27.6 25.2 26 26.9 23.4 20.9 24.6 15.2 21.4 14.2 15.4 13.5 11 15.9 6.8 20.9 4.1" />
        <path className="mode-hatch" d="M10 13.4l3-3.2M9.1 17.5l4.3-4.6M9.6 21.1l5-5.4M11.8 23.9l5.2-5.5M15.6 25.5l4-4.2" />
        <path d="M24.2 7.8l.1 3.6M22.5 9.6l3.5-.1M27.6 13.8l0 2.2M26.5 14.9l2.2 0" />
      </svg>
      <svg className="mode-sun" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M21.7 13.3C20.6 10.1 16.8 8.5 13.6 9.8 10.3 11.2 8.8 15 10.1 18.2 11.5 21.6 15.3 23.2 18.6 21.8 21.9 20.4 23.3 16.7 22 13.5 21.7 12.8 21.2 12.1 20.6 11.5" />
        <path className="mode-hatch" d="M18.7 12.9l-5 5.6M20.3 14.6l-4.4 5M20.5 17.3l-2.4 2.7" />
        <path d="M16.1 2.6l-.2 3.5M16.2 26.1l.1 3.4M2.8 16l3.5.1M26 15.9l3.4-.1M6.5 6.4l2.5 2.6M23.2 23.1l2.4 2.4M6.3 25.6l2.6-2.4M23.1 8.9l2.5-2.5" />
      </svg>
    </button>
  );
}
