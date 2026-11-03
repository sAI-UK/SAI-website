import type { Metadata } from "next";
import { CanvasStudio } from "@/components/canvas/canvas-studio";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Canvas", description: "Draw a character, write a story and watch your drawing come to life in SAI Canvas." };

export default function CanvasPage() {
  return <CanvasStudio />;
}
