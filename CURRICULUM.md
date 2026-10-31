# Curriculum map — בלש הנוף

What the game teaches, where each fact comes from, and where the player meets it.
Sources are the Workbook modules (geography.workbook.co.il) via the snapshots in
`/Users/acedzn/idea-plotter/reports/geography-games-claude-2026-10-31/curriculum/` and
`/Users/acedzn/idea-plotter/reports/geography-games-2026-10-31/curriculum/`. Every Hebrew line in
`src/data/places.ts` and `src/data/cases.ts` either restates a module fact below or is labelled
**העשרה** in the text. Numeric values (rock, rain, altitude) come from the zone model and IMS
1991–2020 station normals, not from the modules; see the `sources` field of each place.

Scope: physical landscapes and the built landscape (buildings, streets, markets, signs, settlement
pattern). No people, clothing or communities; no borders, sovereignty or "which country" rounds.

## Modules → facts → game

| Module | Fact used (checked in the snapshot) | Where the player meets it |
|---|---|---|
| [landform-belts](https://geography.workbook.co.il/grade-9/chapter-2/landform-belts) (gr. 9 ch. 2) | Three belts west→east: the coastal plain (sand and kurkar, at sea level), the mountain ridge (limestone and chalk), the rift. The Dead Sea shore is the lowest point on land (≈430 m below sea level). The Kinneret is below sea level too. Golan basalt shows volcanism; the Judean limestone and chalk show an ancient sea. Coastal sand came with sea currents from the Nile delta. | Cases 1–5 (world 1), 9, 13; the reveal overlay of BELT_ZONES. Case 5's order rule is the west→east cross-section. |
| [israel-climate](https://geography.workbook.co.il/grade-9/chapter-2/israel-climate) | Rain falls north→south and west→east; west-facing slopes get more; east of the ridge is the rain shadow (Judean Desert). The ≈200 mm aridity line is the rough border between arid and semi-arid; south of it rain-fed farming can't be relied on. Mediterranean, steppe (ערבתי, around the aridity line) and desert climates. | Rain gauge readings; cases 6, 7, 8, 10 (rain-shadow rule), 15. |
| [landscape-diversity](https://geography.workbook.co.il/grade-9/chapter-2/landscape-diversity) | A landscape system (מערכת נוף) = climate, rock, soil, plants and animals and processes in one place. Hermon snow melts slowly and comes out in springs that feed the Jordan (Dan, Banias, Hatzbani). The coastal plain is the most built-up and densest area. The Negev is dry because it is on the edge of the desert belt. | Case 18 trap line; Hermon and Banias reveals; case 6. |
| [natural-water-sources](https://geography.workbook.co.il/grade-9/chapter-2/natural-water-sources) | Snow and rain on the Hermon and Galilee feed the Dan, Banias and Hatzbani, which join the upper Jordan and flow into the Kinneret. | Cases 5 (Jordan inflow), 6, 9. |
| [landforms](https://geography.workbook.co.il/grade-8/chapter-5/landforms) (gr. 8 ch. 5) | Desert climate makes wadis, makhteshim and loess fields. A makhtesh = uplifted layers + soft rock beneath + an ephemeral stream that carried it out; "none of the three alone would create a makhtesh"; not a meteorite crater. Sinkholes form when an underground void collapses; Dead Sea sinkholes come mainly from dissolving salt as the level drops, and are not makhteshim. Kurkar cliffs erode faster when sand stops arriving. Wind landscapes in the coastal dunes, Negev and loess plains. The Nabateans collected rainwater with channels and small dams. | Cases 11–15 (world 3), case 1's dunes, case 7's loess. |
| [rocks-minerals](https://geography.workbook.co.il/grade-8/chapter-4/rocks-minerals) (gr. 8 ch. 4) | Limestone, chalk, basalt, kurkar and granite; granite cools slowly underground (large crystals), basalt fast at the surface (tiny crystals); each weathers differently. | Rock hammer readings; case 4 (basalt vs limestone), case 8 (granite), case 2. |
| [cultural-landscapes](https://geography.workbook.co.il/grade-9/chapter-1/cultural-landscapes) (gr. 9 ch. 1) | A place's history, religion, economy and community shape what you see. Nazareth: church, mosque and old market on one slope, pilgrim hotels, multilingual signs. Jerusalem's neighbourhoods each tell a story. | Case 16; culture free looks (buildings and signs only). |
| [global-landscapes](https://geography.workbook.co.il/grade-7/chapter-1/global-landscapes) (gr. 7 ch. 1) | The same malls, food chains and glass buildings make distant cities look alike; a global landscape does not tell you where you are. | Case 17 (Tel Aviv card): glass towers and chain stores fit everywhere in the solver. |
| [settlement-distribution](https://geography.workbook.co.il/grade-9/chapter-4/settlement-distribution) (gr. 9 ch. 4) | Distribution (where people live) and density (people per km²); both peak on the coastal plain. | Kite camera: dense vs sparse town; case 17 (Bat Yam vs Yeruham), case 18. |
| [population-mosaic](https://geography.workbook.co.il/grade-9/chapter-4/population-mosaic) | Israel's population as a human mosaic, explained through map, landscape and settlement. Used only as the world 4 title and as a tag on the Nazareth place. The module's text on unrecognized villages is **not** used, per the handoff. | World 4 title only. |

## Misconceptions → cases

| Misconception (handoff) | Case that traps it | Reveal line source |
|---|---|---|
| The Negev is all sand dunes | 15 (night, Halutza dunes: sand far from the sea) | landforms (wind landscapes in the Negev) |
| Every Israeli desert looks the same | 8 (Eilat granite), 11, 12 | rocks-minerals, landforms |
| Every mountain is the same rock | 2, 18 (Beit Guvrin chalk) | landform-belts |
| The Golan is limestone | 4 (also tested: limestone reading points the solver at the Galilee) | landform-belts |
| It rains more toward the east | 6, 10 | israel-climate |
| The coast is rocky everywhere | 13 | landforms |
| The Dead Sea is at sea level | 3 | landform-belts |
| A makhtesh is a crater or a sinkhole | 11, 14 | landforms |
| A global landscape tells you where you are | 17 | global-landscapes |

## Labelled העשרה (not in a module)

- Akko old city reveal: "עיר עתיקה בחוף הצפוני".
- Jezreel fields reveal: "עמק פנימי בין הגליל לשומרון".
- Eilat granite reveal: "מהסלעים העתיקים בישראל".
- Case 8 trap: acacias as one of the few trees in this desert. (Acacia is in the handoff's term list
  and the game's vegetation enum, but no snapshot sentence describes it.)

## Model values that are not module facts

- The 400 mm Mediterranean/steppe threshold (`MED_MM` in `src/model/world.ts`) is the lead's model
  choice; the modules only give the 200 mm aridity line.
- Rain per place is an IDW of IMS normals; the reading is ±20 %. The rule-based vegetation
  (`vegetationOf`) gives some unrealistic labels that the places follow so the tests pass: 'dune'
  for the Arava sand, 'acacia' on makhtesh floors, 'maquis' on the kurkar coast.
- Dead Sea water level is −435 m in the places (Workbook says ≈430 m); SRTM shows ≈ −415 m.
