# Playtest — בלש הנוף

All runs are against the dev server (`npm run dev`, port 5244) with real inputs: Playwright keyboard, mouse and touch, not state pokes. Time is deterministic through `window.advanceTime(ms)`.

## 1. Automated full passes (2026-10-31)

`scratch/fullrun.mjs` (not committed; it is `scripts/drive.mjs`-style Playwright) plays every case from start to case end:
- open the postcard;
- use the hammer;
- open the map with `M`;
- click a pin at the screen position of a chosen lat/lon;
- press `Enter`, wait for the reveal, then click `המשך`.

| Run | Pin | Result |
|---|---|---|
| True spot | the place's lat/lon | **all 18 cases 3★**, average 0.0–0.4 km, every rule satisfied, 0 console errors |
| 60 km off | 0.55° north or south of the truth | cases score 0★ (1★ in cases 2 and 9, whose 1★ radius is 70 and 80 km), 870–4,300 points, 0 console errors |

The first true-spot run caught a real blocker: the map's tip banner sat over the Hermon, so a click on the far north hit the banner. The tip is now click-through and sits higher, the map framing shows Hermon to Eilat clear of every HUD element, and the commit button sits beside the model instead of on Eilat.

The solver check (`npm test`, 167 tests) separately proves that for every case the *intended* evidence leads to a 3★ pin, and that constant pins (Jerusalem, the centre, Tel Aviv, Be'er Sheva) and random pins never reach 2★. Per-postcard solver results are in `LEVELS.md`.

## 2. Independent playtester (fresh agent, did not see the code changes)

It played case 1 from the album and cases 3, 4, 11, 15 (night), 16 and 18 (no hints), each with good and bad pins. It also played the daily case, ran edge cases (pause, mute, reduced motion, hints, running out of charges, a repeated tool, Esc and back, retry, reload persistence, keyboard-only play), and did a 390×844 touch pass. It found no blockers. Every finding and what happened to it:

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Esc a second time unpaused but left the pause card up; a third Esc stacked another | major | **Fixed**: one pause card; Esc or P toggles it |
| 2 | H, M and Enter still worked while paused (could spend a hint or commit a pin) | major | **Fixed**: while the pause card is up, only Esc or P reach the game; Enter activates the focused "ממשיכים" |
| 3 | You couldn't play keyboard-only: no way to pin without a mouse, and focus was lost after cards | major | **Fixed**: arrows move the pin (Shift for big steps), Enter commits; cards focus their main button; the album focuses the next case |
| 4 | Akko revealed as "אזור ההר" | major | **Fixed in data**: the coastal-plain polygons ran east of Akko's peninsula. Akko is now on the coastal plain and on kurkar, which is correct for its ridge, and the zone-model test agrees |
| 5 | Phone map crowded: the notebook over the Negev, the tip over the title, commit over back | major | **Fixed**: phone map framing pulls back and shifts; the notebook, commit and tip are re-laid out (local capture `scratch/screenshots/12-phone-portrait.png`) |
| 6 | Case 1's tip fired in other cases (an untied 6.5 s timer) and said WASD on touch | minor | **Fixed**: tied to the same postcard load; the touch wording says to tap |
| 7 | No message when daylight ran out (the map replaced the message line) | minor | **Fixed**: the map's tip line doubles as the message line |
| 8 | A hint in the tutorial cost a star | minor | **Fixed**: free in the tutorial (the label says so); there is a test |
| 9 | Silent tools when already used or out of charges | minor | **Fixed**: a radio line explains why |
| 10 | Muting from the pause menu didn't update the 🔊 icon | minor | **Fixed** |
| 11 | 0★ still unlocks the next case | minor | **Kept on purpose**: a class must never get stuck; stars and "משחקים שוב" carry the pressure |
| 12 | Esc did nothing on the album settings, intro and case-end cards | minor | **Fixed**: Esc closes or goes back |
| 13 | Phone: the case 18 title wrapped over ⏸, and the album blurb ran off the edge | minor | **Fixed** |
| — | Mixed singular/plural address in the intros | polish | **Fixed**: all plural, like the HUD |
| — | "חסכתם 1 מטעני כלים" | polish | **Fixed**: singular for one |
| — | "ומתחת הכנרת", "המד־גובה" | polish | **Fixed**: "ומתחתיו הכנרת", "מד הגובה" |
| — | Notebook numbers wrapped onto their own line | polish | **Fixed**: wider notebook, numbers don't wrap |
| — | ↻ glyph looked like "ט" | polish | **Fixed**: text-only buttons |
| — | Night card showed a sun on "שעות אור" | polish | **Fixed**: a moon and "לילה" |
| — | Radio box overlapped the sun-arc label by ~5 px | polish | **Fixed** |
| — | Daily intro said "three tools per postcard" but charges are pooled | polish | **Fixed**: "15 מטעני כלים לכל התיק" |
| — | A city label hid the red pin head | polish | **Fixed**: the pin head draws above labels |

What the playtester said worked well:
- The full loop by mouse, keyboard and touch.
- Gaze-to-notice ("מתבוננים…").
- Charges and repeat-tool blocking.
- The bonus badge.
- Hint cost once per postcard.
- No hint button in case 18.
- Correct good and bad scoring with the trap lesson.
- The daily case.
- Persistence of stars, unlocks, mute, reduced motion and learning events.
- Restart, the lookout, and kite → map → back.
- Tap-to-walk on a phone.
- The reveal flight and explain strip.
- No console errors in any run.
- No borders, sovereignty or people used as clues.

## 3. Still open / honest limits

- The rain interpolation over-rains parts of the Judean Desert and the southern Dead Sea (no Hebron station). Places' recorded rain follows IMS normals, and tests allow ±35 % against the model.
- Some pairs are indistinguishable with the tools (Safed vs Jerusalem, north vs south Dead Sea shore, Bat Yam vs Ashdod). Those cases have wider star radii, documented in `LEVELS.md`.
- I measured performance only on an M2 Max (60 fps at about 2.2M triangles). On slow laptops, adaptive resolution drops the pixel ratio to 0.75, but I haven't tested on a real school Chromebook.
- There has been no human playtest with students yet.
