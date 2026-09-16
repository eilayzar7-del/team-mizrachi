// api/notify.js
// ─────────────────────────────────────────────────────────────────
//  Team Mizrachi — real-time Discord alerts (Vercel Serverless Function)
//  כתובת ה-webhook שמורה ב-Vercel Environment Variables בתור DISCORD_WEBHOOK_URL
//  לעולם לא נחשפת בצד הלקוח ולעולם לא נכתבת ללוג.
//  הנקודה ציבורית: סכמה סגורה, וכל שדה מסונן לתווים מותרים ומקוצר לפני Discord.
// ─────────────────────────────────────────────────────────────────

const SITE = 'mizrachi';
const SITE_NAME = 'Team Mizrachi';
const ILAY_NUMBER = '972556648938';
const MAX_BODY_BYTES = 2048;

//  סוג אירוע → כותרת אנושית. רק המפתחות האלה מתקבלים.
const EVENT_TITLES = {
  whatsapp_click: '🟢 ליד וואטסאפ לאקדמיה',
  signature_click: '✍️ פנייה לעילי זר (חתימה)',
  quiz_complete: '🎯 השאלון הושלם',
};

const POSITION_LABELS = {
  nav: 'תפריט עליון',
  mnav: 'תפריט מובייל',
  hero: 'כפתור ראשי',
  promo: 'באנר מבצע',
  'disc-head': 'כותרת תחומים',
  'coaches-head': 'כותרת מאמנים',
  'wins-head': 'כותרת הישגים',
  'wins-foot': 'תחתית הישגים',
  cta: 'קריאה לפעולה בסוף העמוד',
  footer: 'אייקון בפוטר',
  floating: 'כפתור צף',
  ctxmenu: 'תפריט קליק ימני',
  'quiz-result': 'תוצאת השאלון',
  'chat-message': 'קישור בצ׳אט',
  'chat-booking': 'כרטיס הזמנה בצ׳אט',
  'chat-credit': 'קרדיט בצ׳אט',
  credit: 'קרדיט בפוטר',
  'creator-band': 'פס "רוצה אתר כזה"',
};
const DAY_LABELS = { sun: 'ראשון', mon: 'שני', tue: 'שלישי', wed: 'רביעי', thu: 'חמישי', fri: 'שישי', sat: 'שבת' };
const GYM_LABELS = { hayarok: 'הירוק', center: 'סנטר' };

//  כל שדה מותר: אילו תווים נשארים ואורך מקסימלי קשיח.
//  אין @, <, `, * או _ בשום שדה — אין תיוגים ואין markdown מהמבקר.
const FIELDS = {
  position: { strip: /[^a-z0-9-]/g, max: 40 },
  number: { strip: /[^0-9]/g, max: 15 },
  result: { strip: /[^A-Za-z0-9֐-׿ \/'&.-]/g, max: 60 },
  utm_source: { strip: /[^A-Za-z0-9._-]/g, max: 40 },
  referrer: { strip: /[^a-z0-9.-]/g, max: 80 },
};

function cleanField(name, value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new TypeError(name);
  const { strip, max } = FIELDS[name];
  let s = value.slice(0, max * 4);
  if (name === 'referrer') s = s.toLowerCase();
  s = s.replace(strip, '').trim().slice(0, max);
  return s || null;
}

function positionLabel(pos) {
  if (!pos) return 'לא ידוע';
  if (Object.hasOwn(POSITION_LABELS, pos)) return POSITION_LABELS[pos];
  let m = pos.match(/^disc-card-(\d{1,2})$/);
  if (m) return `כרטיס תחום ${m[1]}`;
  m = pos.match(/^sched-([a-z]{3})-([a-z]+)$/);
  if (m && Object.hasOwn(DAY_LABELS, m[1])) {
    const gym = Object.hasOwn(GYM_LABELS, m[2]) ? ` · ${GYM_LABELS[m[2]]}` : '';
    return `מערכת שעות · יום ${DAY_LABELS[m[1]]}${gym}`;
  }
  return `\`${pos}\``;
}

function jerusalemTime(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jerusalem',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map(p => [p.type, p.value])
  );
  return `${parts.hour}:${parts.minute} · ${parts.day}.${parts.month}`;
}

function buildMessage(f, now) {
  const source = f.utm_source ? `\`${f.utm_source}\`` : f.referrer ? `\`${f.referrer}\`` : 'ישיר';
  const detail =
    f.event === 'quiz_complete' ? `תוצאה: \`${f.result}\`` : `כפתור: ${positionLabel(f.position)}`;
  return [
    `**${EVENT_TITLES[f.event]}** · ${SITE_NAME}`,
    `${detail} · מקור: ${source}`,
    `🕒 ${jerusalemTime(now)}`,
  ].join('\n');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    return res
      .status(500)
      .json({ error: 'DISCORD_WEBHOOK_URL is not set in Vercel environment variables' });
  }

  let fields;
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? null);
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) throw new Error('too large');
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('not an object');
    if (body.site !== SITE) throw new Error('site');
    if (typeof body.event !== 'string' || !Object.hasOwn(EVENT_TITLES, body.event)) throw new Error('event');

    fields = { event: body.event };
    for (const name of Object.keys(FIELDS)) fields[name] = cleanField(name, body[name]);

    //  המספר קובע של מי הליד: של עילי = חתימה, כל השאר = האקדמיה.
    if (fields.event === 'signature_click' && fields.number !== ILAY_NUMBER) throw new Error('number');
    if (fields.event === 'whatsapp_click' && fields.number === ILAY_NUMBER) throw new Error('number');
    if (fields.event === 'quiz_complete' && !fields.result) throw new Error('result');
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  let discordRes;
  try {
    discordRes = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: buildMessage(fields, new Date()), allowed_mentions: { parse: [] } }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    //  רק שם השגיאה — הודעות שגיאה של fetch עלולות לכלול את הכתובת.
    console.error('[api/notify] Discord request failed:', err && err.name);
    return res.status(502).json({ error: 'Upstream request failed' });
  }

  if (discordRes.status === 429) {
    //  לא מנסים שוב: מדווחים כמה לחכות ומשחררים.
    let retryAfter = null;
    try {
      const data = await discordRes.json();
      if (typeof data.retry_after === 'number') retryAfter = data.retry_after;
    } catch {}
    if (retryAfter === null) {
      const header = Number(discordRes.headers.get('retry-after'));
      if (Number.isFinite(header)) retryAfter = header;
    }
    return res.status(429).json({ error: 'Discord rate limited', retry_after: retryAfter });
  }

  if (!discordRes.ok) {
    console.error('[api/notify] Discord responded with status', discordRes.status);
    return res.status(502).json({ error: 'Upstream error', status: discordRes.status });
  }

  return res.status(200).json({ ok: true });
}
