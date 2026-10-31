# בלש הנוף — Landscape Detective

A 3D browser geography game in Hebrew for grades 7–9 (Workbook curriculum). יעלי the Nubian ibex stole the Nature Authority's postcard album. Touch a postcard and you're inside a real Israeli landscape with no labels. Walk, look, and spend a few field-tool charges on the evidence you think matters: rock hammer, field guide, altimeter, rain gauge, kite camera. Then drop one pin on a 3D tabletop relief of Israel and watch the camera swoop to the true spot. The distance is your score, and the ibex is either caught or laughing from the next ridge.

## Run

```bash
npm install
npm run dev        # http://localhost:5244 (strict port)
npm test           # model + solver tests (all 18 cases, places vs zones and relief)
npm run build      # static build in dist/ (tsc + vite)
npm run preview    # http://localhost:4244
```

Rebuild the bundled relief (only needed when places change; fetches public elevation tiles once and caches them in `assets-src/tiles-cache/`):

```bash
npx tsx scripts/build-relief.ts           # country grid + every place patch
npx tsx scripts/build-relief.ts places    # place patches only
npx tsx scripts/verify-daily.ts           # re-verify the daily-case pool with the solver
```

Headless drive with real inputs (Playwright): `node scripts/drive.mjs click:.slot shot:out.png text` (see the script header).

## Controls

| Action | Mouse / touch | Keys |
|---|---|---|
| Walk | tap the ground | `WASD` / arrows, `Shift` to run |
| Look around | drag | — |
| Zoom | wheel / pinch | — |
| Use a field tool | tap a tool on the belt | `1`–`5` |
| Climb the lookout (once per postcard) | 🪜 button when near | `E` |
| Notice a feature | look at it for a moment (the 🔍 ring fills) | — |
| Open the map | 🗺️ למפה | `M` |
| Pin / commit | tap the map, then 📍 נועצים כאן | arrows move the pin (`Shift` = big steps), `Enter` commits |
| Back to the postcard | « חזרה לגלויה | `M` / `Backspace` |
| Hint (costs a star, free in the tutorial; none in the final case) | 💡 | `H` |
| Pause / close a card | ⏸ | `P` / `Esc` (cards: `Enter` on the focused button, `Esc` goes back) |

North is always up on the map and east is to the right, even though the UI reads right-to-left.

## What's implemented

- 18 authored cases in 4 worlds (`src/data/cases.ts`), each with fixed real places (`src/data/places.ts`), plus a daily case seeded by date from a solver-verified pool.
- Real relief: AWS Terrain Tiles (SRTM/ETOPO1-derived) bundled as Int16 grids — a 0.005° country grid and a 4 km × 4 km 20 m patch per place (`public/terrain/`). See `ASSETS.md`.
- Pure geography model (`src/model/`, no Three.js): zones for rock/belt/landforms, IDW rain from IMS normals, the biome rule, tool readings, the solver, scoring, the case state machine and sun position. Tests in `tests/`.
- Three.js scenes: the postcard (near 3 m mesh, the 20 m patch and a 90 km horizon, sky and sun for the postcard's season and hour, water at the real level, biome-driven plants and rocks, landform and culture dressing), and the tabletop pin map with the swooping reveal and the lit zone.
- Tripo models: the rigged ranger (Mixamo clips) and the rigged ibex (quadruped rig; moods layered procedurally on its bones), plus set dressing. See `ASSETS.md`.
- Hebrew RTL HUD after the gameplay mockups in `docs/visual-targets/`; mute, pause and reduced-motion toggles; progress and anonymous learning events in localStorage only.
- `window.render_game_to_text()` and a deterministic `window.advanceTime(ms)`.

## Deploying to Vercel (not deployed)

It's a static site with a relative base: Framework preset "Vite", build command `npm run build`, output directory `dist`. Nothing is fetched at runtime from other hosts.

## Docs

`GAME_IDENTITY.md` (incl. the "Not like" table) · `CURRICULUM.md` · `LEVELS.md` · `ASSETS.md` · `PLAYTEST.md` · `progress.md` · `docs/VISUAL_REVIEW.md` · `docs/visual-targets/` · `docs/screenshots/`
