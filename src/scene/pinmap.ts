// The tabletop relief of Israel: drop one pin, then the swooping reveal from the
// pin to the true spot, with the zone of the decisive clue lit up.
import * as THREE from 'three';
import { CITIES } from '../data/zones';
import { inPoly, type LonLat } from '../model/geo';
import { CountryRelief } from '../model/relief';
import { COUNTRY, M_PER_DEG_LAT, mPerDegLon } from '../model/relief-spec';
import { IbexRig } from './ibex';
import { ModelLib } from './models';

/** Map units: 1 unit = 1 km, x east, z south; vertical exaggeration below. */
export const EXAG = 7;
const REF_LAT = 31.5;
const LON0 = 35.0, LAT0 = 31.5;

export function llToMap(lat: number, lon: number, h = 0): THREE.Vector3 {
  return new THREE.Vector3(((lon - LON0) * mPerDegLon(REF_LAT)) / 1000, (h / 1000) * EXAG, (-(lat - LAT0) * M_PER_DEG_LAT) / 1000);
}
export function mapToLL(p: THREE.Vector3): [number, number] {
  return [LAT0 - (p.z * 1000) / M_PER_DEG_LAT, LON0 + (p.x * 1000) / mPerDegLon(REF_LAT)];
}

export class PinMap {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(38, 1, 1, 4000);
  readonly relief: THREE.Mesh;
  private baseColors: Float32Array;
  readonly pin = new THREE.Group();
  readonly truthFlag = new THREE.Group();
  private arc: THREE.Line | null = null;
  private zoneLine: THREE.LineLoop | null = null;
  ibex = new THREE.Group();
  ibexRig: IbexRig | null = null;
  private ibexModel: THREE.Object3D | null = null;
  pinPlaced = false;
  // camera rig
  focus = new THREE.Vector3(0, 0, 0);
  camDist = 520;
  camPitch = 1.05;
  camYaw = 0;
  private flight: { from: THREE.Vector3; to: THREE.Vector3; d0: number; d1: number; t: number; dur: number } | null = null;
  private time = 0;
  readonly cityDots = new THREE.Group();
  private ripple: THREE.Mesh;

  constructor(readonly country: CountryRelief, models: ModelLib) {
    this.scene.background = new THREE.Color(0x2b2420);
    this.scene.fog = new THREE.Fog(0x2b2420, 900, 2400);
    const sun = new THREE.DirectionalLight(0xfff0d8, 2.4);
    sun.position.set(-300, 260, -120); // low from the west: relief reads strongly
    this.scene.add(sun, new THREE.HemisphereLight(0xdfe8f0, 0x5a4a38, 0.9));

    // Table
    const table = new THREE.Mesh(new THREE.BoxGeometry(900, 20, 1100), new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.7 }));
    table.position.y = -33;
    this.scene.add(table);

    // Relief mesh, downsampled 2× from the country grid.
    const step = 2;
    const rows = Math.floor((COUNTRY.rows - 1) / step) + 1, cols = Math.floor((COUNTRY.cols - 1) / step) + 1;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(rows * cols * 3);
    const col = new Float32Array(rows * cols * 3);
    const c = new THREE.Color();
    for (let r = 0; r < rows; r++)
      for (let cc = 0; cc < cols; cc++) {
        const lat = CountryRelief.latOf(r * step), lon = CountryRelief.lonOf(cc * step);
        const h = country.cell(r * step, cc * step);
        const v = llToMap(lat, lon, Math.max(h, -60));
        if (h < 0 && lon < 35.0) v.y = (-25 / 1000) * EXAG;
        const i = r * cols + cc;
        v.toArray(pos, i * 3);
        this.colorFor(c, h, lat, lon);
        c.toArray(col, i * 3);
      }
    const idx: number[] = [];
    for (let r = 0; r < rows - 1; r++)
      for (let cc = 0; cc < cols - 1; cc++) {
        const a = r * cols + cc, b = a + 1, d = a + cols, e = d + 1;
        idx.push(a, d, b, b, d, e);
      }
    geo.setIndex(idx);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    this.baseColors = col.slice();
    this.relief = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: false }));
    this.scene.add(this.relief);
    // Plinth skirt under the model edges
    const bb = new THREE.Box3().setFromObject(this.relief);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(bb.max.x - bb.min.x, 22, bb.max.z - bb.min.z), new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.9 }));
    plinth.position.set((bb.max.x + bb.min.x) / 2, -12, (bb.max.z + bb.min.z) / 2);
    this.scene.add(plinth);
    // Compass rose: north is always up.
    const n = this.label('N ↑', 0x2f4a2f);
    n.position.set(bb.max.x - 25, 2, bb.min.z + 30);
    n.scale.set(40, 20, 1);
    this.scene.add(n);

    // City dots (unlabelled until the reveal)
    for (const city of CITIES.filter((x) => x.onMap)) {
      const h = country.at(city.lat, city.lon);
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0xfaf6ea, emissive: 0x302820 }));
      dot.position.copy(llToMap(city.lat, city.lon, h)).add(new THREE.Vector3(0, 0.8, 0));
      dot.userData.city = city;
      this.cityDots.add(dot);
    }
    this.scene.add(this.cityDots);

    // Pin: brass needle with red head
    const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.05, 14, 8), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.8, roughness: 0.3 }));
    needle.position.y = 7;
    const head = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshStandardMaterial({ color: 0xd8342a, roughness: 0.35 }));
    head.position.y = 15;
    this.pin.add(needle, head);
    this.pin.visible = false;
    this.scene.add(this.pin);
    this.ripple = new THREE.Mesh(new THREE.RingGeometry(2, 3, 32), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    this.ripple.rotation.x = -Math.PI / 2;
    this.scene.add(this.ripple);

    // True spot: a postcard flag
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 18), new THREE.MeshStandardMaterial({ color: 0x3a2a1a }));
    pole.position.y = 9;
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), new THREE.MeshStandardMaterial({ color: 0x2f7a4a, side: THREE.DoubleSide, emissive: 0x103018 }));
    flag.position.set(4.5, 15, 0);
    this.truthFlag.add(pole, flag);
    this.truthFlag.visible = false;
    this.scene.add(this.truthFlag);

    const ib = models.instance('ibex', 9);
    if (ib) {
      this.ibex.add(ib.root);
      this.ibexModel = ib.root;
      this.ibexRig = new IbexRig(ib.root, ib.clips);
    } else {
      const m = new THREE.Mesh(new THREE.ConeGeometry(3, 8, 5), new THREE.MeshStandardMaterial({ color: 0xc9a06a }));
      m.position.y = 4;
      this.ibex.add(m);
    }
    this.ibex.visible = false;
    this.scene.add(this.ibex);
    this.resetView();
  }

  private colorFor(c: THREE.Color, h: number, lat: number, lon: number) {
    if (h < 0 && lon < 35.0) {
      c.set(0x3f86a6).lerp(new THREE.Color(0x2a5f80), Math.min(1, -h / 1200));
      return;
    }
    // Lakes: flat surfaces at their levels in the rift.
    if (h < -395 && lon > 35.3 && lat < 31.85 && lat > 30.9) return void c.set(0x7cc6c0);
    if (h < -205 && h > -222 && lat > 32.68 && lat < 32.92 && lon > 35.5 && lon < 35.66) return void c.set(0x3f86a6);
    // Hypsometric tint in the table-model style: green lowland → ochre → honey → rose highland.
    const stops: [number, number][] = [
      [-430, 0xd8c79a],
      [0, 0xa7b06a],
      [150, 0xc2b678],
      [400, 0xd2b07a],
      [700, 0xc9976a],
      [1000, 0xb07a5a],
      [1600, 0x9a7060],
      [2400, 0xf2efe8],
    ];
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++)
      if (h >= stops[i][0] && h <= stops[i + 1][0]) {
        a = stops[i];
        b = stops[i + 1];
        break;
      }
    const t = b[0] === a[0] ? 0 : (h - a[0]) / (b[0] - a[0]);
    c.set(a[1]).lerp(new THREE.Color(b[1]), Math.max(0, Math.min(1, t)));
  }

  private label(text: string, color: number): THREE.Sprite {
    const cv = document.createElement('canvas');
    cv.width = 256;
    cv.height = 128;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.font = 'bold 64px Rubik, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 64);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  }

  cityLabel(nameHe: string): THREE.Sprite {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 128;
    const ctx = cv.getContext('2d')!;
    ctx.font = 'bold 56px Rubik, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(40,30,20,0.85)';
    ctx.strokeText(nameHe, 256, 64);
    ctx.fillStyle = '#fff6e0';
    ctx.fillText(nameHe, 256, 64);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    s.scale.set(56, 14, 1);
    return s;
  }

  resetView() {
    this.flight = null;
    this.focus.set(5, 0, 10);
    this.camDist = 560;
    this.camPitch = 1.12;
    this.camYaw = 0;
    this.pin.visible = false;
    this.pinPlaced = false;
    this.truthFlag.visible = false;
    this.ibex.visible = false;
    if (this.arc) {
      this.scene.remove(this.arc);
      this.arc = null;
    }
    this.clearZone();
    this.scene.children.filter((o) => o.userData.revealLabel).forEach((o) => this.scene.remove(o));
  }

  setAspect(a: number) {
    this.camera.aspect = a;
    this.camera.updateProjectionMatrix();
  }

  /** Raycast a screen point (NDC) onto the relief → lat/lon. */
  pick(ndc: THREE.Vector2): [number, number] | null {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = ray.intersectObject(this.relief, false)[0];
    if (!hit) return null;
    return mapToLL(hit.point);
  }

  placePin(lat: number, lon: number) {
    const h = Math.max(0, this.country.at(lat, lon));
    this.pin.position.copy(llToMap(lat, lon, h));
    this.pin.visible = true;
    this.pinPlaced = true;
    this.pin.userData.drop = 0.35;
    this.ripple.position.copy(this.pin.position).add(new THREE.Vector3(0, 0.6, 0));
    this.ripple.userData.t = 0;
  }

  /** Light a zone polygon (in [lon,lat]) on the relief: vertex tint plus an outline. */
  showZone(poly: LonLat[], color: number) {
    this.clearZone();
    const col = this.relief.geometry.attributes.color as THREE.BufferAttribute;
    const pos = this.relief.geometry.attributes.position as THREE.BufferAttribute;
    const tint = new THREE.Color(color);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const [lat, lon] = mapToLL(new THREE.Vector3(pos.getX(i), 0, pos.getZ(i)));
      if (inPoly(lon, lat, poly)) {
        c.fromArray(this.baseColors, i * 3).lerp(tint, 0.55);
        col.setXYZ(i, c.r, c.g, c.b);
      }
    }
    col.needsUpdate = true;
    const pts = poly.map(([lon, lat]) => llToMap(lat, lon, Math.max(0, this.country.at(lat, lon)) + 120));
    this.zoneLine = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, linewidth: 2 }));
    this.scene.add(this.zoneLine);
  }

  clearZone() {
    const col = this.relief.geometry.attributes.color as THREE.BufferAttribute;
    (col.array as Float32Array).set(this.baseColors);
    col.needsUpdate = true;
    if (this.zoneLine) {
      this.scene.remove(this.zoneLine);
      this.zoneLine = null;
    }
  }

  /** Start the reveal: arc + camera flight from the pin to the truth. */
  reveal(truthLat: number, truthLon: number, gap: number, dur = 2.6) {
    const t = llToMap(truthLat, truthLon, Math.max(0, this.country.at(truthLat, truthLon)));
    this.truthFlag.position.copy(t);
    this.truthFlag.visible = true;
    const a = this.pin.position.clone();
    const mid = a.clone().lerp(t, 0.5);
    const len = a.distanceTo(t);
    mid.y += 12 + len * 0.35;
    const curve = new THREE.QuadraticBezierCurve3(a.clone().setY(a.y + 15), mid, t.clone().setY(t.y + 18));
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
    geo.setDrawRange(0, 0);
    this.arc = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: 0xffd36a, dashSize: 4, gapSize: 2.5 }));
    this.arc.computeLineDistances();
    this.arc.userData.t = 0;
    this.scene.add(this.arc);
    const startD = this.camDist;
    this.flight = { from: this.focus.clone(), to: t.clone(), d0: startD, d1: Math.max(110, Math.min(380, len * 2.2 + 90)), t: 0, dur };
    // Ibex on a ridge near the truth: close pins catch it, far pins let it laugh further away.
    const off = new THREE.Vector3(6 + gap * 9, 0, -4 - gap * 6);
    const ip = t.clone().add(off);
    const [ilat, ilon] = mapToLL(ip);
    ip.y = llToMap(ilat, ilon, Math.max(0, this.country.at(ilat, ilon))).y;
    this.ibex.position.copy(ip);
    this.ibex.lookAt(this.pin.position.x, ip.y, this.pin.position.z);
    this.ibex.visible = true;
    this.ibexRig?.set(gap === 0 ? 'sulk' : 'taunt');
  }

  /** Label the cities near the truth after the reveal. */
  labelCities(lat: number, lon: number, maxKm = 60) {
    for (const d of this.cityDots.children) {
      const city = d.userData.city as (typeof CITIES)[number];
      const km = Math.hypot((city.lat - lat) * 111, (city.lon - lon) * 95);
      if (km > maxKm) continue;
      const s = this.cityLabel(city.nameHe);
      s.position.copy(d.position).add(new THREE.Vector3(0, 12, 0));
      s.userData.revealLabel = true;
      this.scene.add(s);
    }
  }

  get flying() {
    return !!this.flight && this.flight.t < this.flight.dur;
  }

  update(dt: number) {
    this.time += dt;
    if (this.flight) {
      const f = this.flight;
      f.t = Math.min(f.dur, f.t + dt);
      const k = f.t / f.dur;
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      this.focus.lerpVectors(f.from, f.to, e);
      this.camDist = THREE.MathUtils.lerp(f.d0, f.d1, e) + Math.sin(k * Math.PI) * 60;
      this.camPitch = THREE.MathUtils.lerp(1.12, 0.78, e);
      if (this.arc) {
        const n = Math.floor(81 * Math.min(1, k * 1.6));
        this.arc.geometry.setDrawRange(0, n);
      }
    }
    if (this.pin.userData.drop > 0) {
      this.pin.userData.drop = Math.max(0, this.pin.userData.drop - dt);
      this.pin.children.forEach((c) => (c.position.y = (c === this.pin.children[0] ? 7 : 15) + this.pin.userData.drop * 60));
    }
    if (this.ripple.userData.t !== undefined) {
      this.ripple.userData.t += dt;
      const t = this.ripple.userData.t;
      this.ripple.scale.setScalar(1 + t * 6);
      (this.ripple.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - t);
    }
    this.truthFlag.children[1].rotation.y = Math.sin(this.time * 3) * 0.2;
    this.ibexRig?.update(dt);
    if (this.ibexModel && this.ibexRig) this.ibexModel.position.y = this.ibexRig.lift * 6;
    const cp = this.camPitch, cd = this.camDist;
    this.camera.position.set(this.focus.x + Math.sin(this.camYaw) * Math.cos(cp) * cd, this.focus.y + Math.sin(cp) * cd, this.focus.z + Math.cos(this.camYaw) * Math.cos(cp) * cd);
    this.camera.lookAt(this.focus);
  }

  pan(dx: number, dy: number) {
    if (this.flying) return;
    const s = this.camDist / 700;
    this.focus.x = THREE.MathUtils.clamp(this.focus.x - dx * s, -120, 120);
    this.focus.z = THREE.MathUtils.clamp(this.focus.z - dy * s, -220, 260);
  }

  zoom(delta: number) {
    if (this.flying) return;
    this.camDist = THREE.MathUtils.clamp(this.camDist * (1 + delta * 0.0012), 70, 700);
  }
}
