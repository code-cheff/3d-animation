// gif.js (loaded globally via <script> in index.html) needs its worker script
// same-origin to be able to `new Worker(url)` it. Since we load gif.js itself
// from a CDN with no build step, fetch the worker source once and turn it
// into a same-origin Blob URL instead of pointing at the CDN URL directly.
const WORKER_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js";
let cachedWorkerBlobUrl = null;

async function getWorkerBlobUrl() {
  if (cachedWorkerBlobUrl) return cachedWorkerBlobUrl;
  const res = await fetch(WORKER_SCRIPT_URL);
  if (!res.ok) throw new Error(`Failed to fetch gif worker script: ${res.status}`);
  const text = await res.text();
  const blob = new Blob([text], { type: "application/javascript" });
  cachedWorkerBlobUrl = URL.createObjectURL(blob);
  return cachedWorkerBlobUrl;
}

export async function recordGif(canvas, { durationMs = 3500, fps = 12, width = 480, height = 480, onProgress } = {}) {
  const workerScript = await getWorkerBlobUrl();

  const gif = new window.GIF({
    workers: 2,
    quality: 10,
    workerScript,
    width,
    height,
  });

  const frameDelay = Math.round(1000 / fps);
  const totalFrames = Math.round(durationMs / frameDelay);

  return new Promise((resolve, reject) => {
    let frame = 0;

    gif.on("finished", (blob) => resolve(blob));
    gif.on("abort", () => reject(new Error("GIF recording aborted")));

    function captureFrame() {
      if (frame >= totalFrames) {
        gif.render();
        return;
      }
      gif.addFrame(canvas, { copy: true, delay: frameDelay });
      frame++;
      if (onProgress) onProgress(frame / totalFrames);
      setTimeout(captureFrame, frameDelay);
    }

    captureFrame();
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
