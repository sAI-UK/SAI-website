import type { PublicVideoJob } from "@/lib/video/types";
import { Spinner } from "@/components/creator-studio/spinner";

export function GenerationProgress({ job, onRetry }: { job: PublicVideoJob; onRetry: () => void }) {
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
          <Spinner label="Creating your video" />
          <p className="mt-2 text-sm text-ink/60">The status will update automatically for a limited time.</p>
        </div>
      )}
      {job.status === "failed" && <button onClick={onRetry} className="mt-6 min-h-11 rounded-full border border-forest/20 px-5 py-2 text-sm font-semibold text-forest hover:bg-mist">Return to your story plan</button>}
    </section>
  );
}
