// Three image sources, tried in order by main.js: (1) our own Vercel serverless
// proxy in front of Hugging Face's FLUX.1-schnell (paid-tier reliability, needs
// HF_TOKEN configured server-side), (2) Pollinations.ai (free, keyless, but no
// uptime SLA - it went down entirely for a stretch this project), (3) a local
// procedural-art fallback with no network dependency at all.

function loadImageFromUrl(url, timeoutMs) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // must be set before .src so the load is CORS-clean for canvas reads

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(null);
    }, timeoutMs);

    img.onload = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(null);
    };

    img.src = url;
  });
}

export async function generateHuggingFaceImage(
  prompt,
  { timeoutMs = 20000, width = 480, height = 854, retries = 1 } = {}
) {
  const url = `/api/generate-image?prompt=${encodeURIComponent(prompt)}&width=${width}&height=${height}`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const img = await loadImageFromUrl(url, timeoutMs);
    if (img) return img;
  }
  return null;
}

export async function generatePollinationsImage(
  prompt,
  { timeoutMs = 25000, width = 480, height = 854, retries = 1 } = {}
) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const img = await loadImageFromUrl(url, timeoutMs);
    if (img) return img;
  }
  return null;
}
