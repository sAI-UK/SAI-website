import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilmStudio } from "@/components/creator-studio/film-studio";
import type { PublicFilm } from "@/lib/film/types";
const film: PublicFilm = { id: "a".repeat(32), brief: { title: "Fern's bridge", character: "An orange fox", story: "A fox helps a rabbit cross a stream", style: "Watercolour", aspectRatio: "16:9" }, scenes: ["The fox walks beside a stream", "The rabbit cannot cross the stream", "The fox finds a helpful branch", "The rabbit crosses the new bridge"].map(description => ({ description, status: "waiting", attempts: 0 })), narration: "A thoughtful fox helps a new friend find their way across the stream.", narrate: true, status: "draft", mode: "live", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString(), revision: 1, attempts: 0, hasImage: false };
const response = (value: PublicFilm) => new Response(JSON.stringify({ film: value }));
afterEach(() => { vi.unstubAllGlobals(); });
describe("four-scene film interface", () => {
  it("plans first, allows scene edits and only starts paid clips after Generate my film", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response(film)).mockResolvedValueOnce(response({ ...film, status: "generating" })); vi.stubGlobal("fetch", fetcher);
    const user = userEvent.setup(); render(<FilmStudio mode="live" />);
    await user.type(screen.getByLabelText("Film title"), "Fern's bridge");
    await user.type(screen.getByLabelText(/Main character/), "An orange fox");
    await user.type(screen.getByLabelText("What happens in your story?"), "A fox helps a rabbit cross a stream");
    await user.click(screen.getByRole("button", { name: "Plan my film" }));
    expect(await screen.findByRole("button", { name: "Generate my film" })).toBeEnabled();
    expect(fetcher).toHaveBeenCalledTimes(1);
    await user.clear(screen.getByLabelText("Scene 3 description"));
    await user.type(screen.getByLabelText("Scene 3 description"), "The fox carefully places a branch across the stream");
    await user.click(screen.getByRole("button", { name: "Generate my film" }));
    const request = JSON.parse(fetcher.mock.calls[1][1].body);
    expect(request.action).toBe("start"); expect(request.scenes[2]).toContain("carefully places"); expect(request.narration).toBe(film.narration);
    expect(await screen.findByRole("status")).toHaveTextContent("Generating scene 1 of 4");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
  it("restores a completed film and regenerates only the selected scene", async () => {
    sessionStorage.setItem("sai-active-film", film.id);
    const complete: PublicFilm = { ...film, status: "completed", media: `/api/films/${film.id}/media?v=1`, scenes: film.scenes.map((scene, i) => ({ ...scene, status: "ready", media: `/api/films/${film.id}/media?scene=${i}` })) };
    const fetcher = vi.fn().mockResolvedValueOnce(response(complete)).mockResolvedValueOnce(response({ ...complete, status: "generating", media: undefined })); vi.stubGlobal("fetch", fetcher);
    const user = userEvent.setup(); render(<FilmStudio mode="live" />);
    expect(await screen.findByRole("link", { name: "Download MP4" })).toHaveAttribute("href", `${complete.media}&download=1`);
    await user.click(screen.getByRole("button", { name: "Regenerate scene 2 · $0.80" }));
    const request = JSON.parse(fetcher.mock.calls[1][1].body);
    expect(request).toMatchObject({ action: "retry-scene", index: 1, description: film.scenes[1].description });
  });
  it("rejects oversized reference uploads before planning", async () => {
    const user = userEvent.setup(); render(<FilmStudio mode="live" />);
    await user.click(screen.getByRole("radio", { name: "Use a reference image" }));
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "too-large.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Reference image"), file);
    expect(screen.getByRole("alert")).toHaveTextContent("up to 5 MB");
  });
  it("requires acknowledgement before retrying an unconfirmed paid request", async () => {
    sessionStorage.setItem("sai-active-film", film.id);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ ...film, status: "failed", scenes: film.scenes.map((scene, i) => i === 0 ? { ...scene, status: "uncertain", error: "Check Google usage" } : scene) })));
    const user = userEvent.setup(); render(<FilmStudio mode="live" />);
    const retry = await screen.findByRole("button", { name: "Retry scene 1 · $0.80" });
    expect(retry).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /I have checked Google usage/ }));
    await waitFor(() => expect(retry).toBeEnabled());
  });
});
