import type { CSSProperties } from "react";

// Stars that twinkle over the drawn starfield, placed where they stay clear of the hero text.
// [left %, top px or %, size px, seconds per twinkle, delay in seconds]
const TOP_BAND = [
  [7, "24px", 15, 3.4, 0], [19, "62px", 11, 4.6, -1.3], [31, "22px", 13, 3.9, -2.2], [44, "70px", 10, 5.2, -0.6],
  [56, "28px", 14, 3.1, -1.8], [68, "66px", 11, 4.3, -3], [79, "20px", 13, 3.7, -0.9], [93, "60px", 15, 4.9, -2.6],
] as const;
const MARGINS = [
  [4, "26%", 13, 4.1, -0.4], [11, "46%", 16, 3.3, -2], [3, "63%", 11, 5, -3.4], [9, "78%", 14, 3.6, -1.1],
  [90, "40%", 15, 3.8, -2.8], [96, "55%", 11, 4.7, -0.2], [88, "68%", 14, 3.2, -1.6], [95, "84%", 12, 5.3, -3.8],
  [15, "33%", 12, 2.7, -1.9], [7, "54%", 10, 3, -0.7], [14, "70%", 13, 2.5, -2.3], [2, "42%", 15, 3.5, -3.1],
  [85, "30%", 11, 2.8, -0.5], [93, "47%", 13, 2.6, -2.1], [84, "60%", 10, 3.2, -1.2], [91, "74%", 15, 2.9, -3.3],
] as const;

function Sparkle({ left, top, size, seconds, delay, side }: { left: number; top: string; size: number; seconds: number; delay: number; side?: boolean }) {
  const style = { left: `${left}%`, top, width: size, height: size, animationDuration: `${seconds}s`, animationDelay: `${delay}s` } as CSSProperties;
  return (
    <svg className={`sparkle${side ? " sparkle-side" : ""}`} style={style} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 1.5C12.6 8.4 15.6 11.4 22.5 12 15.6 12.6 12.6 15.6 12 22.5 11.4 15.6 8.4 12.6 1.5 12 8.4 11.4 11.4 8.4 12 1.5Z" />
    </svg>
  );
}

/** Twinkling stars, regular shooting stars and a passing satellite. CSS only; both hold still or stay away for reduced motion. */
export function StarMotion() {
  return (
    <div className="star-motion" aria-hidden="true">
      {TOP_BAND.map(([left, top, size, seconds, delay]) => (
        <Sparkle key={left} left={left} top={top} size={size} seconds={seconds} delay={delay} />
      ))}
      {MARGINS.map(([left, top, size, seconds, delay]) => (
        <Sparkle key={left} left={left} top={top} size={size} seconds={seconds} delay={delay} side />
      ))}
      <span className="shooting-star shooting-star-1" />
      <span className="shooting-star shooting-star-2" />
      <span className="shooting-star shooting-star-3" />
      <span className="shooting-star shooting-star-4" />
      <span className="shooting-star shooting-star-5" />
      <span className="shooting-star shooting-star-6" />
      <span className="shooting-star shooting-star-7" />
      <svg className="satellite" viewBox="0 0 44 18" focusable="false">
        <path d="M2 3h12v12H2zM30 3h12v12H30zM8 3v12M36 3v12M14 9h4M26 9h4M18 5h8v8h-8z" />
      </svg>
    </div>
  );
}
