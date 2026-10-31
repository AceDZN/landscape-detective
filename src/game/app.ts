// App controller: album → case intro → postcard (explore) → pin map → reveal → case end.
// All geography and scoring come from src/model; this file only wires input, scenes and HUD.
import * as THREE from 'three';
import { CASES } from '../data/cases';
import { PLACES } from '../data/places';
import { BELT_ZONES, ROCK_ZONES } from '../data/zones';
import { dailyCase, todayKey } from '../model/daily';
import { inPoly } from '../model/geo';
import { notebookLine, type Observation } from '../model/observe';
import { CountryRelief, PatchRelief, int16FromBuffer } from '../model/relief';
import { CaseSession, type PinResult } from '../model/session';
import { CULTURE_HE, LANDFORM_HE, ROCK_HE, TOOL_HE } from '../model/terms';
import type { CaseDef, Place, ToolId } from '../model/types';
import { Explorer } from '../scene/explore';
import { ModelLib } from '../scene/models';
import { PinMap, llToMap } from '../scene/pinmap';
import { PostcardWorld } from '../scene/world';
import { Sfx } from './audio';
import { Progress } from './progress';

type Mode = 'loading' | 'album' | 'intro' | 'explore' | 'map' | 'reveal' | 'caseEnd';

const TOOLS: { id: ToolId; ico: string; key: string }[] = [
  { id: 'hammer', ico: '⛏️', key: '1' },
  { id: 'guide', ico: '📗', key: '2' },
  { id: 'altimeter', ico: '⌚', key: '3' },
  { id: 'rain', ico: '🧪', key: '4' },
  { id: 'kite', ico: '🪁', key: '5' },
];

const WORLD_TABS: Record<number, { name: string; color: string; ico: string }> = {
  1: { name: 'שלוש רצועות ואבן שחורה', color: '#3f7a4c', ico: '⛰️' },
  2: { name: 'איפה נגמר הגשם', color: '#3a6a8a', ico: '🌧️' },
  3: { name: 'צורות הנוף', color: '#a0623a', ico: '🏜️' },
  4: { name: 'הפסיפס האנושי', color: '#7a4a6a', ico: '🏘️' },
};

const ROCK_ZONE_COLOR: Record<string, number> = { basalt: 0x3a3a4a, kurkar: 0xd08a40, sand: 0xf0d080, granite: 0xd05040, loess: 0xc8a060, marl_salt: 0xf4f4f4, chalk: 0xf8f0e0, sandstone: 0xc06a4a, limestone: 0xe8d8a0 };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export class App {
  renderer!: THREE.WebGLRenderer;
  camera = new THREE.PerspectiveCamera(55, 1, 0.3, 120000);
  scene = new THREE.Scene();
  relief!: CountryRelief;
  models = new ModelLib();
  sfx = new Sfx();
  pinmap!: PinMap;
  progress = new Progress();
  mode: Mode = 'loading';
  session: CaseSession | null = null;
  world: PostcardWorld | null = null;
  explorer: Explorer | null = null;
  paused = false;
  reduced = false;
  time = 0;
  private lastReveal: PinResult | null = null;
  private hud!: HTMLDivElement;
  private overlay!: HTMLDivElement;
  private radioTimer = 0;
  private pointers = new Map<number, { x: number; y: number; sx: number; sy: number; moved: boolean }>();
  private pinchD = 0;
  private freshKey = '';
  private patchCache = new Map<string, PatchRelief>();
  private countT = 0;
  private revealPending: { r: PinResult; place: Place } | null = null;
  private manualTime = false;
  private loadingToken = 0;

  constructor(readonly root: HTMLElement) {}

  async boot() {
    this.root.innerHTML = `<div class="loading">טוענים את התרמיל…</div>`;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.root.prepend(this.renderer.domElement);
    this.root.insertAdjacentHTML('beforeend', `<div class="vignette"></div><div class="frame"></div><div class="stamp" aria-hidden="true">🐐</div>`);
    this.hud = document.createElement('div');
    this.hud.className = 'hud';
    this.root.appendChild(this.hud);
    this.overlay = document.createElement('div');
    this.root.appendChild(this.overlay);

    const [buf] = await Promise.all([fetch('./terrain/israel.bin').then((r) => r.arrayBuffer()), this.models.init()]);
    this.relief = new CountryRelief(int16FromBuffer(buf));
    await this.models.preload(['ranger', 'ibex']);
    this.pinmap = new PinMap(this.relief, this.models);
    this.root.querySelector('.loading')?.remove();

    this.reduced = this.progress.data.reduced ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    document.body.classList.toggle('reduced', this.reduced);
    this.sfx.setMuted(!!this.progress.data.muted);

    new ResizeObserver(() => this.resize()).observe(this.root);
    this.resize();
    this.bindInput();
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.toast('הגרפיקה נעצרה לרגע… מנסים שוב');
    });
    this.renderer.domElement.addEventListener('webglcontextrestored', () => this.session && this.mode === 'explore' && this.loadPostcard(this.session.idx));
    window.addEventListener('blur', () => this.mode === 'explore' && !this.paused && this.pause(true));
    this.exposeTestHooks();
    this.showAlbum();
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!this.manualTime) this.step(dt);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private resize() {
    const w = this.root.clientWidth || 1, h = this.root.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.pinmap?.setAspect(w / h);
  }

  // ---------------------------------------------------------------- loop
  step(dt: number) {
    if (this.paused) return;
    this.time += dt;
    if (this.session) this.session.clock = this.time;
    if (this.mode === 'explore' && this.explorer && this.world) {
      this.explorer.update(dt);
      this.world.update(dt, this.explorer.player.position, this.camera.position);
      this.updateExploreHud();
    }
    if (this.mode === 'map' || this.mode === 'reveal') this.pinmap.update(dt);
    if (this.mode === 'reveal' && this.revealPending) {
      this.countT += dt;
      const { r } = this.revealPending;
      const k = Math.min(1, this.countT / (this.reduced ? 0.2 : 1.8));
      const el = this.hud.querySelector('.counter .num');
      if (el) {
        const prev = el.textContent;
        el.textContent = String(Math.round(r.km * k));
        if (prev !== el.textContent && k < 1) this.sfx.tick();
      }
      if (!this.pinmap.flying && k >= 1) this.finishReveal();
    }
    if (this.radioTimer > 0) {
      this.radioTimer -= dt;
      if (this.radioTimer <= 0) this.hud.querySelector('.radio')?.classList.remove('show');
    }
  }

  render() {
    if (this.mode === 'map' || this.mode === 'reveal') this.renderer.render(this.pinmap.scene, this.pinmap.camera);
    else if (this.world) this.renderer.render(this.scene, this.camera);
    else {
      this.renderer.setClearColor(0x2b2420);
      this.renderer.clear();
    }
  }

  // ---------------------------------------------------------------- album
  showAlbum() {
    this.mode = 'album';
    this.clearWorld();
    this.hud.innerHTML = '';
    const total = CASES.length * 3;
    const got = CASES.reduce((a, c) => a + (this.progress.best(c.id)?.stars ?? 0), 0);
    const pages = [1, 2, 3, 4]
      .map((w) => {
        const tab = WORLD_TABS[w];
        const slots = CASES.filter((c) => c.world === w)
          .map((c) => {
            const best = this.progress.best(c.id);
            const unlocked = this.unlocked(c.id);
            const isNext = unlocked && !best;
            const tilt = ((c.id * 37) % 7) - 3;
            const stars = best ? `<span class="st stars">${this.starsHtml(best.stars)}</span>` : '';
            return `<button class="slot ${unlocked ? '' : 'locked'} ${isNext ? 'next' : ''}" style="--tilt:${tilt * 0.6}deg" data-case="${c.id}" ${unlocked ? '' : 'disabled'} aria-label="${esc(c.titleHe)}">
              <div class="art" style="${this.thumbStyle(c)}"></div><span class="num">${c.id}</span>${stars}<span class="nm">${esc(c.titleHe)}</span></button>`;
          })
          .join('');
        return `<div class="page"><div class="tab" style="background:${tab.color}">${tab.ico} ${esc(tab.name)}</div>${slots}</div>`;
      })
      .join('');
    const daily = this.progress.data.daily?.[todayKey()];
    this.overlay.className = 'overlay';
    this.overlay.innerHTML = `<div class="album">
      <div class="album-head">
        <div class="title-pill">🌳 האלבום של יעלי <span class="stars">★ <bdi>${got}/${total}</bdi></span></div>
        <div style="display:flex;gap:8px">
          <button class="btn round" data-act="mute" aria-label="השתקה">${this.sfx.muted ? '🔇' : '🔊'}</button>
          <button class="btn round" data-act="settings" aria-label="הגדרות">⚙️</button>
        </div>
      </div>
      <div class="pages">${pages}</div>
      <div class="album-foot">
        <button class="btn" data-act="play">▶ שחק</button>
        <p style="color:#f3e6c8;margin:0;align-self:center;font-size:clamp(12px,1.8vmin,16px);max-width:52ch">יעלי היעלה גנבה את אלבום הגלויות של רשות הטבע. כל גלויה היא מקום אמיתי בישראל — אספו ראיות ונעצו סיכה.</p>
        <button class="btn" data-act="daily">📅 תיק יומי ${daily ? `<span class="stars">${this.starsHtml(daily.stars)}</span>` : ''}</button>
      </div></div>`;
    this.overlay.querySelectorAll<HTMLButtonElement>('.slot').forEach((b) => b.addEventListener('click', () => this.openIntro(CASES.find((c) => c.id === Number(b.dataset.case))!)));
    this.overlay.querySelector('[data-act=play]')!.addEventListener('click', () => {
      const next = CASES.find((c) => this.unlocked(c.id) && !this.progress.best(c.id)) ?? CASES[0];
      this.openIntro(next);
    });
    this.overlay.querySelector('[data-act=daily]')!.addEventListener('click', () => this.openIntro(dailyCase(todayKey())));
    this.overlay.querySelector('[data-act=mute]')!.addEventListener('click', (e) => {
      this.toggleMute();
      (e.currentTarget as HTMLElement).textContent = this.sfx.muted ? '🔇' : '🔊';
    });
    this.overlay.querySelector('[data-act=settings]')!.addEventListener('click', () => this.pause(true, true));
  }

  private thumbStyle(c: CaseDef) {
    const grads: Record<number, string> = {
      1: 'linear-gradient(#f2a36b 0 40%, #e9d6a9 40%)',
      2: 'linear-gradient(#8fc0e0 0 40%, #7f9a4a 40%)',
      3: 'linear-gradient(#f0d8a8 0 40%, #c9976a 40%)',
      4: 'linear-gradient(#a8c8e0 0 40%, #e8dcc0 40%)',
    };
    return `background:url(./thumbs/case-${c.id}.jpg) center/cover, ${grads[c.world]}`;
  }

  private unlocked(id: number) {
    if (id <= 1) return true;
    return !!this.progress.best(id - 1) || !!this.progress.best(id);
  }

  private starsHtml(n: number) {
    return [0, 1, 2].map((i) => (i < n ? '★' : '<span class="off">★</span>')).join('');
  }

  // ---------------------------------------------------------------- case flow
  openIntro(def: CaseDef) {
    this.sfx.unlock();
    this.sfx.click();
    this.mode = 'intro';
    const n = def.postcards.length;
    const charges = def.charges >= 50 ? 'ללא הגבלה (אימון)' : `<bdi>${def.charges}</bdi>`;
    this.overlay.className = 'overlay';
    this.overlay.innerHTML = `<div class="card">
      <div style="font-size:44px">📮</div>
      <h2>${def.id > 0 ? `תיק <bdi>${def.id}</bdi>: ` : ''}${esc(def.titleHe)}</h2>
      <p>${esc(def.introHe)}</p>
      <p><b>גלויות:</b> <bdi>${n}</bdi> · <b>מטעני כלים:</b> ${charges}${def.hints ? '' : ' · <b>בלי רמזים</b>'}</p>
      <p style="font-size:0.85em;color:#6b5640">צפון תמיד למעלה במפה, ומזרח מימין — גם כשהכתוב מימין לשמאל. השמש שוקעת במערב.</p>
      <div class="row"><button class="btn" data-act="go">יוצאים לשטח »</button><button class="btn ghost" data-act="back">לאלבום</button></div></div>`;
    this.overlay.querySelector('[data-act=go]')!.addEventListener('click', () => this.startCase(def));
    this.overlay.querySelector('[data-act=back]')!.addEventListener('click', () => this.showAlbum());
  }

  startCase(def: CaseDef, retry = 0) {
    this.sfx.unlock();
    const prevRetries = this.progress.data.retries?.[def.id] ?? 0;
    this.session = new CaseSession(def, PLACES, retry || prevRetries);
    this.progress.bumpRetry(def.id);
    this.loadPostcard(0);
  }

  private async patchFor(place: Place) {
    const hit = this.patchCache.get(place.id);
    if (hit) return hit;
    const buf = await fetch(`./terrain/places/${place.id}.bin`).then((r) => r.arrayBuffer());
    const p = new PatchRelief(int16FromBuffer(buf), place.lat, place.lon);
    this.patchCache.set(place.id, p);
    return p;
  }

  async loadPostcard(idx: number) {
    const s = this.session!;
    const token = ++this.loadingToken;
    this.mode = 'loading';
    this.overlay.className = 'overlay';
    this.overlay.innerHTML = `<div class="card"><div style="font-size:40px">✉️</div><h2>גלויה <bdi>${idx + 1}/${s.def.postcards.length}</bdi></h2><p>נוגעים בגלויה… ונכנסים פנימה.</p></div>`;
    const place = s.placeOf(idx);
    const pc = s.def.postcards[idx];
    const patch = await this.patchFor(place);
    await this.models.preload(['ranger', 'ibex', ...PostcardWorld.modelsFor(place)]);
    if (token !== this.loadingToken) return;
    this.clearWorld();
    this.world = new PostcardWorld(place, pc, patch, this.relief, this.models);
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(this.world.fogColor, pc.night ? 200 : 900, pc.night ? 5000 : 30000);
    this.scene.add(this.world.group);
    this.explorer = new Explorer(this.world, this.camera, this.models, {
      onNotice: (o) => this.onNotice(o),
      onGaze: (p, a) => this.onGaze(p, a ? this.obsLabel(a.obs) : ''),
      onWalk: (m) => this.session?.walk(m),
    });
    this.explorer.update(0.016);
    this.camera.position.copy(this.explorer.player.position).add(new THREE.Vector3(0, 3, 6));
    for (let i = 0; i < 30; i++) this.explorer.update(0.033);
    this.overlay.className = '';
    this.overlay.innerHTML = '';
    this.mode = 'explore';
    this.buildExploreHud();
    const amb = pc.night ? (place.landforms.includes('sea_west') ? 'sea' : 'night') : place.culture.length > 2 ? 'town' : this.world.waterLevel === 0 ? 'sea' : 'wind';
    this.sfx.ambience(amb);
    const first = idx === 0 ? s.def.introHe : pc.stampHe ?? 'גלויה חדשה! איפה אנחנו הפעם?';
    this.radio(first, 6);
    if (s.def.id === 1 && idx === 0) setTimeout(() => this.mode === 'explore' && this.radio('טיפ: גררו כדי להסתכל מסביב, לחצו על הקרקע כדי ללכת (או <bdi>WASD</bdi>). הסתכלו על דברים מעניינים — הם נכתבים במחברת.', 8), 6500);
  }

  private clearWorld() {
    this.explorer?.dispose();
    this.world?.dispose();
    this.explorer = null;
    this.world = null;
    this.scene = new THREE.Scene();
  }

  // ---------------------------------------------------------------- explore HUD
  private buildExploreHud() {
    const s = this.session!;
    const def = s.def;
    const best = this.progress.best(def.id);
    this.hud.innerHTML = `
      <div class="tl"><button class="btn round" data-act="pause" aria-label="השהיה">⏸</button><button class="btn round" data-act="mute" aria-label="השתקה">${this.sfx.muted ? '🔇' : '🔊'}</button></div>
      ${def.hints ? '<button class="btn hintbtn" data-act="hint">💡 רמז (עולה כוכב)</button>' : ''}
      <div class="sunarc" aria-label="שעות אור"><svg viewBox="0 0 200 70"><path d="M10 60 Q100 -10 190 60" fill="none" stroke="#f2c75a" stroke-width="5" stroke-linecap="round" opacity="0.9"/><circle class="sundot" r="9" fill="#ffcf40" stroke="#fff3c0" stroke-width="3" cx="10" cy="60"/></svg><div class="lbl">שעות אור</div></div>
      <div class="title-pill"><div>${esc(def.titleHe)}<div class="sub">גלויה <bdi>${s.idx + 1}/${def.postcards.length}</bdi></div></div><span class="stars">${this.starsHtml(best?.stars ?? 0)}</span></div>
      <div class="radio paper"></div>
      <div class="notebook"><button class="toggle" data-act="nb">📓</button><h3>יומן תצפיות של חוקר נוף</h3><ul></ul></div>
      <div class="charges paper"></div>
      <div class="belt">${TOOLS.map((t) => `<button class="tool" data-tool="${t.id}" aria-label="${TOOL_HE[t.id].name}"><span class="key"><bdi>${t.key}</bdi></span><span class="ico">${t.ico}</span><span class="nm">${TOOL_HE[t.id].name}</span></button>`).join('')}</div>
      <button class="btn climb" data-act="climb" style="display:none">🪜 לטפס לתצפית <bdi>(E)</bdi></button>
      <button class="btn mapbtn" data-act="map">🗺️ למפה »</button>
      <div class="reticle"><svg viewBox="0 0 54 54"><circle cx="27" cy="27" r="22" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="4"/><circle class="gz" cx="27" cy="27" r="22" fill="none" stroke="#f2c75a" stroke-width="5" stroke-dasharray="138.2" stroke-dashoffset="138.2" transform="rotate(-90 27 27)"/><text x="27" y="33" text-anchor="middle" font-size="18">🔍</text></svg><span class="tag"></span></div>
      <div class="inset"><canvas width="256" height="256"></canvas><div class="cap"></div></div>`;
    this.hud.querySelectorAll<HTMLButtonElement>('.tool').forEach((b) => b.addEventListener('click', () => this.useTool(b.dataset.tool as ToolId)));
    this.hud.querySelector('[data-act=map]')!.addEventListener('click', () => this.openMap());
    this.hud.querySelector('[data-act=climb]')!.addEventListener('click', () => this.climb());
    this.hud.querySelector('[data-act=pause]')!.addEventListener('click', () => this.pause(true));
    this.hud.querySelector('[data-act=mute]')!.addEventListener('click', (e) => {
      this.toggleMute();
      (e.currentTarget as HTMLElement).textContent = this.sfx.muted ? '🔇' : '🔊';
    });
    this.hud.querySelector('[data-act=hint]')?.addEventListener('click', () => this.hint());
    this.hud.querySelector('[data-act=nb]')?.addEventListener('click', () => this.hud.querySelector('.notebook')!.classList.toggle('collapsed'));
    this.renderNotebook();
    this.renderTools();
  }

  private obsLabel(o: Observation) {
    return o.kind === 'landform' ? LANDFORM_HE[o.landform] : o.kind === 'culture' ? CULTURE_HE[o.sign] : '';
  }

  private renderNotebook() {
    const s = this.session;
    const ul = this.hud.querySelector('.notebook ul');
    if (!s || !ul) return;
    const list = s.obs[s.idx];
    if (!list.length) {
      ul.innerHTML = `<li class="empty">עדיין ריק. הסתכלו סביב, או השתמשו בכלי מהתרמיל.</li>`;
      return;
    }
    ul.innerHTML = list
      .map((o) => {
        const l = notebookLine(o);
        const key = JSON.stringify(o);
        return `<li class="${key === this.freshKey ? 'fresh' : ''}">• <span class="lab">${esc(l.label)}:</span> ${esc(l.value)}${l.num ? ` <bdi>${esc(l.num)}</bdi>` : ''}</li>`;
      })
      .join('');
  }

  private renderTools() {
    const s = this.session;
    if (!s) return;
    const inf = s.def.charges >= 50;
    this.hud.querySelectorAll<HTMLButtonElement>('.tool').forEach((b) => {
      const t = b.dataset.tool as ToolId;
      const used = s.toolsUsed[s.idx].includes(t);
      b.classList.toggle('used', used);
      b.disabled = used || s.charges <= 0 || this.mode !== 'explore';
    });
    const ch = this.hud.querySelector('.charges');
    if (ch) ch.innerHTML = inf ? `מטעני כלים: <bdi>∞</bdi>` : `מטעני כלים: ${Array.from({ length: s.def.charges }, (_, i) => `<span class="pip ${i < s.charges ? '' : 'off'}"></span>`).join('')}`;
  }

  private updateExploreHud() {
    const s = this.session, ex = this.explorer;
    if (!s || !ex) return;
    const dot = this.hud.querySelector('.sundot');
    if (dot) {
      const k = 1 - s.daylightLeft;
      const x = 10 + 180 * k, y = 60 - 140 * k * (1 - k) * 0.9;
      dot.setAttribute('cx', x.toFixed(1));
      dot.setAttribute('cy', y.toFixed(1));
    }
    const climb = this.hud.querySelector<HTMLElement>('[data-act=climb]');
    if (climb) climb.style.display = ex.canClimb() ? '' : 'none';
    if (s.daylightLeft <= 0 && this.mode === 'explore') {
      this.radio('השמש שוקעת! הגיע הזמן לנעוץ סיכה.', 4);
      this.openMap();
    }
  }

  private onGaze(p: number, label: string) {
    const r = this.hud.querySelector('.reticle');
    if (!r) return;
    r.classList.toggle('on', p > 0.05);
    const c = r.querySelector('.gz');
    c?.setAttribute('stroke-dashoffset', String(138.2 * (1 - p)));
    const tag = r.querySelector('.tag');
    if (tag) tag.textContent = p > 0.05 ? `מתבוננים… ${label}` : '';
  }

  private onNotice(o: Observation) {
    if (!this.session?.look(o)) return;
    this.freshKey = JSON.stringify(o);
    this.sfx.notice();
    this.renderNotebook();
    const l = notebookLine(o);
    this.radio(`נרשם במחברת: <b>${esc(l.value)}</b>`, 2.5);
  }

  useTool(t: ToolId) {
    const s = this.session, ex = this.explorer, w = this.world;
    if (!s || !ex || !w || this.mode !== 'explore' || this.paused) return;
    if (!s.canUse(t).ok) return;
    if (t === 'kite' && ex.mode !== 'walk') return;
    const p = ex.player.position;
    const got = s.useTool(t, w.heightAt(p.x, p.z));
    if (!got) return;
    this.freshKey = JSON.stringify(got[0]);
    if (t === 'hammer') {
      ex.playAction('hammer');
      this.sfx.hammer();
      setTimeout(() => this.showInset(got[0]), 450);
    } else if (t === 'kite') {
      ex.kite();
      this.sfx.kite();
      this.radio('העפיפון עולה <bdi>40</bdi> מטר — עשר שניות של מבט מלמעלה!', 4);
      got.forEach((o) => ex.noticed.add(JSON.stringify(o)));
    } else {
      ex.playAction('write');
      this.sfx.write();
    }
    this.renderNotebook();
    this.renderTools();
    const l = notebookLine(got[0]);
    if (t !== 'kite') this.radio(`${TOOL_HE[t].name}: <b>${esc(l.value)}</b>${l.num ? ` <bdi>${esc(l.num)}</bdi>` : ''}`, 3.5);
  }

  private showInset(o: Observation) {
    if (o.kind !== 'rock') return;
    const inset = this.hud.querySelector<HTMLElement>('.inset');
    const cv = inset?.querySelector('canvas');
    if (!inset || !cv) return;
    drawRock(cv, o.rock);
    inset.querySelector('.cap')!.textContent = ROCK_HE[o.rock];
    inset.classList.add('on');
    setTimeout(() => inset.classList.remove('on'), 2600);
  }

  climb() {
    if (this.explorer?.climb()) this.radio('מטפסים למגדל התצפית… מסתכלים לכל הכיוונים.', 3);
  }

  hint() {
    const q = this.session?.hint();
    if (q) this.radio(`💡 ${esc(q)}`, 7);
  }

  radio(html: string, secs: number) {
    const r = this.hud.querySelector('.radio');
    if (!r) return;
    r.innerHTML = `📻 ${html}`;
    r.classList.add('show');
    this.radioTimer = secs;
  }

  toast(text: string) {
    this.radio(esc(text), 3);
  }

  // ---------------------------------------------------------------- map + reveal
  openMap() {
    const s = this.session;
    if (!s || this.mode !== 'explore') return;
    s.openMap();
    this.mode = 'map';
    this.sfx.whoosh();
    this.pinmap.resetView();
    const pin = s.pins[s.idx];
    if (pin) this.pinmap.placePin(pin.lat, pin.lon);
    const late = s.def.world >= 3 ? '' : '';
    this.hud.innerHTML = `<div class="maphud">
      <div class="tl"><button class="btn round" data-act="pause">⏸</button></div>
      <div class="title-pill"><div>${esc(s.def.titleHe)}<div class="sub">גלויה <bdi>${s.idx + 1}/${s.def.postcards.length}</bdi></div></div></div>
      <div class="tip paper">לחצו על המפה כדי לנעוץ סיכה. גררו להזזה, גלגלו להתקרבות. ${late}</div>
      <div class="compass paper"><div class="arrow">↑</div>צפון</div>
      <div class="notebook" style="top:auto;bottom:90px"><h3>מה ראינו</h3><ul></ul></div>
      <button class="btn back" data-act="back">« חזרה לגלויה</button>
      <button class="btn commit" data-act="commit" ${pin ? '' : 'disabled'}>📍 נועצים כאן!</button></div>`;
    this.renderNotebook();
    this.hud.querySelector('[data-act=back]')!.addEventListener('click', () => this.closeMap());
    this.hud.querySelector('[data-act=commit]')!.addEventListener('click', () => this.commit());
    this.hud.querySelector('[data-act=pause]')!.addEventListener('click', () => this.pause(true));
  }

  closeMap() {
    const s = this.session;
    if (!s || this.mode !== 'map') return;
    if (s.daylightLeft <= 0) return this.radio('כבר חשוך בגלויה — נועצים!', 3);
    s.closeMap();
    this.mode = 'explore';
    this.buildExploreHud();
  }

  placePinAt(lat: number, lon: number) {
    if (this.mode !== 'map' || !this.session) return;
    this.session.setPin(lat, lon);
    this.pinmap.placePin(lat, lon);
    this.sfx.pin();
    const b = this.hud.querySelector<HTMLButtonElement>('[data-act=commit]');
    if (b) b.disabled = false;
  }

  commit() {
    const s = this.session;
    if (!s) return;
    const r = s.commitPin();
    if (!r) return;
    this.mode = 'reveal';
    this.lastReveal = r;
    const place = s.place;
    this.revealPending = { r, place };
    this.countT = 0;
    this.sfx.whoosh();
    this.pinmap.reveal(place.lat, place.lon, r.gap, this.reduced ? 0.3 : 2.6);
    this.hud.innerHTML = `<div class="tl"><button class="btn round" data-act="pause">⏸</button></div>
      <div class="title-pill"><div>${esc(s.def.titleHe)}<div class="sub">גלויה <bdi>${s.idx + 1}/${s.def.postcards.length}</bdi></div></div></div>
      <div class="counter"><span class="num">0</span><span><span class="unit">ק״מ</span><br><span class="pts"><bdi>+${r.points.toLocaleString('en-US')}</bdi> נק׳</span></span></div>`;
    this.hud.querySelector('[data-act=pause]')!.addEventListener('click', () => this.pause(true));
  }

  private finishReveal() {
    const pend = this.revealPending;
    const s = this.session;
    if (!pend || !s) return;
    this.revealPending = null;
    const { r, place } = pend;
    const zone = this.zoneFor(place, s.def.intended[s.idx] ?? []);
    if (zone) this.pinmap.showZone(zone.poly, zone.color);
    this.pinmap.labelCities(place.lat, place.lon);
    const km = r.km < 10 ? r.km.toFixed(1) : Math.round(r.km).toString();
    const num = this.hud.querySelector('.counter .num');
    if (num) num.textContent = km;
    const trap = r.gap >= 2 && s.def.trapHe ? `<span class="trap">${esc(s.def.trapHe)}</span>` : '';
    const ibexLine = r.gap === 0 ? 'תפסתם את יעלי! היא מפילה גלויה ומתבאסת.' : r.gap === 1 ? 'יעלי רק רכס אחד לפניכם…' : r.gap === 2 ? 'יעלי מצחקקת מהרכס הבא.' : 'יעלי ברחה רחוק וצוחקת!';
    this.sfx.bleat(r.gap > 0);
    if (r.gap === 0) this.sfx.fanfare(3);
    this.hud.insertAdjacentHTML(
      'beforeend',
      `<div class="explain paper"><span class="place">📍 ${esc(place.nameHe)}${zone ? ` · ${esc(zone.name)}` : ''}</span>${esc(place.revealHe)}${trap}<span class="trap">🐐 ${ibexLine}</span></div>
       <button class="btn next" data-act="next">המשך »</button>`,
    );
    this.hud.querySelector('[data-act=next]')!.addEventListener('click', () => this.next());
  }

  private zoneFor(place: Place, intended: ToolId[]): { poly: [number, number][]; color: number; name: string } | null {
    const rockZone = [...ROCK_ZONES].reverse().find((z) => z.rock === place.rock && inPoly(place.lon, place.lat, z.poly));
    const beltZone = [...BELT_ZONES].reverse().find((z) => z.belt === place.belt && inPoly(place.lon, place.lat, z.poly));
    if (rockZone && (intended.includes('hammer') || !beltZone)) return { poly: rockZone.poly, color: ROCK_ZONE_COLOR[place.rock] ?? 0xffd36a, name: rockZone.nameHe };
    if (beltZone) return { poly: beltZone.poly, color: 0xffd36a, name: beltZone.nameHe };
    return null;
  }

  next() {
    const s = this.session;
    if (!s || this.mode !== 'reveal' || this.revealPending) return;
    s.next();
    if (s.phase === 'done') this.caseEnd();
    else this.loadPostcard(s.idx);
  }

  private caseEnd() {
    const s = this.session!;
    this.mode = 'caseEnd';
    const res = s.result(this.relief);
    const def = s.def;
    if (def.id > 0) this.progress.record(def.id, res.stars, res.bonus, res.points, s.events);
    else this.progress.recordDaily(todayKey(), res.stars, res.points, s.events);
    this.sfx.fanfare(res.stars);
    const rule = !res.ruleOk ? `<p>⚠️ ${def.rule === 'order_west_east' ? 'הסדר ממערב למזרח התהפך — לכן לכל היותר כוכב אחד.' : 'אחת הסיכות נפלה בצד הלא נכון של קו פרשת המים — לכן לכל היותר כוכב אחד.'}</p>` : '';
    const hint = s.hintsUsed ? '<p>💡 השתמשתם ברמז — כוכב אחד ירד.</p>' : '';
    const bonus = res.bonus ? `<p>🎒 חסכתם <bdi>${res.chargesLeft}</bdi> מטעני כלים — תג חוקר חסכוני!</p>` : '';
    const nextCase = CASES.find((c) => c.id === def.id + 1);
    const finale = def.id === 18 && res.stars > 0 ? '<p>🐐 תפסתם את יעלי! האלבום חזר לרשות הטבע. תודה, חוקר נוף.</p>' : '';
    this.hud.innerHTML = '';
    this.overlay.className = 'overlay';
    this.overlay.innerHTML = `<div class="card">
      <h2>${esc(def.titleHe)}</h2>
      <div class="bigstars">${this.starsHtml(res.stars)}</div>
      <p>מרחק ממוצע: <bdi>${res.avgKm < 10 ? res.avgKm.toFixed(1) : Math.round(res.avgKm)} ק״מ</bdi> · נקודות: <bdi>${res.points.toLocaleString('en-US')}</bdi></p>
      ${rule}${hint}${bonus}${finale}
      <div class="row">
        ${nextCase && def.id > 0 ? '<button class="btn" data-act="next">לתיק הבא »</button>' : ''}
        <button class="btn ghost" data-act="retry">↻ שוב</button>
        <button class="btn ghost" data-act="album">לאלבום</button>
      </div></div>`;
    this.overlay.querySelector('[data-act=next]')?.addEventListener('click', () => this.openIntro(nextCase!));
    this.overlay.querySelector('[data-act=retry]')!.addEventListener('click', () => this.startCase(def));
    this.overlay.querySelector('[data-act=album]')!.addEventListener('click', () => this.showAlbum());
  }

  // ---------------------------------------------------------------- pause / settings
  pause(on: boolean, fromAlbum = false) {
    this.paused = on && !fromAlbum;
    if (!on) {
      this.overlay.className = '';
      this.overlay.innerHTML = '';
      return;
    }
    const el = document.createElement('div');
    el.className = 'overlay';
    el.innerHTML = `<div class="card"><h2>${fromAlbum ? 'הגדרות' : 'הפסקה'}</h2>
      <div class="toggles">
        <label><input type="checkbox" data-t="mute" ${this.sfx.muted ? 'checked' : ''}/> השתקת צלילים</label>
        <label><input type="checkbox" data-t="reduced" ${this.reduced ? 'checked' : ''}/> פחות תנועה</label>
      </div>
      <div class="row"><button class="btn" data-act="resume">${fromAlbum ? 'סגירה' : 'ממשיכים'}</button>${fromAlbum ? '' : '<button class="btn ghost" data-act="restart">↻ התחלה מחדש</button><button class="btn ghost" data-act="album">לאלבום</button>'}</div></div>`;
    const close = () => {
      el.remove();
      this.paused = false;
    };
    el.querySelector('[data-act=resume]')!.addEventListener('click', close);
    el.querySelector('[data-act=restart]')?.addEventListener('click', () => {
      close();
      if (this.session) this.startCase(this.session.def);
    });
    el.querySelector('[data-act=album]')?.addEventListener('click', () => {
      close();
      this.showAlbum();
    });
    el.querySelector<HTMLInputElement>('[data-t=mute]')!.addEventListener('change', () => this.toggleMute());
    el.querySelector<HTMLInputElement>('[data-t=reduced]')!.addEventListener('change', (e) => {
      this.reduced = (e.target as HTMLInputElement).checked;
      document.body.classList.toggle('reduced', this.reduced);
      this.progress.set({ reduced: this.reduced });
    });
    this.root.appendChild(el);
  }

  toggleMute() {
    this.sfx.setMuted(!this.sfx.muted);
    this.progress.set({ muted: this.sfx.muted });
  }

  // ---------------------------------------------------------------- input
  private bindInput() {
    const cv = this.renderer.domElement;
    cv.addEventListener('pointerdown', (e) => {
      this.sfx.unlock();
      cv.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false });
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.pinchD = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    cv.addEventListener('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (Math.hypot(p.x - p.sx, p.y - p.sy) > 6) p.moved = true;
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const delta = (this.pinchD - d) * 3;
        this.pinchD = d;
        if (this.mode === 'map') this.pinmap.zoom(delta);
        else this.explorer?.zoom(delta);
        return;
      }
      if (this.mode === 'explore') this.explorer?.orbit(dx, dy);
      else if (this.mode === 'map') this.pinmap.pan(dx, dy);
    });
    const up = (e: PointerEvent) => {
      const p = this.pointers.get(e.pointerId);
      this.pointers.delete(e.pointerId);
      if (!p || p.moved || this.pointers.size) return;
      this.tap(e.clientX, e.clientY);
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', (e) => this.pointers.delete(e.pointerId));
    cv.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        if (this.mode === 'map') this.pinmap.zoom(e.deltaY);
        else this.explorer?.zoom(e.deltaY);
      },
      { passive: false },
    );
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'p' || k === 'escape') {
        if (this.mode === 'explore' || this.mode === 'map') this.pause(!this.paused);
        return;
      }
      if (this.mode === 'explore') {
        this.explorer?.keys.add(k);
        const tool = TOOLS.find((t) => t.key === k);
        if (tool) this.useTool(tool.id);
        if (k === 'e') this.climb();
        if (k === 'm') this.openMap();
        if (k === 'h') this.hint();
      } else if (this.mode === 'map') {
        if (k === 'enter') this.commit();
        if (k === 'm' || k === 'backspace') this.closeMap();
      } else if (this.mode === 'reveal' && (k === 'enter' || k === ' ')) this.next();
    });
    window.addEventListener('keyup', (e) => this.explorer?.keys.delete(e.key.toLowerCase()));
  }

  private ndc(x: number, y: number) {
    const r = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  }

  private tap(x: number, y: number) {
    if (this.paused) return;
    const v = this.ndc(x, y);
    if (this.mode === 'map') {
      const ll = this.pinmap.pick(v);
      if (ll) this.placePinAt(ll[0], ll[1]);
    } else if (this.mode === 'explore' && this.world && this.explorer) {
      const ray = new THREE.Raycaster();
      ray.setFromCamera(v, this.camera);
      const near = this.world.group.getObjectByName('terrain-near');
      const hit = near && ray.intersectObject(near, false)[0];
      if (hit) {
        if (this.explorer.mode === 'lookout') this.explorer.target = hit.point;
        else this.explorer.walkTo(hit.point);
      }
    }
  }

  // ---------------------------------------------------------------- test hooks
  private exposeTestHooks() {
    const w = window as unknown as Record<string, unknown>;
    w.render_game_to_text = () => JSON.stringify(this.textState());
    w.advanceTime = (ms: number) => {
      this.manualTime = true;
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let i = 0; i < steps; i++) this.step(1 / 60);
      this.render();
      return this.textState();
    };
    w.__ld = this;
    w.__ld_cases = CASES;
  }

  /** Test helper: where a lat/lon appears on screen in the map view (to aim a real click). */
  screenOfLatLon(lat: number, lon: number): [number, number] {
    const v = llToMap(lat, lon, Math.max(0, this.relief.at(lat, lon)));
    this.pinmap.camera.updateMatrixWorld();
    v.project(this.pinmap.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
  }

  textState() {
    const s = this.session, ex = this.explorer, w = this.world;
    const base: Record<string, unknown> = { mode: this.mode, paused: this.paused, coords: 'map: north up, east right; postcard: x east, z south, metres' };
    if (!s) return { ...base, album: CASES.map((c) => ({ id: c.id, unlocked: this.unlocked(c.id), best: this.progress.best(c.id) })) };
    const pc = s.def.postcards[s.idx];
    const out: Record<string, unknown> = {
      ...base,
      case: { id: s.def.id, title: s.def.titleHe, world: s.def.world, postcard: s.idx + 1, of: s.def.postcards.length, charges: s.charges, hints: s.def.hints, rule: s.def.rule ?? null },
      objective: 'Collect evidence, then pin the true spot on the relief map of Israel.',
      postcard: { season: pc.season, hour: pc.hour, night: !!pc.night },
      notebook: s.obs[s.idx].map((o) => notebookLine(o)),
      toolsUsed: s.toolsUsed[s.idx],
      daylightLeft: +s.daylightLeft.toFixed(2),
      pin: s.pins[s.idx],
    };
    if (ex && w) {
      const p = ex.player.position;
      out.player = { x: +p.x.toFixed(1), z: +p.z.toFixed(1), elevM: +w.heightAt(p.x, p.z).toFixed(1), mode: ex.mode, facingDeg: Math.round(((ex.yaw * 180) / Math.PI) % 360) };
      out.ibex = { x: +ex.ibex.position.x.toFixed(1), z: +ex.ibex.position.z.toFixed(1) };
      out.anchors = w.anchors.map((a) => ({ obs: a.obs, x: Math.round(a.pos.x), z: Math.round(a.pos.z), noticed: ex.noticed.has(JSON.stringify(a.obs)) }));
      out.sunDir = w.sunDir.toArray().map((x) => +x.toFixed(2));
      out.lookout = { x: Math.round(w.lookout.x), z: Math.round(w.lookout.z), used: ex.lookoutUsed };
    }
    if (this.mode === 'reveal' || this.mode === 'caseEnd') {
      out.result = this.lastReveal && { km: +this.lastReveal.km.toFixed(2), points: this.lastReveal.points, ibexGap: this.lastReveal.gap, truth: this.lastReveal.truth, place: s.place.nameHe };
    }
    if (this.mode === 'caseEnd') out.caseResult = s.result(this.relief);
    return out;
  }
}

/** A close-up of the rock's texture and colour for the hammer inset. */
function drawRock(cv: HTMLCanvasElement, rock: string) {
  const ctx = cv.getContext('2d')!;
  const base: Record<string, [string, string, string]> = {
    basalt: ['#3b3836', '#24211f', 'holes'],
    limestone: ['#e2d3ac', '#c8b88e', 'fossil'],
    chalk: ['#f2eee2', '#ddd6c2', 'smooth'],
    kurkar: ['#cf9d68', '#a77a4a', 'grains'],
    sand: ['#ecd9ab', '#cdb586', 'grains'],
    granite: ['#c06a52', '#4a3a36', 'crystals'],
    loess: ['#ccb088', '#ad9068', 'smooth'],
    marl_salt: ['#efece2', '#d4cfbf', 'crust'],
    sandstone: ['#c4805e', '#9a5a40', 'layers'],
  };
  const [a, b, kind] = base[rock] ?? base.limestone;
  const g = ctx.createRadialGradient(100, 90, 20, 128, 128, 180);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) {
    const x = rnd() * 256, y = rnd() * 256, r = rnd();
    if (kind === 'holes') {
      ctx.fillStyle = 'rgba(10,8,8,0.75)';
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + r * 6, 0, 6.3);
      ctx.fill();
    } else if (kind === 'crystals') {
      ctx.fillStyle = ['#f0e6e0', '#2a2220', '#d88a70', '#8a4a3a'][i % 4];
      ctx.fillRect(x, y, 3 + r * 7, 2 + r * 5);
    } else if (kind === 'grains') {
      ctx.fillStyle = `rgba(${120 + r * 100},${90 + r * 60},50,0.6)`;
      ctx.fillRect(x, y, 2, 2);
      if (i % 9 === 0) {
        ctx.fillStyle = 'rgba(80,50,20,0.5)';
        ctx.beginPath();
        ctx.arc(x, y, 2 + r * 4, 0, 6.3);
        ctx.fill();
      }
    } else if (kind === 'layers') {
      ctx.fillStyle = `rgba(${150 + r * 80},${70 + r * 40},40,0.35)`;
      ctx.fillRect(0, (i * 7) % 256, 256, 2 + r * 3);
    } else if (kind === 'fossil' && i % 25 === 0) {
      ctx.strokeStyle = 'rgba(120,100,70,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let t = 0; t < 12; t += 0.3) ctx.lineTo(x + Math.cos(t) * t, y + Math.sin(t) * t);
      ctx.stroke();
    } else if (kind === 'crust') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(x, y, 4 + r * 10, 1 + r * 3);
    } else {
      ctx.fillStyle = `rgba(0,0,0,${0.04 * r})`;
      ctx.fillRect(x, y, 3, 3);
    }
  }
}
