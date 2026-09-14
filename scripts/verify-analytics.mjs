// Verifies the PostHog install on index.html: pageview, delegated WhatsApp
// click tracking on every touchpoint, the quiz funnel, autocapture off, and
// the site super property. Serves the repo statically, drives a real browser,
// and intercepts network calls to eu.i.posthog.com so no events reach the
// live project. Adapted from portfolio/scripts/verify-analytics.mjs.
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = 5545;
const BASE = `http://127.0.0.1:${PORT}/`;
const SITE = 'mizrachi';
const ACADEMY = '972587777750';
const ILAY = '972556648938';

// Playwright's bundled browser download is blocked in this sandbox network,
// so drive the system-installed Chrome instead.
const CHROME_CANDIDATES = [
  String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  String.raw`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
  String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
  String.raw`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
];
const executablePath = CHROME_CANDIDATES.find(p => existsSync(p));
if (!executablePath) {
  console.error('No local Chrome/Edge install found to drive Playwright with.');
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

// Plain static server: /api/chat is NOT served, so a chat send 404s and the
// site renders its real error bubble (which contains a wa.me link).
const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(ROOT, urlPath);
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise(r => server.listen(PORT, r));

const allEvents = []; // every posthog event intercepted, tagged by pass

function attachCapture(page, tag) {
  page.on('request', req => {
    const url = req.url();
    if (url.includes('eu.i.posthog.com') && req.method() === 'POST') {
      const buf = req.postDataBuffer();
      if (!buf) return;
      // posthog-js gzips the payload client-side but still sends
      // content-type: text/plain (to dodge a CORS preflight), so detect the
      // gzip magic bytes rather than trusting the header.
      const isGzip = buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b;
      let text;
      try { text = isGzip ? zlib.gunzipSync(buf).toString('utf8') : buf.toString('utf8'); }
      catch { return; }
      let body;
      try { body = JSON.parse(text); } catch { return; }
      const events = Array.isArray(body?.batch) ? body.batch : [body];
      for (const ev of events) if (ev && ev.event) allEvents.push({ tag, ...ev });
    }
  });
}

async function armRoutes(context, mainPage) {
  // Never let test traffic hit the live PostHog project.
  await context.route('https://eu.i.posthog.com/**', route =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: '1' }));
  // Never let test clicks actually open WhatsApp / hit its network.
  await context.route('https://wa.me/**', route => route.abort());
  await context.route('https://api.whatsapp.com/**', route => route.abort());
  // target="_blank" anchors open a popup; close it (never the main page).
  context.on('page', p => { if (p !== mainPage) p.close().catch(() => {}); });
}

// posthog-js silently drops every capture() call for traffic it fingerprints
// as a bot (default blocklist matches "HeadlessChrome" in the UA, plus a
// navigator.webdriver check). Spoof both so the test observes what a real
// visitor's browser sends. Also pre-dismiss the camp badge and chat teaser
// (sessionStorage flags the site itself sets) so they don't cover targets.
async function prepare(page) {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true });
    try { sessionStorage.setItem('campBadgeSeen', '1'); sessionStorage.setItem('tmcTeaser', '1'); } catch {}
  });
}
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36';
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36';

const results = []; // one row per touchpoint click

async function waitForEvent(fromIndex, name, timeout = 10000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    const hit = allEvents.slice(fromIndex).find(e => e.event === name);
    if (hit) return hit;
    await new Promise(r => setTimeout(r, 150));
  }
  return null;
}

async function waitForCount(fromIndex, name, n, timeout = 10000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (allEvents.slice(fromIndex).filter(e => e.event === name).length >= n) return true;
    await new Promise(r => setTimeout(r, 150));
  }
  return false;
}

// Real pointer interaction: Playwright scrolls, checks the element is the
// hit-target, then clicks (desktop) or taps (mobile). No force.
async function hit(page, selector, label, { pass, expectPos, expectNum, nth = 0, tap = false }) {
  const before = allEvents.length;
  let error = null;
  try {
    const el = page.locator(selector).nth(nth);
    await el.scrollIntoViewIfNeeded({ timeout: 8000 });
    if (tap) await el.tap({ timeout: 8000 }); else await el.click({ timeout: 8000 });
  } catch (e) {
    error = e.message.split('\n')[0];
  }
  const seen = error ? null : await waitForEvent(before, 'whatsapp_click');
  results.push({ pass, label, expectPos, expectNum, fired: !!seen, props: seen?.properties ?? null, error });
}

async function answerQuiz(page, count) {
  for (let i = 0; i < count; i++) {
    const dotsBefore = await page.locator('#finderBody .f-dot.on').count();
    await page.locator('#finderBody .f-opt').first().click({ timeout: 8000 });
    if (i < count - 1 || dotsBefore < 4) {
      // wait for the next question (180ms site delay) or the analyzing screen
      await page.waitForFunction(n =>
        document.querySelectorAll('#finderBody .f-dot.on').length !== n ||
        !!document.querySelector('#finderBody .f-analyze'), dotsBefore, { timeout: 5000 });
    }
  }
}

async function toggleLang(page) {
  await page.locator('#langBtn').click();
  await page.waitForTimeout(900); // veil down (340ms) → swap → veil up
}

const quizLog = {}; // named slices of quiz events for assertions

const browser = await chromium.launch({ executablePath });

// ====================== DESKTOP PASS ======================
const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: DESKTOP_UA });
const page = await desktopCtx.newPage();
await prepare(page);
await armRoutes(desktopCtx, page);
attachCapture(page, 'desktop');
await page.goto(BASE, { waitUntil: 'load' });
await page.waitForSelector('#load.gone', { state: 'attached', timeout: 15000 });
await page.waitForTimeout(2500); // array.js load + initial $pageview flush
const D = { pass: 'desktop' };

// --- static data-wa anchors ---
await hit(page, 'nav#nav a.ncta', 'nav CTA', { ...D, expectPos: 'nav', expectNum: ACADEMY });
await hit(page, '#hero a[data-wa="join"]', 'hero CTA', { ...D, expectPos: 'hero', expectNum: ACADEMY });
await hit(page, '#promo a[data-wa="join"]', 'promo CTA', { ...D, expectPos: 'promo', expectNum: ACADEMY });
await hit(page, '#disc .disc-head a[data-wa]', 'disciplines header', { ...D, expectPos: 'disc-head', expectNum: ACADEMY });
await hit(page, '#coaches .coach-head a[data-wa]', 'coaches header', { ...D, expectPos: 'coaches-head', expectNum: ACADEMY });
await hit(page, '#wins .wins-head a[data-wa]', 'wins header', { ...D, expectPos: 'wins-head', expectNum: ACADEMY });
await hit(page, '#wins .wins-foot a[data-wa]', 'wins footer CTA', { ...D, expectPos: 'wins-foot', expectNum: ACADEMY });
await hit(page, '#cta a[data-wa]', 'final CTA section', { ...D, expectPos: 'cta', expectNum: ACADEMY });
await hit(page, 'footer .foot-socials a[data-wa]', 'footer WhatsApp icon', { ...D, expectPos: 'footer', expectNum: ACADEMY });
await hit(page, '.dock a.fab.wa', 'floating dock button', { ...D, expectPos: 'floating', expectNum: ACADEMY });
// --- static literal hrefs ---
await hit(page, 'footer a.cb-cta', 'creator band CTA', { ...D, expectPos: 'creator-band', expectNum: ILAY });
await hit(page, 'footer a.credit', 'footer credit', { ...D, expectPos: 'credit', expectNum: ILAY });
// --- context menu (right-click) ---
{
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.mouse.move(640, 420);
  await page.mouse.click(640, 420, { button: 'right' });
  await page.waitForSelector('#ctx.show', { timeout: 5000 });
  await hit(page, '#ctx a[data-wa]', 'right-click context menu', { ...D, expectPos: 'ctxmenu', expectNum: ACADEMY });
}
// --- innerHTML-built: discipline cards ---
for (let i = 0; i < 6; i++) {
  await hit(page, '#discGrid a.disc-card', `discipline card ${i + 1}`, { ...D, nth: i, expectPos: `disc-card-${i + 1}`, expectNum: ACADEMY });
}
// --- innerHTML-built: schedule private-lesson chips (only the active day is visible) ---
for (const day of ['sun', 'mon', 'tue', 'wed', 'thu']) {
  await page.locator('#sched').scrollIntoViewIfNeeded();
  await page.locator(`#tabs .tab[data-day="${day}"]`).click();
  await page.waitForTimeout(400);
  const sel = `#schedBody .day[data-day="${day}"] a.chip[href*="wa.me"]`;
  const n = await page.locator(sel).count();
  if (n !== 2) results.push({ pass: 'desktop', label: `schedule ${day}: expected 2 WhatsApp chips, found ${n}`, fired: false, props: null, error: 'chip count' });
  await hit(page, sel, `schedule ${day} private (HaYarok)`, { ...D, nth: 0, expectPos: `sched-${day}-hayarok`, expectNum: ACADEMY });
  await hit(page, sel, `schedule ${day} private (CENTER)`, { ...D, nth: 1, expectPos: `sched-${day}-center`, expectNum: ACADEMY });
}

// --- QUIZ FUNNEL ---
{
  await page.locator('#finder').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const quizNames = ['quiz_start', 'quiz_step', 'quiz_complete'];
  const quizSlice = from => allEvents.slice(from).filter(e => e.tag === 'desktop' && quizNames.includes(e.event));

  // Nothing fired by page-load renderFinder(0) or by a language toggle.
  await page.waitForTimeout(3500);
  quizLog.beforeAnyAnswer = quizSlice(0);
  const mLoad = allEvents.length;
  await toggleLang(page); await toggleLang(page); // renderFinder(0) twice more, back to he
  await page.waitForTimeout(3500);
  quizLog.afterLangToggleNoAnswer = quizSlice(mLoad);

  // Attempt A: clean full run.
  const mA = allEvents.length;
  await answerQuiz(page, 4);
  await page.waitForSelector('#finderBody .f-result', { timeout: 10000 });
  await waitForEvent(mA, 'quiz_complete');
  await page.waitForTimeout(3500);
  quizLog.attemptA = quizSlice(mA);

  // Quiz-result WhatsApp touchpoint.
  await hit(page, '#finderBody .f-actions a.btn-wa', 'quiz result CTA', { ...D, expectPos: 'quiz-result', expectNum: ACADEMY });

  // Attempt B (retake): Q1, Q2, then the only UI path that re-shows Q1
  // mid-attempt (language toggle → renderFinder(0), fState kept), re-answer
  // Q1, then finish.
  const mB = allEvents.length;
  await page.locator('#fReset').click();
  await page.waitForSelector('#finderBody .f-opt', { timeout: 5000 });
  await answerQuiz(page, 2);
  const dotsBeforeToggle = await page.locator('#finderBody .f-dot.on').count();
  await toggleLang(page);
  quizLog.q1ReshownAfterToggle = (await page.locator('#finderBody .f-dot.on').count()) === 1 && dotsBeforeToggle === 3;
  await answerQuiz(page, 4); // re-answer Q1, then Q2..Q4
  await page.waitForSelector('#finderBody .f-result', { timeout: 10000 });
  await waitForEvent(mB, 'quiz_complete');
  await page.waitForTimeout(3500);
  quizLog.attemptB = quizSlice(mB);
  await toggleLang(page); // back to he
}

// --- CHAT: runtime-only anchors ---
{
  await page.locator('#tmcFab').click();
  await page.waitForSelector('#tmcPanel.open', { timeout: 5000 });
  await page.waitForTimeout(2500); // greeting typewriter
  await hit(page, '#tmcPanel .tmc-brand .lh a', 'chat "powered by" credit (he)', { ...D, expectPos: 'chat-credit', expectNum: ILAY });

  // Real failure path: static server has no /api/chat → site's error bubble with a wa.me link.
  await page.locator('#tmcInput').fill('שלום');
  await page.locator('#tmcInput').press('Enter');
  await page.waitForSelector('#tmcMsgs .tmc-bot a[href*="wa.me"]', { timeout: 10000 });
  await hit(page, '#tmcMsgs .tmc-bot a[href*="wa.me"]', 'chat error-message link', { ...D, nth: 0, expectPos: 'chat-message', expectNum: ACADEMY });

  // AI reply + booking card. /api/chat (the Groq proxy) is stubbed with a
  // fixed reply; the thing under test — click tracking on the anchors the
  // site renders from that reply — is not mocked.
  const reply = 'מעולה! אפשר גם בוואטסאפ: https://wa.me/972587777750\n<<<BOOKING>>>{"name":"Test User","phone":"0500000000","age":"30","interest":"MMA","day":"גמיש"}<<<END>>>';
  await page.route('**/api/chat', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ choices: [{ message: { content: reply } }] }),
  }));
  await page.locator('#tmcInput').fill('רוצה לקבוע');
  await page.locator('#tmcInput').press('Enter');
  await page.waitForSelector('#tmcMsgs .tmc-booking a', { timeout: 15000 });
  await hit(page, '#tmcMsgs .tmc-bot a[href*="wa.me"]', 'chat AI-reply link', { ...D, nth: 1, expectPos: 'chat-message', expectNum: ACADEMY });
  await hit(page, '#tmcMsgs .tmc-booking a', 'chat booking confirm card', { ...D, expectPos: 'chat-booking', expectNum: ACADEMY });

  // English "powered by" credit is display:none in he — switch language to reach it.
  await page.locator('#tmcClose').click();
  await page.waitForTimeout(500);
  await toggleLang(page);
  await page.locator('#tmcFab').click();
  await page.waitForSelector('#tmcPanel.open', { timeout: 5000 });
  await page.waitForTimeout(600);
  await hit(page, '#tmcPanel .tmc-brand .le a', 'chat "powered by" credit (en)', { ...D, expectPos: 'chat-credit', expectNum: ILAY });
}

await page.waitForTimeout(3500);
const desktopPageviews = allEvents.filter(e => e.tag === 'desktop' && e.event === '$pageview');
await desktopCtx.close();

// ====================== MOBILE PASS (touch taps) ======================
const mobileCtx = await browser.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: MOBILE_UA,
});
const mpage = await mobileCtx.newPage();
await prepare(mpage);
await armRoutes(mobileCtx, mpage);
attachCapture(mpage, 'mobile');
await mpage.goto(BASE, { waitUntil: 'load' });
await mpage.waitForSelector('#load.gone', { state: 'attached', timeout: 15000 });
await mpage.waitForTimeout(2500);
const M = { pass: 'mobile', tap: true };

await hit(mpage, '#hero a[data-wa="join"]', 'hero CTA', { ...M, expectPos: 'hero', expectNum: ACADEMY });
await hit(mpage, '.dock a.fab.wa', 'floating dock button', { ...M, expectPos: 'floating', expectNum: ACADEMY });
await hit(mpage, '#discGrid a.disc-card', 'discipline card 1', { ...M, nth: 0, expectPos: 'disc-card-1', expectNum: ACADEMY });
await hit(mpage, '#schedBody .day.on a.chip[href*="wa.me"]', 'schedule sun private (HaYarok)', { ...M, nth: 0, expectPos: 'sched-sun-hayarok', expectNum: ACADEMY });
await hit(mpage, '#cta a[data-wa]', 'final CTA section', { ...M, expectPos: 'cta', expectNum: ACADEMY });
{
  await mpage.locator('#finder').scrollIntoViewIfNeeded();
  const mQ = allEvents.length;
  for (let i = 0; i < 4; i++) {
    const dots = await mpage.locator('#finderBody .f-dot.on').count();
    await mpage.locator('#finderBody .f-opt').first().tap({ timeout: 8000 });
    await mpage.waitForFunction(n =>
      document.querySelectorAll('#finderBody .f-dot.on').length !== n ||
      !!document.querySelector('#finderBody .f-analyze'), dots, { timeout: 5000 }).catch(() => {});
  }
  await mpage.waitForSelector('#finderBody .f-result', { timeout: 10000 });
  await waitForEvent(mQ, 'quiz_complete');
  await mpage.waitForTimeout(3500);
  quizLog.mobile = allEvents.slice(mQ).filter(e => ['quiz_start', 'quiz_step', 'quiz_complete'].includes(e.event));
  await hit(mpage, '#finderBody .f-actions a.btn-wa', 'quiz result CTA', { ...M, expectPos: 'quiz-result', expectNum: ACADEMY });
}
await mpage.evaluate(() => window.scrollTo(0, 0));
await mpage.waitForTimeout(600);
await mpage.locator('#burger').tap();
await mpage.waitForSelector('#mnav.open', { state: 'attached' });
await mpage.waitForTimeout(700);
await hit(mpage, '#mnav a.mcta', 'mobile menu CTA', { ...M, expectPos: 'mnav', expectNum: ACADEMY });

await mpage.waitForTimeout(3500);
const mobilePageviews = allEvents.filter(e => e.tag === 'mobile' && e.event === '$pageview');
await mobileCtx.close();
await browser.close();
server.close();

// ====================== REPORT ======================
console.log('\n--- WhatsApp touchpoint table ---');
console.table(results.map(r => ({
  pass: r.pass,
  touchpoint: r.label,
  fired: r.fired ? 'yes' : 'NO',
  position: r.props?.position ?? (r.error ? `ERR: ${r.error.slice(0, 60)}` : 'null'),
  expected_pos: r.expectPos ?? '',
  number: r.props?.number ?? 'null',
  method: r.props?.method ?? 'null',
  site: r.props?.site ?? 'null',
})));

const fmt = evs => evs.map(e => e.event + (e.properties?.step_index !== undefined ? `(${e.properties.step_index})` : '') +
  (e.properties?.result !== undefined ? `(${e.properties.result})` : '')).join(' → ') || '(none)';
console.log('\n--- Quiz event sequences ---');
console.log('page load, no answer       :', fmt(quizLog.beforeAnyAnswer));
console.log('2x lang toggle, no answer  :', fmt(quizLog.afterLangToggleNoAnswer));
console.log('attempt A (clean run)      :', fmt(quizLog.attemptA));
console.log('attempt B (retake+re-Q1)   :', fmt(quizLog.attemptB));
console.log('mobile run                 :', fmt(quizLog.mobile));

// ====================== ASSERTIONS ======================
let pass = true;
function check(name, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + ' — ' + name);
  if (!cond) pass = false;
}
console.log('\n--- Assertions ---');
check('exactly one $pageview for the desktop load (whole pass)', desktopPageviews.length === 1);
check('exactly one $pageview for the mobile load (whole pass)', mobilePageviews.length === 1);

for (const r of results) {
  const tag = `[${r.pass}] ${r.label}`;
  check(`${tag}: whatsapp_click fired`, r.fired);
  if (r.fired) {
    check(`${tag}: position non-null and === "${r.expectPos}"`, r.props?.position != null && r.props.position === r.expectPos);
    check(`${tag}: number non-null and === ${r.expectNum}`, r.props?.number != null && r.props.number === r.expectNum);
  }
}
// 36 WhatsApp anchors exist: 12 static data-wa + 4 static literal hrefs +
// 16 innerHTML-built on load + 4 runtime-only (quiz result, chat error link,
// chat AI-reply link, booking card). mnav is only rendered at <=760px, so it
// is covered by the mobile pass; the other 35 by the desktop pass.
const uniqueDesktop = new Set(results.filter(r => r.pass === 'desktop').map(r => r.label));
const uniqueAll = new Set(results.map(r => r.label));
check(`desktop pass covered ${uniqueDesktop.size} distinct touchpoints (expected 35)`, uniqueDesktop.size === 35);
check(`both passes together covered ${uniqueAll.size} distinct touchpoints (expected 36)`, uniqueAll.size === 36);

const count = (evs, name) => evs.filter(e => e.event === name).length;
const steps = evs => evs.filter(e => e.event === 'quiz_step').map(e => e.properties?.step_index);
check('no quiz events from page-load renderFinder(0)', quizLog.beforeAnyAnswer.length === 0);
check('no quiz events from language toggles without an answer', quizLog.afterLangToggleNoAnswer.length === 0);
check('attempt A: quiz_start fires exactly once', count(quizLog.attemptA, 'quiz_start') === 1);
check('attempt A: quiz_start precedes first quiz_step', quizLog.attemptA[0]?.event === 'quiz_start');
check('attempt A: quiz_step step_index sequence is exactly 0,1,2,3', JSON.stringify(steps(quizLog.attemptA)) === '[0,1,2,3]');
const completeA = quizLog.attemptA.filter(e => e.event === 'quiz_complete');
check('attempt A: quiz_complete fires exactly once with non-null result', completeA.length === 1 && completeA[0].properties?.result != null);
check('attempt B: Q1 was re-shown mid-attempt by the language toggle', quizLog.q1ReshownAfterToggle === true);
check('attempt B: re-answering Q1 mid-attempt did NOT emit a second quiz_start', count(quizLog.attemptB, 'quiz_start') === 1);
check('attempt B (retake): emitted its own quiz_start', count(quizLog.attemptB, 'quiz_start') === 1);
check('attempt B: quiz_complete fires with non-null result', count(quizLog.attemptB, 'quiz_complete') === 1 &&
  quizLog.attemptB.find(e => e.event === 'quiz_complete').properties?.result != null);
check('desktop total quiz_start === 2 (attempt + retake)', count(allEvents.filter(e => e.tag === 'desktop'), 'quiz_start') === 2);
check('mobile run: 1 start, steps 0,1,2,3, 1 complete with result', count(quizLog.mobile, 'quiz_start') === 1 &&
  JSON.stringify(steps(quizLog.mobile)) === '[0,1,2,3]' && count(quizLog.mobile, 'quiz_complete') === 1 &&
  quizLog.mobile.find(e => e.event === 'quiz_complete')?.properties?.result != null);

const autocaptureEvents = allEvents.filter(e => e.event === '$autocapture');
check('zero $autocapture events anywhere', autocaptureEvents.length === 0);
const missingSite = allEvents.filter(e => e.properties?.site !== SITE);
check(`every intercepted event carries site="${SITE}" (${allEvents.length} events)`, allEvents.length > 0 && missingSite.length === 0);
if (missingSite.length) console.log('  events missing site:', missingSite.map(e => e.event).join(', '));

const byName = {};
for (const e of allEvents) byName[e.event] = (byName[e.event] || 0) + 1;
console.log(`\nTotal PostHog events intercepted: ${allEvents.length}`, byName);
console.log(pass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(pass ? 0 : 1);
