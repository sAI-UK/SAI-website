// Movie templates for SAI Canvas.
// Each template is a short movie script written with the helpers in lib/canvas/movie-api.ts.
// The LLM edits a template to fit the child's story; if that fails, the template plays as it is,
// using the child's own sentences as captions (story.line).
// To add a template, copy one below, give it a new id, and add a label and description.

export type MovieTemplate = { id: string; label: string; description: string; code: string };

export const movieTemplates: MovieTemplate[] = [
  {
    id: "journey",
    label: "A journey",
    description: "The hero sets off and travels somewhere new.",
    code: `movie.title("A Big Adventure");

movie.scene({ sky: "dawn", duration: 6, caption: story.line(0, "One morning, our hero woke up ready for an adventure.") }, () => {
  hero.place(0.2, 0.62).float();
  props.sun({ x: 0.85, y: 0.2, size: 0.2 }).fadeIn({ duration: 1.5 });
  effects.sparkles({ around: hero, duration: 2.5 });
});

movie.scene({ sky: "day", duration: 7, caption: story.line(1, "Off they went, over the hills and far away.") }, () => {
  props.tree({ x: 0.55, y: 0.62, size: 0.4, layer: "back" });
  props.cloud({ x: 0.2, y: 0.18, size: 0.14 }).moveBy(0.25, 0);
  hero.place(0.1, 0.62).moveTo(0.85, 0.6, { duration: 6 });
  hero.hop({ at: 0.5, duration: 5, times: 5, height: 0.05 });
});

movie.scene({ sky: "sunset", duration: 7, caption: story.line(2, "At last, they found somewhere wonderful.") }, () => {
  hero.place(0.5, 0.6);
  camera.zoom(1.4, { x: 0.5, y: 0.55, duration: 2 });
  hero.spin({ at: 2.2 }).say("We made it!", { at: 3.2 });
  effects.confetti({ at: 2.5 });
});`,
  },
  {
    id: "day-to-night",
    label: "Day to night",
    description: "A whole day passes, from sunny morning to a starry night.",
    code: `movie.title("From Day to Night");

movie.scene({ sky: "day", duration: 6, caption: story.line(0, "The sun was shining and it was a lovely day.") }, () => {
  props.sun({ x: 0.82, y: 0.2, size: 0.2 });
  props.flower({ x: 0.12, y: 0.82, size: 0.18 });
  props.flower({ x: 0.9, y: 0.84, size: 0.16, color: "#ffd23f" });
  hero.wiggle({ duration: 2 }).hop({ at: 2.5, times: 2 });
});

movie.scene({ sky: "sunset", skyTo: "night", duration: 7, caption: story.line(1, "Slowly, the sun went down and the sky turned orange.") }, () => {
  props.sun({ x: 0.82, y: 0.25, size: 0.2, layer: "back" }).moveTo(0.82, 1.1, { duration: 6 });
  props.moon({ x: 0.15, y: 1.1, size: 0.16, layer: "back", keep: true }).moveTo(0.15, 0.18, { at: 2, duration: 5 });
  hero.say("What a beautiful sunset!", { at: 1.5 });
});

movie.scene({ sky: "night", duration: 7, caption: story.line(2, "When night came, the stars came out to say goodnight.") }, () => {
  effects.stars();
  effects.fireflies({ at: 1 });
  hero.float().say("Goodnight!", { at: 4 });
  camera.zoom(1.25, { x: hero.home.x, y: hero.home.y, duration: 5 });
});`,
  },
  {
    id: "new-friend",
    label: "A new friend",
    description: "The hero meets someone new and they become friends.",
    code: `movie.title("A New Friend");

movie.scene({ sky: "day", duration: 6, caption: story.line(0, "Our hero was playing all alone.") }, () => {
  hero.place(0.3, 0.62).float();
  hero.say("I wish I had a friend to play with.", { at: 2 });
});

movie.scene({ sky: "day", duration: 7, caption: story.line(1, "Then someone new came along.") }, () => {
  const friend = props.buddy({ x: 1.15, y: 0.66, size: 0.26, keep: true });
  friend.moveTo(0.68, 0.66, { duration: 3, ease: "quick" }).hop({ at: 0.5, duration: 2.5, times: 3 });
  friend.say("Hello! Can I play too?", { at: 3.3 });
  hero.say("Yes, please!", { at: 5.5, duration: 1.5 });
});

movie.scene({ sky: "sunset", duration: 7, caption: story.line(2, "From that day on, they were the best of friends.") }, () => {
  hero.moveTo(0.42, 0.62, { duration: 1.5 }).hop({ at: 1.5, duration: 3, times: 4 });
  effects.hearts({ at: 1 });
  camera.zoom(1.3, { x: 0.52, y: 0.6, at: 1, duration: 2 });
});`,
  },
  {
    id: "problem-solved",
    label: "Problem solved",
    description: "Something goes wrong, the hero has an idea and makes it right.",
    code: `movie.title("The Big Idea");

movie.scene({ sky: "day", duration: 5, caption: story.line(0, "Everything was calm and happy.") }, () => {
  hero.float();
  props.cloud({ x: 0.7, y: 0.18, size: 0.14 });
});

movie.scene({ sky: "storm", duration: 7, caption: story.line(1, "But then, a problem appeared. Oh no!") }, () => {
  effects.rain();
  camera.shake({ at: 0.5 });
  hero.shake({ at: 0.6 }).say("Oh no! What shall I do?", { at: 2 });
});

movie.scene({ sky: "storm", skyTo: "dawn", duration: 6, caption: story.line(2, "Our hero thought hard and had a brilliant idea.") }, () => {
  effects.rain({ duration: 2 });
  effects.sparkles({ around: hero, at: 2 });
  hero.pulse({ at: 2 }).say("I've got it!", { at: 2.5 });
});

movie.scene({ sky: "day", duration: 7, caption: story.line(3, "With a little courage, everything was put right.") }, () => {
  props.rainbow({ x: 0.5, y: 0.45, size: 0.5, layer: "back" }).fadeIn({ duration: 2 });
  hero.spin({ at: 1 }).hop({ at: 2.5, times: 3, duration: 2 });
  effects.confetti({ at: 2 });
});`,
  },
];

export const surpriseTemplateId = "surprise";

export function findTemplate(id: string) {
  return movieTemplates.find((template) => template.id === id);
}
