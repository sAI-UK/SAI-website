import type { PublicVideoJob, RuntimeMode } from "@/lib/video/types";

export function TeacherApprovalPanel({ job, mode, busy, onDecision }: { job: PublicVideoJob; mode: RuntimeMode; busy: boolean; onDecision: (decision: "approved" | "changes_requested" | "rejected") => void }) {
  return (
    <section className="rounded-md border-2 border-dashed border-teal/35 bg-paper p-6 sm:p-8" aria-labelledby="teacher-review-title">
      <p className="text-sm font-semibold uppercase tracking-[0.06em] text-teal">Awaiting teacher review</p>
      <h2 id="teacher-review-title" className="mt-2 font-mono text-2xl text-ink">Ask the supervising adult to review</h2>
      <p className="mt-4 max-w-2xl leading-7 text-ink/80">The story has passed the automated first check. That check can miss things, so an adult must review the story plan before a preview is created.</p>
      {mode === "teacher-guided" ? (
        <div className="mt-6 rounded-md bg-amber-50 p-5 text-sm leading-6 text-ink/75">Teacher authentication is not configured in this prototype. Generation is paused.</div>
      ) : (
        <div className="mt-6 rounded-md border border-coral/30 bg-coral/10 p-5">
          <p className="font-semibold text-forest">Simulation only — this is not real teacher approval</p>
          <p className="mt-2 text-sm leading-6 text-ink/70">Use these controls to test the prototype workflow. A real deployment must replace them with authenticated staff roles.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button disabled={busy} onClick={() => onDecision("approved")} className="min-h-11 rounded bg-forest px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">Simulate teacher approval</button>
            <button disabled={busy} onClick={() => onDecision("changes_requested")} className="min-h-11 rounded border border-forest/20 px-5 py-2 text-sm font-semibold text-forest disabled:opacity-50">Request changes</button>
            <button disabled={busy} onClick={() => onDecision("rejected")} className="min-h-11 rounded border border-coral/50 px-5 py-2 text-sm font-semibold text-red-900 disabled:opacity-50">Reject this version</button>
          </div>
        </div>
      )}
      <p className="sr-only" aria-live="polite">{job.safeStatusMessage}</p>
    </section>
  );
}
