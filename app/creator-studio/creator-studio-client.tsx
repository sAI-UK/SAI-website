"use client";
import { useState } from "react";
import { VideoStudioClient } from "@/app/video-studio/video-studio-client";
import { ImageStudio } from "@/components/creator-studio/image-studio";
import type { RuntimeMode } from "@/lib/video/types";

export function CreatorStudioClient({ mode, imageConfigured }: { mode: RuntimeMode; imageConfigured: boolean }) {
  const [type, setType] = useState<"video" | "image">("video");
  return <div>
    <section className="border-b border-forest/10 bg-grain px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal">SAI Creator Studio</p><h1 className="mt-5 font-serif text-5xl text-forest sm:text-6xl">Bring your ideas to life</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-ink/72">Your ideas lead. Create an expressive image or turn a meaningful moment into a short animated video.</p></div></section>
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8"><fieldset><legend className="mb-3 text-sm font-semibold text-forest">What would you like to create?</legend><div className="flex gap-3">{(["image", "video"] as const).map(value => <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-full border px-6 py-3 font-semibold focus-within:ring-4 focus-within:ring-teal/20 ${type === value ? "border-forest bg-forest text-white" : "border-forest/20 bg-white text-forest"}`}><input type="radio" className="sr-only" name="creation-type" checked={type === value} onChange={() => setType(value)} />{value === "image" ? "Image" : "Video"}</label>)}</div></fieldset></div>
    <div hidden={type !== "video"}><VideoStudioClient mode={mode} /></div>
    <div hidden={type !== "image"} className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><ImageStudio configured={imageConfigured} /></div>
  </div>;
}
