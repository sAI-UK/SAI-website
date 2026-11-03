/**
 * Picks the scroll position to settle on when scrolling stops, or null to stay put.
 * Looks further ahead in the direction of travel than behind, so the page carries on the way it was going.
 */
export function findSnap(y: number, points: number[], range: number, goingDown: boolean) {
  const behind = range * 0.35;
  let best: number | null = null;
  let bestDistance = Infinity;
  for (const point of points) {
    const ahead = goingDown ? point - y : y - point;
    if (ahead > range || ahead < -behind) continue;
    const distance = Math.abs(point - y);
    if (distance < bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }
  return best !== null && bestDistance >= 1 ? best : null;
}
