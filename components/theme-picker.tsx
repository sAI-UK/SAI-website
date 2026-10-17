"use client";

import { useEffect, useRef, useState } from "react";

import { useTheme } from "@/components/theme-provider";
import { themes } from "@/lib/themes";

function Swatch({ colours }: { colours: readonly string[] }) {
  return (
    <span className="theme-swatch" aria-hidden="true">
      {colours.map((colour) => (
        <span key={colour} style={{ background: colour }} />
      ))}
    </span>
  );
}

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const current = themes.find((item) => item.id === theme) ?? themes[0];

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="theme-picker" ref={wrapper}>
      <button
        type="button"
        className="theme-toggle"
        aria-expanded={open}
        aria-controls="theme-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Swatch colours={current.swatch} />
        <span className="theme-toggle-label">Theme</span>
        <span className="sr-only">: {current.label}</span>
      </button>
      {open && (
        <div id="theme-menu" className="theme-menu" role="group" aria-label="Choose a site theme">
          {themes.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === theme}
              onClick={() => {
                setTheme(item.id);
                setOpen(false);
              }}
            >
              <Swatch colours={item.swatch} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
