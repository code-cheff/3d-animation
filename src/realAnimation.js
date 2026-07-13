// Client for the "Request Real Animation" queue: submits a prompt, then polls
// for a manually-fulfilled result (see api/submit-request.js, api/request-
// status.js, and the admin.html fulfillment page).
const POLL_INTERVAL_MS = 15000;

export async function submitRealAnimationRequest(prompt) {
  const resp = await fetch("/api/submit-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const { id } = await resp.json();
  return id;
}

// Returns a stop() function to cancel polling.
export function pollRequestStatus(id, { onReady }) {
  let stopped = false;

  async function tick() {
    if (stopped) return;
    try {
      const resp = await fetch(`/api/request-status?id=${encodeURIComponent(id)}&_=${Date.now()}`, {
        cache: "no-store",
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.status === "ready" && data.video_url) {
          onReady(data.video_url);
          return;
        }
      }
    } catch {
      // Network hiccup - keep polling silently rather than surfacing every blip.
    }
    if (!stopped) setTimeout(tick, POLL_INTERVAL_MS);
  }

  tick();
  return () => {
    stopped = true;
  };
}
