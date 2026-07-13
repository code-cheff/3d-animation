// Zero-network fallback used only when the free Pollinations API is unreachable
// (it has no uptime SLA and can go down entirely, as observed this session).
// Draws an abstract, color-themed scene from simple keyword matching so the
// parallax pipeline always has something with real edges/variation to work
// with, rather than the whole video failing when one external service is down.
const COLOR_WORDS = {
  red: ["#ff4d4d", "#7a1010"],
  blue: ["#4d79ff", "#0a1a4d"],
  green: ["#4dff88", "#0a4d1a"],
  purple: ["#9d4dff", "#2a0a4d"],
  pink: ["#ff4da6", "#4d0a2a"],
  yellow: ["#ffe14d", "#4d3d0a"],
  orange: ["#ff9d4d", "#4d240a"],
  gold: ["#ffd700", "#4d3d00"],
  night: ["#2a2a55", "#05050f"],
  rain: ["#5588aa", "#0a1520"],
  fire: ["#ff6a1a", "#4d1000"],
  ocean: ["#1a8fff", "#001a33"],
  gray: ["#999999", "#2a2a2a"],
};
const DEFAULT_PALETTE = ["#7c3aed", "#1a1030"];

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

  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, base);
  bgGradient.addColorStop(1, "#000000");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  const blobCount = 5 + Math.floor(rand() * 4);
  for (let i = 0; i < blobCount; i++) {
    const x = rand() * width;
    const y = height * (0.3 + rand() * 0.7); // bias toward lower half, like a ground plane
    const r = width * (0.15 + rand() * 0.35);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, accent);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.35 + rand() * 0.35;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  return canvas;
}
