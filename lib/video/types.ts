export const storyValues = [
  "Honesty",
  "Kindness",
  "Fairness",
  "Courage",
  "Responsibility",
  "Empathy",
  "Identity",
  "Self-expression",
] as const;

export const visualStyles = [
  "Storybook illustration",
  "Paper cut-out",
  "Clay animation",
  "Watercolour",
  "Colourful 2D animation",
  "Simple cinematic animation",
] as const;

export const videoDurations = [4, 6, 8] as const;
export type VideoSettings = {
  model: "veo-3.1-fast-generate-preview" | "veo-3.1-generate-preview";
  resolution: "720p" | "1080p";
  aspectRatio: "16:9" | "9:16";
};
export const moods = ["Hopeful", "Playful", "Calm", "Curious", "Brave", "Magical"] as const;

export type StoryValue = (typeof storyValues)[number];
export type VisualStyle = (typeof visualStyles)[number];
export type VideoDuration = (typeof videoDurations)[number];

export type StructuredStory = {
  title: string;
  mainCharacter: string;
  setting: string;
  action: string;
  value: StoryValue;
  style: VisualStyle;
  mood: string;
  dialogue?: string;
  duration: VideoDuration;
};

export const jobStatuses = [
  "draft",
  "checking_content",
  "needs_changes",
  "awaiting_teacher_approval",
  "approved",
  "queued",
  "generating",
  "completed",
  "failed",
  "rejected",
] as const;

export type VideoJobStatus = (typeof jobStatuses)[number];
export type ApprovalState = "awaiting_teacher_review" | "approved" | "changes_requested" | "rejected";

export type SafetyCategory =
  | "personal_information"
  | "real_person"
  | "sensitive_disclosure"
  | "sexual_content"
  | "graphic_violence"
  | "self_harm"
  | "hate_or_harassment"
  | "drugs_or_weapons"
  | "bullying"
  | "policy_bypass"
  | "political_or_commercial_persuasion";

export type SafetyOutcome = {
  allowed: boolean;
  needsTeacherReview: boolean;
  childSafeMessage: string;
  flaggedCategories: SafetyCategory[];
  sanitisedPreview: StructuredStory;
};

export type SafeVideoRequest = {
  story: StructuredStory;
  providerPrompt: string;
  duration: VideoDuration;
  aspectRatio: "16:9" | "9:16";
  settings?: VideoSettings;
  resolutionTier: "standard";
  safetyLevel: "strict";
};

export type ProviderJob = { id: string; status: "queued" | "generating" };
export type ProviderJobStatus = {
  status: "queued" | "generating" | "completed" | "failed";
  progress?: number;
  assetReference?: string;
  errorCode?: string;
};

export type VideoJob = {
  id: string;
  sessionId: string;
  idempotencyKey: string;
  status: VideoJobStatus;
  structuredStory: StructuredStory;
  sanitisedPromptHash: string;
  selectedValue: StoryValue;
  duration: VideoDuration;
  style: VisualStyle;
  safetyOutcome: SafetyOutcome;
  approvalState: ApprovalState;
  providerName: string;
  providerJobId?: string;
  settings?: VideoSettings;
  resultAssetReference?: string;
  progress?: number;
  safeStatusMessage: string;
  operationalErrorCode?: string;
  createdAt: string;
  expiresAt: string;
  reportedAt?: string;
};

export type PublicVideoJob = Pick<
  VideoJob,
  | "id"
  | "status"
  | "approvalState"
  | "selectedValue"
  | "duration"
  | "style"
  | "progress"
  | "safeStatusMessage"
  | "resultAssetReference"
  | "createdAt"
  | "expiresAt"
> & { title: string; recoverable: boolean; settings?: VideoSettings; providerName?: string };

export const reportCategories = [
  "Scary or upsetting",
  "Inappropriate",
  "Does not match my story",
  "Shows a real person",
  "Contains private information",
  "Something else",
] as const;

export type RuntimeMode = "demo" | "teacher-guided" | "provider-development" | "live" | "unconfigured";
