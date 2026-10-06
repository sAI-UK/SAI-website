import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GenerationProgress } from "@/components/video-studio/generation-progress";
import { ResponsibleUseChecklist } from "@/components/video-studio/responsible-use-checklist";
import { StoryForm } from "@/components/video-studio/story-form";
import { TeacherApprovalPanel } from "@/components/video-studio/teacher-approval-panel";
import { VideoResult } from "@/components/video-studio/video-result";
import { VideoStudioClient } from "@/app/video-studio/video-studio-client";
import type { PublicVideoJob, StructuredStory } from "@/lib/video/types";

const story: StructuredStory = {
  title: "",
  mainCharacter: "",
  setting: "",
  action: "",
  value: "Kindness",
  style: "Storybook illustration",
  mood: "Hopeful",
  duration: 8,
};

const job: PublicVideoJob = {
  id: "job-id",
  status: "awaiting_teacher_approval",
  approvalState: "awaiting_teacher_review",
  selectedValue: "Kindness",
  duration: 8,
  style: "Storybook illustration",
  safeStatusMessage: "Waiting for review",
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  title: "Lantern garden",
  recoverable: false,
};

function StoryHarness({ onContinue }: { onContinue: () => void }) {
  const [value, setValue] = useState(story);
  return <StoryForm story={value} errors={{}} onChange={setValue} onContinue={onContinue} busy={false} />;
}

function AgreementHarness({ onSubmit }: { onSubmit: () => void }) {
  const [checked, setChecked] = useState(false);
  return <ResponsibleUseChecklist checked={checked} onChange={setChecked} onSubmit={onSubmit} busy={false} />;
}

describe("Video Studio interface", () => {
  it("offers direct generation without safety or teacher gates", () => {
    render(<VideoStudioClient mode="live" />);
    expect(screen.getByRole("button", { name: "Generate video" })).toBeEnabled();
    expect(screen.queryByText("Safety check")).not.toBeInTheDocument();
    expect(screen.queryByText("Teacher review")).not.toBeInTheDocument();
  });

  it("requires eight seconds when 1080p is selected", async () => {
    const user = userEvent.setup();
    render(<VideoStudioClient mode="live" />);
    await user.click(screen.getByRole("radio", { name: "4 seconds" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Resolution" }), "1080p");
    expect(screen.getByRole("radio", { name: "8 seconds" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "4 seconds" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "6 seconds" })).toBeDisabled();
  });

  it("renders a live video player and an MP4 download", () => {
    const { container } = render(<VideoResult job={{ ...job, status: "completed", providerName: "veo", resultAssetReference: "/api/video/jobs/job-id/media" }} reportOpen={false} reported={false} onTryAgain={vi.fn()} onNewStory={vi.fn()} onOpenReport={vi.fn()} onReport={vi.fn()} />);
    expect(container.querySelector("video")).toHaveAttribute("controls");
    expect(screen.getByRole("link", { name: "Download MP4" })).toHaveAttribute("href", "/api/video/jobs/job-id/media?download=1");
  });
  it("supports keyboard entry and submission through labelled native controls", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<StoryHarness onContinue={onContinue} />);
    await user.type(screen.getByLabelText("Story title"), "The bright bridge");
    await user.type(screen.getByLabelText(/Main character/), "a fictional owl");
    await user.type(screen.getByLabelText("Setting"), "a forest library");
    await user.type(screen.getByLabelText(/What happens/), "The owl returns a book and helps a friend.");
    await user.tab();
    await user.click(screen.getByRole("button", { name: "Generate video" }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("links validation errors to their fields", () => {
    render(<StoryForm story={story} errors={{ title: "Give your story a short title." }} onChange={vi.fn()} onContinue={vi.fn()} busy={false} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Give your story a short title.");
    expect(screen.getByRole("link", { name: "Give your story a short title." })).toHaveAttribute("href", "#title");
    expect(screen.getByLabelText("Story title")).toHaveAttribute("aria-invalid", "true");
  });

  it("keeps review submission disabled until the agreement is checked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AgreementHarness onSubmit={onSubmit} />);
    const button = screen.getByRole("button", { name: "Ask your teacher to review" });
    expect(button).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    expect(button).toBeEnabled();
  });

  it("labels simulated teacher approval honestly", () => {
    render(<TeacherApprovalPanel job={job} mode="demo" busy={false} onDecision={vi.fn()} />);
    expect(screen.getByText(/not real teacher approval/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simulate teacher approval" })).toBeEnabled();
  });

  it("announces bounded generation progress", () => {
    render(<GenerationProgress job={{ ...job, status: "generating", progress: 45 }} onRetry={vi.fn()} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "45");
    expect(screen.getByText(/status will update automatically for a limited time/i)).toBeInTheDocument();
  });

  it("offers a clear recovery action after generation failure", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<GenerationProgress job={{ ...job, status: "failed", safeStatusMessage: "The service is unavailable." }} onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Return to your story plan" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("offers short reporting categories without free text", async () => {
    const user = userEvent.setup();
    const onReport = vi.fn();
    render(<VideoResult job={{ ...job, status: "completed", resultAssetReference: "/video-studio/mock-story.svg" }} reportOpen={true} reported={false} onTryAgain={vi.fn()} onNewStory={vi.fn()} onOpenReport={vi.fn()} onReport={onReport} />);
    await user.click(screen.getByRole("button", { name: "Shows a real person" }));
    expect(onReport).toHaveBeenCalledWith("Shows a real person");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("keeps the progress steps usable at mobile and wider breakpoints", () => {
    render(<VideoStudioClient mode="demo" />);
    const progress = screen.getByRole("navigation", { name: "Video creation progress" });
    expect(progress.querySelector("ol")).toHaveClass("grid-cols-3");
    expect(screen.getByText(/Demo mode .+ no paid generation/i)).toBeInTheDocument();
  });
});


