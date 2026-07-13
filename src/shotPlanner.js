// Deterministic "storyboard" derivation from a single free-text prompt: no LLM,
// just a fixed rotation of cinematic camera/lighting modifiers appended to the
// user's prompt so each of the 6 shots asks Pollinations for a distinct image.
const SHOT_TEMPLATES = [
  { modifier: "wide establishing shot, cinematic", verticalBiasWeight: 0.4 },
  { modifier: "close-up, dramatic lighting", verticalBiasWeight: 0.25 },
  { modifier: "low angle view, cinematic", verticalBiasWeight: 0.4 },
  { modifier: "golden hour lighting, wide shot", verticalBiasWeight: 0.4 },
  { modifier: "night time, moody atmosphere", verticalBiasWeight: 0.4 },
  { modifier: "overhead view, cinematic", verticalBiasWeight: 0.1 },
];

export function buildStoryboard(basePrompt, { shotCount = SHOT_TEMPLATES.length } = {}) {
  const trimmed = basePrompt.trim();
  const shots = [];
  for (let i = 0; i < shotCount; i++) {
    const template = SHOT_TEMPLATES[i % SHOT_TEMPLATES.length];
    shots.push({
      index: i,
      prompt: `${trimmed}, ${template.modifier}`,
      panDir: i % 2 === 0 ? 1 : -1,
      verticalBiasWeight: template.verticalBiasWeight,
    });
  }
  return shots;
}
