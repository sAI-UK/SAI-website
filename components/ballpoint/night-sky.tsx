import type { CSSProperties } from "react";

import { mulberry32 } from "@/lib/ballpoint/pen";

const STAR_COUNT = 72;

// A fixed seed gives the same sky on the server and in the browser.
const rand = mulberry32(1969);
const STARS = Array.from({ length: STAR_COUNT }, (_, index) => {
  // Most stars keep to the sides of the screen, away from reading text.
  const side = rand() < 0.76;
  const across = side ? (rand() < 0.5 ? rand() * 20 : 80 + rand() * 20) : 20 + rand() * 60;
  return {
    key: index,
    sparkle: rand() < 0.2 && side,
    size: 1.4 + rand() * 1.8,
    style: {
      left: `${across.toFixed(2)}%`,
      top: `${(rand() * 100).toFixed(2)}%`,
      animationDuration: `${(2.2 + rand() * 4.4).toFixed(2)}s`,
      animationDelay: `${(-rand() * 6).toFixed(2)}s`,
    } as CSSProperties,
  };
});

/** Stars blinking behind every page in dark mode. Hidden by CSS in light mode. */
export function NightSky() {
  return (
    <div className="night-sky" aria-hidden="true">
      {STARS.map(({ key, sparkle, size, style }) =>
        sparkle ? (
          <svg key={key} className="night-sparkle" style={style} viewBox="0 0 24 24" focusable="false">
            <path d="M12 1.5C12.6 8.4 15.6 11.4 22.5 12 15.6 12.6 12.6 15.6 12 22.5 11.4 15.6 8.4 12.6 1.5 12 8.4 11.4 11.4 8.4 12 1.5Z" />
          </svg>
        ) : (
          <span key={key} className="night-star" style={{ ...style, width: size, height: size }} />
        ),
      )}
    </div>
  );
}
