// The workbook bridge in a real embed: a localhost parent page with the game in an iframe at ?level=4.
// Checks `ready` before `level-start` for the deep-linked case, `level-complete` after the case is won
// (each postcard pinned at its true spot), and that a standalone page posts nothing.
// Needs the dev server on :5244 (or BASE=http://localhost:4244/ for `npm run preview`).  Usage: node tests/host-embed.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';

const GAME = process.env.BASE ?? 'http://localhost:5244/';
const LEVEL = 4;
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const parent = createServer((_, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(`<body style="margin:0"><script>window.msgs=[];addEventListener('message',e=>msgs.push({origin:e.origin,...e.data}))</script><iframe id="g" src="${GAME}?level=${LEVEL}" style="width:100vw;height:100vh;border:0"></iframe></body>`);
}).listen(4998);
await page.goto('http://localhost:4998/');
const frame = await (await page.waitForSelector('#g')).contentFrame();
await frame.waitForFunction(() => window.__ld?.mode === 'explore', null, { timeout: 60000 });
const opened = await frame.evaluate(() => window.__ld.session.def.id);
// Win the case: every postcard pinned at its true spot through the game's own map and commit flow.
const n = await frame.evaluate(() => window.__ld.session.def.postcards.length);
for (let i = 0; i < n; i++) {
  await frame.waitForFunction(() => window.__ld.mode === 'explore', null, { timeout: 60000 });
  await frame.evaluate(() => {
    const a = window.__ld, p = a.session.place;
    a.openMap();
    a.placePinAt(p.lat, p.lon);
    a.commit();
    window.advanceTime(9000);
    a.next();
  });
}
await frame.waitForFunction(() => window.__ld.mode === 'caseEnd', null, { timeout: 60000 });
await page.waitForTimeout(300);
const msgs = await page.evaluate(() => window.msgs);
console.log('opened on case', opened);
console.log(msgs.map((m) => `${m.type}${m.level ? ' L' + m.level : ''}${m.stars ? ' ★' + m.stars : ''}`).join(', '));
const at = (t) => msgs.findIndex((m) => m.type === t);
const ok =
  opened === LEVEL &&
  msgs.every((m) => m.source === 'workbook-game' && m.slug === 'landscape-detective' && m.version === 1 && m.origin.startsWith('http://localhost')) &&
  msgs.filter((m) => m.type === 'ready').length === 1 &&
  at('ready') >= 0 && at('ready') < at('level-start') &&
  msgs[at('level-start')].level === LEVEL &&
  at('level-complete') > at('level-start') &&
  msgs.some((m) => m.type === 'level-complete' && m.level === LEVEL && m.stars >= 1 && m.durationMs > 0) &&
  !msgs.some((m) => m.type === 'error');
// standalone: no parent, nothing posted (no errors either)
const solo = await (await browser.newContext()).newPage();
const errs = [];
solo.on('pageerror', (e) => errs.push(String(e)));
await solo.goto(GAME + '?level=2');
await solo.waitForFunction(() => window.__ld?.mode === 'explore', null, { timeout: 60000 });
const soloCase = await solo.evaluate(() => window.__ld.session.def.id);
console.log('standalone ?level=2 opened case', soloCase);
const pass = ok && soloCase === 2 && !errs.length;
console.log(pass ? 'bridge OK' : 'bridge FAILED', errs);
await browser.close();
parent.close();
process.exit(pass ? 0 : 1);
