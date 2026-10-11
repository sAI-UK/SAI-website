import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreatorStudioClient } from "@/app/creator-studio/creator-studio-client";
import { ImageStudio } from "@/components/creator-studio/image-studio";
import { buildImagePrompt, generateImage, validateImageIdea, type ImageIdea } from "@/lib/image/generation";
import { defaultVideoSettings, validateVideoSettings } from "@/lib/video/settings";
import { POST } from "@/app/api/image/generate/route";
const idea: ImageIdea = { subject: "A fox with a teal scarf", setting: "A woodland", action: "Holding a lantern", style: "Watercolour", mood: "Calm", lighting: "Golden dawn", composition: "Eye-level view", text: "Be kind", aspectRatio: "16:9" };
const googleResponse = () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { data: "aW1hZ2U=", mimeType: "image/png" } }] } }] }));
beforeEach(() => vi.stubEnv("GEMINI_API_KEY", "test-secret"));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("Creator Studio", () => {
  it("offers the video-only film flow with image references", async () => {
    sessionStorage.clear(); localStorage.clear();
    const user = userEvent.setup(); render(<CreatorStudioClient mode="live" />);
    expect(screen.queryByRole("combobox", { name: "Model" })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Film title"), "Lantern story");
    await user.click(screen.getByRole("radio", { name: "Use a reference image" }));
    expect(screen.getByLabelText("Reference image")).toHaveAttribute("type", "file");
    expect(screen.getByLabelText("Film title")).toHaveValue("Lantern story");
    expect(screen.queryByRole("button", { name: "Generate image" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Plan my film" })).toBeEnabled();
  });
  it("defaults and submits video settings as Fast despite an old environment setting", () => {
    vi.stubEnv("VEO_MODEL", "veo-3.1-generate-preview");
    expect(defaultVideoSettings().model).toBe("veo-3.1-fast-generate-preview");
    expect(validateVideoSettings({ model: "veo-3.1-generate-preview", resolution: "720p", aspectRatio: "16:9" }, 8)?.model).toBe("veo-3.1-fast-generate-preview");
  });
  it("validates image fields and translates all composition choices", () => {
    expect(validateImageIdea({ ...idea, subject: "", aspectRatio: "bad" }).errors).toHaveProperty("subject");
    for (const value of Object.values(idea)) expect(buildImagePrompt(idea)).toContain(value);
    expect(buildImagePrompt({ ...idea, text: "" })).toContain("No visible text");
  });
  it("uses Nano Banana and the documented aspect ratio parameter", async () => {
    const fetcher = vi.fn().mockResolvedValue(googleResponse()); vi.stubGlobal("fetch", fetcher);
    expect(await generateImage(idea)).toEqual({ dataUrl: "data:image/png;base64,aW1hZ2U=", mimeType: "image/png" });
    expect(fetcher.mock.calls[0][0]).toContain("gemini-2.5-flash-image:generateContent");
    expect(JSON.parse(fetcher.mock.calls[0][1].body).generationConfig.responseFormat.image.aspectRatio).toBe("16:9");
  });
  it("disables the old standalone image generation endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue(googleResponse()); vi.stubGlobal("fetch", fetcher);
    const result = await POST();
    expect(result.status).toBe(410);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("handles a filtered image without inventing a result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } }))));
    await expect(generateImage(idea)).rejects.toThrow(/content filters/);
  });
  it("previews the image and offers a matching download", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ image: { dataUrl: "data:image/png;base64,aW1hZ2U=", mimeType: "image/png" } }))));
    render(<ImageStudio configured />);
    await user.type(screen.getByRole("textbox", { name: "Subject" }), "A paper fox");
    await user.click(screen.getByRole("button", { name: "Generate image" }));
    expect(await screen.findByRole("img", { name: "A paper fox" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download image" })).toHaveAttribute("download", "sai-creation.png");
  });
});
