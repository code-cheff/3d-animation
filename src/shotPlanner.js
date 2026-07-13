// Deterministic "storyboard" derivation from a single free-text prompt: no LLM,
// just a fixed rotation of narrative-progression modifiers appended to the
// user's prompt so the 6 shots read as a step-by-step sequence (beginning ->
// climax -> resolution) rather than unrelated camera angles. Each modifier also
// repeats an explicit "same character" instruction - since every shot is an
// independent FLUX.1-schnell generation with no image-to-image/reference
// support on the free tier, this is a best-effort nudge toward visual
// consistency, not a guarantee of an identical face across shots.
const SHOT_TEMPLATES = [
  "the beginning of the scene, establishing shot, cinematic, consistent character appearance and outfit",
  "the action just starting, same character and setting, cinematic, consistent character appearance and outfit",
  "the process well underway, same character, detailed, cinematic, consistent character appearance and outfit",
  "reaching the peak moment, same character, dramatic lighting, cinematic, consistent character appearance and outfit",
  "nearing completion, same character and setting, cinematic, consistent character appearance and outfit",
  "the final result, same character, cinematic, satisfying conclusion, consistent character appearance and outfit",
];

const DEFAULT_VERTICAL_BIAS_WEIGHT = 0.4;

export function buildStoryboard(basePrompt, { shotCount = SHOT_TEMPLATES.length } = {}) {
  const trimmed = basePrompt.trim();
  const shots = [];
  for (let i = 0; i < shotCount; i++) {
    const modifier = SHOT_TEMPLATES[i % SHOT_TEMPLATES.length];
    shots.push({
      index: i,
      prompt: `${trimmed}, ${modifier}`,
      panDir: i % 2 === 0 ? 1 : -1,
      verticalBiasWeight: DEFAULT_VERTICAL_BIAS_WEIGHT,
    });
  }
  return shots;
}
