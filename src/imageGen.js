// Free, keyless image generation via Pollinations.ai. No SLA guaranteed, so
// every attempt races a timeout, and one retry is attempted before giving up -
// mirroring the retry behavior already validated in the ai_3d_video Python
// prototype, where individual fetches occasionally took 25-40s.
function fetchOnce(prompt, { timeoutMs, width, height }) {
  return new Promise((resolve) => {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true`;
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

export async function generatePollinationsImage(
  prompt,
  { timeoutMs = 25000, width = 480, height = 854, retries = 1 } = {}
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const img = await fetchOnce(prompt, { timeoutMs, width, height });
    if (img) return img;
  }
  return null;
}
