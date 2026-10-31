# Landscape Detective — בלש הנוף

## One line
You are dropped, with no labels, inside a real 3D Israeli landscape. Walk, look, and spend a few field-tool charges on the evidence you think is decisive. Then drop one pin on a 3D relief map of Israel and watch the camera swoop to the true spot. The distance is your score, and יעלי the ibex either escapes or gets caught.

## Who and why
- **יעלי** (Ya'eli), a cheeky Nubian ibex, stole the Nature Authority's postcard album and scatters postcards across Israel.
- **You** are a junior ranger with a backpack of field tools and a small daylight budget.
- Each postcard is a real place at real coordinates on real relief (SRTM-derived). The clues are the geography itself: rock, plants, altitude, rain, landform, the sun setting over the sea, the buildings on a slope.

## Core verbs (the whole game)
1. **Walk and look** in a real 3D place (third person, one lookout climb per postcard).
2. **Choose which field tools to spend** (rock hammer, field guide, altimeter, rain gauge, kite camera). Charges are scarce; unused charges are bonus stars.
3. **Commit one pin** on a 3D relief map of Israel.
4. **Watch the reveal**: camera flight from your pin to the truth, distance count-up, the belt/climate/landform zone lights up, one Hebrew line links your best clue to the answer.

The player never sets landscape factors, never builds a scene, never sorts, tags or rates anything. The ranger notebook fills itself.

## Look (art direction)
- Warm painterly realism with flat-colour depth (Firewatch-like layered haze, A Short Hike charm) at the *real* scale of the place. Golden-hour Nitzanim, misty Galilee morning, the Dead Sea's milky turquoise and salt crust, black basalt fields, honey limestone terraces, red Eilat granite.
- The 3D view sits inside a **postcard frame**: a cream deckled border with a stamp corner. Opening the map "flips" the postcard.
- The **pin map** is a tabletop relief model of all of Israel, sea to the west, rift to the east, lit low from the west, a brass pin with a red head.
- HUD: Hebrew RTL, Rubik. Cream paper panels, ranger-green accents, ink-brown text. Top-right: case title + stars. Top-left: pause/mute. Bottom-centre: the **tool belt** (5 chunky tool buttons with charge pips). Right side: the **ranger notebook** (paper page, entries appear as you observe). Big "למפה" button bottom-left. A daylight sun-arc meter.
- Numbers, units and coordinates are LTR (`<bdi>`), e.g. "−430 מ'", "200 מ"מ".
- North is always up on the map; east is right. A tutorial line says so.

## Not like (hard rule: no duplicate mechanics)
Checked against `/Users/acedzn/idea-plotter/reports/geography-games-claude-2026-10-31/EXISTING.md`, the Workbook sim sources (read-only) and the other games in `~/dev/AceDZN-exp`. Recorded before each world.

| Existing game / sim | Its core interaction | What Landscape Detective does instead | Banned here |
|---|---|---|---|
| IsraelLandscapeMixerLab (landscape-diversity) | Dials for altitude, rain, distance from sea, rock build a landscape; recreate Hermon/coast/Negev | The landscape is given and fixed; you *infer* where it is from evidence you choose to collect | Any dial or slider that sets a landscape factor |
| IsraelRainTransectLab (israel-climate) | Move a marker on a transect, set altitude/distance from sea, read rain | Rain is one *measured* clue (rain gauge, ±20 %) in a place you cannot change; you pin a 2D map location | Moving a probe to read rain off a transect |
| CulturalLandscapeReaderLab (cultural-landscapes) | Place cultural-sign tiles on a street, read cause families | You walk a street that already exists and look | Tiles, building a scene |
| GlobalLandscapeSpotterLab (global-landscapes) | Sort tiles into global vs. local bins | A global street is evidence that *doesn't* locate you, so you spend tools on physical clues | Sorting into bins |
| CulturalLandscapeMosaicLab / IsraelPopulationMosaicLab | Paint groups onto a grid / toggle factors and watch dots | Settlement density is seen from the kite camera and pinned | Painting, factor toggles |
| IsraelLandformBeltsLab (landform-belts) | Drag process chips onto belt slots | Belts appear only as the reveal overlay after you commit | Chips, slots |
| RockCycleExplorer (rocks-minerals) | Click processes on a cycle wheel | The rock hammer reads the rock in front of you | Cycle wheels |
| RiverFlowSculptorLab / WeatheringErosionLab (landforms) | Sculpt rivers and erosion | Landforms are read, never shaped | Terrain editing |
| TradeRouteBridgeLab (israel-middle-east) | Follow historic route stops | Postcards are independent drops, no route | Route-following journeys |
| ClimatographDetectiveLab (climate-zones) | Identify a climate zone from a climograph | No climographs; climate is inferred from plants, rain, rock and latitude in 3D | Climograph reading |
| Clockwork Alibi (AceDZN-exp) | Inspect-and-deduce with timeline scrubbing | No timeline, no reconstruction; one pin commit per postcard | Timeline scrubbing |
| Windshift Riders | Fly a sailplane | You walk; the kite camera is a fixed 10 s look from a tether, no flight control | Flying |
| Basin Breakers | Cut and raise terrain, route water | Terrain is real and untouchable | Terrain editing |
| Rush Hour Israel | Draw transport links on a relief atlas | The relief atlas only takes one pin | Drawing networks |
| Rift Makers | Place heat plumes, shape plates | — | Plate shaping |
| Tilt World | Commit time jumps, photograph sky events | The sun's position is a passive free clue (west/sea), never controlled | Controlling time/sun |
| Slope Sled, Rooftop Radio, Hypotenuse Rush, Clumpus, others | Ride/parkour/rolling/launch loops | Calm walking is only a means to look | — |

### Per-world check
- **World 1 — Three belts and black stone:** verbs used = walk, tool charge, pin, reveal. No dials, chips or bins. ✔
- **World 2 — Where the rain stops:** rain is only measured, never set; no transect probe. ✔
- **World 3 — Shapes of the land:** no terrain editing, no erosion sculpting; sinkholes vs makhtesh read, not built. ✔
- **World 4 — The human mosaic:** no tiles, no painting, no sorting; cultural clues are seen buildings and signs, never people. ✔

## Sensitivity
Landscapes, not people: buildings, streets, markets, signs, settlement patterns. No political borders, no sovereignty, no "which country" rounds. Places are named only at the reveal, by their standard Hebrew names.
