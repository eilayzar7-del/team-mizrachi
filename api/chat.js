// api/chat.js
// ─────────────────────────────────────────────────────────────────
//  Team Mizrachi MMA — Secure Groq API proxy (Vercel Serverless Function)
//  המפתח שמור ב-Vercel Environment Variables בתור GROQ_API_KEY
//  לעולם לא נחשף בצד הלקוח.
// ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: 'GROQ_API_KEY is not set in Vercel environment variables' });
  }

  let messages;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    messages = body && body.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error('bad messages');
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 600,
        temperature: 0.7,
        stream: false,
      }),
    });

    const data = await groqRes.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(groqRes.status).json(data);
  } catch (err) {
    console.error('[api/chat] Groq error:', err);
    return res
      .status(500)
      .json({ error: 'Internal server error', detail: err.message });
  }
}
