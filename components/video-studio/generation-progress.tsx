import type { PublicVideoJob } from "@/lib/video/types";

export function GenerationProgress({ job, onRetry }: { job: PublicVideoJob; onRetry: () => void }) {
  const progress = Math.max(0, Math.min(100, job.progress ?? 0));
  return (
    <section className="rounded-[1.75rem] border border-forest/10 bg-white p-6 shadow-card sm:p-8" aria-labelledby="generation-title">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Creation status</p>
      <h2 id="generation-title" className="mt-2 font-serif text-3xl text-forest">{job.status === "failed" ? "The preview was not created" : "Creating a short preview"}</h2>
      <div className="mt-6" aria-live="polite" aria-atomic="true">
        <p className="font-semibold capitalize text-forest">{job.status.replaceAll("_", " ")}</p>
        <p className="mt-2 leading-7 text-ink/72">{job.safeStatusMessage}</p>
      </div>
      {job.status !== "failed" && (
        <div className="mt-6">
          <div className="h-3 overflow-hidden rounded-full bg-sand" role="progressbar" aria-label="Video creation progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={job.progress === undefined ? undefined : progress}>
            <div className="h-full rounded-full bg-teal transition-[width] motion-reduce:transition-none" style={{ width: job.progress === undefined ? "35%" : `${progress}%` }} />
          </div>
          <p className="mt-2 text-sm text-ink/60">{job.progress !== undefined ? `${progress}% complete. ` : "Google does not provide a completion percentage. "}The status will update automatically for a limited time.</p>
        </div>
      )}
      {job.status === "failed" && <button onClick={onRetry} className="mt-6 min-h-11 rounded-full border border-forest/20 px-5 py-2 text-sm font-semibold text-forest hover:bg-mist">Return to your story plan</button>}
    </section>
  );
}
