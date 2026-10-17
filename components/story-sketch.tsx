"use client";

import { useState, type CSSProperties } from "react";

const colours = [
  { name: "Berry", ink: "#AE4160" },
  { name: "Ocean", ink: "#346A91" },
  { name: "Leaf", ink: "#56772D" },
  { name: "Sunshine", ink: "#956514" },
];

/** A small, locally interactive drawing; no personal data or external services. */
export function StorySketch() {
  const [colour, setColour] = useState(colours[0]);

  return (
    <div className="story-sketch" style={{ "--crayon-ink": colour.ink } as CSSProperties}>
      <p className="sketch-caption">Every big idea starts with a little scribble.</p>
      <svg viewBox="0 0 400 270" role="img" aria-label={`An open storybook with a ${colour.name.toLowerCase()} crayon drawing a trail of imagination, a rainbow and stars.`}>
        <defs>
          <pattern id="paper-dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.7" fill="#D8C8A8" />
          </pattern>
        </defs>
        <rect width="400" height="270" fill="url(#paper-dots)" />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 111 C32 29 141 24 151 103" stroke="#CF6778" strokeWidth="12" opacity=".75" />
          <path d="M48 110 C48 48 123 45 135 105" stroke="#E2B34D" strokeWidth="10" opacity=".85" />
          <path d="M63 110 C63 68 107 64 119 107" stroke="#82A385" strokeWidth="9" />
          <path d="M77 111 C77 85 95 83 104 109" stroke="#7195B2" strokeWidth="8" />
          <path className="sketch-trail" key={colour.name} d="M99 170 C37 151 67 104 152 118 S244 56 208 40 S174 75 232 87 S338 55 319 119" stroke="var(--crayon-ink)" strokeWidth="3" strokeDasharray="5 7" />
          <g className="sketch-star" stroke="#B27A1F" strokeWidth="3" fill="#FAE5A6">
            <path d="m277 29 5 14 15 1-12 9 4 15-12-9-13 9 4-15-12-9 16-1Z" />
            <path d="m351 98 3 9 10 1-8 6 2 9-7-6-8 5 3-9-8-6 10-1Z" />
          </g>
          <path d="m167 73 3 10m-8-5 13 1M343 43l2 12m-8-6 13-1" stroke="#56772D" strokeWidth="3" />
          <g className="sketch-book">
            <path d="M83 152 Q140 133 199 158 Q253 134 314 151 L310 232 Q250 216 199 241 Q143 217 88 235Z" fill="#D6E3DA" stroke="#43607F" strokeWidth="3" />
            <path d="M90 142 Q145 127 199 151 Q252 127 307 141 L302 222 Q248 210 199 232 Q148 209 93 224Z" fill="#FFFCF4" stroke="#43607F" strokeWidth="2.5" />
            <path d="m199 153 0 77" stroke="#D8C8A8" strokeWidth="2" />
            <path d="m111 191 57 5m-57 10 43 3m71-14 59-4m-58 17 43-3" stroke="#D8C8A8" strokeWidth="3" />
            <path d="M128 175c-25-16-6-34 5-18 12-17 31 0 5 19l-5 4Z" fill="#E8A0A5" stroke="#AE4160" strokeWidth="2" />
            <path d="m252 154 5 10 11 2-8 8 1 11-10-5-10 5 2-12-8-7 12-2Z" fill="#F3D781" stroke="#956514" strokeWidth="2" />
          </g>
          <g className="sketch-crayon" transform="translate(306 148) rotate(24)">
            <path d="M0 0 10-25 20 0Z" fill="#E9CCA3" stroke="#67513B" strokeWidth="2" />
            <path d="m6-15 4-10 4 10Z" fill="var(--crayon-ink)" stroke="var(--crayon-ink)" />
            <rect width="20" height="83" rx="3" fill="var(--crayon-ink)" />
            <path d="M1 16h18v48H1Z" fill="#FFFCF4" opacity=".65" />
            <path d="M3 22h14M3 57h14" stroke="var(--crayon-ink)" strokeWidth="2" />
            <path d="M7 32v14m6-14v14" stroke="var(--crayon-ink)" strokeWidth="3" />
          </g>
          <path d="M28 247 Q78 234 119 249m199-4 40-5" stroke="#D8C8A8" strokeWidth="3" />
        </g>
      </svg>
      <div className="crayon-palette" role="group" aria-label="Choose the drawing colour">
        <span className="palette-hint">Pick your crayon</span>
        {colours.map((item) => (
          <button key={item.name} type="button" aria-label={`${item.name} crayon`} aria-pressed={colour.name === item.name} onClick={() => setColour(item)} style={{ "--swatch": item.ink } as CSSProperties}>
            <span aria-hidden="true">{colour.name === item.name ? "✓" : ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
