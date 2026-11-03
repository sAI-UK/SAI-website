// Explains the movie helpers (lib/canvas/movie-runtime.js) to the LLM.
// Keep this in sync with the runtime when you add or change a helper.
export const movieApi = `
SAI MOVIE API
The stage is 1280 x 720. Positions use 0–1 fractions: x 0 = left, 1 = right; y 0 = top, 1 = bottom.
Sizes are a fraction of the stage height (0.3 = 30% of the height).
Times inside a scene are seconds from the start of that scene.
Most actions take an options object: { at: start time, duration: seconds, ease: "gentle" | "quick" | "bouncy" | "linear" }.

AVAILABLE NAMES (nothing else exists):
movie, hero, props, effects, camera, actor, sound, story, drawing, ease, W, H, Math and plain JavaScript.

STYLE — call movie.style(...) FIRST, before any scene. Match the animation style the child asked for.
movie.style(look, overrides)
  look: "riso" (risograph screen print: vivid pink, yellow and blue inks, halftone dots, grain, iris transitions)
      | "paper" (paper cut-out storybook) | "watercolour" (soft painted washes) | "storybook" (inked picture book)
      | "neon" (glowing outlines on dark vivid skies) | "chalk" (chalk on a blackboard) | "comic" (bold outlines, halftone, comic captions)
      | "pixel" (retro pixel game, chunky pixels, 12 fps) | "ink" (old sepia ink book, wobbly lines) | "stopmotion" (cut-outs at 10 fps)
      | "dream" (soft glowing pastel dream)
  overrides (all optional, mix freely to invent new looks):
    outline: colour or false   outlineWidth: 0.5–10   glow: 0–40 (outline glow, neon-like)
    treatment: "cutout" | "outline" | "soft" | "riso" | "plain"   (how characters and props are rendered)
    texture: "paper" | "watercolour" | "chalk" | "halftone" | "film" | "riso" | "none"   grain: 0–1   vignette: 0–1
    transition: "fade" | "iris" (a circular lens wipe) | "cut"   — the default scene transition
    bloom: 0–3 (how strongly lights glow)   darkness: 0–1.5 (how dark night scenes get)
    fps: 0 (smooth) or 4–30 (stepped, stop-motion feel)   boil: 0–4 (hand-drawn line wobble)   pixel: 0 or 2–10 (pixel size)
    halo: true (soft glow around everything)   caption: "paper" | "comic" | "neon" | "chalk" | "pixel" | "minimal" | "ink" | "riso"
    font: "serif" | "hand" | "round" | "mono" | "comic"
    filter: { saturate, contrast, brightness, sepia, grayscale, hueRotate (degrees), blur (px) }
    skies: { night: { top: "#hex", bottom: "#hex" }, day: {...}, ... } to recolour named skies
  Example: movie.style("watercolour", { bloom: 1.8, filter: { saturate: 1.1 } })
  Example: movie.style("neon", { outline: "#ff4fd8", glow: 22 })

LIGHT: night-like skies darken the whole picture and stars appear by themselves. Lit things glow in the dark:
sun, moon, star, firefly, lantern, props.glow, house windows, lightning, notes, sparkles, fireflies, and anything using .glow() or .lightUp().
DEPTH: layer "back" is far away (sky things: sun, moon, clouds, distant birds) and sits behind the child's background drawing.
The default middle layer lines up exactly with the child's drawing: put things that stand on or touch the drawing there.
"front" is closest to the camera. The camera also drifts gently by itself.

movie.title(text, { sky })            Optional 3.5s title card. Call it after movie.style.
movie.scene({ duration, sky, skyTo, colors, darkness, caption, backdrop, ground, transition }, () => { ...actions... })
  duration: 2–15 seconds (default 6)
  sky / skyTo: "day" | "dawn" | "sunset" | "night" | "storm" | "space" | "underwater". skyTo blends the sky across the scene.
  colors: { top: "#hex", bottom: "#hex" } paints any sky you like. darkness: 0–1 overrides how dark the scene is.
  caption: a sentence shown at the bottom.
  backdrop: "drawing" (default, shows the child's background drawing) | "plain" (sky only)
  ground: "grass" | "sand" | "snow" | "water" | "none" (default: grass if there is no background drawing)
  transition: "fade" | "iris" | "cut" (default: the style's transition)
movie.draw((p, t, k) => { ... }, { at, duration, layer: "back" | "middle" | "front", glow })
  DRAW ANYTHING the story needs with p5 (2D) every frame: waves, beams of light, ribbons, rainbows, auroras, magic trails, weather.
  p is a p5 1.11 instance (classic p5 API); p.drawingContext is the canvas 2D context. t = seconds since start, k = progress 0–1.
  Use stage pixel coordinates (W, H). glow: true draws it as light (additive) after the night darkening, so it shines.
  Keep each frame light: loops under 200 steps.
movie.end(text)                       Change the end card text (default "The End"). movie.end(false) removes it.

hero — the child's own drawing. It is the star. It keeps its position between scenes. hero.home = { x, y, size } where the child drew it.
props.sun | moon | star | cloud | tree | flower | heart | house | buddy | firefly | rainbow | balloon | whale | fish | bird | boat | lantern | butterfly | glow
  ({ x, y, size, color, layer, keep, hidden, face, follow, dx, dy })
  Built-in props drawn in the movie's style. Only visible in the scene where they are created, unless keep: true.
  face: true gives sun, moon, star or cloud a cute face. buddy and firefly always have faces and blink.
  follow: another hero/prop to stick to, offset by dx, dy (e.g. a glow on the hero's lantern: props.glow({ follow: hero, dx: 0.04, dy: -0.02 })).
  glow is an invisible light, e.g. props.glow({ x, y, size: 0.12, color: "#ffcf70", keep: true }) on a window in the child's drawing.
actor((p, size, t, color) => { ...draw centred at 0,0 with p5... }, { x, y, size, layer, keep, lit })
  Invent your own character or prop (a dragon, a rocket, a crown...). size is its height in pixels. It gets the movie's style automatically.

Every hero, prop and actor has these chainable actions (call them inside a scene):
  .place(x, y, { at, size })          jump instantly
  .moveTo(x, y, { at, duration, ease }) travel (default: until the scene ends)
  .moveBy(dx, dy, { at, duration, ease })
  .resize(size, { at, duration })    .rotateTo(degrees, { at, duration })    .flip({ at }) turn to face the other way
  .fadeIn({ at, duration }) .fadeOut({ at, duration }) .show({ at }) .hide({ at })
  .hop({ at, duration, height, times }) .shake({ at, duration, strength }) .spin({ at, duration, turns })
  .wiggle({ at, duration, angle }) .float({ at, duration, height }) .swim({ at, duration, height }) .pulse({ at, duration, amount })
  .glow({ at, duration, color })     .lightUp({ at, duration, color }) warms to a glowing colour and shines until the scene ends
  .say(text, { at, duration })         speech bubble
  Units: heights and strengths are fractions of the stage, NOT pixels: hop height 0.03–0.15, float/swim height 0.01–0.04,
    shake strength 0.005–0.03, wiggle angle 5–20 degrees, pulse amount 0.05–0.3, spin turns 1–3. Leave them out for good defaults.

effects.rain | snow | stars | sparkles | hearts | confetti | bubbles | leaves | fireflies | lightning | notes ({ at, duration, amount, color, around })
  amount: number of particles (lightning: number of flashes). around: a hero/prop to centre sparkles or notes on (notes = music notes for singing).
camera.focus(target, { zoom, at, duration })  push in on a hero/prop (zoom default 1.6)
camera.zoom(scale, { x, y, at, duration }) camera.pan(x, y, { at, duration }) camera.shake({ at, duration, strength }) camera.reset({ at, duration })
  The camera resets at the start of every scene. Zoom 1.1–2 works best.
sound(name, { at })  "chime" | "sparkle" | "pop" | "boing" | "whoosh" | "twinkle" | "magic" | "blip" | "rumble" | "hop" | "thunder" | "splash" | "sing"
  Gentle music plays by itself and follows the sky. Many actions already make sounds (hop, spin, say, lightUp, sparkles, lightning, notes).

story.text (the child's full story), story.lines (its sentences), story.line(i, fallback)
drawing.hasBackground, drawing.hasHero (false means hero is a friendly buddy instead of a drawing)
ease(name, k) returns an eased 0–1 value. Colours are CSS strings like "#ff70a6".
`;
