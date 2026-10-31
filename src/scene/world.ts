// A postcard's 3D world: real relief, sky and sun for the season/hour, water,
// biome-driven plants and rocks, and the landform/culture dressing with the
// "look" anchors the player can notice.
import * as THREE from 'three';
import type { Observation } from '../model/observe';
import { CountryRelief, PatchRelief } from '../model/relief';
import { M_PER_DEG_LAT, mPerDegLon } from '../model/relief-spec';
import { sunPosition, sunVector } from '../model/sun';
import type { Place, Postcard } from '../model/types';
import { biomeOf, type Biome } from '../model/world';
import { ModelLib } from './models';
import {
  boulderGeometry,
  churchTower,
  glassTower,
  lookoutTower,
  marketStall,
  minaret,
  shrubGeometry,
  signBoard,
  stoneHouse,
  tiledHouse,
  treeGeometry,
  tuftGeometry,
  vertexMat,
} from './props';
import { NEAR_HALF, TerrainField, buildHorizonMesh, buildNearMesh, buildPatchMesh, fbm } from './terrain';

export interface Anchor {
  obs: Observation;
  pos: THREE.Vector3;
  /** Max distance from which looking at it counts. */
  range: number;
  /** Cone half-angle in degrees. */
  cone: number;
}

export const WALK_HALF = 160;
/** Deck height of the Tripo lookout as a share of its height (measured in scene). */
const LOOKOUT_DECK = 0.55;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class PostcardWorld {
  readonly group = new THREE.Group();
  readonly field: TerrainField;
  readonly biome: Biome;
  readonly anchors: Anchor[] = [];
  readonly sunDir: THREE.Vector3;
  readonly sunLight: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly fill: THREE.DirectionalLight;
  readonly waterLevel: number | null;
  readonly skyColor: THREE.Color;
  readonly fogColor: THREE.Color;
  readonly night: boolean;
  lookout = new THREE.Vector3();
  lookoutTop = 12.2;
  lookoutObj: THREE.Object3D | null = null;
  spawn = new THREE.Vector3();
  heading: number;
  private water: THREE.Mesh[] = [];
  private t = 0;
  private sky!: THREE.Mesh;

  constructor(
    readonly place: Place,
    readonly postcard: Postcard,
    readonly patch: PatchRelief,
    readonly country: CountryRelief,
    readonly models: ModelLib,
  ) {
    const elev = patch.centre();
    this.biome = biomeOf(place.rainMm, place.rock, elev, place.landforms, place.vegetation);
    this.night = !!postcard.night;
    const detail = place.rock === 'sand' || place.landforms.includes('dunes') ? 1.6 : place.rock === 'basalt' ? 0.9 : 0.6;
    this.field = new TerrainField(patch, detail);
    if (place.landforms.includes('makhtesh')) this.biome.floor = { belowM: patch.centre() - (place.id.includes('floor') ? -15 : 60), color: 0xa8745a };
    this.heading = place.startHeadingDeg ?? 0;
    this.waterLevel = this.computeWaterLevel();
    this.field.shelf = this.waterLevel;

    // Cosmetic terrain edits that a landform needs (sinkholes are pits in the shore).
    if (place.landforms.includes('sinkholes')) {
      const r = rng(7);
      for (let i = 0; i < 7; i++) {
        const a = (this.heading + 40 + i * 25 + r() * 15) * (Math.PI / 180);
        const d = 30 + i * 9 + r() * 12;
        this.field.edits.push({ x: Math.sin(a) * d, z: -Math.cos(a) * d, r: 4 + r() * 6, depth: 4 + r() * 5 });
      }
    }

    // Sky, sun, light
    const sv = sunVector(place.lat, postcard.season, postcard.hour);
    this.sunDir = new THREE.Vector3(...sv).normalize();
    const { elevation } = sunPosition(place.lat, postcard.season, postcard.hour);
    const golden = Math.max(0, Math.min(1, 1 - elevation / 18));
    this.skyColor = this.night ? new THREE.Color(0x1a2440) : new THREE.Color(0x7fb2d9).lerp(new THREE.Color(0xf2a36b), golden * 0.55);
    this.fogColor = this.night ? new THREE.Color(0x26304a) : new THREE.Color(0xd8e2e6).lerp(new THREE.Color(0xf4c08e), golden * 0.7);
    if (!this.night && place.climate === 'desert') this.fogColor.lerp(new THREE.Color(0xeedcbc), 0.4);
    this.sunLight = new THREE.DirectionalLight(this.night ? 0x8fa6d8 : new THREE.Color(0xfff1d8).lerp(new THREE.Color(0xffa45c), golden), this.night ? 0.5 : 2.2);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    const sc = this.sunLight.shadow.camera;
    sc.left = -60;
    sc.right = 60;
    sc.top = 60;
    sc.bottom = -60;
    sc.near = 1;
    sc.far = 600;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.6;
    this.group.add(this.sunLight, this.sunLight.target);
    this.hemi = new THREE.HemisphereLight(this.night ? 0x40507a : this.skyColor, this.night ? 0x101418 : new THREE.Color(this.biome.groundColor).lerp(new THREE.Color(0xffc890), golden * 0.5), this.night ? 0.6 : 1.5 + golden * 0.5);
    this.group.add(this.hemi);
    // Soft fill from the camera side so backlit golden-hour shots keep their colour (painterly, not physical).
    this.fill = new THREE.DirectionalLight(this.night ? 0x6070a0 : 0xffe2c0, this.night ? 0.25 : 0.55 + golden * 0.5);
    this.group.add(this.fill, this.fill.target);
    this.buildSky(elevation);

    // Terrain
    const near = buildNearMesh(this.field, this.biome, this.waterLevel);
    const far = buildPatchMesh(this.field, this.biome, this.waterLevel);
    const horizon = buildHorizonMesh(country, place.lat, place.lon, patch.half, this.biome, 0);
    this.group.add(near, far, horizon);
    this.buildWater();

    this.spawn.set(0, this.heightAt(0, 0), 0);
    this.placeLookout();
    this.scatter();
    this.dressLandforms();
    this.dressCulture();
    this.dressModels();
  }

  /** Tripo dressing a place uses, so the app can preload them before building the world. */
  static modelsFor(place: Place): string[] {
    const n = new Set<string>(['lookout_tower']);
    const c = place.culture, lf = place.landforms;
    if (place.rock === 'basalt' || lf.includes('basalt_plateau')) n.add('basalt_boulders').add('field_wall');
    if (['limestone', 'chalk', 'kurkar', 'granite', 'sandstone'].includes(place.rock) || lf.includes('kurkar_ridge')) n.add('rocks');
    if (place.vegetation === 'acacia') n.add('acacia');
    if (place.vegetation === 'oasis') n.add('date_palm').add('acacia');
    if (place.vegetation === 'maquis' || place.vegetation === 'batha' || c.includes('olive_groves')) n.add('olive').add('cypress');
    if (lf.includes('terraces')) n.add('terrace_wall');
    if (c.includes('church')) n.add('church_tower');
    if (c.includes('mosque')) n.add('minaret');
    if (c.includes('old_market')) n.add('market_stall');
    if (c.includes('stone_houses')) n.add('house');
    if (c.includes('glass_towers') || c.includes('chain_stores')) n.add('fan_palm');
    return [...n];
  }

  /** A grounded Tripo prop (null when the model is missing: the procedural dressing still stands). */
  private prop(name: string, x: number, z: number, o: { h?: number; yaw?: number; tint?: number; sink?: number } = {}): THREE.Object3D | null {
    const inst = this.models.instance(name, o.h);
    if (!inst) return null;
    const root = inst.root;
    root.position.set(x, this.heightAt(x, z) - (o.sink ?? 0.15), z);
    root.rotation.y = o.yaw ?? 0;
    root.traverse((ob) => {
      const m = ob as THREE.Mesh;
      if (!m.isMesh) return;
      m.frustumCulled = true;
      if (o.tint !== undefined) {
        const mat = (m.material as THREE.MeshStandardMaterial).clone();
        mat.color.multiply(new THREE.Color(o.tint));
        m.material = mat;
      }
    });
    this.group.add(root);
    return root;
  }

  /** Near-field Tripo dressing: boulders, trees, walls and landmark buildings. Cosmetic only. */
  private dressModels() {
    const pl = this.place, r = rng(91);
    const ring = (n: number, dMin: number, dMax: number, ok: (x: number, z: number) => boolean, put: (x: number, z: number, i: number) => void) => {
      let k = 0;
      for (let i = 0; i < n * 8 && k < n; i++) {
        const a = r() * Math.PI * 2, d = dMin + r() * (dMax - dMin);
        const x = Math.sin(a) * d, z = -Math.cos(a) * d;
        if (!this.dry(x, z, 1) || !ok(x, z) || this.inView(x, z, 30) || this.lookout.distanceTo(new THREE.Vector3(x, this.lookout.y, z)) < 9) continue;
        put(x, z, k++);
      }
    };
    const gentle = (x: number, z: number) => this.slope(x, z) < 0.6;
    if (pl.rock === 'basalt' || pl.landforms.includes('basalt_plateau')) {
      ring(16, 8, 140, gentle, (x, z) => this.prop('basalt_boulders', x, z, { h: 0.8 + r() * 1.6, yaw: r() * 6.28, sink: 0.25 }));
      // Dry-stone field walls of black basalt, as on the Golan.
      const a0 = ((this.heading + 60) * Math.PI) / 180;
      for (let i = 0; i < 6; i++) {
        const d = 22 + i * 7.5;
        const x = Math.sin(a0) * d, z = -Math.cos(a0) * d;
        if (this.dry(x, z)) this.prop('field_wall', x, z, { h: 0.9, yaw: -a0 + Math.PI / 2, tint: 0x6a6664, sink: 0.1 });
      }
    }
    const rockTint: Partial<Record<string, number>> = { kurkar: 0xe8a070, granite: 0xd07068, chalk: 0xffffff, sandstone: 0xe0907a, limestone: 0xf4ecdc };
    const rk = pl.landforms.includes('kurkar_ridge') ? 'kurkar' : pl.rock;
    if (rockTint[rk] !== undefined) ring(10, 8, 120, gentle, (x, z) => this.prop('rocks', x, z, { h: 0.7 + r() * 1.3, yaw: r() * 6.28, tint: rockTint[rk], sink: 0.2 }));
    if (pl.vegetation === 'acacia') ring(9, 14, 160, gentle, (x, z) => this.prop('acacia', x, z, { h: 4.5 + r() * 2.5, yaw: r() * 6.28 }));
    if (pl.vegetation === 'oasis') {
      ring(9, 12, 110, gentle, (x, z) => this.prop('date_palm', x, z, { h: 8 + r() * 4, yaw: r() * 6.28 }));
      ring(3, 20, 120, gentle, (x, z) => this.prop('acacia', x, z, { h: 5 + r() * 2, yaw: r() * 6.28 }));
    }
    if (pl.vegetation === 'maquis' || pl.vegetation === 'batha') {
      ring(pl.vegetation === 'batha' ? 7 : 5, 12, 120, gentle, (x, z) => this.prop('olive', x, z, { h: 4 + r() * 2, yaw: r() * 6.28 }));
      if (pl.culture.length) ring(4, 25, 140, gentle, (x, z) => this.prop('cypress', x, z, { h: 8 + r() * 4 }));
    }
    if (pl.landforms.includes('terraces')) {
      // A few showpiece dry-stone panels on the nearest terrace step.
      const a = (this.heading * Math.PI) / 180;
      for (let i = -3; i <= 3; i++) {
        const x = Math.sin(a) * 14 + Math.cos(a) * i * 2.4, z = -Math.cos(a) * 14 + Math.sin(a) * i * 2.4;
        this.prop('terrace_wall', x, z, { h: 1.0, yaw: -a, sink: 0.3 });
      }
    }
    if (pl.culture.includes('glass_towers') || pl.culture.includes('chain_stores')) {
      const a = (this.heading * Math.PI) / 180;
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue;
        const x = Math.sin(a) * 9 + Math.cos(a) * i * 9, z = -Math.cos(a) * 9 + Math.sin(a) * i * 9;
        if (this.dry(x, z)) this.prop('fan_palm', x, z, { h: 10 + r() * 3, yaw: r() * 6.28 });
      }
    }
  }

  /** See-through tower while the camera climbs inside it (1 = solid). */
  fadeLookout(alpha: number) {
    this.lookoutObj?.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      if (!m.userData.fadeMat) m.userData.fadeMat = m.material = (m.material as THREE.Material).clone();
      const mat = m.material as THREE.Material;
      mat.transparent = alpha < 1;
      mat.opacity = alpha;
      mat.depthWrite = alpha >= 1;
    });
  }

  heightAt(x: number, z: number) {
    return this.field.height(x, z);
  }

  /** Ground height including flat roofs/decks the player can stand on (the lookout deck). */
  groundAt(x: number, z: number) {
    return this.heightAt(x, z);
  }

  toLatLon(x: number, z: number): [number, number] {
    return [this.place.lat - z / M_PER_DEG_LAT, this.place.lon + x / mPerDegLon(this.place.lat)];
  }

  private computeWaterLevel(): number | null {
    const wl = this.place.waterLevelM;
    if (wl === undefined) {
      // Coastal patches: bathymetry below 0 means the sea is in the patch.
      let min = Infinity;
      for (let i = 0; i < this.patch.data.length; i += 7) min = Math.min(min, this.patch.data[i] / 10);
      return min < -1 ? 0 : null;
    }
    if (wl >= -1) return 0;
    // Lakes: the relief (SRTM, 2000) has its own flat lake surface; sit just above it.
    // Use the commonest low value (the flat surface), not a single deep pixel.
    const counts = new Map<number, number>();
    let min = Infinity;
    for (let i = 0; i < this.patch.data.length; i++) min = Math.min(min, this.patch.data[i] / 10);
    for (let i = 0; i < this.patch.data.length; i++) {
      const m = Math.round(this.patch.data[i] / 10);
      if (m < min + 10) counts.set(m, (counts.get(m) ?? 0) + 1);
    }
    const surface = [...counts].sort((a, b) => b[1] - a[1])[0][0];
    return Math.max(wl, surface + 0.6);
  }

  private buildSky(sunElev: number) {
    const top = this.night ? new THREE.Color(0x0b1430) : new THREE.Color(0x3d7fc0).lerp(new THREE.Color(0x6a6aa8), Math.max(0, 1 - sunElev / 15) * 0.5);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        top: { value: top },
        horizon: { value: this.fogColor.clone() },
        sunDir: { value: this.sunDir.clone() },
        sunColor: { value: this.night ? new THREE.Color(0xdfe6ff) : new THREE.Color(0xfff0c0) },
        night: { value: this.night ? 1 : 0 },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }`,
      fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunColor; uniform float night; varying vec3 vDir;
        float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
        void main(){
          float y = max(vDir.y, 0.0);
          vec3 c = mix(horizon, top, pow(y, 0.55));
          vec3 sd = normalize(night > 0.5 ? vec3(-0.4, 0.55, -0.5) : sunDir);
          float d = max(dot(normalize(vDir), sd), 0.0);
          c += sunColor * (pow(d, 900.0) * 4.0 + pow(d, 16.0) * (night > 0.5 ? 0.05 : 0.18));
          if (night > 0.5) { vec3 q = floor(vDir * 300.0); float s = step(0.997, h(q)) * y; c += vec3(s); }
          if (vDir.y < 0.0) c = horizon;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(80000, 32, 16), mat);
    this.sky.renderOrder = -1;
    this.group.add(this.sky);
  }

  private buildWater() {
    if (this.waterLevel === null) return;
    const salt = this.place.landforms.includes('salt_lake');
    const fresh = this.place.landforms.includes('fresh_lake');
    const color = salt ? 0x8fd0c8 : fresh ? 0x3f87a8 : 0x2f7fa0;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: salt ? 0.25 : 0.12, metalness: 0.15, transparent: true, opacity: salt ? 0.92 : 0.88 });
    const size = salt || fresh ? 9000 : 120000;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 1, 1), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = this.waterLevel;
    m.name = 'water';
    m.receiveShadow = true;
    this.group.add(m);
    this.water.push(m);
    // Shimmer strip toward the sun
    if (!this.night) {
      const glint = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ color: 0xffe3a0, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      glint.rotation.x = -Math.PI / 2;
      glint.position.set(this.sunDir.x * 2500, this.waterLevel + 0.3, this.sunDir.z * 2500);
      glint.scale.set(180, 3000, 1);
      glint.rotation.z = Math.atan2(this.sunDir.x, -this.sunDir.z);
      this.group.add(glint);
      this.water.push(glint);
    }
  }

  /** Keeps the opening view clear: true for spots close in front of the start heading. */
  private inView(x: number, z: number, dist = 40) {
    const d = Math.hypot(x, z);
    if (d > dist) return false;
    const a = (Math.atan2(x, -z) * 180) / Math.PI;
    const diff = Math.abs(((a - this.heading + 540) % 360) - 180);
    return diff < 60;
  }

  private dry(x: number, z: number, margin = 0.6) {
    return this.waterLevel === null || this.heightAt(x, z) > this.waterLevel + margin;
  }

  private slope(x: number, z: number) {
    const e = 2;
    return Math.hypot(this.heightAt(x + e, z) - this.heightAt(x - e, z), this.heightAt(x, z + e) - this.heightAt(x, z - e)) / (2 * e);
  }

  private placeLookout() {
    const a = ((this.heading + 35) * Math.PI) / 180;
    let best = { x: Math.sin(a) * 28, z: -Math.cos(a) * 28 };
    // Prefer a dry, gentle spot near the start.
    for (let k = 0; k < 24; k++) {
      const ang = a + k * 0.26;
      const x = Math.sin(ang) * 28, z = -Math.cos(ang) * 28;
      if (this.dry(x, z, 1) && this.slope(x, z) < 0.35) {
        best = { x, z };
        break;
      }
    }
    const y = this.heightAt(best.x, best.z);
    const H = 16;
    const tower = this.models.instance('lookout_tower', H);
    let t: THREE.Object3D;
    if (tower) {
      t = tower.root;
      t.rotation.y = Math.atan2(-best.x, -best.z);
      t.traverse((o) => ((o as THREE.Mesh).frustumCulled = true));
      this.lookoutTop = H * LOOKOUT_DECK;
    } else t = lookoutTower();
    t.position.set(best.x, y, best.z);
    this.group.add(t);
    this.lookoutObj = t;
    this.lookout.set(best.x, y, best.z);
  }

  private scatter() {
    const b = this.biome;
    const r = rng(Math.floor(this.place.lat * 1000 + this.place.lon * 100));
    const shrubMat = new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true });
    const shrubColors: Record<string, number> = { maquis: 0x4f6b35, batha: 0x8a9466, desert: 0x9a9470, acacia: 0x8f8a62, dune: 0xa9b07a, oasis: 0x4f7a3a, bare: 0xb8b39a };
    const tint = new THREE.Color(shrubColors[b.vegetation]);
    const area = 2 * 380;
    const nShrub = Math.min(6000, Math.round(((area * area) / 100) * b.plantDensity * 0.18));
    const shrubs = new THREE.InstancedMesh(shrubGeometry(2), shrubMat, nShrub);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const col = new THREE.Color();
    let k = 0;
    for (let i = 0; i < nShrub * 3 && k < nShrub; i++) {
      const x = (r() * 2 - 1) * 380, z = (r() * 2 - 1) * 380;
      if (Math.hypot(x, z) < 4) continue;
      const clump = fbm(x / 40, z / 40, 2);
      if (clump < (b.vegetation === 'maquis' ? -0.35 : 0.0)) continue;
      if (!this.dry(x, z, 0.8) || this.slope(x, z) > 0.9) continue;
      const sc = (b.vegetation === 'maquis' ? 1.6 : b.vegetation === 'batha' ? 0.8 : 0.6) * (0.6 + r() * 0.9);
      p.set(x, this.heightAt(x, z) - 0.1, z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28);
      s.set(sc, sc * (0.8 + r() * 0.4), sc);
      m.compose(p, q, s);
      shrubs.setMatrixAt(k, m);
      col.copy(tint).offsetHSL((r() - 0.5) * 0.04, (r() - 0.5) * 0.1, (r() - 0.5) * 0.1);
      shrubs.setColorAt(k, col);
      k++;
    }
    shrubs.count = k;
    shrubs.castShadow = true;
    shrubs.receiveShadow = true;
    this.group.add(shrubs);

    // Grass tufts where there is enough rain, and dune grass on sand.
    if (b.greenness > 0.2 || b.vegetation === 'dune') {
      const nT = b.vegetation === 'dune' ? 1400 : Math.round(3500 * b.greenness);
      const tufts = new THREE.InstancedMesh(tuftGeometry(), vertexMat(), nT);
      const tc = new THREE.Color(b.vegetation === 'dune' ? 0xb7b27a : b.grassColor);
      let j = 0;
      for (let i = 0; i < nT * 3 && j < nT; i++) {
        const x = (r() * 2 - 1) * 200, z = (r() * 2 - 1) * 200;
        if (!this.dry(x, z, 0.8) || this.slope(x, z) > 0.7) continue;
        p.set(x, this.heightAt(x, z) - 0.05, z);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28);
        const sc = 0.8 + r() * 0.8;
        s.set(sc, sc, sc);
        m.compose(p, q, s);
        tufts.setMatrixAt(j, m);
        col.copy(tc).offsetHSL(0, 0, (r() - 0.5) * 0.12);
        tufts.setColorAt(j, col);
        j++;
      }
      tufts.count = j;
      this.group.add(tufts);
    }

    // Trees by vegetation type (Tripo olive/cypress/palm when available).
    const treeKinds: Record<string, ('oak' | 'pine' | 'acacia' | 'olive' | 'palm' | 'tamarisk')[]> = {
      maquis: ['oak', 'oak', 'pine'],
      batha: ['olive'],
      desert: ['tamarisk'],
      acacia: ['acacia'],
      dune: ['tamarisk'],
      oasis: ['palm', 'acacia', 'tamarisk'],
      bare: [],
    };
    const kinds = treeKinds[b.vegetation];
    const nTrees = Math.round(((area * area) / 100) * b.plantDensity * b.treeShare * 0.02);
    for (const kind of kinds) {
      const n = Math.round(nTrees / kinds.length);
      if (!n) continue;
      const geo = treeGeometry(kind);
      const im = new THREE.InstancedMesh(geo, vertexMat(), n);
      let j = 0;
      for (let i = 0; i < n * 6 && j < n; i++) {
        const x = (r() * 2 - 1) * 380, z = (r() * 2 - 1) * 380;
        if (Math.hypot(x, z) < 10 || this.inView(x, z, 45) || !this.dry(x, z, 1) || this.slope(x, z) > 0.7) continue;
        if (kind === 'acacia' || kind === 'tamarisk') {
          // Desert trees grow in the channels: prefer low ground.
          const around = (this.heightAt(x + 25, z) + this.heightAt(x - 25, z) + this.heightAt(x, z + 25) + this.heightAt(x, z - 25)) / 4;
          if (this.heightAt(x, z) > around - 0.6) continue;
        }
        const h = (kind === 'palm' ? 11 : kind === 'pine' ? 9 : kind === 'acacia' ? 5 : 6) * (0.7 + r() * 0.6);
        p.set(x, this.heightAt(x, z) - 0.2, z);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28);
        s.set(h, h, h);
        m.compose(p, q, s);
        im.setMatrixAt(j++, m);
      }
      im.count = j;
      im.castShadow = true;
      this.group.add(im);
    }

    // Boulders of the place's rock.
    const nB = this.place.rock === 'basalt' ? 420 : this.place.rock === 'sand' || this.place.rock === 'loess' ? 25 : 160;
    const bm = new THREE.MeshStandardMaterial({ color: b.rockColor, roughness: 0.95, flatShading: true });
    const boulders = new THREE.InstancedMesh(boulderGeometry(this.place.rock), bm, nB);
    let j = 0;
    for (let i = 0; i < nB * 4 && j < nB; i++) {
      const x = (r() * 2 - 1) * 260, z = (r() * 2 - 1) * 260;
      if (Math.hypot(x, z) < 6 || !this.dry(x, z, 0.5)) continue;
      const sc = (0.5 + r() * 1.6) * (this.place.rock === 'basalt' ? 1 : 1.2);
      if (sc > 1.1 && this.inView(x, z, 25)) continue;
      p.set(x, this.heightAt(x, z) - 0.15 * sc, z);
      q.setFromEuler(new THREE.Euler(r() * 0.4, r() * 6.28, r() * 0.4));
      s.set(sc, sc, sc);
      m.compose(p, q, s);
      boulders.setMatrixAt(j, m);
      col.set(b.rockColor).offsetHSL(0, 0, (r() - 0.5) * 0.12);
      boulders.setColorAt(j, col);
      j++;
    }
    boulders.count = j;
    boulders.castShadow = true;
    boulders.receiveShadow = true;
    boulders.name = 'boulders';
    this.group.add(boulders);
  }

  /** Point on the ground at a heading (degrees from north) and distance. */
  private at(headingDeg: number, dist: number): THREE.Vector3 {
    const a = (headingDeg * Math.PI) / 180;
    const x = Math.sin(a) * dist, z = -Math.cos(a) * dist;
    return new THREE.Vector3(x, this.heightAt(x, z), z);
  }

  private anchor(obs: Observation, pos: THREE.Vector3, range: number, cone = 22) {
    this.anchors.push({ obs, pos, range, cone });
  }

  /** Search the patch for the strongest feature of a kind within a radius. */
  private findCell(score: (x: number, z: number) => number, radius: number, step = 40): THREE.Vector3 {
    let best = new THREE.Vector3(), bs = -Infinity;
    for (let x = -radius; x <= radius; x += step)
      for (let z = -radius; z <= radius; z += step) {
        if (Math.hypot(x, z) > radius || Math.hypot(x, z) < 60) continue;
        const s = score(x, z);
        if (s > bs) {
          bs = s;
          best = new THREE.Vector3(x, this.heightAt(x, z), z);
        }
      }
    return best;
  }

  private horizonHigh(radiusM: number): THREE.Vector3 {
    let best = new THREE.Vector3(0, -1e9, -radiusM), mLon = mPerDegLon(this.place.lat);
    for (let x = -radiusM; x <= radiusM; x += 400)
      for (let z = -radiusM; z <= radiusM; z += 400) {
        const d = Math.hypot(x, z);
        if (d > radiusM || d < 1500) continue;
        const h = this.country.at(this.place.lat - z / M_PER_DEG_LAT, this.place.lon + x / mLon);
        if (h > best.y) best = new THREE.Vector3(x, h, z);
      }
    return best;
  }

  private dressLandforms() {
    const pl = this.place;
    const r = rng(11);
    for (const lf of pl.landforms) {
      const obs: Observation = { kind: 'landform', landform: lf };
      switch (lf) {
        case 'sea_west': {
          let pos = new THREE.Vector3(-3000, 0, 0);
          for (let d = 60; d < 2000; d += 20)
            if (this.patch.at(-d, 0) < -0.5) {
              pos = new THREE.Vector3(-d - 200, 0, 0);
              break;
            }
          this.anchor(obs, pos, 8000, 30);
          break;
        }
        case 'salt_lake':
        case 'fresh_lake': {
          const wl = this.waterLevel ?? 0;
          const pos = this.findCell((x, z) => (this.patch.at(x, z) < wl + 0.3 ? 1e4 - Math.hypot(x, z) : -1e9), 2000, 40);
          this.anchor(obs, pos, 6000, 30);
          break;
        }
        case 'makhtesh':
        case 'canyon':
        case 'rift_cliffs':
        case 'kurkar_cliff': {
          const pos = this.findCell((x, z) => {
            const d = Math.abs(this.patch.at(x + 30, z) - this.patch.at(x - 30, z)) + Math.abs(this.patch.at(x, z + 30) - this.patch.at(x, z - 30));
            return d - Math.hypot(x, z) * (lf === 'kurkar_cliff' ? 0.05 : 0.01);
          }, lf === 'kurkar_cliff' ? 600 : 1800);
          this.anchor(obs, pos, 5000, 26);
          break;
        }
        case 'wadi': {
          const pos = this.findCell((x, z) => -this.patch.at(x, z) - Math.hypot(x, z) * 0.02, 500, 20);
          this.anchor(obs, pos, 1500, 26);
          break;
        }
        case 'volcanic_cones':
        case 'granite_peaks': {
          const pos = lf === 'volcanic_cones' ? this.horizonHigh(9000) : this.findCell((x, z) => this.patch.at(x, z), 1900, 40);
          this.anchor(obs, pos, 20000, 22);
          break;
        }
        case 'terraces': {
          // Dry-stone walls along contour lines on the slope in front.
          const wallMat = new THREE.MeshStandardMaterial({ color: 0xcdbb92, roughness: 1, flatShading: true });
          const seg = new THREE.BoxGeometry(2.2, 1.1, 0.7);
          const segs: THREE.Matrix4[] = [];
          const base = this.heightAt(0, 0);
          for (let lvl = -14; lvl <= 14; lvl += 2.2) {
            const target = base + lvl;
            for (let x = -140; x <= 140; x += 2) {
              let lo = -140, hi = 140, found = false;
              // Find z along the column where the height crosses the contour.
              for (let z = -140; z < 140; z += 4) {
                const a = this.heightAt(x, z) - target, b = this.heightAt(x, z + 4) - target;
                if (a * b <= 0) {
                  lo = z;
                  hi = z + 4;
                  found = true;
                  break;
                }
              }
              if (!found) continue;
              const z = (lo + hi) / 2;
              if (Math.hypot(x, z) < 6 || !this.dry(x, z)) continue;
              const mm = new THREE.Matrix4().compose(new THREE.Vector3(x, this.heightAt(x, z) + 0.2, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
              segs.push(mm);
            }
          }
          const im = new THREE.InstancedMesh(seg, wallMat, Math.max(1, segs.length));
          segs.forEach((mm, i) => im.setMatrixAt(i, mm));
          im.count = segs.length;
          im.castShadow = true;
          im.receiveShadow = true;
          this.group.add(im);
          this.anchor(obs, this.at(this.heading, 25), 140, 40);
          break;
        }
        case 'sinkholes': {
          for (const e of this.field.edits) {
            const ring = new THREE.Mesh(new THREE.RingGeometry(e.r * 0.85, e.r * 1.15, 16), new THREE.MeshStandardMaterial({ color: 0xbfb49a, roughness: 1 }));
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(e.x, this.field.base(e.x, e.z) + 0.15, e.z);
            this.group.add(ring);
          }
          const e0 = this.field.edits[0];
          this.anchor(obs, new THREE.Vector3(e0.x, this.heightAt(e0.x, e0.z), e0.z), 160, 35);
          // Warning sign (no text needed: a red triangle)
          const sign = signBoard(['⚠', 'בולענים'], '#f7e7c7', '#a02a1a', 2.4, 1.6);
          const sp = this.at(this.heading + 15, 9);
          sign.position.set(sp.x, sp.y + 1.6, sp.z);
          sign.lookAt(0, sp.y + 1.6, 0);
          this.group.add(sign);
          break;
        }
        case 'kurkar_ridge':
        case 'basalt_plateau':
        case 'loess_plain':
        case 'dunes': {
          const c = lf === 'kurkar_ridge' ? 0xc79a6b : lf === 'basalt_plateau' ? 0x3a3634 : lf === 'loess_plain' ? 0xc9ac82 : 0xe9d6a9;
          if (lf === 'basalt_plateau' && this.models.has('basalt_boulders')) {
            const out = this.at(this.heading - 20, 14);
            for (let i = 0; i < 4; i++) {
              const ox = out.x + (r() - 0.5) * 10, oz = out.z + (r() - 0.5) * 10;
              this.prop('basalt_boulders', ox, oz, { h: 1.2 + r() * 1.2, yaw: r() * 6.28, sink: 0.25 });
            }
            this.anchor(obs, out, 90, 35);
          } else if (lf !== 'dunes' && lf !== 'loess_plain') {
            const mat = new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true });
            const out = this.at(this.heading - 20, 14);
            for (let i = 0; i < 9; i++) {
              const bm = new THREE.Mesh(boulderGeometry(lf === 'kurkar_ridge' ? 'kurkar' : 'basalt', i + 2), mat);
              const sc = 1.2 + r() * 1.8;
              bm.scale.setScalar(sc);
              const ox = out.x + (r() - 0.5) * 9, oz = out.z + (r() - 0.5) * 9;
              bm.position.set(ox, this.heightAt(ox, oz) - 0.2, oz);
              bm.rotation.y = r() * 6;
              bm.castShadow = bm.receiveShadow = true;
              this.group.add(bm);
            }
            this.anchor(obs, out, 90, 35);
          } else {
            this.anchor(obs, this.at(this.heading + 180, 30), 200, 60);
            this.anchor({ ...obs }, this.at(this.heading, 30), 200, 60);
          }
          break;
        }
      }
    }
  }

  private building(obj: THREE.Object3D, x: number, z: number, faceTo = new THREE.Vector3()) {
    let minH = Infinity;
    for (const [dx, dz] of [[-5, -5], [5, -5], [-5, 5], [5, 5], [0, 0]]) minH = Math.min(minH, this.heightAt(x + dx, z + dz));
    obj.position.set(x, minH - 0.3, z);
    obj.lookAt(faceTo.x, minH, faceTo.z);
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.castShadow = m.receiveShadow = true;
    });
    this.group.add(obj);
  }

  private dressCulture() {
    const pl = this.place;
    const c = pl.culture;
    if (!c.length) return;
    const r = rng(23);
    const front = this.heading;
    const towers = c.includes('glass_towers');
    const stone = c.includes('stone_houses');
    const dense = c.includes('dense_town') || towers;
    const nHouses = dense ? 150 : c.includes('sparse_town') ? 14 : c.includes('stone_houses') || c.includes('church') ? 40 : 0;
    for (let i = 0; i < nHouses; i++) {
      const ang = front + (r() - 0.5) * (dense ? 300 : 160);
      // Dense towns pack in (square-root spread keeps the middle full); from the kite they read as one built-up block.
      const d = 35 + (dense ? Math.sqrt(r()) * 230 : r() * 220);
      const a = (ang * Math.PI) / 180;
      const x = Math.sin(a) * d, z = -Math.cos(a) * d;
      if (!this.dry(x, z, 1) || this.slope(x, z) > 0.6 || Math.hypot(x, z) < 25) continue;
      const tripoHouse = stone && d < 140 && r() < 0.5 ? this.models.instance('house', 5 + r() * 3)?.root : undefined;
      const house = tripoHouse ? tripoHouse : towers && r() < 0.4 ? glassTower(40 + r() * 80, 14 + r() * 12) : stone ? stoneHouse(7 + r() * 5, 7 + r() * 5, 2 + Math.floor(r() * 3), 0xe8dcc0) : c.includes('sparse_town') ? tiledHouse() : stoneHouse(8 + r() * 6, 8 + r() * 4, dense ? 3 + Math.floor(r() * 5) : 2, 0xf0ebe0);
      this.building(house, x, z);
    }
    if (c.includes('church')) {
      const p = this.at(front + 25, 70);
      this.building(this.models.instance('church_tower')?.root ?? churchTower(), p.x, p.z);
      this.anchor({ kind: 'culture', sign: 'church' }, p.clone().setY(p.y + 15), 600, 18);
    }
    if (c.includes('mosque')) {
      const p = this.at(front - 30, 85);
      this.building(this.models.instance('minaret', 22)?.root ?? minaret(), p.x, p.z);
      this.anchor({ kind: 'culture', sign: 'mosque' }, p.clone().setY(p.y + 18), 600, 18);
    }
    if (c.includes('old_market')) {
      for (let i = 0; i < 6; i++) {
        const p = this.at(front - 8 + i * 4, 16 + (i % 2) * 5);
        this.building((i % 2 ? this.models.instance('market_stall')?.root : null) ?? marketStall([0xc0503a, 0x3a7a9a, 0xd9a030][i % 3]), p.x, p.z, new THREE.Vector3(0, 0, 0));
      }
      this.anchor({ kind: 'culture', sign: 'old_market' }, this.at(front, 18), 90, 30);
    }
    if (c.includes('multilingual_signs')) {
      const p = this.at(front + 12, 11);
      const s = signBoard(['שוק', 'سوق', 'MARKET'], '#1f5a3a', '#f4ead2', 3, 2);
      s.position.set(p.x, p.y + 2.2, p.z);
      s.lookAt(0, p.y + 2.2, 0);
      this.group.add(s);
      this.anchor({ kind: 'culture', sign: 'multilingual_signs' }, s.position.clone(), 60, 25);
    }
    if (c.includes('pilgrim_hotels')) {
      const p = this.at(front + 60, 120);
      const h = stoneHouse(26, 14, 6, 0xf2ead8);
      this.building(h, p.x, p.z);
      const s = signBoard(['HOTEL', 'מלון'], '#f4ead2', '#2a3a5a', 8, 3);
      s.position.set(p.x, p.y + 20, p.z);
      s.lookAt(0, p.y + 20, 0);
      this.group.add(s);
      this.anchor({ kind: 'culture', sign: 'pilgrim_hotels' }, p.clone().setY(p.y + 12), 400, 20);
    }
    if (c.includes('stone_houses')) this.anchor({ kind: 'culture', sign: 'stone_houses' }, this.at(front, 50).setY(this.heightAt(0, 0) + 4), 300, 50);
    if (towers) {
      const p = this.at(front, 90);
      this.building(glassTower(140, 30), p.x, p.z);
      this.anchor({ kind: 'culture', sign: 'glass_towers' }, p.clone().setY(p.y + 60), 800, 25);
    }
    if (c.includes('chain_stores')) {
      const p = this.at(front - 20, 14);
      const shop = stoneHouse(10, 6, 1, 0xf5f5f5);
      this.building(shop, p.x, p.z, new THREE.Vector3());
      const s = signBoard(['COFFEE • 24/7'], '#1a1a1a', '#ffffff', 6, 1.4);
      s.position.set(p.x, p.y + 3.6, p.z);
      s.lookAt(0, p.y + 3.6, 0);
      this.group.add(s);
      this.anchor({ kind: 'culture', sign: 'chain_stores' }, s.position.clone(), 80, 30);
    }
    if (c.includes('nabatean_dam')) {
      const p = this.findCell((x, z) => -this.patch.at(x, z) - Math.hypot(x, z) * 0.15, 260, 10);
      const dam = new THREE.Mesh(new THREE.BoxGeometry(22, 2.6, 2.2), new THREE.MeshStandardMaterial({ color: 0xc9b088, roughness: 1, flatShading: true }));
      dam.position.set(p.x, p.y + 0.9, p.z);
      dam.lookAt(0, p.y + 0.9, 0);
      dam.castShadow = dam.receiveShadow = true;
      this.group.add(dam);
      this.anchor({ kind: 'culture', sign: 'nabatean_dam' }, dam.position.clone(), 200, 25);
    }
    if (c.includes('olive_groves') || c.includes('wheat_fields') || c.includes('kibbutz_fields')) {
      const isWheat = c.includes('wheat_fields') || c.includes('kibbutz_fields');
      const sign: Observation = { kind: 'culture', sign: isWheat ? (c.includes('wheat_fields') ? 'wheat_fields' : 'kibbutz_fields') : 'olive_groves' };
      const p = this.at(front + 70, 60);
      if (isWheat) {
        const field = new THREE.Mesh(new THREE.PlaneGeometry(90, 60, 30, 20), new THREE.MeshStandardMaterial({ color: 0xd9b860, roughness: 1 }));
        field.rotation.x = -Math.PI / 2;
        const pos = field.geometry.attributes.position as THREE.BufferAttribute;
        field.position.set(p.x, 0, p.z);
        field.updateMatrixWorld();
        for (let i = 0; i < pos.count; i++) {
          const wx = p.x + pos.getX(i), wz = p.z - pos.getY(i);
          pos.setZ(i, this.heightAt(wx, wz) + 0.25);
        }
        field.geometry.computeVertexNormals();
        field.receiveShadow = true;
        this.group.add(field);
      } else {
        const geo = treeGeometry('olive');
        const im = new THREE.InstancedMesh(geo, vertexMat(), 60);
        let j = 0;
        for (let gx = 0; gx < 10; gx++)
          for (let gz = 0; gz < 6; gz++) {
            const x = p.x + (gx - 5) * 8, z = p.z + (gz - 3) * 8;
            if (!this.dry(x, z)) continue;
            im.setMatrixAt(j++, new THREE.Matrix4().compose(new THREE.Vector3(x, this.heightAt(x, z) - 0.2, z), new THREE.Quaternion(), new THREE.Vector3(5, 5, 5)));
          }
        im.count = j;
        im.castShadow = true;
        this.group.add(im);
      }
      this.anchor(sign, p.clone().setY(p.y + 1), 300, 35);
    }
  }

  update(dt: number, focus: THREE.Vector3, camPos?: THREE.Vector3) {
    this.t += dt;
    if (camPos) {
      this.fill.position.copy(camPos).add(new THREE.Vector3(0, 20, 0));
      this.fill.target.position.copy(focus);
    }
    // Keep the shadow frustum around the player.
    this.sunLight.position.copy(focus).addScaledVector(this.night ? new THREE.Vector3(-0.4, 0.55, -0.5).normalize() : this.sunDir, 250);
    this.sunLight.target.position.copy(focus);
    for (const w of this.water) if (w.name === 'water') w.position.y = (this.waterLevel ?? 0) + Math.sin(this.t * 0.6) * 0.04;
  }

  dispose() {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
  }
}
