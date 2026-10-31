// Tripo GLB library: loads public/models/manifest.json and the GLBs it lists.
// Models are dressing and characters only; geography never comes from a mesh.
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

export interface ModelEntry {
  file: string;
  heightM: number;
  forward?: string;
  clips?: Record<string, string>;
  /** Extra yaw (radians) to square up a model whose body is turned in its bind pose. */
  yawRad?: number;
  yawOffsetRad?: number;
}

export class ModelLib {
  manifest: Record<string, ModelEntry> = {};
  private gltfs = new Map<string, GLTF>();
  private loader = new GLTFLoader();

  async init(base = './models/') {
    try {
      const res = await fetch(`${base}manifest.json`);
      if (res.ok) this.manifest = await res.json();
    } catch {
      this.manifest = {};
    }
    this.base = base;
  }
  private base = './models/';

  has(name: string) {
    return !!this.manifest[name];
  }

  async load(name: string): Promise<GLTF | null> {
    const e = this.manifest[name];
    if (!e) return null;
    const hit = this.gltfs.get(name);
    if (hit) return hit;
    try {
      const g = await this.loader.loadAsync(this.base + e.file);
      this.gltfs.set(name, g);
      return g;
    } catch (err) {
      console.warn('model failed', name, err);
      return null;
    }
  }

  async preload(names: string[]) {
    await Promise.all(names.filter((n) => this.has(n)).map((n) => this.load(n)));
  }

  /** A scaled, grounded clone (skinned meshes cloned with their skeletons). */
  instance(name: string, heightM?: number): { root: THREE.Object3D; clips: THREE.AnimationClip[]; entry: ModelEntry } | null {
    const g = this.gltfs.get(name);
    const e = this.manifest[name];
    if (!g || !e) return null;
    const inner = skeletonClone(g.scene);
    inner.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.frustumCulled = false;
      }
    });
    const box = new THREE.Box3().setFromObject(inner);
    const size = box.getSize(new THREE.Vector3());
    const s = (heightM ?? e.heightM) / Math.max(0.001, size.y);
    inner.scale.setScalar(s);
    inner.position.y = -box.min.y * s;
    const f = e.forward ?? '+Z';
    inner.rotation.y = (f === '-Z' ? Math.PI : f === '+X' ? -Math.PI / 2 : f === '-X' ? Math.PI / 2 : 0) + (e.yawRad ?? e.yawOffsetRad ?? 0);
    const root = new THREE.Group();
    root.add(inner);
    return { root, clips: g.animations, entry: e };
  }

  /** First mesh geometry + material of a static model, for instancing. */
  meshOf(name: string): { geo: THREE.BufferGeometry; mat: THREE.Material; scale: number } | null {
    const g = this.gltfs.get(name);
    const e = this.manifest[name];
    if (!g || !e) return null;
    let mesh: THREE.Mesh | null = null;
    g.scene.updateMatrixWorld(true);
    g.scene.traverse((o) => {
      if (!mesh && (o as THREE.Mesh).isMesh && !(o as THREE.SkinnedMesh).isSkinnedMesh) mesh = o as THREE.Mesh;
    });
    if (!mesh) return null;
    const m = mesh as THREE.Mesh;
    const geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
    const h = bb.max.y - bb.min.y;
    return { geo, mat: Array.isArray(m.material) ? m.material[0] : m.material, scale: e.heightM / Math.max(0.001, h) };
  }
}

/** Plays named roles on a rigged model; falls back gracefully when a role is missing. */
export class Animator {
  mixer: THREE.AnimationMixer;
  private actions = new Map<string, THREE.AnimationAction>();
  current = '';
  constructor(root: THREE.Object3D, clips: THREE.AnimationClip[], roles: Record<string, string> = {}) {
    this.mixer = new THREE.AnimationMixer(root);
    for (const [role, clipName] of Object.entries(roles)) {
      const clip = clips.find((c) => c.name === clipName) ?? clips.find((c) => c.name.toLowerCase().includes(role));
      if (clip) this.actions.set(role, this.mixer.clipAction(clip));
    }
    if (!this.actions.size && clips[0]) this.actions.set('idle', this.mixer.clipAction(clips[0]));
  }
  has(role: string) {
    return this.actions.has(role);
  }
  play(role: string, opts: { once?: boolean; fade?: number; timeScale?: number } = {}) {
    const a = this.actions.get(role) ?? this.actions.get('idle');
    if (!a) return 0;
    if (this.current === role && !opts.once) {
      a.timeScale = opts.timeScale ?? 1;
      return a.getClip().duration;
    }
    const prev = this.actions.get(this.current);
    a.reset();
    a.timeScale = opts.timeScale ?? 1;
    a.setLoop(opts.once ? THREE.LoopOnce : THREE.LoopRepeat, opts.once ? 1 : Infinity);
    a.clampWhenFinished = !!opts.once;
    a.play();
    if (prev && prev !== a) prev.crossFadeTo(a, opts.fade ?? 0.25, false);
    this.current = role;
    return a.getClip().duration / (opts.timeScale ?? 1);
  }
  update(dt: number) {
    this.mixer.update(dt);
  }
}
