// Free, keyless image generation via Pollinations.ai. No SLA guaranteed, so
// every call races a timeout and resolves null on any failure rather than
// ever blocking the app.
export function generatePollinationsImage(prompt, { timeoutMs = 8000 } = {}) {
  return new Promise((resolve) => {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;
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
