// api/chat.js
// ─────────────────────────────────────────────────────────────────
//  Team Mizrachi MMA — Secure Groq API proxy (Vercel Serverless Function)
//  המפתח שמור ב-Vercel Environment Variables בתור GROQ_API_KEY
//  לעולם לא נחשף בצד הלקוח. גם ה-system prompt נבנה כאן בלבד.
// ─────────────────────────────────────────────────────────────────
import { SYSTEM_PROMPT, DIRECTIVE } from './_prompt.js';

//  המודל נקרא מ-GROQ_MODEL כדי שהחלפת מודל תהיה שינוי בדשבורד ולא דיפלוי.
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const MAX_MESSAGES = 12;
const MAX_USER_CHARS = 1000;
const MAX_ASSISTANT_CHARS = 2400;

// The site's own domains, Vercel previews of this project, and local dev.
// Extra production domains can be added with ALLOWED_ORIGINS (comma-separated).
function originAllowed(origin) {
  if (!origin) return false;
  let host;
  try { host = new URL(origin).hostname; } catch { return false; }
  const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (extra.some(o => { try { return new URL(o).hostname === host; } catch { return o === host; } })) return true;
  if (host === 'team-mizrachi.vercel.app') return true;
  if (/^team-mizrachi(-[a-z0-9-]+)?\.vercel\.app$/.test(host)) return true; // preview deployments
  if (host === 'localhost' || host === '127.0.0.1') return true;
  return false;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = originAllowed(origin);
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    if (!allowed) return res.status(403).end();
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!allowed) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chat is not configured' });
  }

  let messages, lang;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    lang = body && body.lang === 'en' ? 'en' : 'he';
    const raw = body && body.messages;
    if (!Array.isArray(raw) || raw.length === 0) throw new Error('bad messages');
    // Only user/assistant turns are accepted: a client-supplied system message is rejected outright.
    if (raw.some(m => !m || (m.role !== 'user' && m.role !== 'assistant'))) {
      return res.status(400).json({ error: 'Only user and assistant messages are accepted' });
    }
    messages = raw.slice(-MAX_MESSAGES).map(m => ({
      role: m.role,
      content: String(m.content ?? '').slice(0, m.role === 'user' ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS),
    }));
    if (messages[messages.length - 1].role !== 'user') throw new Error('last message must be user');
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
        messages: [{ role: 'system', content: DIRECTIVE[lang] + SYSTEM_PROMPT }, ...messages],
        max_tokens: 600,
        temperature: 0.7,
        stream: false,
      }),
    });

    const data = await groqRes.json();
    return res.status(groqRes.status).json(data);
  } catch (err) {
    console.error('[api/chat] Groq error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
