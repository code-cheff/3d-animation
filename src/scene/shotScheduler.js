// Pure elapsed-time -> active-shot mapping. No THREE dependency, easy to reason
// about independent of rendering.
export function scheduleShot(elapsedMs, shotDurationMs, totalShots) {
  const shotIndex = Math.min(Math.floor(elapsedMs / shotDurationMs), totalShots - 1);
  const tShotNormalized = Math.min((elapsedMs - shotIndex * shotDurationMs) / shotDurationMs, 1);
  const done = elapsedMs >= shotDurationMs * totalShots;
  return { shotIndex, tShotNormalized, done };
}
