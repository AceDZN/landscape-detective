// Terrain meshes for a postcard: a detailed near field, the 4 km SRTM patch and a
// 90 km horizon from the country grid. Heights are the real relief; only a
// sub-metre detail noise is added near the player (fading to zero at its edge).
import * as THREE from 'three';
import { CountryRelief, PatchRelief } from '../model/relief';
import { M_PER_DEG_LAT, mPerDegLon } from '../model/relief-spec';
import type { Biome } from '../model/world';

export const NEAR_HALF = 420;
const NEAR_STEP = 3;
const HORIZON_HALF = 45_000;
const HORIZON_STEP = 450;

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
export function fbm(x: number, y: number, oct = 4): number {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * (vnoise(x * f, y * f) * 2 - 1);
    a *= 0.5;
    f *= 2.03;
  }
  return s;
}

function cubic(p0: number, p1: number, p2: number, p3: number, t: number) {
  return p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
}

/** Smooth (Catmull-Rom) height from the 20 m patch. */
export function smoothPatch(patch: PatchRelief, x: number, z: number): number {
  const sp = 20;
  const fc = (x + patch.half) / sp, fr = (z + patch.half) / sp;
  const c = Math.floor(fc), r = Math.floor(fr);
  const tc = fc - c, tr = fr - r;
  const rows: number[] = [];
  for (let k = -1; k <= 2; k++) rows.push(cubic(patch.sample(r + k, c - 1), patch.sample(r + k, c), patch.sample(r + k, c + 1), patch.sample(r + k, c + 2), tc));
  return cubic(rows[0], rows[1], rows[2], rows[3], tr);
}

export interface TerrainEdit {
  x: number;
  z: number;
  r: number;
  depth: number;
}

export class TerrainField {
  edits: TerrainEdit[] = [];
  /** Coastal patches: SRTM reads ~0 m on the water, so let the beach shelve under the sea surface. */
  seaShelf = false;
  constructor(readonly patch: PatchRelief, readonly detail: number) {}

  base(x: number, z: number) {
    const h = smoothPatch(this.patch, x, z);
    return this.seaShelf && h < 0.8 ? h - (0.8 - h) * 3 : h;
  }

  height(x: number, z: number): number {
    let h = this.base(x, z);
    const edge = Math.max(Math.abs(x), Math.abs(z));
    const fade = Math.max(0, Math.min(1, (NEAR_HALF - edge) / 80));
    if (this.seaShelf && h < 0.3) return h;
    if (fade > 0) h += fbm(x / 9, z / 9, 3) * this.detail * fade + fbm(x / 1.7, z / 1.7, 2) * this.detail * 0.18 * fade;
    for (const e of this.edits) {
      const d = Math.hypot(x - e.x, z - e.z);
      if (d < e.r) h -= e.depth * Math.cos(((d / e.r) * Math.PI) / 2) ** 1.5;
    }
    return h;
  }
}

function colorFor(out: THREE.Color, h: number, slope: number, n: number, biome: Biome, waterLevel: number | null) {
  const ground = new THREE.Color(biome.groundColor);
  const rock = new THREE.Color(biome.rockColor);
  const grass = new THREE.Color(biome.grassColor);
  out.copy(ground);
  const g = Math.max(0, Math.min(1, biome.greenness * 1.2 + n * 0.35 - slope * 0.4));
  out.lerp(grass, g);
  const r = Math.max(0, Math.min(1, (slope - 0.35) * 2.2 + n * 0.2));
  out.lerp(rock, r);
  if (waterLevel !== null) {
    const above = h - waterLevel;
    if (above < 1.5) out.lerp(new THREE.Color(biome.vegetation === 'bare' ? 0xf4f1e8 : 0xe6d3a8), Math.max(0, 1 - above / 1.5) * 0.8);
  }
  out.offsetHSL(0, 0, n * 0.04);
}

export function buildNearMesh(field: TerrainField, biome: Biome, waterLevel: number | null): THREE.Mesh {
  const n = Math.round((NEAR_HALF * 2) / NEAR_STEP) + 1;
  const geo = new THREE.PlaneGeometry(NEAR_HALF * 2, NEAR_HALF * 2, n - 1, n - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setY(i, field.height(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  const nor = geo.attributes.normal as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const slope = Math.sqrt(1 - Math.min(1, nor.getY(i) ** 2)) / Math.max(0.2, nor.getY(i));
    colorFor(c, pos.getY(i), slope, fbm(x / 23, z / 23, 3), biome, waterLevel);
    c.toArray(colors, i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, flatShading: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain-near';
  return mesh;
}

export function buildPatchMesh(field: TerrainField, biome: Biome, waterLevel: number | null): THREE.Mesh {
  const half = field.patch.half;
  const n = 201;
  const geo = new THREE.PlaneGeometry(half * 2, half * 2, n - 1, n - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const inside = Math.abs(x) < NEAR_HALF - 25 && Math.abs(z) < NEAR_HALF - 25;
    pos.setY(i, field.base(x, z) - (inside ? 6 : 0));
  }
  geo.computeVertexNormals();
  const nor = geo.attributes.normal as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const slope = Math.sqrt(1 - Math.min(1, nor.getY(i) ** 2)) / Math.max(0.2, nor.getY(i));
    colorFor(c, pos.getY(i), slope, fbm(pos.getX(i) / 60, pos.getZ(i) / 60, 3), biome, waterLevel);
    c.toArray(colors, i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97 }));
  mesh.receiveShadow = true;
  mesh.name = 'terrain-patch';
  return mesh;
}

/** 90 km horizon from the country grid, centred on the place. */
export function buildHorizonMesh(country: CountryRelief, lat: number, lon: number, patchHalf: number, biome: Biome, centreOffset: number): THREE.Mesh {
  const n = Math.round((HORIZON_HALF * 2) / HORIZON_STEP) + 1;
  const geo = new THREE.PlaneGeometry(HORIZON_HALF * 2, HORIZON_HALF * 2, n - 1, n - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const mLon = mPerDegLon(lat);
  const colors = new Float32Array(pos.count * 3);
  const far = new THREE.Color(biome.groundColor).lerp(new THREE.Color(biome.grassColor), biome.greenness * 0.6);
  const sea = new THREE.Color(0x3f8fa8);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = country.at(lat - z / M_PER_DEG_LAT, lon + x / mLon) + centreOffset;
    const inside = Math.abs(x) < patchHalf - 60 && Math.abs(z) < patchHalf - 60;
    pos.setY(i, inside ? h - 40 : h);
    const c = h < -1 && lon + x / mLon < 35.0 ? sea : far;
    c.toArray(colors, i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  mesh.name = 'terrain-horizon';
  return mesh;
}
