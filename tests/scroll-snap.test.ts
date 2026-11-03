import { describe, expect, it } from "vitest";

import { findSnap } from "@/lib/ballpoint/scroll-snap";

const points = [0, 1000, 2000];

describe("findSnap", () => {
  it("settles on a section just ahead", () => {
    expect(findSnap(800, points, 300, true)).toBe(1000);
    expect(findSnap(1200, points, 300, false)).toBe(1000);
  });

  it("stays put in the middle of a long section", () => {
    expect(findSnap(1500, points, 300, true)).toBeNull();
    expect(findSnap(1500, points, 300, false)).toBeNull();
  });

  it("does not drag far backwards against the direction of travel", () => {
    expect(findSnap(1200, points, 300, true)).toBeNull();
    expect(findSnap(1050, points, 300, true)).toBe(1000);
  });

  it("does nothing when already there", () => {
    expect(findSnap(1000, points, 300, true)).toBeNull();
  });
});
