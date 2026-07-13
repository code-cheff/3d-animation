// Zero-network fallback used only when the free Pollinations API is unreachable
// (it has no uptime SLA and can go down entirely, as observed this session).
// Draws an abstract, color-themed scene from simple keyword matching so the
// parallax pipeline always has something with real edges/variation to work
// with, rather than the whole video failing when one external service is down.
// Kept deliberately bright/saturated (no near-black gradient stops) - an
// earlier version faded to pure black and averaged ~10% brightness, which read
// as "basically a black video" to a real viewer.
const COLOR_WORDS = {
  red: ["#ff6b6b", "#8a2a2a"],
  blue: ["#5a8dff", "#1a3a7a"],
  green: ["#5dff9e", "#1a6b3a"],
  purple: ["#b06bff", "#4a1a7a"],
  pink: ["#ff6bc4", "#7a1a52"],
  yellow: ["#ffe45d", "#7a5a0a"],
  orange: ["#ffab5d", "#7a3f0a"],
  gold: ["#ffdf4d", "#7a5f0a"],
  night: ["#5a5aa0", "#20204a"],
  rain: ["#7aa8cc", "#1a3a52"],
  fire: ["#ff8a4d", "#7a2a0a"],
  ocean: ["#4dabff", "#0a3a5f"],
  gray: ["#b0b0b0", "#4a4a4a"],
};
const DEFAULT_PALETTE = ["#a06bff", "#3a1a6a"];

function pickPalette(text) {
  const lower = text.toLowerCase();
  for (const [word, palette] of Object.entries(COLOR_WORDS)) {
    if (lower.includes(word)) return palette;
  }
  return DEFAULT_PALETTE;
}

function mulberry32(seed) {
  let t = seed;
  return function () {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateProceduralImage(prompt, { width = 480, height = 854, seed = 0 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const rand = mulberry32(seed + 1);
  const [accent, base] = pickPalette(prompt);

  // Background never fades to black - stays within a mid-tone band so the
  // whole frame reads as visible content, not empty space.
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, accent);
  bgGradient.addColorStop(1, base);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  const blobCount = 8 + Math.floor(rand() * 5);
  for (let i = 0; i < blobCount; i++) {
    const x = rand() * width;
    const y = height * (0.2 + rand() * 0.8);
    const r = width * (0.25 + rand() * 0.45);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.55 + rand() * 0.35;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  return canvas;
}
