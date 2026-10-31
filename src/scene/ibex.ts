// יעלי's moods. Tripo's quadruped rig ships only a walk clip, so idle, taunt,
// sulk and leap are layered procedurally on the real bones (head, spine, root).
import * as THREE from 'three';

export type IbexMood = 'idle' | 'taunt' | 'sulk' | 'leap' | 'walk';

export class IbexRig {
  private mixer: THREE.AnimationMixer | null = null;
  private walk: THREE.AnimationAction | null = null;
  private bones: Record<string, THREE.Bone | undefined> = {};
  private rest = new Map<THREE.Bone, THREE.Euler>();
  private t = 0;
  mood: IbexMood = 'idle';
  private leapT = -1;
  /** Vertical offset applied to the model root (leaps, sulks). */
  lift = 0;

  constructor(readonly root: THREE.Object3D, clips: THREE.AnimationClip[]) {
    root.traverse((o) => {
      const b = o as THREE.Bone;
      if (!b.isBone) return;
      const n = b.name;
      for (const key of ['Head_0', 'Head_1', 'Head_2', 'Spine_0', 'Spine_2', 'bone_30', 'bone_31']) if (n.endsWith(key)) this.bones[key] = b;
    });
    for (const b of Object.values(this.bones)) if (b) this.rest.set(b, b.rotation.clone());
    const walk = clips.find((c) => c.name.includes('walk')) ?? clips[0];
    if (walk) {
      this.mixer = new THREE.AnimationMixer(root);
      this.walk = this.mixer.clipAction(walk);
      this.walk.play();
    }
  }

  get rigged() {
    return !!this.bones.Head_1;
  }

  set(mood: IbexMood) {
    if (mood === 'leap') this.leapT = 0;
    this.mood = mood;
  }

  update(dt: number) {
    this.t += dt;
    const walking = this.mood === 'walk' || this.leapT >= 0;
    if (this.walk) {
      this.walk.timeScale = walking ? (this.leapT >= 0 ? 2.2 : 1) : 0;
      if (!walking) this.walk.time = 0.35; // a standing pose from the walk cycle
    }
    this.mixer?.update(dt);
    for (const [b, r] of this.rest) b.rotation.copy(r);
    const head = this.bones.Head_1, neck = this.bones.Head_0, skull = this.bones.Head_2, spine = this.bones.Spine_2, tail = this.bones.bone_30;
    const t = this.t;
    this.lift = 0;
    if (this.leapT >= 0) {
      this.leapT += dt;
      const k = this.leapT / 0.9;
      this.lift = Math.sin(Math.min(1, k) * Math.PI) * 1.4;
      if (spine) spine.rotation.x += Math.sin(k * Math.PI) * -0.25;
      if (k >= 1) {
        this.leapT = -1;
        if (this.mood === 'leap') this.mood = 'taunt';
      }
    } else if (this.mood === 'taunt') {
      // Head shake + little hops: "can't catch me!"
      if (head) head.rotation.y += Math.sin(t * 9) * 0.35;
      if (skull) skull.rotation.z += Math.sin(t * 9 + 1) * 0.15;
      this.lift = Math.max(0, Math.sin(t * 5)) * 0.12;
      if (tail) tail.rotation.x += Math.sin(t * 14) * 0.5;
    } else if (this.mood === 'sulk') {
      if (neck) neck.rotation.x += 0.55;
      if (head) head.rotation.x += 0.35;
      this.lift = -0.12;
      if (tail) tail.rotation.x -= 0.4;
    } else {
      if (head) head.rotation.y += Math.sin(t * 0.7) * 0.25;
      if (neck) neck.rotation.x += Math.sin(t * 1.3) * 0.04;
      if (tail) tail.rotation.x += Math.sin(t * 6) * 0.2;
    }
  }
}
