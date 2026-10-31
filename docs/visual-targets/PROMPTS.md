# Visual targets: prompts and provenance

These are **design targets** generated before the game was built. They are **not** screenshots of the game. Copy their camera, silhouettes, materials, lighting and HUD layout. Don't copy their generated Hebrew, numbers or geography: the image model invents relief and sometimes writes the answer on screen.

- **Route:** A, ChatGPT image generation (gpt-image) in the user's signed-in Chrome, in the art helper's own tab. All four images were made in one chat; prompts 2–4 say "same game, same art style".
- **Chat URL:** https://chatgpt.com/c/6ae602db-afc8-83eb-9448-e6b8620a8410
- **Date:** 2026-10-31 (≈17:00–17:15 local)
- **Output size:** 1672 × 941 PNG (ChatGPT's 16:9 output).
- **Download:** the image viewer's download button, then moved from `~/Downloads` into this folder.
- **Attempts:** one per image. Each first result already read as a polished game a 13-year-old would pick (characters, juice, chunky HUD), so no regenerations were spent; the issues below are fixed in the build, not by re-rolling.

| File | Role | Download name | SHA-256 |
| --- | --- | --- | --- |
| `01-first-30s.png` | first 30 s: Nitzanim dunes at sunset | `Sunset Dunes Explorer Postcard.png` | `f9dcdd8475c5f6cde77c0c0933269b6ea1096e31a8454996da4d7a04f71de62a` |
| `02-core-golan.png` | core action: rock hammer on Golan basalt | `חוקר נוף_ סוד הבזלת.png` | `4b333ecac783d62cadd0ffbcd4b0fda127f16f9302ef442c8c55411812e336cc` |
| `03-pin-reveal.png` | pin map + reveal (the 40 km miss) | `Interactive Golan Map Reveal.png` | `e6e628040734c74ee9fa6f8324cdb96bed0953d2083f7c297ee0c6a538fddb18` |
| `04-level-select.png` | level select: יעלי's postcard album | `Yaeli’s Golden Album Adventure.png` | `3c984de32d446037f7d970cfacea2862dd3dd92a66f4c896411113b5609075ca` |

---

## 01-first-30s.png — first postcard, Nitzanim dunes

**Prompt (exact):**

> Create an image: a polished in-game screenshot of a 3D browser game called Landscape Detective (design target, landscape 16:9, real 3D depth with lights and shadows, not flat vector art, not an edtech worksheet). Art style: warm painterly realism with flat-colour layered haze, like Firewatch meets A Short Hike, golden hour. Scene: the Nitzanim coastal dunes in Israel at sunset. Third-person camera slightly above and behind a teen junior ranger character (stylized, khaki shirt, green cap, small backpack, hiking boots) standing on a pale cream sand dune; at his feet a low reddish-tan kurkar sandstone outcrop is exposed where sand was kicked away; the Mediterranean Sea glinting to the left (west) with the big orange sun low over the water, long shadows toward the camera; sparse dune grasses. On a far dune a cheeky cartoon Nubian ibex with big curved horns and a sandy coat peeks over the crest, grinning. The whole 3D view is framed as a postcard: a cream deckled paper border with a postage stamp in one corner. Hebrew right-to-left game HUD, font like Rubik, chunky rounded cream paper panels with soft shadows, ranger-green accents and ink-brown text: top-right a navy and green pill with the case title "גלויה ראשונה" and 3 gold stars; top-left two round buttons, pause and mute; bottom-centre a tool belt of 5 chunky round tool buttons with icons (rock hammer, field guide book, altimeter, rain gauge, kite camera), each with small charge pips under it; right side a tall paper ranger notebook page with 2 handwritten-style Hebrew entries ("חול בהיר", "סלע: כורכר"); bottom-left a big ranger-green button "למפה" with a map pin icon; near the top a small daylight sun-arc meter showing the sun close to setting. Make it look like a game a 13-year-old would want to play.

**Keep:** the postcard frame (deckled cream edge + stamp top-right), the low third-person camera over the shoulder, sun over the sea on the left (west), the pitted honey-orange kurkar outcrop at the ranger's feet, the ibex peeking from a crest, the HUD exactly as laid out (see CHECKLIST.md). The tool labels it invented are good Hebrew: פטיש גאולוגי, מדריך שדה, מד גובה, מד גשם, מצלמת עפיפון; the notebook header "יומן תצפיות של חוקר נוף" and the sun-arc label "שעות אור" are usable.

**What's off:**
- The stamp prints "ניצנים / ישראל". In the game the stamp must never name the place before the reveal (it would give the answer away): use a generic stamp (ibex or a postmark).
- The altimeter icon shows "+56" on its face; the real button must not show a value before it is used.
- The ranger is very photoreal-Pixar; our Tripo ranger is chunkier and cuter. Fine.
- The sun is well above the horizon and huge; keep it big but real direction (west-south-west for the season).
- Sand ripples and grass are richer than a 300 m real-time terrain can carry; aim for the palette and haze, not the detail.

## 02-core-golan.png — core action: rock hammer on basalt

**Prompt (exact):**

> Great, keep exactly this game, art style, postcard frame and HUD layout. Now create image 2 (landscape 16:9, in-game screenshot, design target): the core action mid-play on the Golan basalt plateau. Scene: a wide flat plateau of yellow-green grass strewn with rounded black basalt boulders and dark stone field walls, several smooth round volcanic cone hills on the horizon under a clear late-morning sky with soft haze, a few small oak trees. Third-person camera behind and to the side of the same teen junior ranger (khaki shirt, green cap, backpack) mid-swing with a rock hammer striking a big black basalt boulder, chips and dust flying, a small impact burst. A round close-up inset bubble next to the boulder (like a magnifying loupe) shows dark grey vesicular basalt rock full of small holes. The cheeky ibex is tiny on a distant cone hill. HUD same as before: top-right navy and green pill with the case title "אבן שחורה" and 3 stars; top-left round pause and mute; the daylight sun-arc meter at top showing mid-morning; bottom-centre the tool belt of 5 tool buttons with the rock hammer button glowing as active and one of its charge pips just used (empty); right side the paper ranger notebook with entries "סלע: בזלת" (newest, highlighted as just written) and "צומח: עשבים ואלונים"; bottom-left the big green "למפה" button. Real 3D depth, warm painterly light, Firewatch meets A Short Hike.

**Keep:** hammer-swing pose and the impact burst (chips + spark star), the round loupe inset on a thin leader line, gold glow on the active tool with one hollow pip, the yellow highlighter behind the newest notebook line, the flat plateau with dark rounded boulders and dry-stone walls, cones on the horizon.

**What's off:**
- The stamp reads "רמת הגולן" — again, never name the place in the scene. Generic stamp only.
- The cones are too evenly spaced and too close; the real Golan cones (e.g. Avital/Bental) sit a few km away. Use the real relief.
- Notebook entry "צומח: עשבים ואלונים" should come from the field guide, not appear after only the hammer was used.

## 03-pin-reveal.png — pin map and reveal (the 40 km miss)

**Prompt (exact):**

> Excellent. Same game, same art style. Now image 3 (landscape 16:9, in-game screenshot, design target): the PIN MAP reveal moment. The postcard has flipped and we now see a beautiful tabletop 3D relief model of the whole Land of Israel lying on a wooden ranger desk, camera at a 3/4 angle from the south-west looking north, NORTH IS UP (the top of the model points away from the camera), the Mediterranean Sea in blue on the LEFT (west), the Jordan rift valley, Sea of Galilee and the milky turquoise Dead Sea on the RIGHT (east), the Negev triangle narrowing to the south toward the camera; carved, painterly relief with mountains lit low from the west, warm desk lamp light. NO political border lines, no country names. A big brass pin with a red head is stuck in the Galilee hills; from it a glowing golden arc line flies across to the true spot a little north-east on the Golan plateau, where a second glowing green ranger flag pin marks the answer; the dark basalt Golan zone glows softly. A big chunky distance counter badge reads "40 ק״מ" with the numbers counting up. A cream paper explanation card at the bottom reads one Hebrew line: "בזלת + רמה → רמת הגולן, לא הגליל". The cheeky cartoon Nubian ibex (big curved horns, sandy coat) stands on a ridge of the relief model laughing and pointing a hoof. HUD: top-right navy and green case pill with stars (2 of 3 filled), top-left pause/mute, a big green button "המשך" bottom-left, a small "צפון ↑" north arrow compass rose on the map corner. Real 3D depth, satisfying game juice (sparkles along the arc, dust puff at the pin).

**Keep:** the tabletop-on-a-desk framing (brass lamp, binoculars, field notebook as props), sea left / rift right, the red-headed brass pin, the golden arc with sparkles to a green flag pin, the glowing zone outline, the flip-counter distance badge, the one-line explanation strip, the "המשך »" button, the "צפון ↑" card, the ibex laughing on the edge.

**What's off:**
- The relief is invented: the coastline, the Kinneret and Dead Sea positions and the Negev shape are wrong, and the camera actually looks north-east. Build the model from ETOPO/SRTM, with north up on screen at the reveal.
- The Golan is drawn as a raised block right next to the coast; in reality it is east of the Kinneret.
- The distance badge reads "40 ק"מ" with "ק"מ" placed left of the number — in the real UI the number goes in an LTR span (`<bdi>`), e.g. "<bdi>40</bdi> ק״מ".

## 04-level-select.png — level select: יעלי's album

**Prompt (exact):**

> Love it. Same game, same art style. Now image 4 (landscape 16:9, in-game screenshot, design target): the LEVEL SELECT screen. A big open leather-bound postcard album lying on a cork board / wooden ranger desk, seen from slightly above, warm lamp light, real 3D depth. Hebrew right-to-left: the album reads from RIGHT to LEFT, the first world page is on the RIGHT. Four world pages/tabs with Hebrew titles on ribbon tabs: "שלוש רצועות ואבן שחורה", "איפה נגמר הגשם", "צורות הנוף", "הפסיפס האנושי". On the open spread, 18 small numbered painted postcards in photo corners showing different Israeli landscapes (sunset sand dunes, honey limestone terraces with olive trees, the turquoise Dead Sea with salt crust, black basalt plateau with volcanic cones, green Galilee oak forest, loess wheat fields, red granite mountains with acacia, a big desert crater rim, a stone church and minaret on a hillside town, glass towers); the first postcards (on the right) are completed with 1 to 3 gold stars stamped on them, the current one glows with a pulsing ranger-green outline, later ones are locked: face-down with a padlock wax seal. A trail of little hoofprints and torn postcard corners crosses the album from right to left, and the cheeky cartoon Nubian ibex peeks over the top edge of the album holding a stolen postcard in its teeth. HUD: top-right a navy and green pill "האלבום של יעלי" with a total star counter "★ 14/54"; top-left round pause/mute and settings buttons; bottom-left a big green "שחק" play button; a small daily case stamp badge "תיק יומי" at bottom-right. Inviting, collectible, makes a 13-year-old want to fill the album.

**Keep:** RTL order (world 1 tab and postcard #1 top-right, numbers run down then leftwards), the four coloured ribbon tabs with icons (green dunes / blue rain cloud / pink mountains / purple people), postcards in photo corners with a star strip, the glowing current card, red wax-seal padlocks on locked cards, hoofprint trail, ibex peeking with a stolen card, "★ 14/54" counter pill, "שחק ▶" button, "תיק יומי" calendar stamp.

**What's off:**
- Progress is inconsistent: #3 is "current" but #4–#10 already have stars. In-game, everything after the current card is locked.
- Only 18 cards in 4 tabs, but the spread shows them all at once with tabs over columns, not real pages. Either show one spread per world (5/5/5/3) or keep the "all columns" overview — decide in the build.
- The ibex's head is cut by the top HUD; keep it below the pill.
- Locked cards show sketched landscapes under the seal; keep locked cards blank so they don't spoil places.
