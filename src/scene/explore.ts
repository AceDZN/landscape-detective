// Third-person ranger in a postcard: walk/run on the real relief, orbit camera,
// one lookout climb, the kite camera, gaze-to-notice anchors, and the ibex.
import * as THREE from 'three';
import type { Observation } from '../model/observe';
import { IbexRig } from './ibex';
import { Animator, ModelLib } from './models';
import { PostcardWorld, WALK_HALF, type Anchor } from './world';

export type ExploreMode = 'walk' | 'climb' | 'lookout' | 'kite' | 'action';

export interface ExploreEvents {
  onNotice(o: Observation): void;
  onGaze(progress: number, anchor: Anchor | null): void;
  onWalk(m: number): void;
}

function fallbackRanger(): THREE.Group {
  const g = new THREE.Group();
  const mat = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, flatShading: true });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 4, 8), mat(0xc8b48a));
  body.position.y = 1.05;
  const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.45, 4, 8), mat(0x5d6b3a));
  legs.position.y = 0.45;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), mat(0xe0b08a));
  head.position.y = 1.62;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.24, 0.12, 12), mat(0x4f6b35));
  cap.position.set(0, 1.78, 0);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.22), mat(0x6b5a3a));
  pack.position.set(0, 1.1, -0.28);
  g.add(body, legs, head, cap, pack);
  g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  return g;
}

function fallbackIbex(): THREE.Group {
  const g = new THREE.Group();
  const mat = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, flatShading: true });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.7, 4, 8), mat(0xc9a06a));
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.85;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 6), mat(0xc9a06a));
  head.rotation.z = -Math.PI / 2;
  head.position.set(0.7, 1.15, 0);
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 5, 10, Math.PI), mat(0x5a4632));
    horn.position.set(0.55, 1.45, s * 0.08);
    horn.rotation.y = Math.PI / 2;
    g.add(horn);
  }
  for (const [x, z] of [[-0.35, -0.15], [-0.35, 0.15], [0.35, -0.15], [0.35, 0.15]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.6), mat(0x8a6a48));
    leg.position.set(x, 0.3, z);
    g.add(leg);
  }
  g.add(body, head);
  g.rotation.y = -Math.PI / 2; // face +Z
  const root = new THREE.Group();
  root.add(g);
  return root;
}

/** Sizes are in the hand bone's space (the rig is scaled ~1/100), so they are set in world-ish units below. */
function handHammer(): THREE.Object3D {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.42, 6), new THREE.MeshStandardMaterial({ color: 0x8a5a32 }));
  handle.position.y = 0.12;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x5a5a62, metalness: 0.7, roughness: 0.35 }));
  head.position.y = 0.32;
  g.add(handle, head);
  g.visible = false;
  g.userData.worldSize = true;
  return g;
}
function handBook(): THREE.Object3D {
  const g = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.03), new THREE.MeshStandardMaterial({ color: 0x3f7a4c }));
  g.visible = false;
  g.userData.worldSize = true;
  return g;
}

export class Explorer {
  readonly player = new THREE.Group();
  readonly ibex = new THREE.Group();
  ranger: Animator | null = null;
  private handHammer: THREE.Object3D | null = null;
  private handBook: THREE.Object3D | null = null;
  private actionRole = '';
  ibexRig: IbexRig | null = null;
  private ibexModel: THREE.Object3D | null = null;
  mode: ExploreMode = 'walk';
  yaw = 0; // camera yaw, radians, 0 = looking north
  pitch = 0.32;
  dist = 7;
  facing = 0;
  speed = 0;
  keys = new Set<string>();
  target: THREE.Vector3 | null = null;
  lookoutUsed = false;
  kiteUsed = false;
  private modeT = 0;
  private gaze = { anchor: null as Anchor | null, t: 0 };
  readonly noticed = new Set<string>();
  private lastPos = new THREE.Vector3();
  private kiteCenter = new THREE.Vector3();
  private ibexPhase = 0;
  ibexMood: 'taunt' | 'sulk' | 'idle' = 'taunt';

  constructor(
    readonly world: PostcardWorld,
    readonly camera: THREE.PerspectiveCamera,
    readonly models: ModelLib,
    readonly ev: ExploreEvents,
  ) {
    const rg = models.instance('ranger');
    if (rg) {
      this.player.add(rg.root);
      this.ranger = new Animator(rg.root, rg.clips, rg.entry.clips);
      this.ranger.play('idle');
      // A rock hammer in the right hand and a notebook in the left, shown during actions.
      rg.root.traverse((o) => {
        if (o.name.endsWith('RightHand')) {
          this.handHammer = handHammer();
          o.add(this.handHammer);
        }
        if (o.name.endsWith('LeftHand')) {
          this.handBook = handBook();
          o.add(this.handBook);
        }
      });
      rg.root.updateMatrixWorld(true);
      for (const h of [this.handHammer, this.handBook]) {
        if (!h?.parent) continue;
        const ws = new THREE.Vector3();
        h.parent.getWorldScale(ws);
        h.scale.setScalar(1 / Math.max(1e-4, ws.x));
      }
    } else this.player.add(fallbackRanger());
    const ib = models.instance('ibex', 1.5);
    if (ib) {
      this.ibex.add(ib.root);
      this.ibexModel = ib.root;
      this.ibexRig = new IbexRig(ib.root, ib.clips);
      this.ibexRig.set('taunt');
    } else this.ibex.add(fallbackIbex());
    world.group.add(this.player, this.ibex);
    this.player.position.copy(world.spawn);
    this.lastPos.copy(world.spawn);
    this.yaw = (world.heading * Math.PI) / 180;
    this.facing = this.yaw;
    this.placeIbex();
  }

  private placeIbex() {
    // On a rise in front of the start, 60–120 m away.
    let best = new THREE.Vector3(0, -1e9, -80);
    for (let k = -6; k <= 6; k++) {
      const a = this.yaw + k * 0.12;
      for (const d of [55, 75, 95, 115]) {
        const x = Math.sin(a) * d, z = -Math.cos(a) * d;
        const h = this.world.heightAt(x, z);
        if (this.world.waterLevel !== null && h < this.world.waterLevel + 1) continue;
        if (h > best.y) best = new THREE.Vector3(x, h, z);
      }
    }
    this.ibex.position.copy(best);
    this.ibex.lookAt(this.player.position.x, best.y, this.player.position.z);
  }

  get grounded() {
    return this.mode === 'walk' || this.mode === 'action';
  }

  /** Click/tap on the ground → walk there. */
  walkTo(p: THREE.Vector3) {
    if (this.mode !== 'walk') return;
    this.target = p.clone();
  }

  playAction(role: 'hammer' | 'write' | 'cheer', seconds = 1.6) {
    if (this.mode !== 'walk') return 0;
    this.mode = 'action';
    this.actionRole = role;
    const d = this.ranger?.play(role, { once: true }) || seconds;
    this.modeT = Math.min(Math.max(d, 1.0), 3.5);
    return this.modeT;
  }

  canClimb() {
    return !this.lookoutUsed && this.mode === 'walk' && this.player.position.distanceTo(this.world.lookout) < 9;
  }

  climb() {
    if (!this.canClimb()) return false;
    this.lookoutUsed = true;
    this.mode = 'climb';
    this.modeT = 0;
    this.ranger?.play('climb');
    return true;
  }

  kite() {
    if (this.kiteUsed || this.mode !== 'walk') return false;
    this.kiteUsed = true;
    this.mode = 'kite';
    this.modeT = 0;
    this.kiteCenter.copy(this.player.position);
    this.ranger?.play('idle');
    return true;
  }

  /** Step the explorer. Movement input is in camera space (forward/right). */
  update(dt: number) {
    const w = this.world;
    const p = this.player.position;
    if (this.mode === 'walk' || this.mode === 'action') {
      let fwd = 0, right = 0;
      if (this.mode === 'walk') {
        if (this.keys.has('w') || this.keys.has('arrowup')) fwd += 1;
        if (this.keys.has('s') || this.keys.has('arrowdown')) fwd -= 1;
        if (this.keys.has('d') || this.keys.has('arrowright')) right += 1;
        if (this.keys.has('a') || this.keys.has('arrowleft')) right -= 1;
      }
      const run = this.keys.has('shift');
      let dir = new THREE.Vector3();
      if (fwd || right) {
        this.target = null;
        const f = new THREE.Vector3(Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const r = new THREE.Vector3(Math.cos(this.yaw), 0, Math.sin(this.yaw));
        dir.addScaledVector(f, fwd).addScaledVector(r, right).normalize();
      } else if (this.target) {
        dir = this.target.clone().sub(p).setY(0);
        if (dir.length() < 0.6) {
          this.target = null;
          dir.set(0, 0, 0);
        } else dir.normalize();
      }
      const want = dir.lengthSq() > 0 ? (run || (this.target && p.distanceTo(this.target) > 25) ? 6 : 3) : 0;
      this.speed += (want - this.speed) * Math.min(1, dt * 6);
      if (this.speed > 0.05 && dir.lengthSq() > 0) {
        const nx = p.x + dir.x * this.speed * dt, nz = p.z + dir.z * this.speed * dt;
        const ny = w.heightAt(nx, nz);
        const steep = (ny - p.y) / Math.max(0.01, this.speed * dt);
        const wet = w.waterLevel !== null && ny < w.waterLevel + 0.15;
        const inside = Math.abs(nx) < WALK_HALF && Math.abs(nz) < WALK_HALF;
        if (steep < 1.6 && !wet && inside) {
          const moved = Math.hypot(nx - p.x, nz - p.z);
          p.set(nx, ny, nz);
          this.ev.onWalk(moved);
        } else {
          this.speed *= 0.3;
          this.target = null;
        }
        const targetFacing = Math.atan2(dir.x, -dir.z);
        let d = targetFacing - this.facing;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        this.facing += d * Math.min(1, dt * 10);
      }
      p.y = w.heightAt(p.x, p.z);
      if (this.mode === 'action') {
        this.modeT -= dt;
        if (this.modeT <= 0) this.mode = 'walk';
      } else if (this.ranger) this.ranger.play(this.speed > 4 ? 'run' : this.speed > 0.4 ? 'walk' : 'idle', { timeScale: this.speed > 4 ? 1 : Math.max(0.6, this.speed / 2.4) });
    } else if (this.mode === 'climb') {
      this.modeT += dt;
      const L = w.lookout;
      const k = Math.min(1, this.modeT / 2.6);
      p.set(L.x, L.y + k * w.lookoutTop, L.z + 1.7 * (1 - k));
      if (k >= 1) {
        this.mode = 'lookout';
        this.modeT = 0;
        // First person on the deck: hide the tower so its posts never fill the view.
        if (w.lookoutObj) w.lookoutObj.visible = false;
        this.ranger?.play('idle');
      }
    } else if (this.mode === 'lookout') {
      this.modeT += dt;
      if (this.modeT > 0.2 && (this.keys.has('w') || this.keys.has('s') || this.keys.has('a') || this.keys.has('d') || this.keys.has('arrowup') || this.keys.has('arrowdown') || this.keys.has('escape') || this.target)) {
        this.target = null;
        this.mode = 'walk';
        if (w.lookoutObj) w.lookoutObj.visible = true;
        p.set(w.lookout.x + 2.5, w.heightAt(w.lookout.x + 2.5, w.lookout.z), w.lookout.z);
      }
    } else if (this.mode === 'kite') {
      this.modeT += dt;
      if (this.modeT >= 10) this.mode = 'walk';
    }
    this.player.rotation.y = -this.facing + Math.PI;
    if (this.handHammer) this.handHammer.visible = this.mode === 'action' && this.actionRole === 'hammer';
    if (this.handBook) this.handBook.visible = this.mode === 'action' && this.actionRole === 'write';
    this.ranger?.update(dt);
    this.updateIbex(dt);
    this.updateCamera(dt);
    this.updateGaze(dt);
  }

  private updateIbex(dt: number) {
    this.ibexPhase += dt;
    this.ibexRig?.update(dt);
    if (this.ibexModel && this.ibexRig) this.ibexModel.position.y = this.ibexRig.lift;
    const p = this.player.position;
    const d = this.ibex.position.distanceTo(p);
    const look = new THREE.Vector3(p.x, this.ibex.position.y, p.z);
    this.ibex.lookAt(look);
    if (d < 22 && this.mode === 'walk') {
      // The ibex leaps away to the next rise, laughing.
      const away = this.ibex.position.clone().sub(p).setY(0).normalize().multiplyScalar(45);
      const nx = THREE.MathUtils.clamp(this.ibex.position.x + away.x, -WALK_HALF - 40, WALK_HALF + 40);
      const nz = THREE.MathUtils.clamp(this.ibex.position.z + away.z, -WALK_HALF - 40, WALK_HALF + 40);
      this.ibex.position.set(nx, this.world.heightAt(nx, nz), nz);
      this.ibexRig?.set('leap');
    }
    if (!this.ibexRig) this.ibex.position.y = this.world.heightAt(this.ibex.position.x, this.ibex.position.z) + Math.abs(Math.sin(this.ibexPhase * 3)) * 0.15;
  }

  private updateCamera(dt: number) {
    const p = this.player.position;
    const cam = this.camera;
    if (this.mode === 'kite') {
      const t = this.modeT / 10;
      const a = this.yaw + t * Math.PI * 2;
      const h = 40 * Math.min(1, this.modeT / 1.5) + 2;
      const c = this.kiteCenter;
      cam.position.set(c.x + Math.sin(a) * 6, c.y + h, c.z - Math.cos(a) * 6);
      cam.lookAt(c.x + Math.sin(a) * 220, c.y - 10, c.z - Math.cos(a) * 220);
      return;
    }
    if (this.mode === 'lookout') {
      cam.position.set(p.x, p.y + 1.7, p.z);
      cam.lookAt(p.x + Math.sin(this.yaw) * 100, p.y + 1.7 - Math.tan(this.pitch - 0.25) * 100, p.z - Math.cos(this.yaw) * 100);
      return;
    }
    const dist = this.dist;
    const back = new THREE.Vector3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), Math.cos(this.yaw) * Math.cos(this.pitch));
    const want = p.clone().add(new THREE.Vector3(0, 1.6, 0)).addScaledVector(back, dist);
    const gy = this.world.heightAt(want.x, want.z) + 0.8;
    if (want.y < gy) want.y = gy;
    cam.position.lerp(want, Math.min(1, dt * 8));
    cam.lookAt(p.x + Math.sin(this.yaw) * 2, p.y + 1.5, p.z - Math.cos(this.yaw) * 2);
  }

  /** Looking at a feature for a moment writes it into the notebook. */
  private updateGaze(dt: number) {
    const cam = this.camera;
    const fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    let best: Anchor | null = null, bestCos = -1;
    for (const a of this.world.anchors) {
      const key = JSON.stringify(a.obs);
      if (this.noticed.has(key)) continue;
      const to = a.pos.clone().sub(cam.position);
      const d = to.length();
      if (d > a.range) continue;
      to.normalize();
      // Use the horizontal angle mostly so cliffs below and peaks above count.
      const fh = new THREE.Vector3(fwd.x, fwd.y * 0.3, fwd.z).normalize();
      const th = new THREE.Vector3(to.x, to.y * 0.3, to.z).normalize();
      const c = fh.dot(th);
      if (c > Math.cos((a.cone * Math.PI) / 180) && c > bestCos) {
        best = a;
        bestCos = c;
      }
    }
    if (best && best === this.gaze.anchor) this.gaze.t += dt;
    else this.gaze = { anchor: best, t: 0 };
    const need = 0.9;
    this.ev.onGaze(best ? Math.min(1, this.gaze.t / need) : 0, best);
    if (best && this.gaze.t >= need) {
      this.noticed.add(JSON.stringify(best.obs));
      this.ev.onNotice(best.obs);
      this.gaze = { anchor: null, t: 0 };
    }
  }

  /** Orbit the camera (drag). */
  orbit(dx: number, dy: number) {
    this.yaw += dx * 0.005;
    this.pitch = THREE.MathUtils.clamp(this.pitch + dy * 0.004, -0.15, 1.2);
  }

  zoom(delta: number) {
    this.dist = THREE.MathUtils.clamp(this.dist * (1 + delta * 0.001), 3.5, 22);
  }

  dispose() {
    this.ranger?.mixer.stopAllAction();
  }
}
