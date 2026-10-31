# Landscape Detective — בלש הנוף — build handoff

Read `../COMMON.md` first. Repo `/Users/acedzn/dev/AceDZN-exp/landscape-detective` → public `AceDZN/landscape-detective`, port 5244 (preview 4244). The user asked for this game on 31 Oct 2026 ("Add Landscape Detective") as the third Claude Code geography game.

## Promise

**יעלי**, a cheeky Nubian ibex, has stolen the Nature Authority's postcard album and is leaping across Israel, scattering postcards. Touch a postcard and you're *inside* it: dropped somewhere in a real 3D Israeli landscape with no labels. You're a junior ranger with a backpack of field tools and a small daylight budget. Walk, climb a lookout, crack a rock, check the plants, glance at the sky, watch where the sun sets over the sea. Then open the big 3D relief map of Israel and **drop your pin**. The camera swoops from your pin to the true spot across the real relief, and the distance in km is your score. Close pins keep you on יעלי's trail; far ones let the ibex escape over the next ridge, laughing. It's GeoGuessr's "where am I?" thrill, but the clues are the geography itself: kurkar or basalt, maquis or acacia, 800 m up or 430 m below the sea, a makhtesh rim or a wadi after a flood, a church, a mosque and a market sharing one slope.

Map evidence: Alba × Firewatch (related, density 0.623) and Firewatch × A Short Hike (0.627), the emptiest pairs after the two already used. GeoGuessr (not in the Steam corpus) proves the pin-and-reveal loop.

## Not like the existing games (hard rule)

Read `/Users/acedzn/idea-plotter/reports/geography-games-claude-2026-10-31/EXISTING.md`. The sims closest to this game, and what you must not copy:

- **IsraelLandscapeMixerLab** (landscape-diversity): dials for altitude, rain, distance from the sea and rock type build a landscape; the challenge is to recreate Hermon, the coastal plain or the Negev. Here the landscape is given and you *infer* it. **No dials or sliders that set landscape factors.**
- **CulturalLandscapeReaderLab** (cultural-landscapes): place cultural-sign tiles on a street and read the cause families. **No tiles, and no building a scene.**
- **GlobalLandscapeSpotterLab** (global-landscapes): sort tiles into global vs. local bins. **No sorting into bins.**
- **CulturalLandscapeMosaicLab**, **IsraelPopulationMosaicLab**: paint groups onto a grid / toggle factors and watch the dots. **No painting, no factor toggles.**
- **IsraelLandformBeltsLab**: drag process chips onto belt slots. **No chips.**
- **TradeRouteBridgeLab**: follow historic route stops. **No route-following journey.**
- **Clockwork Alibi** (`~/dev/AceDZN-exp/clockwork-alibi`, an English game) is also an inspect-and-deduce game. **No timeline scrubbing or reconstruction.**
- Windshift Riders, Basin Breakers, Rush Hour Israel and Rift Makers: no flying, no terrain editing, no network drawing, no plate shaping.

Your verbs are: **walk and look** in a real 3D place, **choose which field tools to spend** your small budget on, **commit a pin** on a 3D relief map, then see the reveal. Record the check in a "Not like" table in `GAME_IDENTITY.md`.

## Curriculum (Workbook grade 9 chapters 1, 2 and 4; grade 8 chapters 4–5; grade 7 chapter 1)

- Grade 9 ch. 2: [landscape-diversity](https://geography.workbook.co.il/grade-9/chapter-2/landscape-diversity), [landform-belts](https://geography.workbook.co.il/grade-9/chapter-2/landform-belts), [israel-climate](https://geography.workbook.co.il/grade-9/chapter-2/israel-climate), [natural-water-sources](https://geography.workbook.co.il/grade-9/chapter-2/natural-water-sources).
- Grade 9 ch. 1: [cultural-landscapes](https://geography.workbook.co.il/grade-9/chapter-1/cultural-landscapes), [israel-middle-east](https://geography.workbook.co.il/grade-9/chapter-1/israel-middle-east).
- Grade 9 ch. 4: [population-mosaic](https://geography.workbook.co.il/grade-9/chapter-4/population-mosaic), [settlement-distribution](https://geography.workbook.co.il/grade-9/chapter-4/settlement-distribution).
- Grade 8: [landforms](https://geography.workbook.co.il/grade-8/chapter-5/landforms), [rocks-minerals](https://geography.workbook.co.il/grade-8/chapter-4/rocks-minerals).
- Grade 7: [global-landscapes](https://geography.workbook.co.il/grade-7/chapter-1/global-landscapes).

Snapshots: `/Users/acedzn/idea-plotter/reports/geography-games-claude-2026-10-31/curriculum/` (cultural-landscapes, population-mosaic, settlement-distribution, landscape-diversity, landforms, global-landscapes) and `/Users/acedzn/idea-plotter/reports/geography-games-2026-10-31/curriculum/grade-*` (the rest).

What the clues teach (from the modules; verify each in the snapshots before you use it):
- **A landscape system (מערכת נוף)** is climate, rock (מסלע), soil, plants and animals, and geological processes meeting in one place. That's why the short trip from Hermon to the Negev crosses two worlds.
- **Landform belts:** the coastal plain (sand, kurkar ridges, at sea level), the mountain ridge (limestone and chalk, terraces, the watershed, up to ~900 m), the rift (the Dead Sea shore is the lowest point on land; the Kinneret is below sea level too). Golan basalt points to volcanism. The rocks are limestone, basalt, kurkar and granite (Eilat), and each weathers differently.
- **Climate:** rain falls from north to south and from west to east; the western slopes are wetter, east of the ridge is the rain shadow (the Judean Desert), and the ~200 mm aridity line runs through the northern Negev. Climates: Mediterranean, steppe (ערבתי) and desert. The Negev is dry because it's on the edge of the desert belt.
- **Landforms:** desert climate in the Negev makes wadis, makhteshim and loess fields; the Mediterranean coast makes kurkar cliffs and sandy beaches, and the cliffs erode faster when sand stops arriving. Limestone dissolves (chemical weathering). Wind landscapes are found in the coastal dunes, the Negev and the loess plains. A makhtesh needs several conditions together ("none of the three alone would create a makhtesh"). **Dead Sea sinkholes** form mainly from dissolving salt layers as the water level drops, and they're **not** makhteshim (a distinction the module makes). The Nabateans harvested rainwater with channels and dams.
- **Cultural landscapes:** a place's history, religion, economy and community shape what you see. In Nazareth a church, a mosque and an old market share one slope, with pilgrim hotels and multilingual signs. Jerusalem's neighborhoods each tell a story. The coastal plain is densely settled (settlement-distribution). **Global landscapes:** glass towers, malls, international chains and English signs look the same everywhere, unlike a traditional market.
- **Israel as a bridge between continents**, where climates and landscapes meet in a small area.
- Hebrew terms: מערכת נוף, מסלע, גיר, קירטון, בזלת, כורכר, גרניט, לס, חול, מישור החוף, אזור ההר, בקע, רמת הגולן, טרסות, חורש ים תיכוני, צומח מדברי, שיטה, אקלים ים תיכוני / ערבתי / מדברי, קו הצחיחות, צל גשם, ואדי (ערוץ יבש), מכתש, מצוק כורכר, בולען, נוף תרבותי, פסיפס אנושי, נוף גלובלי, פני הים.

Misconceptions to catch: the Negev is all sand dunes; every Israeli desert looks the same; every mountain is the same rock; the Golan is limestone; it rains more toward the east; the coast is rocky everywhere; the Dead Sea is at sea level; a makhtesh is a crater or a sinkhole; a global landscape tells you *where* you are (it tells you *nothing*, a clue in itself).

**Sensitivity:** these are landscapes, not people. Cultural clues are buildings, streets, markets, signs and settlement patterns, never clothing or caricatures of communities. Use no political borders, no sovereignty questions, and no "which country" rounds. Workbook's population-mosaic text mentions the dispute over unrecognized villages; don't make it gameplay. Every place is labelled by its standard Hebrew name as Workbook uses it, shown only at the reveal.

## Loop and controls

- **Inside the postcard:** third-person ranger (rigged), a calm walk/run/climb on real relief at the true coordinates, about 300 × 300 m of explorable ground with a far horizon from coarser data. You can climb one lookout point per scene. The sun's real direction for the stated season and time shows where west (and usually the sea) is, which is a free clue. No minimap.
- **Field tools (the decision):** each case gives you a few tool charges. Choosing which evidence to spend them on is the core skill.
  - **Rock hammer:** rock type, with a close-up of texture and color.
  - **Field guide:** natural vegetation type.
  - **Altimeter:** metres above or below sea level, rounded to 50 m.
  - **Rain gauge:** the yearly average, ±20 %.
  - **Kite camera:** a 360° look from 40 m on a tether, once, for 10 seconds.

  Unused charges give bonus stars, so the player learns which clue is decisive. Every observation is written into a ranger notebook automatically, in Workbook terms ("סלע: בזלת"). The player never sorts, tags or rates anything.
- **Pin:** open the 3D relief map of Israel (real SRTM/ETOPO relief, a few city dots, no region names until late hints), drop one pin and commit.
- **Reveal:** the camera flies from your pin to the true spot over the relief, the distance counts up, and the belt/climate/landform zones light up with a one-line Hebrew explanation linking your best clue to the answer ("basalt + 400 m + a plateau → the Golan, not the Galilee"). Score: 5,000 points for 0 km, falling off with distance. The case's star thresholds are authored.
- **יעלי chase:** after each case, the ibex is a few ridges ahead or far away, depending on the score. A good streak gives a cutscene: יעלי drops a stolen postcard and sulks.
- Hint (logged, costs a star): a notebook question ("is the rock dark or light?") that points at an unused clue. Never a region.

## Levels (author exactly; tests prove each; 18 cases, 3–5 postcards each)

Each case has fixed authored postcards (exact coordinates the reviewer checks against SRTM and Workbook), so the solver can verify that the intended clues, read correctly, put the pin inside the 3-star radius, and that a fixed "always pin the center of Israel" or "always pin Jerusalem" strategy can't reach 2 stars.

**World 1 — Three belts and black stone · שלוש רצועות ואבן שחורה** (landform-belts, landscape-diversity, rocks-minerals)
1. **First postcard:** the Nitzanim dunes. Sand, kurkar, the sea glinting to the west at sunset. Tutorial with all tools free.
2. **Stone terraces:** the Judean hills west of Jerusalem: limestone terraces, olive trees, ~700–800 m.
3. **Below the sea:** the Dead Sea shore near Ein Gedi. The altimeter reads about −430 m; salt crust, cliffs, and יעלי's cousins on the rocks.
4. **Black stone:** the Golan plateau: basalt boulders, volcanic cones on the horizon. The trap is to pin it as the Galilee.
5. **Transfer, one latitude across:** three postcards on one west→east line (coast, ridge, rift) with two tool charges for all three. Pin all three; order counts.

**World 2 — Where the rain stops · איפה נגמר הגשם** (israel-climate, natural-water-sources)
6. **Green north:** Upper Galilee near Meron: dense Mediterranean maquis and oaks, 700+ mm.
7. **On the line:** the northern Negev near Be'er Sheva: loess, thin wheat fields, ~200 mm. Pin it relative to the aridity line.
8. **Granite and acacia:** the Eilat mountains: red granite, acacias, under 50 mm.
9. **The lake:** the Kinneret shore: below sea level, basalt pebbles, the lake ahead.
10. **Transfer, two seasons:** the same Judean Desert slope in winter and in summer, plus a western-slope twin. Pin both, and say which is in the rain shadow (the reveal shows the ridge between them).

**World 3 — Shapes of the land · צורות הנוף** (landforms, landscape-diversity)
11. **The rim:** the edge of Makhtesh Ramon. The trap is to call it a crater.
12. **Dry river:** the Ein Avdat canyon after a flash flood: wadi marks, a Nabatean dam terrace nearby.
13. **Cliff by the sea:** a kurkar cliff on the central coast, with fresh collapse at its base and a thin beach.
14. **Holes in the ground:** Dead Sea sinkholes vs. a small makhtesh, two postcards. The reveal states the module's distinction.
15. **Transfer, night postcard:** moonlight, wind and waves or silence, and only two tool charges. Somewhere in a desert or on the coast.

**World 4 — The human mosaic · הפסיפס האנושי** (cultural-landscapes, population-mosaic, settlement-distribution, global-landscapes)
16. **One slope, many faiths:** Nazareth: a church, a mosque and an old market on one slope, pilgrim hotels and multilingual signs.
17. **Glass or stone:** a Tel Aviv street of glass towers (a global landscape: the clue is that it could be anywhere, so the physical clues decide), then a Jerusalem street of stone houses. Then a dense coastal-plain town vs. a sparse Negev town, explained by settlement distribution.
18. **Final, יעלי's last leap (no hints):** five postcards across Israel mixing physical and cultural clues, a small tool budget and no map hints. Catch the ibex and get the album back.

After the authored cases work, add a **daily case**: 5 postcards seeded by date from a pool of ≥ 30 verified locations, with the same solver checks.

## 3D and art

Warm, painterly realism, like Firewatch's flat-color depth and A Short Hike's charm, at the real scale of Israel's landscapes. Golden-hour desert, misty Galilee mornings, the Mediterranean glinting, the Dead Sea's milky turquoise and salt crust, black basalt fields, honey limestone terraces. Terrain comes from real public-domain elevation (SRTM 1-arc-second around each postcard, ETOPO/SRTM-90 for the horizon and the big pin map), bundled at build time. Biome rules (vegetation density/type, rock material, soil color) come from a pure module driven by the recorded rainfall, altitude and rock per location, so the look follows the geography. The pin map is a beautiful tabletop relief of the whole country (sea in the west, rift in the east).

Tripo (search the library and assets first, then generate):
- **יעלי the rigged ibex** (quadruped rig: idle, leap, taunt, sulk)
- the **rigged ranger** (Mixamo: idle, walk, climb, hammer swing, write in notebook, cheer)
- a field-tool kit
- vegetation sets: olive, oak, pine, acacia, date palm, maquis shrubs, desert bushes
- rock props: basalt boulders, limestone terrace walls, kurkar blocks, granite outcrops
- generic buildings: a stone house, a church tower, a minaret, a market stall, a glass tower block, a kibbutz dining-hall type
- a Nabatean dam, a lookout tower

Tripo meshes are dressing only; the terrain and the clue values are procedural and authoritative.

## Acceptance

In the first 30 seconds: touch the first postcard, land in the Nitzanim dunes at sunset, kick sand to reveal kurkar, watch the sun drop into the sea, open the map, pin the coast, and get the big swooping reveal with "3 km!" while יעלי scowls from a dune. Then in Level 4, pin the Golan postcard in the Galilee on purpose and see the 40 km miss with the one-line basalt explanation. All clue values, scoring, distance and zone reveals come from the pure modules. Tests cover all 18 cases, that each case's intended clues lead inside the 3-star radius, that constant-pin strategies fail, and that every location's rock/altitude/rain values match the recorded sources. The "Not like" table in `GAME_IDENTITY.md` confirms that no level uses a banned verb.
