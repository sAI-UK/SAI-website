import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

describe("ballpoint site shell", () => {
  afterEach(() => {
    delete document.documentElement.dataset.mode;
    localStorage.clear();
  });

  it("writes the logo as S³AI with a real superscript", () => {
    const { container } = render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "S³AI home" })).toBeInTheDocument();
    const term = container.querySelector(".logo-term");
    expect(term?.textContent).toBe("S3AI");
    expect(term?.querySelector("sup")?.textContent).toBe("3");
  });

  it("switches between light and dark, and remembers the choice", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(document.documentElement.dataset.mode).toBe("dark");
    expect(localStorage.getItem("sai-mode")).toBe("dark");
    await userEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(document.documentElement.dataset.mode).toBeUndefined();
    expect(localStorage.getItem("sai-mode")).toBe("light");
  });

  it("puts the footer text directly on the fence", () => {
    const { container } = render(<SiteFooter />);
    const fence = container.querySelector(".fence-boards");
    expect(fence).toHaveTextContent("hello@sai-initiative.org");
    expect(fence).toHaveTextContent("Explore");
    expect(container.querySelector(".ink-card")).toBeNull();
  });

  it("keeps the live grass out of the page layout, so it cannot stretch the page", () => {
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toMatch(/\.wind-grass \{ position: absolute;/);
    expect(css).toMatch(/\.ground-zone \{ position: relative; \}/);
  });

  it("lands on a described meadow, with its own version for phones", () => {
    const { container } = render(<SiteFooter />);
    expect(screen.getByRole("img", { name: /cows grazing in rolling meadows/i })).toHaveAttribute("src", "/ballpoint/meadow.webp");
    expect(container.querySelector("source")).toHaveAttribute("srcset", "/ballpoint/meadow-mobile.webp");
  });
});
