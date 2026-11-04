// api/chat.js
// ─────────────────────────────────────────────────────────────────
//  Team Mizrachi MMA — Secure Groq API proxy (Vercel Serverless Function)
//  המפתח שמור ב-Vercel Environment Variables בתור GROQ_API_KEY
//  לעולם לא נחשף בצד הלקוח.
// ─────────────────────────────────────────────────────────────────

//  המודל נקרא מ-GROQ_MODEL כדי שהחלפת מודל תהיה שינוי בדשבורד ולא דיפלוי.
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

//  רק האתר עצמו (ופיתוח מקומי) רשאי לקרוא לנקודה הזו — כדי שאף אחד אחר לא ישתמש במפתח.
const ALLOWED_ORIGINS = ['https://team-mizrachi.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:3000'];
const MAX_MESSAGES = 16;
const MAX_SYSTEM_CHARS = 20000;
const MAX_MSG_CHARS = 4000;

//  משאיר רק הודעת system אחת בראש (הנחיות הצ'אט), ואת השאר רק user/assistant בגודל סביר.
function sanitize(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;
  const out = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || typeof m.content !== 'string') return null;
    if (m.role === 'system') {
      if (i !== 0 || m.content.length > MAX_SYSTEM_CHARS) return null;
    } else if (m.role !== 'user' && m.role !== 'assistant') return null;
    else if (m.content.length > MAX_MSG_CHARS) return null;
    out.push({ role: m.role, content: m.content });
  }
  return out;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ALLOWED_ORIGINS.includes(origin);
  res.setHeader('Vary', 'Origin');
  if (allowed) res.setHeader('Access-Control-Allow-Origin', origin);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!allowed) return res.status(403).json({ error: 'Forbidden' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  let messages;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    messages = sanitize(body && body.messages);
    if (!messages) throw new Error('bad messages');
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
        model: GROQ_MODEL,
        messages,
        max_tokens: 600,
        temperature: 0.7,
        stream: false,
      }),
    });

    const data = await groqRes.json();

    return res.status(groqRes.status).json(data);
  } catch (err) {
    console.error('[api/chat] Groq error:', err && err.name);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
