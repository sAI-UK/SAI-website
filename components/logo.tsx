/** The S³AI logo: written like a term in an equation and circled in pen. */
export function Logo({ size = "default" }: { size?: "default" | "large" }) {
  return (
    <span className={`logo logo-${size}`}>
      <svg className="logo-loop" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M6 66C0 30 28 5 54 6 84 7 99 30 96 54 93 82 66 96 42 94 16 92 1 72 5 44 7 30 15 19 27 13" />
      </svg>
      <span className="logo-term">
        S<sup>3</sup>AI
      </span>
    </span>
  );
}
