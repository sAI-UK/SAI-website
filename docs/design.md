# Visual style

The site has one look, ballpoint pen on a notebook page, in two modes: daytime paper and a night sky. The moon and
sun button in the header (`components/mode-toggle.tsx`) switches between them and remembers the choice in that browser.
Dark mode colours are under `:root[data-mode="dark"]` in `app/globals.css`. The same drawings are used in both modes:
`--art-filter` maps paper to moonlit navy and blue ink to pale chalk, with warm accents for the moon, windows and flame.

- Off-white paper with a faint squared grid behind every page (`body` in `app/globals.css`).
- Pen blue for actions and labels, deep blue for headings, and a red pen for errors and warnings.
- Fraunces headings, Inter reading text and Caveat handwritten notes, self-hosted through `next/font`.
- Palette tokens are at the top of `app/globals.css`; font names are in `tailwind.config.ts`.

## The logo

`components/logo.tsx` writes the logo as S³AI, like a term in an equation, circled in pen. The 3 takes up no width, so
the letters still read as SAI.

## The homepage descends from space to the ground

| Part of the page | What is in the sky |
| --- | --- |
| Hero | Stars, the Plough, a climbing rocket, and a sun by day or a moon by night |
| Below the hero | An aeroplane with a vapour trail, flying through a thick layer of cloud where the stars end |
| Upper sections | Thin wispy cloud |
| Middle sections | Small clouds, growing as you scroll |
| Lower sections | The largest clouds, and the first birds |
| Contact | Birds just above the ground |
| Footer | The Northumberland-style meadow, then grass up to a timber fence carrying the footer text down to the bottom of the page, on every page |

Sky pieces are placed per section in `app/page.tsx` with `SkyArt` (page margins on wide screens) and
`SkyGapCloud` (between sections below 1321px). Margin pieces never reach into the content column.

## The feeling of falling

Scrolling uses parallax, handled by `components/ballpoint/sky-drift.tsx`. Text never moves. Stars and high wisps lag
behind the page, near clouds overtake it and speed up as you descend, and the meadow grows as it arrives. On the
homepage, the meadow then holds in view briefly as you land (`.meadow-pin` in `globals.css`). Clouds stop at the end of
the sky, so none appear over the land.
`components/ballpoint/gravity-scroll.tsx` handles the feel of scrolling: wheel movement eases rather than jumps and gains
speed on the way down, the page settles onto a section when it stops close to one, pulls itself onto the meadow, and
takes more effort to leave it. Birds are live canvases (`bird-flock.tsx`), including over the meadow.
Strengths are named constants at the top of both files. All of this is off for reduced motion.

## How the drawings are made

- **Illustrations** are images in `public/ballpoint`, so visitors' browsers do not have to draw them. To change one,
  edit `scripts/ballpoint-art/` and run `node scripts/ballpoint-art/render.mjs` (needs Chrome or Edge).
  `pieces.js` lists every image, `sky.js` draws the upper sky and `scenes.js` draws clouds and the meadow.
- **Pen marks** (card edges, word marks, the logo loop) are stretchy SVG in `components/ballpoint/sketch.tsx`.
  They arrive with the page and stay sharp at any zoom.
- **Live pieces** are the drawing pad, birds and wind-blown grass, which share the pen in `lib/ballpoint/pen.ts`, and the
  CSS-animated stars, shooting stars, clouds, plane and chimney smoke. Grass parts around the pointer and clouds ease
  away from it. All of it holds still for people who prefer reduced motion.
