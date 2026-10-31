// Builds the bundled relief from public elevation tiles (AWS Terrain Tiles,
// "terrarium" encoding; SRTM / ETOPO1 / other public sources, see ASSETS.md).
//   npx tsx scripts/build-relief.ts
// Outputs (Int16, little-endian, decimetres; row 0 = north, col 0 = west):
//   public/terrain/israel.bin       whole-country grid for the pin map and horizons
//   public/terrain/places/<id>.bin  4 km x 4 km patch around each place
//   src/data/relief-meta.json       grid bounds and per-place patch info
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { COUNTRY, PATCH } from '../src/model/relief-spec.ts';

const CACHE = 'assets-src/tiles-cache';
const TILE_URL = (z: number, x: number, y: number) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;

function decodePng(buf: Buffer): { w: number; h: number; ch: number; data: Uint8Array } {
  let p = 8;
  let w = 0, h = 0, ch = 0;
  const idat: Buffer[] = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const body = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      w = body.readUInt32BE(0);
      h = body.readUInt32BE(4);
      const color = body[9];
      ch = color === 6 ? 4 : color === 2 ? 3 : 0;
      if (!ch || body[8] !== 8 || body[12] !== 0) throw new Error(`unsupported png color=${color}`);
    } else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const out = new Uint8Array(w * h * ch);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? out[y * stride + x - ch] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= ch && y > 0 ? out[(y - 1) * stride + x - ch] : 0;
      let v = raw[src + x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[y * stride + x] = v & 255;
    }
  }
  return { w, h, ch, data: out };
}

const tiles = new Map<string, Float32Array>();
async function tile(z: number, x: number, y: number): Promise<Float32Array> {
  const key = `${z}/${x}/${y}`;
  const hit = tiles.get(key);
  if (hit) return hit;
  const file = `${CACHE}/${z}-${x}-${y}.png`;
  if (!existsSync(file)) {
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await fetch(TILE_URL(z, x, y));
        if (!res.ok) throw new Error(`${key}: ${res.status}`);
        writeFileSync(file, Buffer.from(await res.arrayBuffer()));
        break;
      } catch (err) {
        if (attempt >= 5) throw err;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  const png = decodePng(readFileSync(file));
  const el = new Float32Array(png.w * png.h);
  for (let i = 0; i < el.length; i++) {
    const r = png.data[i * png.ch], g = png.data[i * png.ch + 1], b = png.data[i * png.ch + 2];
    el[i] = r * 256 + g + b / 256 - 32768;
  }
  tiles.set(key, el);
  return el;
}

/** Bilinear elevation at lat/lon from zoom-z tiles. */
async function elevation(z: number, lat: number, lon: number): Promise<number> {
  const n = 2 ** z;
  const fx = ((lon + 180) / 360) * n * 256;
  const latR = (lat * Math.PI) / 180;
  const fy = ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n * 256;
  const x0 = Math.floor(fx - 0.5), y0 = Math.floor(fy - 0.5);
  const tx = fx - 0.5 - x0, ty = fy - 0.5 - y0;
  const px = async (X: number, Y: number) => (await tile(z, Math.floor(X / 256), Math.floor(Y / 256)))[(Y & 255) * 256 + (X & 255)];
  const a = await px(x0, y0), b = await px(x0 + 1, y0), c = await px(x0, y0 + 1), d = await px(x0 + 1, y0 + 1);
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}

function toBin(vals: number[]): Buffer {
  const b = Buffer.alloc(vals.length * 2);
  vals.forEach((v, i) => b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 10))), i * 2));
  return b;
}

async function main() {
  mkdirSync(CACHE, { recursive: true });
  mkdirSync('public/terrain/places', { recursive: true });

  const only = process.argv[2];
  if (only !== 'places') {
  const country: number[] = [];
  for (let r = 0; r < COUNTRY.rows; r++) {
    const lat = COUNTRY.north - r * COUNTRY.step;
    for (let c = 0; c < COUNTRY.cols; c++) country.push(await elevation(COUNTRY.zoom, lat, COUNTRY.west + c * COUNTRY.step));
  }
  writeFileSync('public/terrain/israel.bin', toBin(country));
  console.log('country', COUNTRY.rows, 'x', COUNTRY.cols, 'min', country.reduce((a, b) => Math.min(a, b)).toFixed(0), 'max', country.reduce((a, b) => Math.max(a, b)).toFixed(0));
  }
  if (only === 'country') return;
  const { PLACES } = await import('../src/data/places.ts');

  const places: Record<string, { centerM: number; minM: number; maxM: number }> = {};
  for (const p of PLACES) {
    const vals: number[] = [];
    const mPerDegLat = 110_950;
    const mPerDegLon = 111_320 * Math.cos((p.lat * Math.PI) / 180);
    const half = (PATCH.size - 1) / 2;
    for (let r = 0; r < PATCH.size; r++) {
      const lat = p.lat + ((half - r) * PATCH.spacingM) / mPerDegLat;
      for (let c = 0; c < PATCH.size; c++) {
        const lon = p.lon + ((c - half) * PATCH.spacingM) / mPerDegLon;
        vals.push(await elevation(PATCH.zoom, lat, lon));
      }
    }
    writeFileSync(`public/terrain/places/${p.id}.bin`, toBin(vals));
    const center = vals[half * PATCH.size + half];
    places[p.id] = { centerM: Math.round(center), minM: Math.round(Math.min(...vals)), maxM: Math.round(Math.max(...vals)) };
    console.log(p.id.padEnd(24), String(places[p.id].centerM).padStart(6), 'm');
  }
  writeFileSync('src/data/relief-meta.json', JSON.stringify({ source: 'AWS Terrain Tiles (terrarium), Mapzen/Tilezen joerd: SRTM, ETOPO1 and others', country: COUNTRY, patch: PATCH, places }, null, 1));
}

main();
