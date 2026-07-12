import { presets } from "./scene/presets/index.js";

const COLOR_WORDS = {
  red: [0xff4d4d, 0xff8080, 0xffffff],
  blue: [0x4d79ff, 0x80a3ff, 0xffffff],
  green: [0x4dff88, 0x80ffb3, 0xffffff],
  purple: [0x9d4dff, 0xc080ff, 0xffffff],
  pink: [0xff4da6, 0xff80c2, 0xffffff],
  yellow: [0xffe14d, 0xfff080, 0xffffff],
  orange: [0xff9d4d, 0xffc080, 0xffffff],
  gold: [0xffd700, 0xffe680, 0xffffff],
  black: [0x222222, 0x444444, 0xffffff],
  white: [0xffffff, 0xdddddd, 0x9999ff],
};

const SPEED_WORDS = {
  fast: 1.8,
  quick: 1.8,
  crazy: 2.2,
  wild: 2.2,
  energetic: 1.6,
  slow: 0.5,
  chill: 0.5,
  calm: 0.5,
  relax: 0.5,
  gentle: 0.6,
};

const FALLBACK_IDS = ["floatingBlobs", "galaxySwirl"];

function normalize(str) {
  return (str || "").toLowerCase().replace(/[^\w\s]/g, " ");
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pickPreset(promptText, { hasImage = false } = {}) {
  const text = normalize(promptText);

  let best = null;
  let bestScore = 0;

  for (const preset of presets) {
    if (preset.imageAware && !hasImage) continue; // photoExplode needs an image to work with
    let score = 0;
    for (const kw of preset.keywords) {
      if (text.includes(kw)) score += kw.length > 5 ? 1.5 : 1;
    }
    if (hasImage && preset.imageAware) score += 2; // favor photo-based scenes when a photo is present
    if (score > bestScore) {
      bestScore = score;
      best = preset;
    }
  }

  if (!best) {
    // Nothing matched (and no image, so photoExplode wasn't eligible) - deterministic
    // fallback so the same prompt always produces the same result.
    const idx = hashString(text || "seed") % FALLBACK_IDS.length;
    best = presets.find((p) => p.id === FALLBACK_IDS[idx]) || presets[0];
  }

  let palette = best.defaultPalette;
  for (const [word, colors] of Object.entries(COLOR_WORDS)) {
    if (text.includes(word)) {
      palette = colors;
      break;
    }
  }

  let speed = 1;
  for (const [word, mult] of Object.entries(SPEED_WORDS)) {
    if (text.includes(word)) {
      speed = mult;
      break;
    }
  }

  return { preset: best, palette, speed };
}
