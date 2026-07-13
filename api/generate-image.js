// Vercel serverless function: proxies image generation to Hugging Face's
// Inference Providers router. The HF token lives only in the server-side
// HF_TOKEN environment variable (set in Vercel project settings) - it must
// never be sent to or embedded in client code, since this repo/site is public.
const HF_ENDPOINT = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

export default async function handler(req, res) {
  const { prompt, width = "480", height = "854" } = req.query;

  if (!prompt) {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }

  const token = process.env.HF_TOKEN;
  if (!token) {
    res.status(500).json({ error: "Server misconfigured: HF_TOKEN is not set" });
    return;
  }

  try {
    const hfResponse = await fetch(HF_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width: Number(width),
          height: Number(height),
          num_inference_steps: 4,
        },
      }),
    });

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      res.status(hfResponse.status).json({ error: errText });
      return;
    }

    const arrayBuffer = await hfResponse.arrayBuffer();
    res.setHeader("Content-Type", hfResponse.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
}
