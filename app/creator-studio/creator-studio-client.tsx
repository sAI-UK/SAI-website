"use client";
import { FilmStudio } from "@/components/creator-studio/film-studio";
import type { RuntimeMode } from "@/lib/video/types";

export function CreatorStudioClient({ mode }: { mode: RuntimeMode }) {
  return <div>
    <section className="border-b border-sand bg-grain px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl"><p className="text-sm font-semibold uppercase tracking-[0.06em] text-teal">SAI Creator Studio</p><h1 className="mt-4 font-mono text-2xl text-ink sm:text-[2.375rem]">A little story. A whole film.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-ink/75">Start with an idea or a character image. Shape four scenes, then bring them together in a 30-second film.</p></div></section>
    <FilmStudio mode={mode} />
  </div>;
}
