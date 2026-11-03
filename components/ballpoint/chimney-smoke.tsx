/** Smoke rising from the farmhouse chimney in the footer. Pure CSS, and it holds still for reduced motion. */
export function ChimneySmoke() {
  return (
    <svg className="chimney-smoke" viewBox="0 0 60 90" aria-hidden="true" focusable="false">
      <path d="M12 88C8 78 17 72 13 62 9 52 20 46 16 36" />
      <path d="M14 86C19 76 11 68 17 58 23 48 15 40 23 30" />
      <path d="M11 84C15 72 24 68 21 56 18 46 30 40 29 26" />
      <path d="M13 87C10 74 20 66 25 54 29 44 26 36 36 24" />
    </svg>
  );
}

/** Lit farmhouse windows, shown at night. */
export function FarmLights() {
  return <div className="farm-lights" aria-hidden="true" />;
}
