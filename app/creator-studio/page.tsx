import type { Metadata } from "next";
import { getRuntimeMode } from "@/lib/video/provider";
import { CreatorStudioClient } from "./creator-studio-client";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Creator Studio", description: "Turn an idea into a four-scene, 30-second film in SAI Creator Studio." };
export default function CreatorStudioPage() {
  return <CreatorStudioClient mode={getRuntimeMode()} />;
}
