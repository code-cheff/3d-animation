// Protected endpoint (shared secret, not a full auth system - fine for a
// two-person tool): lists pending requests for the admin page to fulfill.
export default async function handler(req, res) {
  // Prevent any caching layer (browser or Vercel's edge network) from serving
  // a stale response for this exact URL - the pending list changes constantly.
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  const { secret } = req.query;
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  try {
    const resp = await fetch(
      `${supabaseUrl}/rest/v1/requests?status=eq.pending&select=id,prompt,created_at&order=created_at.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    if (!resp.ok) {
      res.status(502).json({ error: "Lookup failed" });
      return;
    }
    const rows = await resp.json();
    res.status(200).json(rows);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
}
