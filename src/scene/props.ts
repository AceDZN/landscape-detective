// Procedural dressing: plants, boulders and generic buildings. Shapes and colours
// come from the biome and the place's recorded rock and culture signs.
import * as THREE from 'three';
import type { Rock } from '../model/types';

const flat = (color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, ...extra });

function jitter(geo: THREE.BufferGeometry, amt: number, seed: number) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  // Hash by position, not index: polyhedra are non-indexed, so shared corners must move together or faces split into shards.
  for (let i = 0; i < p.count; i++) {
    const k = Math.sin(Math.round(p.getX(i) * 1000) * 12.9898 + Math.round(p.getY(i) * 1000) * 4.1414 + Math.round(p.getZ(i) * 1000) * 7.13 + seed * 78.233) * 43758.5453;
    const r = (k - Math.floor(k)) * 2 - 1;
    p.setXYZ(i, p.getX(i) * (1 + r * amt), p.getY(i) * (1 + r * amt * 0.7), p.getZ(i) * (1 - r * amt));
  }
  geo.computeVertexNormals();
  return geo;
}

export function shrubGeometry(seed = 1): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(0.6, 1);
  g.scale(1, 0.65, 1);
  g.translate(0, 0.3, 0);
  return jitter(g, 0.22, seed);
}

export function tuftGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const c = new THREE.ConeGeometry(0.05, 0.55 + (i % 3) * 0.15, 3);
    c.translate(0, 0.3, 0);
    c.rotateZ((i - 2) * 0.22);
    c.rotateY(i * 1.3);
    parts.push(c);
  }
  return mergeGeos(parts);
}

export function boulderGeometry(rock: Rock, seed = 3): THREE.BufferGeometry {
  const g = rock === 'basalt' || rock === 'granite' ? new THREE.DodecahedronGeometry(0.8, 0) : new THREE.IcosahedronGeometry(0.8, 0);
  if (rock === 'kurkar' || rock === 'limestone' || rock === 'chalk') g.scale(1.3, 0.6, 1);
  if (rock === 'granite') g.scale(1, 1.2, 1);
  g.translate(0, 0.25, 0);
  return jitter(g, 0.25, seed);
}

export function mergeGeos(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const ng = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  let count = 0;
  for (const g of ng) count += g.attributes.position.count;
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  let o = 0;
  for (const g of ng) {
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    g.computeVertexNormals();
    nor.set(g.attributes.normal.array as Float32Array, o * 3);
    const c = g.attributes.color as THREE.BufferAttribute | undefined;
    if (c) col.set(c.array as Float32Array, o * 3);
    else col.fill(1, o * 3, (o + g.attributes.position.count) * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return out;
}

function painted(g: THREE.BufferGeometry, color: number): THREE.BufferGeometry {
  const ng = g.index ? g.toNonIndexed() : g;
  const c = new THREE.Color(color);
  const arr = new Float32Array(ng.attributes.position.count * 3);
  for (let i = 0; i < ng.attributes.position.count; i++) c.toArray(arr, i * 3);
  ng.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return ng;
}

/** Tree silhouettes by type, as one vertex-coloured geometry each (height ≈ 1 unit, scaled per instance). */
export function treeGeometry(kind: 'oak' | 'pine' | 'acacia' | 'olive' | 'palm' | 'tamarisk'): THREE.BufferGeometry {
  const trunkC = kind === 'palm' ? 0x8a6a48 : 0x6b4e36;
  const parts: THREE.BufferGeometry[] = [];
  if (kind === 'pine') {
    parts.push(painted(new THREE.CylinderGeometry(0.05, 0.08, 0.6, 5).translate(0, 0.3, 0), trunkC));
    parts.push(painted(jitter(new THREE.IcosahedronGeometry(0.38, 0).scale(1.2, 0.7, 1.2).translate(0, 0.78, 0), 0.15, 2), 0x3e5b32));
  } else if (kind === 'acacia') {
    parts.push(painted(new THREE.CylinderGeometry(0.035, 0.06, 0.62, 5).translate(0, 0.31, 0).rotateZ(0.12), trunkC));
    parts.push(painted(new THREE.CylinderGeometry(0.03, 0.04, 0.35, 4).translate(0.12, 0.55, 0).rotateZ(-0.5), trunkC));
    parts.push(painted(jitter(new THREE.CylinderGeometry(0.62, 0.5, 0.16, 9).translate(0, 0.78, 0), 0.12, 5), 0x7d8a45));
  } else if (kind === 'palm') {
    parts.push(painted(new THREE.CylinderGeometry(0.04, 0.06, 0.85, 6).translate(0, 0.42, 0), trunkC));
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.ConeGeometry(0.06, 0.55, 3).rotateZ(Math.PI / 2 + 0.5).translate(0.25, 0.83, 0).rotateY((i / 7) * Math.PI * 2);
      parts.push(painted(leaf, 0x5f7f3a));
    }
  } else {
    const canopy = kind === 'olive' ? 0x8a9a6a : kind === 'tamarisk' ? 0x8d9a78 : 0x4f6b35;
    parts.push(painted(new THREE.CylinderGeometry(0.05, 0.09, 0.45, 5).translate(0, 0.22, 0), trunkC));
    parts.push(painted(jitter(new THREE.IcosahedronGeometry(0.42, 1).scale(1.15, 0.8, 1.15).translate(0, 0.66, 0), 0.18, 7), canopy));
    parts.push(painted(jitter(new THREE.IcosahedronGeometry(0.28, 0).translate(0.22, 0.6, 0.1), 0.2, 9), canopy));
  }
  return mergeGeos(parts);
}

export const vertexMat = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });

// ---------- buildings (generic, no real landmarks reproduced) ----------

export function stoneHouse(w = 8, d = 8, floors = 2, color = 0xe8dcc0): THREE.Group {
  const g = new THREE.Group();
  const h = floors * 3;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), flat(color));
  body.position.y = h / 2;
  g.add(body);
  const win = flat(0x3b3a3a);
  for (let f = 0; f < floors; f++)
    for (const s of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1.3, 0.1), win);
      m.position.set(s * w * 0.25, 1.6 + f * 3, d / 2 + 0.02);
      g.add(m);
    }
  const rim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.4, d + 0.4), flat(0xd4c4a0));
  rim.position.y = h + 0.2;
  g.add(rim);
  return g;
}

export function tiledHouse(w = 7, d = 9): THREE.Group {
  const g = stoneHouse(w, d, 1, 0xf1ece0);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.75, 2.4, 4), flat(0xb5523b));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 4.4;
  g.add(roof);
  return g;
}

export function churchTower(): THREE.Group {
  const g = new THREE.Group();
  const nave = new THREE.Mesh(new THREE.BoxGeometry(12, 9, 22), flat(0xe6d8b8));
  nave.position.y = 4.5;
  g.add(nave);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(5, 22, 5), flat(0xe9dcc0));
  tower.position.set(0, 11, -12);
  g.add(tower);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(3.4, 6, 4), flat(0x7a8a8f));
  cap.rotation.y = Math.PI / 4;
  cap.position.set(0, 25, -12);
  g.add(cap);
  const cross = new THREE.Group();
  const v = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.2, 0.25), flat(0x3a3a3a));
  const hbar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.25), flat(0x3a3a3a));
  hbar.position.y = 0.4;
  cross.add(v, hbar);
  cross.position.set(0, 29, -12);
  g.add(cross);
  const dome = new THREE.Mesh(new THREE.ConeGeometry(5, 7, 8), flat(0x8f9da0));
  dome.position.set(0, 12.5, 3);
  g.add(dome);
  return g;
}

export function minaret(): THREE.Group {
  const g = new THREE.Group();
  const hall = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 14), flat(0xeee6d4));
  hall.position.y = 3.5;
  g.add(hall);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), flat(0x6f9a7a));
  dome.position.y = 7;
  g.add(dome);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 24, 8), flat(0xf3eee0));
  shaft.position.set(8, 12, 0);
  g.add(shaft);
  const balcony = new THREE.Mesh(new THREE.CylinderGeometry(2, 1.6, 0.8, 8), flat(0xd8ccb0));
  balcony.position.set(8, 20, 0);
  g.add(balcony);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.5, 8), flat(0x6f9a7a));
  tip.position.set(8, 25.8, 0);
  g.add(tip);
  const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 6, 12, Math.PI * 1.4), flat(0xd9b860));
  crescent.position.set(8, 28.2, 0);
  g.add(crescent);
  return g;
}

export function marketStall(color = 0xc0503a): THREE.Group {
  const g = new THREE.Group();
  const table = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 1.5), flat(0x8a6a48));
  table.position.y = 0.5;
  g.add(table);
  for (const [x, z] of [[-1.4, -0.7], [1.4, -0.7], [-1.4, 0.7], [1.4, 0.7]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6), flat(0x5a4632));
    p.position.set(x, 1.3, z);
    g.add(p);
  }
  const awning = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 2), flat(color));
  awning.position.y = 2.6;
  awning.rotation.x = 0.15;
  g.add(awning);
  const goods = [0xe0a030, 0xb33a2a, 0x7a9a40, 0xd9c08a];
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 4), flat(goods[i % 4]));
    b.position.set(-1.1 + i * 0.45, 1.15, 0.2);
    g.add(b);
  }
  return g;
}

export function glassTower(h = 90, w = 22): THREE.Group {
  const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({ color: 0x7fa6c0, roughness: 0.12, metalness: 0.65, flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), glass);
  body.position.y = h / 2;
  g.add(body);
  const bands = flat(0x4c5a66);
  for (let y = 4; y < h; y += 4) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.3, w + 0.2), bands);
    b.position.y = y;
    g.add(b);
  }
  return g;
}

/** A sign board with canvas text (multilingual or chain logo). */
export function signBoard(lines: string[], bg = '#f4ead2', fg = '#3a2a1a', w = 4, h = 2): THREE.Mesh {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 256;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 10;
  ctx.strokeRect(6, 6, 500, 244);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lh = 230 / lines.length;
  lines.forEach((l, i) => {
    ctx.font = `bold ${Math.min(64, lh * 0.7)}px Rubik, Arial, sans-serif`;
    ctx.fillText(l, 256, 13 + lh * (i + 0.5));
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  return m;
}

export function lookoutTower(): THREE.Group {
  const g = new THREE.Group();
  const wood = flat(0x7a5a3a);
  for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 12), wood);
    leg.position.set(x, 6, z);
    leg.castShadow = true;
    g.add(leg);
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.3, 4.2), wood);
  deck.position.y = 12;
  g.add(deck);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2, 4), flat(0x2f5a3a));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 14.6;
  g.add(roof);
  for (let y = 1; y < 12; y += 1.2) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.08), wood);
    rung.position.set(0, y, 1.7);
    g.add(rung);
  }
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshStandardMaterial({ color: 0xe8b13a, side: THREE.DoubleSide }));
  flag.position.set(0.6, 16.6, 0);
  g.add(flag);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3), wood);
  pole.position.set(0, 16, 0);
  g.add(pole);
  g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  return g;
}

export function postcardMarker(): THREE.Group {
  const g = new THREE.Group();
  const card = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, 0.05), flat(0xf4ead2, { emissive: 0x6a5020, emissiveIntensity: 0.3 }));
  card.position.y = 1.4;
  g.add(card);
  return g;
}
