// Drive the running game headlessly with real inputs and capture real frames.
// usage: node scripts/drive.mjs [--size=1280x720] [--url=http://localhost:5244/] [--keep] cmd...
//   click:<css>  key:<Key>  hold:<Key>:<ms>  adv:<ms>  wait:<ms>  shot:<file.png>  text  eval:<js>
//   drag:<dx>,<dy>       mouse-drag on the canvas from its centre (orbit / pan)
//   tapat:<fx>,<fy>      mouse click at a fraction of the canvas (0..1)
//   pinat:<lat>,<lon>    mouse click where that lat/lon shows on the 3D map (projected through the map camera)
//   waitfor:<mode>       wait until render_game_to_text().mode === mode
import { chromium } from 'playwright';

const args = process.argv.slice(2);
let size = [1280, 720];
let url = 'http://localhost:5244/';
let keep = false;
const cmds = [];
for (const a of args) {
  if (a.startsWith('--size=')) size = a.slice(7).split('x').map(Number);
  else if (a.startsWith('--url=')) url = a.slice(6);
  else if (a === '--keep') keep = true;
  else cmds.push(a);
}
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
await page.goto(url);
await page.waitForFunction(() => typeof window.render_game_to_text === 'function', null, { timeout: 60000 });
if (!keep) {
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {}
  });
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function', null, { timeout: 60000 });
}
const mode = () => page.evaluate(() => JSON.parse(window.render_game_to_text()).mode);
for (const c of cmds) {
  const [op, ...rest] = c.split(':');
  const arg = rest.join(':');
  if (op === 'click') await page.click(arg);
  else if (op === 'key') await page.keyboard.press(arg);
  else if (op === 'hold') {
    const [k, ms] = arg.split(':');
    await page.keyboard.down(k);
    await page.evaluate((m) => window.advanceTime(Number(m)), ms);
    await page.keyboard.up(k);
  } else if (op === 'adv') await page.evaluate((m) => window.advanceTime(Number(m)), arg);
  else if (op === 'wait') await page.waitForTimeout(Number(arg));
  else if (op === 'waitfor') {
    for (let i = 0; i < 300 && (await mode()) !== arg; i++) await page.waitForTimeout(100);
  } else if (op === 'shot') {
    await page.evaluate(() => window.advanceTime(16));
    await page.screenshot({ path: arg });
    console.log('shot', arg);
  } else if (op === 'text') console.log(await page.evaluate(() => window.render_game_to_text()));
  else if (op === 'eval') console.log(JSON.stringify(await page.evaluate(arg)));
  else if (op === 'drag') {
    const [dx, dy] = arg.split(',').map(Number);
    const cx = size[0] / 2, cy = size[1] / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(cx + (dx * i) / 10, cy + (dy * i) / 10);
    await page.mouse.up();
  } else if (op === 'tapat') {
    const [fx, fy] = arg.split(',').map(Number);
    await page.mouse.click(fx * size[0], fy * size[1]);
  } else if (op === 'pinat') {
    const [lat, lon] = arg.split(',').map(Number);
    const xy = await page.evaluate(([la, lo]) => window.__ld.screenOfLatLon(la, lo), [lat, lon]);
    await page.mouse.click(xy[0], xy[1]);
  }
}
if (errors.length) console.log('CONSOLE:', errors.slice(0, 20).join('\n'));
await browser.close();
