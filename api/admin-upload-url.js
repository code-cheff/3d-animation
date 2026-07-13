// Protected endpoint: mints a short-lived Supabase Storage signed upload URL
// so the admin page can PUT the video file directly to Supabase (bypassing
// Vercel's ~4.5MB serverless function body limit) without ever exposing the
// Supabase service key to the browser.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { id, secret, extension } = req.body || {};
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const ext = (extension || "mp4").replace(/[^a-z0-9]/gi, "");
  const path = `videos/${id}.${ext}`;

  try {
    const signResp = await fetch(`${supabaseUrl}/storage/v1/object/upload/sign/${path}`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 300 }),
    });

    if (!signResp.ok) {
      const text = await signResp.text();
      res.status(502).json({ error: `Sign failed: ${text}` });
      return;
    }

    const { url, token } = await signResp.json();
    res.status(200).json({
      uploadUrl: `${supabaseUrl}/storage/v1${url}`,
      token,
      path,
    });
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
}
