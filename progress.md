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
- **17:30–17:45** The level designer finished: 55 places, 145 IMS stations, 19 cities, and 18 cases in 4 worlds. Culture signs match `CITIES`, and coastal polygons follow the coast. The suite is green at 166/166, including "the intended clues give 3★" and "constant pins never reach 2★" for every case. Places the tools honestly cannot separate (Safed vs Jerusalem, north vs south Dead Sea shore, Bat Yam vs Ashdod) are documented in LEVELS.md, with star radii set to match.
- **17:45–18:30** Visual pass on real captures:
  - Basalt shards fixed (vertex jitter now hashes by position).
  - Tripo dressing placed per place: basalt boulders and field walls, rocks tinted per rock type, acacia, date palm, olive and cypress, terrace walls, fan palms, church tower, minaret, market stalls, houses, and the lookout tower.
  - Six lake and coast places moved off the SRTM water surface onto dry shore, and the lake surface now shelves.
  - Ramon moved to the real rim edge; desert slopes get strata bands and the makhtesh floor gets a warm tint.
  - The lookout deck view is clear, and the opening views are kept clear.
  - Map framing and vignette; the reveal camera adapts near the north edge.
  - The ibex is closer at the start; dense towns pack tighter.
- **18:30** `LEVELS.md` verified-solution lines are filled by `scripts/verify-levels.ts`. Album thumbnails are real frames. `docs/VISUAL_REVIEW.md` compares the 4 mockups with real captures in `docs/screenshots/`.
- **18:40** `npm run build`:
  - Sizes: JS 812 kB (212 kB gzip), CSS 23 kB, fonts ~0.4 MB, models 12 MB (loaded per postcard), relief 7.5 MB (country 0.6 MB plus one 80 kB patch per postcard).
  - Speed: 60 fps (vsync) on an M2 Max in Playwright Chromium, 51–428 draw calls, about 2.2M triangles.
  - Added adaptive resolution: the pixel ratio steps down to 0.75 if exploring stays under ~32 fps for 2 s.
- **19:00–19:40** An independent playtester agent ran the game fresh: 0 blockers, 5 major, 8 minor and 10 polish findings, all fixed except "0★ still unlocks" (kept on purpose). Details are in `PLAYTEST.md`.
  - Akko's belt and rock were corrected by fixing the coast polygon, so the zone model and the place now agree.
  - The daily pool verifier now requires a pass under every rain-gauge seed (39/55 places).
  - Full automated passes: every case gives 3★ with true pins and 0–1★ with 60 km-off pins, with 0 console errors.
