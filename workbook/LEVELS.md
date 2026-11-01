# Landscape Detective — workbook catalog entry

- **Slug:** `landscape-detective`
- **Hebrew title:** בלש הנוף
- **English title:** Landscape Detective
- **Hebrew tagline:** נוחתים בתוך גלויה ממקום אמיתי בישראל, אוספים ראיות בשטח — סלע, צומח, גובה וגשם — ונועצים סיכה במפת התבליט. כמה קרוב תגיעו?
- **Grades:** 8, 9 (and 7 for global landscapes in case 17). Mostly grade 9 chapter 2 and grade 8 chapters 4–5.
- **Orientation:** `any`. It works in portrait on a phone (HUD checked at 390×844) and is best in landscape.
- **Levels:** 18 authored cases (`?level=1`…`?level=18`). The daily case is generated and posts no level events.

Module paths are `grade-X/chapter-Y/<module-slug>`. The slugs come only from `acedzn-tools/packages/catalog-geography/src` (`ids.ts` and the `grade-*.ts` chapter lists). For each case they are the modules its places record, most-practised first.

| n | Hebrew level title | Hebrew skill | Workbook geography modules |
|---|---|---|---|
| 1 | הגלויה הראשונה | ים במערב וחול: מישור החוף | grade-9/chapter-2/landform-belts, grade-8/chapter-5/landforms |
| 2 | טרסות של אבן | גובה וסלע גיר: אזור ההר | grade-9/chapter-2/landform-belts, grade-8/chapter-4/rocks-minerals, grade-9/chapter-2/israel-climate |
| 3 | מתחת לפני הים | גובה שלילי: בקע ים המלח | grade-9/chapter-2/landform-belts, grade-8/chapter-5/landforms, grade-9/chapter-2/israel-climate |
| 4 | אבן שחורה | בזלת מול גיר: רמת הגולן | grade-8/chapter-4/rocks-minerals, grade-9/chapter-2/landform-belts |
| 5 | קו רוחב אחד | מעבר מחוף להר לבקע | grade-9/chapter-2/landform-belts, grade-9/chapter-2/israel-climate, grade-9/chapter-2/natural-water-sources |
| 6 | הצפון הירוק | גשם רב וחורש ים־תיכוני | grade-9/chapter-2/israel-climate, grade-9/chapter-2/landscape-diversity, grade-9/chapter-2/natural-water-sources |
| 7 | על הקו | קו 200 מ״מ וספר המדבר | grade-9/chapter-2/israel-climate, grade-8/chapter-5/landforms, grade-9/chapter-4/settlement-distribution |
| 8 | גרניט ושיטה | סלעי הערבה ואקלים מדברי | grade-8/chapter-4/rocks-minerals, grade-9/chapter-2/israel-climate, grade-9/chapter-2/landform-belts |
| 9 | האגם | מים מתוקים ומלוחים בבקע | grade-9/chapter-2/landform-belts, grade-9/chapter-2/natural-water-sources, grade-9/chapter-2/israel-climate |
| 10 | שתי עונות | צל גשם: שני צדי ההר | grade-9/chapter-2/israel-climate, grade-9/chapter-2/landform-belts |
| 11 | השפה | מכתש: איך הוא נוצר | grade-8/chapter-5/landforms, grade-9/chapter-2/landscape-diversity, grade-8/chapter-4/rocks-minerals |
| 12 | נהר יבש | ואדי ושיטפון במדבר | grade-8/chapter-5/landforms, grade-9/chapter-2/israel-climate |
| 13 | מצוק מול הים | מצוק כורכר וסחיפה | grade-8/chapter-5/landforms, grade-9/chapter-2/landform-belts |
| 14 | חורים באדמה | בולענים ומכתש קטן | grade-8/chapter-5/landforms |
| 15 | גלויה לילית | חול בלי ים: חולות הנגב | grade-8/chapter-5/landforms, grade-9/chapter-2/israel-climate |
| 16 | מדרון אחד, הרבה אמונות | סימני תרבות בנוף | grade-9/chapter-1/cultural-landscapes, grade-9/chapter-4/population-mosaic, grade-8/chapter-4/rocks-minerals |
| 17 | זכוכית או אבן | נוף גלובלי מול נוף מקומי | grade-7/chapter-1/global-landscapes, grade-9/chapter-4/settlement-distribution, grade-9/chapter-1/cultural-landscapes |
| 18 | הקפיצה האחרונה של יעלי | חזרה: כל הראיות, בלי רמזים | grade-9/chapter-2/israel-climate, grade-9/chapter-4/settlement-distribution, grade-9/chapter-2/landform-belts, grade-8/chapter-5/landforms |

## Bridge notes

- **`ready`** posts once, when the first playable scene is on screen: the album normally, or the first postcard on a `?level=N` link. It always comes before any `level-start`.
- **`level-start {level}`** posts when case N's first postcard is playable, and again on a retry.
- **`level-complete {level, stars, durationMs}`** posts at the case-end card only when the case is won (≥1★). A 0★ case posts nothing. A replay that is won posts again.
- **`?level=N`** opens case N's first postcard directly, even if the save has it locked. The intro card is skipped, but the case's intro line still plays on the first postcard's radio, so no story is lost.
