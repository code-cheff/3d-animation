// Public endpoint: the friend's webapp calls this to queue a "real animation"
// request. Inserts a row in Supabase and pings the fulfiller's phone via
// Telegram - all secrets stay server-side (env vars), never sent to the client.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: "Server misconfigured: Supabase env vars missing" });
    return;
  }

  try {
    const insertResp = await fetch(`${supabaseUrl}/rest/v1/requests`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ prompt: prompt.trim() }),
    });

    if (!insertResp.ok) {
      const text = await insertResp.text();
      res.status(502).json({ error: `Supabase insert failed: ${text}` });
      return;
    }

    const [row] = await insertResp.json();

    if (telegramToken && telegramChatId) {
      // Fire-and-forget - a notification failure shouldn't fail the friend's request.
      // .trim() guards against stray whitespace/newlines from copy-pasting env vars.
      fetch(`https://api.telegram.org/bot${telegramToken.trim()}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId.trim(),
          text: `New animation request!\n\nPrompt: "${row.prompt}"\nRequest ID: ${row.id}`,
        }),
      }).catch(() => {});
    }

    res.status(200).json({ id: row.id });
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
}
