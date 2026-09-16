// Verifies Layer 1 real-time alerts: index.html → POST /api/notify → api/notify.js.
//
// What this PROVES: the browser builds and sends the correct request (payload,
// flood guard, signature vs academy split, source), the real handler accepts
// exactly that payload and formats the Hebrew message, the handler rejects
// malformed/forged input, a slow or failing notify call never delays the
// WhatsApp link, and no Discord webhook URL is served or committable.
//
// What this does NOT prove: that Discord receives anything. /api/notify is
// intercepted in the browser, and the handler's outbound fetch is replaced by
// a recorder pointed at a fake webhook. Delivery is only provable in production
// from a real phone.
//
// Reuses the bot-blocklist spoof and gzip decoding from verify-analytics.mjs.
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = 5546;
const BASE = `http://127.0.0.1:${PORT}/`;
const SITE = 'mizrachi';
const ACADEMY = '972587777750';
const ILAY = '972556648938';
const ACADEMY_TITLE = 'ליד וואטסאפ לאקדמיה';
const SIGNATURE_TITLE = 'פנייה לעילי זר';
const QUIZ_TITLE = 'השאלון הושלם';
const PAYLOAD_KEYS = 'event,number,position,referrer,result,site,utm_source';

// Needles are assembled so this file never contains a contiguous webhook path.
const NEEDLES = [['discord', '.com/api/', 'webhooks'].join(''), ['discordapp', '.com/api/', 'webhooks'].join('')];
function readRealWebhook() {
  try {
    const m = readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^DISCORD_WEBHOOK_URL=(.+)$/m);
    return m ? m[1].trim() : null;
  } catch { return null; }
}
const REAL_WEBHOOK = readRealWebhook(); // held for the absence check only — never printed, never given to the handler
if (REAL_WEBHOOK) NEEDLES.push(REAL_WEBHOOK);

// ====================== HANDLER HARNESS (Discord replaced) ======================
const FAKE_WEBHOOK = 'https://discord.invalid/api/hooks/verify-alerts-fake';
process.env.DISCORD_WEBHOOK_URL = FAKE_WEBHOOK;

const discordCalls = [];
const defaultDiscordReply = () => new Response(null, { status: 204 });
let discordReply = defaultDiscordReply;
globalThis.fetch = async (url, init) => {
  if (String(url) !== process.env.DISCORD_WEBHOOK_URL) throw new Error('handler fetched an unexpected URL');
  const call = { body: JSON.parse(init.body) };
  discordCalls.push(call);
  return discordReply(call);
};
const loggedErrors = [];
const realConsoleError = console.error;
console.error = (...args) => { loggedErrors.push(args.map(String).join(' ')); };

const { default: handler } = await import(pathToFileURL(path.join(ROOT, 'api', 'notify.js')).href);

function runHandler(method, body) {
  return new Promise(resolve => {
    const c0 = discordCalls.length;
    const res = {
      statusCode: 200, headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this; },
      status(c) { this.statusCode = c; return this; },
      json(o) { resolve({ status: this.statusCode, body: o, headers: this.headers, discord: discordCalls.slice(c0) }); return this; },
      end() { resolve({ status: this.statusCode, body: null, headers: this.headers, discord: discordCalls.slice(c0) }); return this; },
    };
    Promise.resolve(handler({ method, body, headers: {} }, res))
      .catch(e => resolve({ status: 'THREW', body: String(e), discord: discordCalls.slice(c0) }));
  });
}
// Vercel hands the function a parsed object for application/json bodies.
const asVercelBody = raw => { try { return JSON.parse(raw); } catch { return raw; } };

function jerusalemHHMM(t) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(t));
}
function utcHHMM(t) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(t));
}
const hasJerusalemTime = (content, t) =>
  (content.includes(jerusalemHHMM(t)) || content.includes(jerusalemHHMM(t - 60000))) && !content.includes(utcHHMM(t));

// ====================== ASSERTIONS ======================
let pass = true;
function check(name, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + ' — ' + name);
  if (!cond) pass = false;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, timeout = 10000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) { const v = fn(); if (v) return v; await sleep(150); }
  return fn();
}

// ====================== F. HANDLER CHECKS ======================
console.log('\n--- F. api/notify.js handler (Discord replaced by recorder) ---');
{
  const base = { site: SITE, event: 'whatsapp_click', position: 'hero', number: ACADEMY, result: null, utm_source: null, referrer: null };
  const post = body => runHandler('POST', body);

  for (const m of ['GET', 'PUT', 'DELETE', 'OPTIONS']) {
    const r = await runHandler(m, base);
    check(`F ${m} → 405 with Allow: POST, no Discord call`, r.status === 405 && r.headers.allow === 'POST' && r.discord.length === 0);
  }
  const bad = [
    ['malformed JSON string', '{"site":"mizrachi",'],
    ['array body', [base]],
    ['null body', null],
    ['missing site', { ...base, site: undefined }],
    ['site "dor-eitan"', { ...base, site: 'dor-eitan' }],
    ['event "pageview"', { ...base, event: 'pageview' }],
    ['event "__proto__"', { ...base, event: '__proto__' }],
    ['event "toString"', { ...base, event: 'toString' }],
    ['missing event', { ...base, event: undefined }],
    ['position is a number', { ...base, position: 123 }],
    ['utm_source is an object', { ...base, utm_source: { a: 1 } }],
    ['body over 2KB', { ...base, utm_source: 'a'.repeat(3000) }],
    ['signature_click with academy number (forged)', { ...base, event: 'signature_click', number: ACADEMY }],
    ['signature_click with no number', { ...base, event: 'signature_click', number: null }],
    ['whatsapp_click with Ilay number (forged)', { ...base, number: ILAY }],
    ['quiz_complete without result', { ...base, event: 'quiz_complete', position: null, number: null }],
  ];
  for (const [label, body] of bad) {
    const r = await post(body);
    check(`F ${label} → 400, no Discord call`, r.status === 400 && r.discord.length === 0);
  }

  const t = Date.now();
  let r = await post(base);
  let c = r.discord[0]?.body?.content ?? '';
  check('F valid whatsapp_click → 200 and exactly one Discord call', r.status === 200 && r.discord.length === 1);
  check('F message: 3 lines, site name, human event title, button label, source "ישיר", no raw event name',
    c.split('\n').length === 3 && c.includes('Team Mizrachi') && c.includes(ACADEMY_TITLE) &&
    c.includes('כפתור: כפתור ראשי') && c.includes('מקור: ישיר') && !c.includes('whatsapp_click'));
  check(`F message time is Asia/Jerusalem (${jerusalemHHMM(t)}), not UTC (${utcHHMM(t)})`, hasJerusalemTime(c, t));
  check('F Discord payload disables all mentions', JSON.stringify(r.discord[0]?.body?.allowed_mentions) === '{"parse":[]}');

  r = await post({ ...base, event: 'signature_click', position: 'credit', number: ILAY });
  c = r.discord[0]?.body?.content ?? '';
  check('F signature_click message carries the signature title, not the academy title', r.status === 200 && c.includes(SIGNATURE_TITLE) && !c.includes(ACADEMY_TITLE) && c.includes('קרדיט בפוטר'));

  r = await post({ ...base, event: 'quiz_complete', position: null, number: null, result: 'MMA / BJJ' });
  c = r.discord[0]?.body?.content ?? '';
  check('F quiz_complete message carries the result', r.status === 200 && c.includes(QUIZ_TITLE) && c.includes('`MMA / BJJ`'));

  r = await post({ ...base, event: 'quiz_complete', position: null, number: null, result: 'הגנה עצמית / איגרוף לנשים' });
  c = r.discord[0]?.body?.content ?? '';
  check('F quiz_complete with a Hebrew result is accepted (200) and rendered verbatim',
    r.status === 200 && c.includes(QUIZ_TITLE) && c.includes('`הגנה עצמית / איגרוף לנשים`'));

  r = await post({ ...base, utm_source: 'ig_story', referrer: 'l.instagram.com' });
  c = r.discord[0]?.body?.content ?? '';
  check('F source precedence: utm_source wins over referrer', c.includes('מקור: `ig_story`') && !c.includes('instagram.com'));
  r = await post({ ...base, referrer: 'L.Instagram.com' });
  c = r.discord[0]?.body?.content ?? '';
  check('F source fallback: referring domain when no utm_source', c.includes('מקור: `l.instagram.com`'));

  r = await post({ ...base, position: 'sched-sun-hayarok' });
  check('F schedule position rendered in Hebrew', (r.discord[0]?.body?.content ?? '').includes('מערכת שעות · יום ראשון · הירוק'));

  r = await post({ ...base, utm_source: '@everyone <@123> **bold** `tick` ' + 'x'.repeat(200), position: 'a'.repeat(300) });
  c = r.discord[0]?.body?.content ?? '';
  const detailLine = c.split('\n')[1] ?? '';
  check('F attacker text: no @, <, ** or stray backticks reach Discord', r.status === 200 && !c.includes('@') && !c.includes('<') &&
    !c.includes('**bold') && (detailLine.match(/`/g) || []).length === 4);
  check('F truncation: position cut to 40 chars, utm_source cut to 40 chars',
    detailLine.includes('`' + 'a'.repeat(40) + '`') && !detailLine.includes('a'.repeat(41)) &&
    (detailLine.match(/מקור: `([^`]*)`/)?.[1].length ?? 99) <= 40);

  discordReply = () => new Response(JSON.stringify({ message: 'You are being rate limited.', retry_after: 1.25, global: false }),
    { status: 429, headers: { 'content-type': 'application/json', 'retry-after': '2' } });
  r = await post(base);
  check('F Discord 429 → 429 with retry_after from body, exactly one attempt (no retry loop)', r.status === 429 && r.body?.retry_after === 1.25 && r.discord.length === 1);
  discordReply = () => new Response('', { status: 429, headers: { 'retry-after': '3' } });
  r = await post(base);
  check('F Discord 429 without JSON → retry_after from header', r.status === 429 && r.body?.retry_after === 3 && r.discord.length === 1);
  discordReply = () => new Response('nope', { status: 500 });
  r = await post(base);
  check('F Discord 500 → 502', r.status === 502 && r.discord.length === 1);
  discordReply = () => { throw new TypeError(`fetch failed ${FAKE_WEBHOOK}`); };
  r = await post(base);
  check('F Discord network failure → 502', r.status === 502);
  discordReply = defaultDiscordReply;

  delete process.env.DISCORD_WEBHOOK_URL;
  r = await post(base);
  check('F env var missing → 500, no Discord call', r.status === 500 && r.discord.length === 0);
  process.env.DISCORD_WEBHOOK_URL = FAKE_WEBHOOK;
}

// ====================== BROWSER HARNESS ======================
const CHROME_CANDIDATES = [
  String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  String.raw`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
  String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
  String.raw`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
];
const executablePath = CHROME_CANDIDATES.find(p => existsSync(p));
if (!executablePath) {
  realConsoleError('No local Chrome/Edge install found to drive Playwright with.');
  process.exit(1);
}

function contentType(p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  if (p.endsWith('.js') || p.endsWith('.mjs')) return 'application/javascript; charset=utf-8';
  if (p.endsWith('.css')) return 'text/css; charset=utf-8';
  if (p.endsWith('.json')) return 'application/json; charset=utf-8';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  if (p.endsWith('.mp4')) return 'video/mp4';
  if (p.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

// Static server mirroring Vercel: api/ is functions (not files), no dotfiles, no tooling.
const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    if (/^\/(api|scripts|node_modules)\//.test(urlPath) || /\/\./.test(urlPath)) { res.writeHead(404); res.end(); return; }
    const filePath = path.join(ROOT, urlPath);
    if (!filePath.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end(); return; }
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise(r => server.listen(PORT, r));

const notifyLog = [];  // every intercepted POST /api/notify
const phEvents = [];   // every PostHog event, decoded
const waLog = [];      // every wa.me request (the link actually opening)
const pageErrors = [];
const discordFromBrowser = [];
const served = [];     // HTML/JS response bodies the browser received
let notifyMode = 'ok'; // ok | hang | abort | error500

async function armRoutes(context, mainPage, tag) {
  await context.route('https://eu.i.posthog.com/**', route =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: '1' }));
  await context.route('https://wa.me/**', route => {
    waLog.push({ tag, t: Date.now(), url: route.request().url() });
    return route.abort();
  });
  await context.route('https://api.whatsapp.com/**', route => route.abort());
  // Test traffic never reaches the real Discord channel: /api/notify stops here.
  // The exact bytes the browser sent are fed to the real handler (Discord recorded).
  await context.route('**/api/notify', async route => {
    const req = route.request();
    const entry = { tag, t: Date.now(), method: req.method(), headers: await req.allHeaders(), raw: req.postData() };
    try { entry.body = JSON.parse(entry.raw); } catch { entry.body = null; }
    notifyLog.push(entry);
    entry.handler = await runHandler(req.method(), asVercelBody(entry.raw));
    entry.content = entry.handler.discord[0]?.body?.content ?? null;
    try {
      if (notifyMode === 'hang') { await sleep(8000); await route.fulfill({ status: 200, body: '{}' }); }
      else if (notifyMode === 'abort') await route.abort('failed');
      else if (notifyMode === 'error500') await route.fulfill({ status: 500, body: 'boom' });
      else await route.fulfill({ status: entry.handler.status, contentType: 'application/json', body: JSON.stringify(entry.handler.body) });
    } catch {}
  });
  context.on('page', p => { if (p !== mainPage) p.close().catch(() => {}); });
}

function attachWatchers(page, tag) {
  page.on('request', req => {
    const url = req.url();
    if (/discord/i.test(new URL(url).hostname)) discordFromBrowser.push(url);
    if (url.includes('eu.i.posthog.com') && req.method() === 'POST') {
      const buf = req.postDataBuffer();
      if (!buf) return;
      // posthog-js gzips client-side but labels it text/plain; sniff the magic bytes.
      const isGzip = buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b;
      let body;
      try { body = JSON.parse(isGzip ? zlib.gunzipSync(buf).toString('utf8') : buf.toString('utf8')); } catch { return; }
      const events = Array.isArray(body?.batch) ? body.batch : [body];
      for (const ev of events) if (ev && ev.event) phEvents.push({ tag, ...ev });
    }
  });
  page.on('response', async r => {
    const ct = r.headers()['content-type'] || '';
    if (/html|javascript/.test(ct)) { try { served.push({ url: r.url(), text: await r.text() }); } catch {} }
  });
  page.on('pageerror', err => pageErrors.push({ tag, message: err.message }));
}

// posthog-js drops capture() for traffic it fingerprints as a bot (HeadlessChrome
// UA, navigator.webdriver). Spoof both; pre-dismiss camp badge and chat teaser.
async function prepare(page) {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true });
    try { sessionStorage.setItem('campBadgeSeen', '1'); sessionStorage.setItem('tmcTeaser', '1'); } catch {}
  });
}
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36';
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36';

const browser = await chromium.launch({ executablePath });

async function openSite(tag, { mobile = false, url = BASE, referer, extraInit } = {}) {
  const ctx = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: MOBILE_UA }
    : { viewport: { width: 1280, height: 900 }, userAgent: DESKTOP_UA });
  const page = await ctx.newPage();
  await prepare(page);
  if (extraInit) await page.addInitScript(extraInit);
  await armRoutes(ctx, page, tag);
  attachWatchers(page, tag);
  await page.goto(url, { waitUntil: 'load', referer });
  await page.waitForSelector('#load.gone', { state: 'attached', timeout: 15000 });
  await page.waitForTimeout(2500);
  return { ctx, page };
}

async function press(page, selector, { tap = false, last = false } = {}) {
  const loc = page.locator(selector);
  const el = last ? loc.last() : loc.first();
  await el.scrollIntoViewIfNeeded({ timeout: 8000 });
  if (tap) await el.tap({ timeout: 8000 }); else await el.click({ timeout: 8000 });
}

async function answerQuiz(page, count, pick = 'first') {
  for (let i = 0; i < count; i++) {
    const dotsBefore = await page.locator('#finderBody .f-dot.on').count();
    const opts = page.locator('#finderBody .f-opt');
    await (pick === 'last' ? opts.last() : opts.first()).click({ timeout: 8000 });
    await page.waitForFunction(n =>
      document.querySelectorAll('#finderBody .f-dot.on').length !== n ||
      !!document.querySelector('#finderBody .f-analyze'), dotsBefore, { timeout: 5000 }).catch(() => {});
  }
}

const since = (m, tag) => notifyLog.slice(m).filter(e => e.tag === tag);
const HERO = '#hero a[data-wa="join"]';
const FLOATING = '.dock a.fab.wa';

// ====================== A. SINGLE CLICK, FIVE CLICKS, SECOND BUTTON ======================
console.log('\n--- A. desktop: one click, five clicks, second button ---');
{
  const { ctx, page } = await openSite('A');
  const m0 = notifyLog.length;
  const clickT = Date.now();
  await press(page, HERO);
  await page.waitForTimeout(1500);
  const one = since(m0, 'A');
  const e = one[0];
  check('A1 one hero click → exactly one POST /api/notify', one.length === 1);
  check('A1 method POST, Content-Type application/json', e?.method === 'POST' && /application\/json/.test(e?.headers['content-type'] || ''));
  check('A1 payload: site=mizrachi, event=whatsapp_click, position=hero, number=academy, result=null',
    e?.body?.site === SITE && e.body.event === 'whatsapp_click' && e.body.position === 'hero' && e.body.number === ACADEMY && e.body.result === null);
  check('A1 payload has only the documented keys', e?.body && Object.keys(e.body).sort().join(',') === PAYLOAD_KEYS);
  check('A1 real handler accepts the exact browser payload → 200, one Discord message', e?.handler?.status === 200 && e.handler.discord.length === 1);
  check('A1 message: academy title, "כפתור ראשי", source ישיר, Jerusalem time',
    !!e?.content && e.content.includes(ACADEMY_TITLE) && e.content.includes('כפתור ראשי') && e.content.includes('מקור: ישיר') && hasJerusalemTime(e.content, clickT));

  for (let i = 0; i < 4; i++) { await press(page, HERO); await page.waitForTimeout(400); }
  await page.waitForTimeout(1500);
  check('A2 five clicks on the same hero button → still exactly ONE POST', since(m0, 'A').length === 1);
  const phHero = await waitFor(() => phEvents.filter(x => x.tag === 'A' && x.event === 'whatsapp_click' && x.properties?.position === 'hero').length >= 5 && true, 12000);
  check('A2 PostHog whatsapp_click (unchanged) still fired on all 5 clicks', phHero &&
    phEvents.filter(x => x.tag === 'A' && x.event === 'whatsapp_click' && x.properties?.position === 'hero').length === 5);

  await press(page, FLOATING);
  await page.waitForTimeout(1500);
  const two = since(m0, 'A');
  check('A3 hero then floating → TWO POSTs, second is whatsapp_click/floating',
    two.length === 2 && two[1].body?.event === 'whatsapp_click' && two[1].body?.position === 'floating');
  const keys = await page.evaluate(() => Object.keys(sessionStorage).filter(k => k.startsWith('tmAlert:')).sort().join('|'));
  check(`A3 sessionStorage flood keys are event+position (${keys})`, keys === 'tmAlert:whatsapp_click:floating|tmAlert:whatsapp_click:hero');
  await ctx.close();
}

// ====================== S. TRAFFIC SOURCE ======================
console.log('\n--- S. traffic source from a real navigation ---');
{
  const { ctx, page } = await openSite('S-utm', { url: BASE + '?utm_source=ig_story&utm_medium=bio', referer: 'https://l.instagram.com/' });
  const m0 = notifyLog.length;
  await press(page, 'nav#nav a.ncta');
  await page.waitForTimeout(1500);
  const e = since(m0, 'S-utm')[0];
  check('S1 utm_source + referrer both sent; message shows utm_source',
    e?.body?.utm_source === 'ig_story' && e.body.referrer === 'l.instagram.com' && !!e.content && e.content.includes('מקור: `ig_story`'));
  await ctx.close();
}
{
  const { ctx, page } = await openSite('S-ref', { referer: 'https://www.facebook.com/' });
  const m0 = notifyLog.length;
  await press(page, 'nav#nav a.ncta');
  await page.waitForTimeout(1500);
  const e = since(m0, 'S-ref')[0];
  check('S2 no utm → referring domain in payload and message',
    e?.body?.utm_source === null && e.body.referrer === 'www.facebook.com' && !!e.content && e.content.includes('מקור: `www.facebook.com`'));
  await ctx.close();
}

// ====================== M. MOBILE: FIVE TAPS ======================
console.log('\n--- M. mobile: five real taps on one button ---');
{
  const { ctx, page } = await openSite('M', { mobile: true });
  const m0 = notifyLog.length;
  for (let i = 0; i < 5; i++) { await press(page, HERO, { tap: true }); await page.waitForTimeout(500); }
  await page.waitForTimeout(1500);
  const got = since(m0, 'M');
  check('M five taps on hero (touch) → exactly ONE POST, handler 200',
    got.length === 1 && got[0].body?.event === 'whatsapp_click' && got[0].body?.position === 'hero' && got[0].handler?.status === 200);
  check('M WhatsApp opened on every tap (5 wa.me requests)', waLog.filter(w => w.tag === 'M').length === 5);
  await ctx.close();
}

// ====================== B. QUIZ ======================
console.log('\n--- B. quiz: complete, retake, then WhatsApp ---');
{
  const { ctx, page } = await openSite('B');
  await page.locator('#finder').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const m0 = notifyLog.length;
  await answerQuiz(page, 4, 'first');
  await page.waitForSelector('#finderBody .f-result', { timeout: 10000 });
  await page.waitForTimeout(1500);
  const q = since(m0, 'B');
  const e = q[0];
  check('B1 quiz completion → exactly one POST', q.length === 1);
  check('B1 payload: event=quiz_complete, non-empty result, position/number null',
    e?.body?.event === 'quiz_complete' && typeof e.body.result === 'string' && e.body.result.length > 0 && e.body.position === null && e.body.number === null);
  const phQuiz = await waitFor(() => phEvents.find(x => x.tag === 'B' && x.event === 'quiz_complete'), 12000);
  check(`B1 result "${e?.body?.result}" equals PostHog quiz_complete result`, !!phQuiz && phQuiz.properties?.result === e?.body?.result);
  check('B1 handler 200; message has quiz title and the result', e?.handler?.status === 200 && !!e.content && e.content.includes(QUIZ_TITLE) && e.content.includes('`' + e.body.result + '`'));

  await page.locator('#fReset').click();
  await page.waitForSelector('#finderBody .f-opt', { timeout: 5000 });
  await answerQuiz(page, 4, 'last');
  await page.waitForSelector('#finderBody .f-result', { timeout: 10000 });
  await page.waitForTimeout(1500);
  const phBoth = await waitFor(() => phEvents.filter(x => x.tag === 'B' && x.event === 'quiz_complete').length >= 2 && true, 12000);
  const retakeResult = phEvents.filter(x => x.tag === 'B' && x.event === 'quiz_complete')[1]?.properties?.result;
  check(`B2 retake in same session (result "${retakeResult}") → NO second quiz_complete POST`,
    since(m0, 'B').filter(x => x.body?.event === 'quiz_complete').length === 1);
  check('B2 PostHog still recorded both quiz_complete events', !!phBoth);

  await press(page, '#finderBody .f-actions a.btn-wa');
  await page.waitForTimeout(1500);
  const all = since(m0, 'B');
  check('B3 quiz completed, then WhatsApp tapped → TWO POSTs (quiz_complete, whatsapp_click/quiz-result)',
    all.length === 2 && all[1].body?.event === 'whatsapp_click' && all[1].body?.position === 'quiz-result');
  await ctx.close();
}

// ====================== C. SIGNATURE vs ACADEMY ======================
console.log('\n--- C. signature_click vs whatsapp_click from the same listener ---');
{
  const { ctx, page } = await openSite('C');
  // /api/chat (the Groq proxy) is replaced by a fixed reply so the bot "gives out"
  // both numbers; the anchors the site renders from it are the thing under test.
  const reply = `עילי זמין כאן: https://wa.me/${ILAY}\nולאקדמיה: https://wa.me/${ACADEMY}`;
  await ctx.route('**/api/chat', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ choices: [{ message: { content: reply } }] }),
  }));
  const m0 = notifyLog.length;
  const settle = () => page.waitForTimeout(1200);
  await press(page, 'nav#nav a.ncta'); await settle();
  await press(page, 'footer a.cb-cta'); await settle();
  await press(page, 'footer a.credit'); await settle();
  await page.locator('#tmcFab').click();
  await page.waitForSelector('#tmcPanel.open', { timeout: 5000 });
  await page.waitForTimeout(2500);
  await press(page, '#tmcPanel .tmc-brand .lh a'); await settle();
  await page.locator('#tmcInput').fill('איך יוצרים קשר עם עילי?');
  await page.locator('#tmcInput').press('Enter');
  await page.waitForSelector(`#tmcMsgs .tmc-bot a[href*="${ACADEMY}"]`, { timeout: 15000 });
  await page.waitForTimeout(800);
  await press(page, `#tmcMsgs .tmc-bot a[href*="${ILAY}"]`, { last: true }); await settle();
  await press(page, `#tmcMsgs .tmc-bot a[href*="${ACADEMY}"]`, { last: true }); await settle();

  const expected = [
    ['nav', 'whatsapp_click', ACADEMY],
    ['creator-band', 'signature_click', ILAY],
    ['credit', 'signature_click', ILAY],
    ['chat-credit', 'signature_click', ILAY],
    ['chat-message', 'signature_click', ILAY],
    ['chat-message', 'whatsapp_click', ACADEMY],
  ];
  const got = since(m0, 'C');
  check(`C six distinct touchpoints → six POSTs (got ${got.length})`, got.length === 6);
  expected.forEach(([pos, ev, num], i) => {
    const g = got[i]?.body;
    check(`C${i + 1} ${pos} → event=${ev}, number=${num}, handler 200`,
      g?.position === pos && g.event === ev && g.number === num && got[i].handler?.status === 200);
  });
  const chatPair = got.filter(x => x.body?.position === 'chat-message');
  check('C same position "chat-message": two POSTs that differ in event AND number',
    chatPair.length === 2 && chatPair[0].body.event !== chatPair[1].body.event && chatPair[0].body.number !== chatPair[1].body.number);
  const sig = got.filter(x => x.body?.event === 'signature_click');
  const aca = got.filter(x => x.body?.event === 'whatsapp_click');
  check('C Discord text: every signature message has the signature title and never the academy title',
    sig.length === 4 && sig.every(x => x.content?.includes(SIGNATURE_TITLE) && !x.content.includes(ACADEMY_TITLE)));
  check('C Discord text: every academy message has the academy title and never the signature title',
    aca.length === 2 && aca.every(x => x.content?.includes(ACADEMY_TITLE) && !x.content.includes(SIGNATURE_TITLE)));
  await waitFor(() => phEvents.filter(x => x.tag === 'C' && x.event === 'whatsapp_click').length >= 6 && true, 12000);
  const phC = phEvents.filter(x => x.tag === 'C' && x.event === 'whatsapp_click');
  check('C PostHog whatsapp_click (unchanged event name) fired for all 6 with matching position+number',
    phC.length === 6 && expected.every(([pos, , num], i) => phC[i]?.properties?.position === pos && phC[i]?.properties?.number === num));
  await ctx.close();
}

// ====================== D. NAVIGATION NOT DELAYED ======================
console.log('\n--- D. WhatsApp opens regardless of /api/notify ---');
const dRows = [];
{
  const modes = ['ok', 'hang', 'abort', 'error500', 'fetch-throws'];
  let baseline = null;
  for (const mode of modes) {
    notifyMode = mode === 'fetch-throws' ? 'ok' : mode;
    const tag = 'D-' + mode;
    const extraInit = mode === 'fetch-throws'
      ? () => { const f = window.fetch; window.fetch = function (u) { if (String(u).includes('/api/notify')) throw new Error('notify-boom'); return f.apply(this, arguments); }; }
      : undefined;
    const { ctx, page } = await openSite(tag, { extraInit });
    await page.evaluate(() => { window.__dp = []; window.addEventListener('click', e => window.__dp.push(e.defaultPrevented)); });
    const w0 = waLog.length, m0 = notifyLog.length;
    const tClick = Date.now();
    await press(page, HERO);
    const wa = await waitFor(() => waLog.slice(w0).find(x => x.tag === tag), 5000);
    await page.waitForTimeout(300);
    const n = notifyLog.slice(m0).find(x => x.tag === tag);
    const dp = await page.evaluate(() => window.__dp);
    const clickToWa = wa ? wa.t - tClick : null;
    if (mode === 'ok') baseline = clickToWa;
    dRows.push({ mode, notify_sent: !!n, whatsapp_opened: !!wa, click_to_wa_ms: clickToWa, notify_to_wa_ms: n && wa ? wa.t - n.t : null, defaultPrevented: dp.join(',') });

    check(`D[${mode}] wa.me opened with the academy number`, !!wa && wa.url.includes(ACADEMY));
    check(`D[${mode}] click was not defaultPrevented`, dp.length > 0 && dp.every(x => x === false));
    check(`D[${mode}] no uncaught page error`, pageErrors.filter(x => x.tag === tag).length === 0);
    if (mode !== 'ok' && baseline != null) check(`D[${mode}] click→WhatsApp ${clickToWa}ms is within baseline ${baseline}ms + 500ms`, clickToWa != null && clickToWa <= baseline + 500);
    if (mode === 'hang') check('D[hang] WhatsApp opened <1000ms after notify was issued while its response was held 8s', !!n && !!wa && wa.t - n.t < 1000);
    if (mode === 'fetch-throws') check('D[fetch-throws] fetch threw synchronously → no notify request, link still opened', !n && !!wa);
    else check(`D[${mode}] notify request was issued`, !!n);
    await ctx.close();
  }
  notifyMode = 'ok';
}

await browser.close();
server.close();

// ====================== E. SECRET ABSENCE ======================
console.log('\n--- E. webhook URL absence ---');
{
  const leaks = text => NEEDLES.some(n => text.includes(n));
  const rawIndex = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  check(`E served HTML/JS responses (${served.length}) contain no webhook URL`, served.length > 0 && !served.some(s => leaks(s.text)));
  check('E index.html on disk contains no webhook URL', !leaks(rawIndex));
  const notifySrc = readFileSync(path.join(ROOT, 'api', 'notify.js'), 'utf8');
  check('E api/notify.js reads process.env.DISCORD_WEBHOOK_URL and has no http(s) URL literal',
    notifySrc.includes('process.env.DISCORD_WEBHOOK_URL') && !/https?:\/\//.test(notifySrc));
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: ROOT })
    .toString().split('\0').filter(Boolean);
  let scanned = 0, skipped = 0;
  const leaking = [];
  for (const f of files) {
    const full = path.join(ROOT, f);
    let size;
    try { size = statSync(full).size; } catch { continue; }
    if (size > 5 * 1024 * 1024) { skipped++; continue; }
    const buf = readFileSync(full);
    scanned++;
    if (NEEDLES.some(n => buf.includes(Buffer.from(n)))) leaking.push(f);
  }
  check(`E no committable file contains a webhook URL (scanned ${scanned}, skipped ${skipped} >5MB media; .env is git-ignored)`, leaking.length === 0);
  if (leaking.length) console.log('  leaking files:', leaking.join(', '));
  check('E .env is git-ignored', (() => { try { execFileSync('git', ['check-ignore', '-q', '.env'], { cwd: ROOT }); return true; } catch { return false; } })());
  check('E browser sent zero requests to any Discord host', discordFromBrowser.length === 0);
  check('E handler error logs never contain the webhook URL', !loggedErrors.some(l => l.includes(FAKE_WEBHOOK) || leaks(l)));
  console.log(REAL_WEBHOOK
    ? 'INFO — the real webhook value from .env was included in every absence check above (value not printed).'
    : 'UNKNOWN — .env has no DISCORD_WEBHOOK_URL; absence checks used only the generic webhook path.');
  console.log('UNKNOWN — the deployed production bundle was not scanned (nothing is deployed from this branch).');
}

// ====================== REPORT ======================
console.log('\n--- Intercepted POST /api/notify (all scenarios) ---');
console.table(notifyLog.map(e => ({
  scenario: e.tag, event: e.body?.event, position: e.body?.position, number: e.body?.number,
  result: e.body?.result, utm: e.body?.utm_source, referrer: e.body?.referrer, handler: e.handler?.status,
})));
console.log('\n--- Navigation timing ---');
console.table(dRows);

const sample = ev => notifyLog.find(e => e.body?.event === ev && e.content)?.content;
console.log('\n--- Sample Discord messages as the handler built them (not sent) ---');
for (const ev of ['whatsapp_click', 'signature_click', 'quiz_complete']) console.log(`[${ev}]\n${sample(ev)}\n`);
if (pageErrors.length) console.log('Page errors seen:', pageErrors);

const allEventMatchesNumber = notifyLog.every(e => e.body && ((e.body.number === ILAY) === (e.body.event === 'signature_click')));
check(`GLOBAL every one of ${notifyLog.length} POSTs: number===Ilay ⇔ event===signature_click`, notifyLog.length > 0 && allEventMatchesNumber);

console.log('\nSCOPE: this proves the browser builds and sends the correct request and that the handler validates and formats it.');
console.log('It does NOT prove Discord receives anything — only a real phone tap on production proves delivery.');
console.log(pass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(pass ? 0 : 1);
