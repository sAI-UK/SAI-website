const statements = [
  "This is my own story idea.",
  "I have not included private information.",
  "I have not used a real person without permission.",
  "My story is safe and respectful.",
  "I understand that AI-generated results can contain mistakes.",
];

export function ResponsibleUseChecklist({ checked, onChange, onSubmit, busy }: { checked: boolean; onChange: (value: boolean) => void; onSubmit: () => void; busy: boolean }) {
  return (
    <section className="rounded-[1.75rem] border border-forest/10 bg-sky/55 p-6 sm:p-8" aria-labelledby="agreement-title">
      <h2 id="agreement-title" className="font-serif text-3xl text-forest">Responsible creation agreement</h2>
      <p className="mt-3 text-sm leading-6 text-ink/70">This is a learning check, not a legal consent form. Read each statement before ticking the box.</p>
      <ul className="mt-5 space-y-2 text-sm leading-6 text-ink/80">
        {statements.map((statement) => <li key={statement} className="flex gap-3"><span aria-hidden="true" className="text-teal">✓</span>{statement}</li>)}
      </ul>
      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-4 font-semibold text-forest focus-within:ring-4 focus-within:ring-teal/20">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-5 accent-teal" />
        <span>I have read these statements and they are true for my story.</span>
      </label>
      <button onClick={onSubmit} disabled={!checked || busy} className="mt-5 min-h-12 rounded-full bg-forest px-7 py-3 font-semibold text-white hover:bg-forest/90 focus:outline-none focus:ring-4 focus:ring-teal/25 disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? "Preparing review…" : "Ask your teacher to review"}
      </button>
    </section>
  );
}
