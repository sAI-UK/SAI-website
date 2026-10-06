import type { Metadata } from "next";
import { getRuntimeMode } from "@/lib/video/provider";
import { CreatorStudioClient } from "./creator-studio-client";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Creator Studio", description: "Create images with Nano Banana and short videos with Veo in SAI Creator Studio." };
export default function CreatorStudioPage() {
  return <CreatorStudioClient mode={getRuntimeMode()} imageConfigured={Boolean(process.env.GEMINI_API_KEY?.trim())} />;
}
