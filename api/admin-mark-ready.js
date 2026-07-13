// Protected endpoint: called after the admin page finishes uploading the
// video directly to Supabase Storage, to flip the request to "ready" with
// its public video URL so the friend's polling request-status.js picks it up.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { id, secret, path } = req.body || {};
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!id || !path) {
    res.status(400).json({ error: "Missing id or path" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const videoUrl = `${supabaseUrl}/storage/v1/object/public/${path}`;

  try {
    const updateResp = await fetch(`${supabaseUrl}/rest/v1/requests?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status: "ready", video_url: videoUrl }),
    });

    if (!updateResp.ok) {
      const text = await updateResp.text();
      res.status(502).json({ error: `Update failed: ${text}` });
      return;
    }

    res.status(200).json({ ok: true, video_url: videoUrl });
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
}
