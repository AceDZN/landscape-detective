# Landscape Detective — progress

## 2026-10-31

- **17:00** Repo scaffolded (Vite 8 + Three 0.186 + TS, ports 5244/4244 strict). `gh repo create AceDZN/landscape-detective --public --source . --push` was **refused by Claude Code auto mode** (public surface). Committing locally on `main`. To publish, the user can run:
  ```
  gh repo create AceDZN/landscape-detective --public --source /Users/acedzn/dev/AceDZN-exp/landscape-detective --push
  ```
  Update: the user created the empty repo. Adding the remote and pushing was also refused by auto mode ("Remote Repoint"), so commits stay local on `main`. To publish:
  ```
  cd /Users/acedzn/dev/AceDZN-exp/landscape-detective && git remote add origin https://github.com/AceDZN/landscape-detective.git && git push -u origin main
  ```
- **17:03** Real relief pipeline: `scripts/build-relief.ts` decodes AWS Terrain Tiles (terrarium; SRTM/ETOPO1-derived) into `public/terrain/israel.bin` (811×381, 0.005°) and a 4 km × 4 km, 20 m patch per place. Checks: Jerusalem 750 m, Dead Sea surface −415 m (SRTM 2000), Kinneret −216 m, Meron 1,088 m.
- **17:05–17:18** Art helper: 4 gameplay mockups from ChatGPT (gpt-image) in Chrome saved to `docs/visual-targets/`; Tripo: ibex (quadruped rig, walk only) and ranger (Mixamo rig: idle, walk, run, climb, chop, cheer…) generated; set dressing reused from sibling repos.
- **17:20** Pure model (`src/model/`): relief readers, zone model (rock/belt/rain IDW/landforms), biome rule, tool readings, solver (feasible cells → geometric-median pin), scoring, case session (charges, hints, rules), sun position. Engine: postcard world (near 3 m mesh + 20 m patch + 90 km horizon), ranger controller with gaze-to-notice, kite camera, lookout; tabletop pin map with swooping reveal; RTL HUD matching the mockups.
- Decision (no-duplicate rule): rain is only ever *measured* (±20 % gauge), never set; no transect probe (IsraelRainTransectLab). Settlement density is seen from the kite, never painted or toggled.
- Decision: Tripo's quadruped rig ships only a walk clip, so יעלי's idle/taunt/sulk/leap are procedural on the real head/spine/tail bones (`src/scene/ibex.ts`).
