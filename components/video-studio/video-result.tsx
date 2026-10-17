import Image from "next/image";
import { useState } from "react";

import { reportCategories, type PublicVideoJob } from "@/lib/video/types";

export function VideoResult({ job, reportOpen, reported, onTryAgain, onNewStory, onOpenReport, onReport }: { job: PublicVideoJob; reportOpen: boolean; reported: boolean; onTryAgain: () => void; onNewStory: () => void; onOpenReport: () => void; onReport: (category: string) => void }) {
  const [mediaError, setMediaError] = useState(false);
  const live = job.providerName === "veo";
  return (
    <section className="rounded-md border border-sand bg-paper p-6 shadow-card sm:p-8" aria-labelledby="result-title">
      <p className="text-sm font-semibold uppercase tracking-[0.06em] text-teal">Completed</p>
      <h2 id="result-title" className="mt-2 font-mono text-2xl text-ink">{job.title}</h2>
      <div className="mt-6 overflow-hidden rounded-md border border-sand bg-forest">
        {live ? <video aria-label={`Generated video: ${job.title}`} src={job.resultAssetReference} controls playsInline preload="metadata" onError={() => setMediaError(true)} className={`mx-auto max-h-[70vh] w-full ${job.settings?.aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video"}`} /> : <Image src={job.resultAssetReference ?? "/video-studio/mock-story.svg"} alt="Demo animation: a paper story opens and colourful shapes become a simple landscape" width={960} height={540} unoptimized className="aspect-video w-full object-cover" />}
      </div>
      {mediaError && <p role="alert" className="mt-4 text-sm text-red-900">The video could not be loaded. Try the download link or check whether the temporary video has expired.</p>}
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div><dt className="text-xs font-semibold uppercase tracking-wider text-ink/75">Theme</dt><dd className="mt-1 text-forest">{job.selectedValue}</dd></div>
        <div><dt className="text-xs font-semibold uppercase tracking-wider text-ink/75">Style</dt><dd className="mt-1 text-forest">{job.style}</dd></div>
        <div><dt className="text-xs font-semibold uppercase tracking-wider text-ink/75">Status</dt><dd className="mt-1 text-forest">{live ? `${job.duration}s · ${job.settings?.resolution ?? "720p"}` : "Demo completed"}</dd></div>
      </dl>
      <p className="mt-6 rounded-md bg-sky/60 p-4 text-sm leading-6 text-ink/75">{live ? "AI-generated video: check the result before using it. Download it promptly; temporary videos expire after two days." : "Demo animation: no external provider created this placeholder."}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {live && job.resultAssetReference && <a href={`${job.resultAssetReference}?download=1`} download className="inline-flex min-h-11 items-center rounded bg-teal px-5 py-2 text-sm font-semibold text-white">Download MP4</a>}
        <button onClick={onTryAgain} className="min-h-11 rounded bg-forest px-5 py-2 text-sm font-semibold text-white">Try another version</button>
        <button onClick={onNewStory} className="min-h-11 rounded border border-forest/20 px-5 py-2 text-sm font-semibold text-forest">Start a new story</button>
        <button onClick={onOpenReport} className="min-h-11 rounded border border-coral/40 px-5 py-2 text-sm font-semibold text-red-900">Report a problem</button>
      </div>
      {reportOpen && (
        <div className="mt-6 rounded-md border border-coral/30 bg-coral/10 p-5" role="group" aria-labelledby="report-title">
          <h3 id="report-title" className="font-mono text-xl text-ink">What was wrong with the result?</h3>
          {reported ? <p className="mt-3" role="status">Thank you. Please also tell the adult supervising this activity.</p> : <div className="mt-4 flex flex-wrap gap-2">{reportCategories.map((category) => <button key={category} onClick={() => onReport(category)} className="min-h-11 rounded border border-sand bg-paper px-4 py-2 text-sm text-forest">{category}</button>)}</div>}
        </div>
      )}
    </section>
  );
}
