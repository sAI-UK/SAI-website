# Visual style

The visual reference is the supplied LLM bias survey HTML. Only its presentation
informs this site; SAI's content, routes and studio behaviour are retained.

- Warm parchment canvas (`#F5EDDC`), lighter paper panels (`#FBF7EE`) and fine sand rules.
- Courier Prime headings, navigation and labels; Source Serif 4 reading text.
  Google Fonts supplies these fonts, with local Courier and Georgia fallbacks.
- Dark brown text, slate actions, olive labels and terracotta section markers.
- Small corner radii, flat cards, ruled section headings and compact editorial spacing.
- Existing responsive grids and mobile navigation remain in place.

Edit palette and font tokens in `tailwind.config.ts`. Shared editorial treatments,
focus styles and reduced-motion behaviour live in `app/globals.css`. Section
headings use `components/section-heading.tsx`.

The site retains its light theme. The reference's theme toggle and research-page
interactions are not part of this visual refresh.

## Playful homepage layer

`components/story-sketch.tsx` adds an original SVG storybook drawing with four
keyboard-accessible crayon colour buttons. These only change the illustration.
`components/scroll-doodles.tsx` adds a scroll progress stroke and one-time section
entrances. Content remains visible without JavaScript; reduced-motion preferences
disable entrance and illustration animations. No animation library is required.

Crayon highlights, pastel programme cards and the illustration styles are grouped
at the end of `app/globals.css`. Keep these decorations away from longer reading
text, form fields and safety messages.

`components/crayon-butterflies.tsx` supplies four small floating butterflies across
the site (two on mobile). Clicking or keyboard-activating one sends it quickly to
the opposite margin. A pause control and reduced-motion support stop the ongoing
wing and drift animations. The overlay passes clicks through everywhere except
its controls.
