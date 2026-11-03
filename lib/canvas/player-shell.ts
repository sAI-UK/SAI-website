// Shared between the player route (which builds the shell) and the player component (which fills it).
export const scriptPlaceholder = "/*__SAI_MOVIE_SCRIPT__*/";

/** Wraps a checked movie script so the runtime can call it with the movie helpers. */
export function wrapMovieScript(code: string) {
  const safe = code.replace(/<\/script/gi, "<\\/script");
  return `window.__saiMovieScript = function (movie, hero, props, effects, camera, actor, story, drawing, ease, W, H, sound) {\n"use strict";\n${safe}\n};`;
}
