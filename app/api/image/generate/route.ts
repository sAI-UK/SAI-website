import { apiError } from "@/lib/video/http";

export const runtime = "nodejs";

export async function POST() {
  return apiError("Standalone image generation has been removed. Use a reference image in Creator Studio to create a film.", 410, "FEATURE_REMOVED");
}
