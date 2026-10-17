export function SafetyGuidance() {
  return (
    <aside className="rounded-md border border-gold/35 bg-amber-50 p-6" aria-labelledby="privacy-guidance-title">
      <h2 id="privacy-guidance-title" className="font-mono text-xl text-ink">Keep private things private</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-ink/75">
        <li>Do not enter your full name or another child&apos;s name.</li>
        <li>Do not enter an address, school name, phone number or social-media handle.</li>
        <li>Do not ask for a real person or celebrity.</li>
        <li>Do not describe private or distressing experiences in this tool.</li>
        <li>If your story concerns something serious, stop and ask a trusted adult for help.</li>
      </ul>
    </aside>
  );
}
