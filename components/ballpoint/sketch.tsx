import type { ElementType, ReactNode } from "react";

// Pen marks drawn as stretchy SVG. They arrive with the page and stay sharp at any zoom,
// because the line thickness is kept constant however far the shape stretches.

const BOXES = [
  "M-1.2 .6C28-.5 70 1 101.4.1M100-2.4C100.6 30 99.4 70 100.2 102.6M101.6 99.4C70 100.6 28 99-1.4 100M.2 102.4C-.5 70 .8 30 0-2.2",
  "M-1.5.2C30 1 72-.6 101 .7M99.8-1.8C99.2 34 100.7 66 99.9 102M101.4 100.3C66 99.2 34 100.8-1 99.5M-.2 101.9C.7 66-.6 34 .3-2",
  "M-.9.9C24 0 66 1.1 101.6-.2M100.3-2.6C101 28 99.6 72 100.4 101.8M100.9 99.1C72 100.4 30 99.3-1.6 100.3M.4 102.8C-.3 72 .9 28-.1-1.7",
];

function Stretchy({ d, viewBox = "0 0 100 100", className = "sketch-box" }: { d: string; viewBox?: string; className?: string }) {
  return (
    <svg className={className} viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

export function SketchBox({ variant = 0 }: { variant?: number }) {
  return <Stretchy d={BOXES[variant % BOXES.length]} />;
}

type InkCardProps = {
  as?: ElementType;
  tape?: boolean;
  tilt?: boolean;
  variant?: number;
  className?: string;
  children: ReactNode;
};

/** A paper card with a hand-ruled edge and a hatched shadow; add `tape` to stick it to the notebook page. */
export function InkCard({ as: Tag = "div", tape, tilt, variant = 0, className = "", children }: InkCardProps) {
  const classes = ["ink-card", tape && "ink-card-tape", tilt && "ink-card-tilt", className].filter(Boolean).join(" ");
  return (
    <Tag className={classes}>
      <SketchBox variant={variant} />
      {children}
    </Tag>
  );
}

const CIRCLE = "M4 58C2 24 30 4 54 5 82 6 98 26 97 50 96 78 70 96 44 95 18 94 2 74 6 42 8 28 16 18 26 13";
const UNDERLINE = "M0 3C30 1 70 5 100 2M12 8C40 6 70 9 96 7";

/** A word marked up by hand: circled, underlined or hatched. */
export function WordMark({ kind, children }: { kind: "circle" | "underline" | "hatch"; children: ReactNode }) {
  return (
    <span className={`word-mark word-mark-${kind}`}>
      {children}
      {kind === "circle" && <Stretchy d={CIRCLE} className="word-mark-line" />}
      {kind === "underline" && <Stretchy d={UNDERLINE} viewBox="0 0 100 10" className="word-mark-line" />}
    </span>
  );
}
