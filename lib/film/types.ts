export const sceneNames = ["Introduction", "Problem", "Action", "Outcome"] as const;
export const sceneLengths = [7, 8, 8, 7] as const;
export type FilmBrief = { title: string; character: string; story: string; style: string; aspectRatio: "16:9" | "9:16"; image?: string };
export type Scene = { description: string; status: "waiting" | "submitting" | "generating" | "ready" | "failed" | "uncertain"; operation?: string; uri?: string; file?: string; error?: string; attempts: number };
export type Film = { id: string; session: string; brief: FilmBrief; scenes: Scene[]; narration: string; narrate: boolean; status: "draft" | "generating" | "narrating" | "assembling" | "completed" | "failed"; mode: "demo" | "live"; createdAt: string; expiresAt: string; revision: number; actions: string[]; audio?: string; audioRequested?: boolean; output?: string; error?: string; attempts: number };
export type PublicFilm = Omit<Film, "session" | "actions" | "audio" | "output" | "scenes" | "brief"> & { brief: Omit<FilmBrief, "image">; hasImage: boolean; scenes: Array<Omit<Scene, "operation" | "uri" | "file"> & { media?: string }>; media?: string };
export const clipCost = 0.8;
