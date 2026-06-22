// netlify/functions/chat.js
// ─────────────────────────────────────────────────────────────────
//  Team Mizrachi MMA — Secure Groq API proxy
//  המפתח שמור ב-Netlify Environment Variables בתור GROQ_API_KEY
//  לעולם לא נחשף בצד הלקוח.
// ─────────────────────────────────────────────────────────────────

exports.handler = async (event) => {

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GROQ_API_KEY is not set in Netlify environment variables' }),
    };
  }

  let messages;
  try {
    ({ messages } = JSON.parse(event.body));
    if (!Array.isArray(messages) || messages.length === 0) throw new Error('bad messages');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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

    if (!groqRes.ok) {
      return {
        statusCode: groqRes.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };

  } catch (err) {
    console.error('[chat.js] Groq error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', detail: err.message }),
    };
  }
};
