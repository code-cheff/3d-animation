// Public endpoint: the friend's webapp polls this to find out when her
// manually-fulfilled animation is ready.
export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }

  try {
    const resp = await fetch(
      `${supabaseUrl}/rest/v1/requests?id=eq.${encodeURIComponent(id)}&select=status,video_url`,
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
    if (!rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
}
