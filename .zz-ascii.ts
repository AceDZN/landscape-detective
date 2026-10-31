import { rockAt, beltAt, rainAt } from './src/model/world';
const rc: Record<string,string> = { limestone:'.', chalk:'c', basalt:'B', kurkar:'k', sand:'s', granite:'G', loess:'l', marl_salt:'m', sandstone:'S' };
const bc: Record<string,string> = { coastal_plain:'C', mountain:'M', rift:'R', golan:'g', negev:'n' };
const mode = process.argv[2];
for (let lat = 33.4; lat >= 29.45; lat -= 0.05) {
  let row = lat.toFixed(2) + ' ';
  for (let lon = 34.2; lon <= 35.95; lon += 0.025) {
    if (mode === 'rock') row += rc[rockAt(lat, lon)];
    else if (mode === 'belt') { const b = beltAt(lat, lon); row += b ? bc[b] : ' '; }
    else { const r = rainAt(lat, lon); row += r >= 400 ? 'M' : r >= 200 ? 's' : r >= 100 ? '-' : ' '; }
  }
  console.log(row);
}
