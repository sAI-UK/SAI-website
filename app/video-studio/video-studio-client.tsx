"use client";
import { useEffect, useRef, useState } from "react";
import { GenerationProgress } from "@/components/video-studio/generation-progress";
import { StoryForm } from "@/components/video-studio/story-form";
import { VideoResult } from "@/components/video-studio/video-result";
import { estimatedVideoCost } from "@/lib/video/settings";
import type { PublicVideoJob, RuntimeMode, StructuredStory, VideoSettings } from "@/lib/video/types";
import { randomId } from "@/lib/random-id";
const emptyStory: StructuredStory = { title: "", mainCharacter: "", setting: "", action: "", value: "Kindness", style: "Storybook illustration", mood: "Hopeful", dialogue: "", duration: 8 };
const fallback: VideoSettings = { model: "veo-3.1-fast-generate-preview", resolution: "720p", aspectRatio: "16:9" };
export function VideoStudioClient({ mode, defaults = fallback }: { mode: RuntimeMode; defaults?: VideoSettings }) {
  const [story, setStory] = useState(emptyStory);
  const [settings, setSettings] = useState<VideoSettings>({ ...defaults, model: "veo-3.1-fast-generate-preview" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [job, setJob] = useState<PublicVideoJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [polling, setPolling] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const session = useRef("");
  const requestKey = useRef("");
  const submitting = useRef(false);
  const pollStarted = useRef(0);
  useEffect(() => {
    session.current = sessionStorage.getItem("sai-video-session") ?? `session_${randomId()}`;
    sessionStorage.setItem("sai-video-session", session.current);
    const saved = sessionStorage.getItem("sai-video-active");
    if (saved) { try { const parsed = JSON.parse(saved); setStory(parsed.story); setSettings({ ...parsed.settings, model: "veo-3.1-fast-generate-preview" }); setJob(parsed.job); requestKey.current = parsed.key; pollStarted.current = Date.now(); } catch { sessionStorage.removeItem("sai-video-active"); } }
  }, []);
  useEffect(() => {
    if (!job || !polling || !["queued", "generating"].includes(job.status)) return;
    if (Date.now() - pollStarted.current > 10 * 60_000) { setPolling(false); setMessage("Automatic checks have paused. The video may still be generating. Check its status before creating another paid version."); return; }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/video/jobs/${job.id}`, { headers: { "x-video-session-id": session.current }, cache: "no-store" });
        const data = await response.json();
        if (!active) return;
        if (!response.ok) { setMessage(data.error?.message ?? "Could not check the video."); if (response.status === 404) setPolling(false); else setJob({ ...job }); return; }
        setJob(data.job); setMessage("");
        sessionStorage.setItem("sai-video-active", JSON.stringify({ story, settings, job: data.job, key: requestKey.current }));
      } catch { if (active) { setMessage("Could not check the status. Retrying shortly."); setJob({ ...job }); } }
    }, mode === "demo" ? 1250 : 10000);
    return () => { active = false; clearTimeout(timer); };
  }, [job, polling, story, settings, mode]);
  async function generate() {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setErrors({}); setMessage("");
    if (!requestKey.current) requestKey.current = `request_${randomId()}`;
    sessionStorage.setItem("sai-video-active", JSON.stringify({ story, settings, job: null, key: requestKey.current }));
    try {
      const response = await fetch("/api/video/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.current, idempotencyKey: requestKey.current, story, settings }) });
      const data = await response.json();
      if (!response.ok) { setErrors(data.error?.details ?? {}); setMessage(data.error?.message ?? "Generation could not start."); return; }
      setJob(data.job); pollStarted.current = Date.now(); setPolling(true);
      sessionStorage.setItem("sai-video-active", JSON.stringify({ story, settings, job: data.job, key: requestKey.current }));
    } catch { setMessage("Submission could not be confirmed. Retry with the same story to recover the request without submitting it twice."); }
    finally { submitting.current = false; setBusy(false); }
  }
  function edit(clear = false) { setJob(null); setMessage(""); setErrors({}); setReportOpen(false); setReported(false); requestKey.current = ""; sessionStorage.removeItem("sai-video-active"); if (clear) setStory(emptyStory); }
  async function report(category: string) {
    if (!job) return;
    const response = await fetch("/api/video/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.current, jobId: job.id, category }) }).catch(() => null);
    if (response?.ok) setReported(true); else setMessage("The report could not be saved.");
  }
  const stage = job?.status === "completed" ? 2 : job ? 1 : 0;
  return <div>
    <div className="border-y border-teal/20 bg-sky/50 px-4 py-3 text-center text-sm text-forest" role="status">{mode === "demo" ? "Demo mode — no paid generation" : mode === "unconfigured" ? "Add your Gemini API key on the server to enable generation" : "Video generation uses Veo 3.1 Fast and your paid API balance"}</div>
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <nav aria-label="Video creation progress"><ol className="grid grid-cols-3 gap-2">{["Story", "Generate", "Watch & download"].map((label, index) => <li key={label} aria-current={index === stage ? "step" : undefined} className={`rounded border px-3 py-3 text-center text-sm font-semibold ${index === stage ? "border-forest bg-forest text-white" : "border-sand text-forest"}`}>{index + 1}. {label}</li>)}</ol></nav>
      {message && <p role="status" className="mt-6 rounded-md bg-amber-50 p-4 text-sm text-amber-950">{message}</p>}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div>{!job ? <section className="rounded-md border border-sand bg-paper p-6 shadow-card sm:p-8"><h2 className="mb-6 font-mono text-2xl text-ink">Plan your story</h2>
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-forest">Resolution<select aria-label="Resolution" className="mt-2 min-h-12 w-full rounded border p-3" disabled={busy} value={settings.resolution} onChange={e => { requestKey.current = ""; const resolution = e.target.value as VideoSettings["resolution"]; setSettings({ ...settings, resolution }); if (resolution === "1080p") setStory({ ...story, duration: 8 }); }}><option>720p</option><option>1080p</option></select></label>
            <label className="text-sm font-semibold text-forest">Format<select aria-label="Format" className="mt-2 min-h-12 w-full rounded border p-3" disabled={busy} value={settings.aspectRatio} onChange={e => { requestKey.current = ""; setSettings({ ...settings, aspectRatio: e.target.value as VideoSettings["aspectRatio"] }); }}><option value="16:9">Landscape · 16:9</option><option value="9:16">Portrait · 9:16</option></select></label>
          </div>
          <p className="mb-6 rounded bg-mist p-4 text-sm text-forest">{mode === "demo" ? "Demo: no charge." : `Estimated generation cost: $${estimatedVideoCost(settings, story.duration).toFixed(2)} USD before taxes. Each new version is another paid generation.`}</p>
          <StoryForm story={story} errors={errors} onChange={value => { requestKey.current = ""; setStory(value); }} onContinue={generate} busy={busy} resolution={settings.resolution} disabled={mode === "unconfigured"} />
        </section> : job.status === "completed" ? <VideoResult job={job} reportOpen={reportOpen} reported={reported} onTryAgain={() => edit()} onNewStory={() => edit(true)} onOpenReport={() => setReportOpen(true)} onReport={report} /> : <><GenerationProgress job={job} onRetry={() => edit()} />{!polling && <button className="mt-4 min-h-11 rounded bg-forest px-5 py-2 text-white" onClick={() => { pollStarted.current = Date.now(); setPolling(true); }}>Check status again</button>}</>}</div>
        <aside className="h-fit rounded-md border border-sand bg-paper p-6"><h2 className="font-mono text-xl text-ink">Make the moment count</h2><p className="mt-3 text-sm leading-6 text-ink/70">Choose one clear action for a 4–8 second clip. Keep dialogue short and describe what the character actually does.</p><p className="mt-4 text-sm leading-6 text-ink/70">1080p requires 8 seconds. Download completed videos promptly; Google keeps them for two days.</p><p className="mt-4 text-sm leading-6 text-ink/70">Use fictional characters and avoid personal information. Google’s content filters and regional restrictions apply.</p></aside>
      </div>
    </div>
  </div>;
}



