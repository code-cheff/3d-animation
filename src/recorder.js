// Native MediaRecorder + canvas.captureStream(), reliably supported on Android
// Chrome (unlike iOS Safari, which has confirmed captureStream/MediaRecorder
// bugs - this app targets Android only, so we no longer need the GIF-based
// workaround the previous version used).

function pickMimeType() {
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  for (const type of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) return type;
  }
  return null;
}

export function isRecordingSupported(canvas) {
  return !!(window.MediaRecorder && canvas.captureStream);
}

export function startRecording(canvas, { fps = 24, videoBitsPerSecond = 2_500_000 } = {}) {
  const mimeType = pickMimeType();
  if (!mimeType) throw new Error("MediaRecorder with WebM is not supported on this browser");

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond });
  const chunks = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = (e) => reject(e.error || new Error("MediaRecorder error"));
  });

  recorder.start(1000); // 1s timeslice - bounds peak memory instead of buffering the whole clip unmuxed

  return {
    stop() {
      recorder.stop();
      return stopped;
    },
  };
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
