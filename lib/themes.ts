// The site themes visitors can choose from the header.
// Colours for each theme live in app/globals.css under :root[data-theme="..."].
// Floating shapes for each theme live in components/theme-floaters.tsx.

export const themes = [
  { id: "crayon", label: "Crayon", description: "Our classic paper and butterflies", swatch: ["#43607F", "#E8A0A5", "#F3D781"] },
  { id: "web", label: "Web Hero", description: "Crimson, navy and friendly spiders", swatch: ["#C0202E", "#1E409B", "#FFFFFF"] },
  { id: "ice", label: "Ice Palace", description: "Frosty blues and falling snowflakes", swatch: ["#1F5E8C", "#A5D4F2", "#C9B8E8"] },
  { id: "island", label: "Island Adventure", description: "Ocean blues and tropical flowers", swatch: ["#2652A8", "#F07AAE", "#0D786E"] },
  { id: "rainbow", label: "Rainbow", description: "Every colour, hearts and stars", swatch: ["#E2434B", "#F2C230", "#3B8FD9"] },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export const defaultTheme: ThemeId = "crayon";

export const themeStorageKey = "sai-theme";
