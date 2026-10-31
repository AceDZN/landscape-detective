# Hebrew terms — בלש הנוף

Workbook wording for every term the game shows. `src/model/terms.ts` (lead's) holds the enum →
Hebrew maps and must match this file. Place names use their standard Hebrew name as Workbook uses
it and appear only at the reveal.

## Handoff term list → where it appears

| Term | Meaning | In the game |
|---|---|---|
| מערכת נוף | landscape system | case 18 trap line |
| מסלע | bedrock | rock hammer, notebook |
| גיר | limestone | `ROCK_HE.limestone` |
| קירטון | chalk | `ROCK_HE.chalk` |
| בזלת | basalt | `ROCK_HE.basalt` |
| כורכר | kurkar (calcareous sandstone) | `ROCK_HE.kurkar` |
| גרניט | granite | `ROCK_HE.granite` |
| לס | loess | `ROCK_HE.loess` |
| חול | sand | `ROCK_HE.sand` |
| מישור החוף | coastal plain | `BELT_HE.coastal_plain` |
| אזור ההר | mountain region | `BELT_HE.mountain` |
| בקע | rift | `BELT_HE.rift` ("הבקע") |
| רמת הגולן | Golan Heights | `BELT_HE.golan` |
| טרסות | terraces | `LANDFORM_HE.terraces` |
| חורש ים תיכוני | Mediterranean maquis | `VEG_HE.maquis` |
| צומח מדברי | desert vegetation | `VEG_HE.desert` ("צומח מדברי דליל") |
| שיטה | acacia | `VEG_HE.acacia` ("שיטים בערוצים") |
| אקלים ים תיכוני / ערבתי / מדברי | Mediterranean / steppe / desert climate | `CLIMATE_HE` |
| קו הצחיחות | aridity line (≈200 mm) | case 7, rain hints |
| צל גשם | rain shadow | case 10 |
| ואדי (ערוץ יבש) | wadi (dry channel) | `LANDFORM_HE.wadi` |
| מכתש | makhtesh (erosion cirque) | `LANDFORM_HE.makhtesh` |
| מצוק כורכר | kurkar cliff | `LANDFORM_HE.kurkar_cliff` |
| בולען | sinkhole | `LANDFORM_HE.sinkholes` ("בולענים") |
| נוף תרבותי | cultural landscape | world 4, case 16 |
| פסיפס אנושי | human mosaic | world 4 title |
| נוף גלובלי | global landscape | case 17 |
| פני הים | sea level | altimeter ("מעל/מתחת לפני הים") |

## Other terms used in places and cases

| Term | Meaning | Notes |
|---|---|---|
| חוואר ומלח | marl and salt (rift fill) | `ROCK_HE.marl_salt` |
| אבן חול | sandstone (makhtesh floors) | `ROCK_HE.sandstone` |
| בתה וצומח ערבתי | batha / steppe shrubs | `VEG_HE.batha` |
| צמחי חולות | dune plants | `VEG_HE.dune` |
| רכס כורכר | kurkar ridge | `LANDFORM_HE.kurkar_ridge` |
| דיונות חול / חוליות | sand dunes | `LANDFORM_HE.dunes`; reveal lines use חוליות too |
| חרוטי געש | volcanic cones | `LANDFORM_HE.volcanic_cones` |
| רמה בזלתית | basalt plateau | `LANDFORM_HE.basalt_plateau` |
| מצוקי העתקים | fault escarpments | `LANDFORM_HE.rift_cliffs` |
| מישור לס | loess plain | `LANDFORM_HE.loess_plain` |
| קניון | canyon | `LANDFORM_HE.canyon` |
| פרשת המים / קו הרכס | watershed / ridge line | case 10 trap; `watershedLon` |
| שדרת ההר | the mountain spine | Jerusalem places |
| השפלה | the Shephelah | Beit Guvrin reveal |
| הערבה | the Arava | Arava places |
| נחל אכזב | ephemeral stream | makhtesh trap lines (landforms wording) |
| חקלאות בעל | rain-fed farming | case 7 trap (israel-climate wording) |
| סכר נבטי | Nabatean dam | `CULTURE_HE.nabatean_dam` |
| יישוב צפוף / דליל | dense / sparse settlement | kite camera, `CULTURE_HE` |

## Style

- Numbers are written with their unit: `700 מ׳`, `200 מ״מ`, `ק״מ`; negative altitudes as "מתחת לפני הים".
- Reveal lines: clues → place, one line, with "→".
- "העשרה:" marks any fact that is not in a Workbook module.
