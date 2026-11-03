import Image from "next/image";
import type { CSSProperties } from "react";

// Exported illustrations (see scripts/ballpoint-art). Sizes are the width and height each was drawn at.
const ART = {
  balloon: [110, 170],
  "wisp-1": [426, 115],
  "wisp-2": [392, 84],
  "wisp-3": [332, 91],
  "cloud-a": [446, 226],
  "cloud-b": [443, 224],
  "cloud-c": [353, 183],
  "cloud-d": [362, 177],
  "cloud-e": [262, 144],
  "cloud-f": [275, 151],
} as const;

const SMALL_CLOUDS = { 1: [194, 116], 2: [191, 99], 3: [191, 108] } as const;

type Side = "left" | "right";

type SkyArtProps = {
  name: keyof typeof ART;
  side: Side;
  /** Where it sits down the section, such as "12%". */
  top: string;
};

/** Something in the sky, in the page margin on wide screens. Larger, nearer clouds drift faster as you scroll. */
export function SkyArt({ name, side, top }: SkyArtProps) {
  const [width, height] = ART[name];
  const far = name.startsWith("wisp") || name === "balloon";
  const style = { "--top": top, "--w": `min(${width}px, ${(width / 19).toFixed(2)}vw)` } as CSSProperties;
  return (
    <Image
      className={`sky-art sky-${side}`}
      style={style}
      data-drift={far ? "-0.32" : (width / 620).toFixed(2)}
      src={`/ballpoint/${name}.webp`}
      width={width}
      height={height}
      alt=""
      unoptimized
    />
  );
}

/** Narrow screens have no margins, so a small cloud sits in the gap above a section instead. */
export function SkyGapCloud({ cloud, side }: { cloud: keyof typeof SMALL_CLOUDS; side: Side }) {
  const [width, height] = SMALL_CLOUDS[cloud];
  return <Image className={`sky-gap sky-${side}`} data-drift="0.16" src={`/ballpoint/cloud-small-${cloud}.webp`} width={width} height={height} alt="" unoptimized />;
}

type PictureProps = {
  desktop: { src: string; width: number; height: number };
  mobile: { src: string; width: number; height: number };
  alt: string;
  className: string;
  eager?: boolean;
};

/** One drawing for wide screens and its own composition for phones. */
export function ArtPicture({ desktop, mobile, alt, className, eager }: PictureProps) {
  return (
    <picture className={className}>
      <source media="(max-width: 719px)" srcSet={mobile.src} width={mobile.width} height={mobile.height} />
      {/* Art-directed sources need a plain <img>; these files are already sized and compressed. */}
      <img src={desktop.src} width={desktop.width} height={desktop.height} alt={alt} loading={eager ? "eager" : "lazy"} />
    </picture>
  );
}

export function Stars() {
  return (
    <div className="sky-stars">
      <ArtPicture
        className="sky-stars-art"
        desktop={{ src: "/ballpoint/stars.webp", width: 1900, height: 900 }}
        mobile={{ src: "/ballpoint/stars-mobile.webp", width: 640, height: 900 }}
        alt=""
        eager
      />
      <Image className="day-sun" src="/ballpoint/sun.webp" width={220} height={220} alt="" unoptimized />
      <svg className="night-moon" viewBox="-1 -1 2 2" aria-hidden="true" focusable="false">
        <circle r="1" />
        <path d="M0 1A1 1 0 0 1 0-1Q-1.24 0 0 1Z" />
      </svg>
    </div>
  );
}

/** A small cloud blowing across the gap above a section, clear of the text. */
export function WindCloud({ cloud, seconds, start }: { cloud: keyof typeof SMALL_CLOUDS; seconds: number; start: number }) {
  const [width, height] = SMALL_CLOUDS[cloud];
  const style = { animationDuration: `${seconds}s`, animationDelay: `${-start * seconds}s` } as CSSProperties;
  return <Image className="wind-cloud" style={style} src={`/ballpoint/cloud-small-${cloud}.webp`} width={width} height={height} alt="" unoptimized />;
}

// [image, width in the drawing, height from the top %, seconds to cross, how far across it starts %]
const MEADOW_CLOUDS = [
  ["cloud-a", 270, 3, 130, 8],
  ["cloud-f", 150, 1.5, 100, 32],
  ["cloud-b", 300, 4, 165, 52],
  ["cloud-d", 195, 1, 115, 72],
  ["cloud-c", 245, 3.5, 145, 92],
] as const;

/** Clouds crossing the meadow's sky on the wind. */
export function MeadowClouds() {
  return (
    <div className="meadow-clouds" aria-hidden="true">
      {MEADOW_CLOUDS.map(([name, width, top, seconds, across]) => {
        const [naturalWidth, naturalHeight] = ART[name];
        const style = {
          "--cw": width,
          "--x": `${across}cqw`,
          top: `${top}%`,
          animationDuration: `${seconds}s`,
          // Start part-way through the crossing, so clouds are already spread across the sky
          animationDelay: `${(-(across + 35) / 145) * seconds}s`,
        } as CSSProperties;
        return <Image key={name} className="meadow-cloud" style={style} src={`/ballpoint/${name}.webp`} width={naturalWidth} height={naturalHeight} alt="" unoptimized />;
      })}
    </div>
  );
}

/** The thick layer of cloud the aeroplane flies through: the back layer goes behind the plane and the front layer in front. */
export function CloudDeck({ front }: { front?: boolean }) {
  return <div className={`cloud-deck${front ? " cloud-deck-front" : ""}`} data-drift={front ? "0.16" : "0.04"} aria-hidden="true" />;
}

/** A far-off plane crossing the gap above a section. */
export function DistantPlane({ seconds, start }: { seconds: number; start: number }) {
  const style = { animationDuration: `${seconds}s`, animationDelay: `${-start * seconds}s` } as CSSProperties;
  return <Image className="wind-cloud wind-plane" style={style} src="/ballpoint/plane.webp" width={860} height={130} alt="" unoptimized />;
}

/** A rocket climbing through the stars, with a flickering pen-drawn flame. */
export function Rocket() {
  return (
    <div className="sky-rocket" data-drift="-0.26" aria-hidden="true">
      <div className="sky-rocket-craft">
        <Image src="/ballpoint/rocket.webp" width={120} height={200} alt="" unoptimized />
        <svg className="rocket-flame" viewBox="0 0 60 90" focusable="false">
          <path d="M16 2C6 24 18 34 12 52 20 46 22 62 30 86 37 62 40 46 48 52 42 34 54 24 44 2" />
          <path className="rocket-flame-inner" d="M23 3C18 18 26 26 24 38 28 35 29 44 31 56 33 44 35 35 38 38 35 26 42 18 37 3" />
        </svg>
      </div>
    </div>
  );
}

/** An aeroplane crossing slowly, trailing vapour. */
export function Aeroplane() {
  return <Image className="sky-plane" data-drift="0.1" src="/ballpoint/plane.webp" width={860} height={130} alt="" unoptimized />;
}
