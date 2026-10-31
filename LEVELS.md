# Levels — בלש הנוף

The 18 authored cases from BUILD_HANDOFF "Levels", as they are in `src/data/cases.ts`.
Every postcard is a place in `src/data/places.ts` (exact coordinates, SRTM-checked; rock, belt,
rain and landforms come from the zone model in `src/data/zones.ts` and IMS 1991–2020 normals).

How the numbers below were made: `tests/cases.test.ts` runs the solver on each postcard's free
looks plus the intended tool readings (seed `case<id>:<index>`), and requires the average miss
≤ the 3★ radius. Always pinning Jerusalem (31.778, 35.235), the centre of Israel (31.45, 34.95),
Tel Aviv (32.08, 34.78) or Be'er Sheva (31.25, 34.79), or pinning at random, must stay under 2★.
The "Solver miss" column is the levels helper's run of the same check (npm test 166/166).
The "Verified solution" line is for the lead's solver sign-off.

Design notes:
- Cases 1 and 15 have one postcard and case 14 has two, because the handoff text names one
  postcard (the tutorial, the night card) and "two postcards" (sinkholes vs a small makhtesh).
  Three night cards can't be solved with two charges: at night only the sea can be heard.
- Charges are the intended tools plus one spare where the case allows a bonus; transfer cases
  (5, 15) and the final case have no spare.
- Tight radii, deliberately: case 10 (Jerusalem is 14.9 km from both slopes, so 2★ ≤ 14) and
  case 7 (Be'er Sheva constant 15.2 km). Wider radii where the tools honestly cannot separate
  two look-alike places: case 9 (north vs south Dead Sea shore, 32 km), case 12 (Shivta's
  limestone wadi plateau, like much of the central Negev, 28 km), case 17 (Bat Yam vs Ashdod: both dense, sandy, coastal, 29 km).
- Safed is not used in any case: stone houses, terraces, ~750 m and the rain gauge's ±20 %
  make it indistinguishable from Jerusalem for the tools.

## עולם 1 — שלוש רצועות ואבן שחורה

### 1. הגלויה הראשונה

Charges: ∞ (tutorial) · star radii 3★/2★/1★: 12 / 30 / 60 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | חולות ניצנים (`nitzanim_dunes`) | 31.738, 34.61 | autumn 17.3 | פטיש סלעים, מד גשם | 7.6 km |

Solver average 7.6 km (3★ ≤ 12). Constant pins average: ירושלים 59.3, מרכז הארץ 45.4, תל אביב 41.3, באר שבע 56.9 km (2★ needs ≤ 30).

Trap: החול לבד לא מספיק: יש חול גם בנגב. הים במערב והגשם הרב הם שמכריעים: מישור החוף.

Verified solution (solver, 2026-10-31): 1) פטיש סלעים + מד גשם → pin 31.799, 34.646, 7.6 km off. Average 7.6 km → 3★.

### 2. טרסות של אבן

Charges: 5 · star radii 3★/2★/1★: 12 / 30 / 70 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | מדרון הטרסות ליד צובה, הרי ירושלים (`tzuba_terraces`) | 31.783, 35.115 | spring 9 | מד גובה, מד גשם | 9.2 km |
| 2 | יער ירושלים, שדרת ההר (`jerusalem_forest_ridge`) | 31.79, 35.17 | winter 11 | מד גובה | 13.4 km |
| 3 | רכס הכרמל (`carmel_ridge`) | 32.735, 35.035 | autumn 16 | מד גובה | 2.3 km |

Solver average 8.3 km (3★ ≤ 12). Constant pins average: ירושלים 41.9, מרכז הארץ 75.5, תל אביב 57.1, באר שבע 101.2 km (2★ needs ≤ 30).

Trap: גיר וטרסות נמצאים לאורך כל אזור ההר. הגובה מבדיל: 700–800 מ׳ ליד ירושלים, נמוך יותר בכרמל ליד הים.

Verified solution (solver, 2026-10-31): 1) מד גובה + מד גשם → pin 31.851, 35.170, 9.2 km off; 2) מד גובה → pin 31.910, 35.182, 13.4 km off; 3) מד גובה → pin 32.728, 35.058, 2.3 km off. Average 8.3 km → 3★.

### 3. מתחת לפני הים

Charges: 4 · star radii 3★/2★/1★: 8 / 25 / 60 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | חוף ים המלח בעין גדי (`ein_gedi_shore`) | 31.4206, 35.3879 | spring 8 | מד גובה | 8.2 km |
| 2 | הערבה ליד חצבה (`hatzeva_arava`) | 30.778, 35.239 | winter 14 | מד גובה | 4.0 km |
| 3 | ים המלח למרגלות הר סדום (`sodom_shore`) | 31.08, 35.402 | autumn 15 | מד גשם | 2.4 km |

Solver average 4.8 km (3★ ≤ 8). Constant pins average: ירושלים 77.6, מרכז הארץ 60.4, תל אביב 123.5, באר שבע 63.1 km (2★ needs ≤ 25).

Trap: ים המלח אינו בגובה פני הים: החוף שלו הוא המקום הנמוך ביותר ביבשה, ומד הגובה מראה מאות מטרים מתחת לפני הים.

Verified solution (solver, 2026-10-31): 1) מד גובה → pin 31.383, 35.466, 8.5 km off; 2) מד גובה → pin 30.771, 35.280, 4.0 km off; 3) מד גשם → pin 31.065, 35.420, 2.4 km off. Average 5.0 km → 3★.

### 4. אבן שחורה

Charges: 5 · star radii 3★/2★/1★: 6 / 20 / 50 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | שדה בזלת למרגלות הר בנטל (`golan_bental`) | 33.118, 35.77 | winter 10 | פטיש סלעים, מד גובה | 3.9 km |
| 2 | רמת הגולן ליד גמלא (`golan_gamla`) | 32.905, 35.745 | spring 15 | פטיש סלעים | 0.7 km |
| 3 | קצרין, רמת הגולן (`katzrin_town`) | 32.993, 35.69 | summer 18 | מצלמת עפיפון | 1.7 km |

Solver average 2.1 km (3★ ≤ 6). Constant pins average: ירושלים 144.4, מרכז הארץ 188.1, תל אביב 136.5, באר שבע 214.5 km (2★ needs ≤ 20).

Trap: רמת הגולן אינה עשויה גיר: היא רמה של בזלת, סלע געשי כהה. הגליל ממערב לה בנוי בעיקר גיר.

Verified solution (solver, 2026-10-31): 1) פטיש סלעים + מד גובה → pin 33.104, 35.809, 3.9 km off; 2) פטיש סלעים → pin 32.900, 35.750, 0.7 km off; 3) מצלמת עפיפון → pin 32.991, 35.708, 1.7 km off. Average 2.1 km → 3★.

### 5. קו רוחב אחד (transfer)

Charges: 2 · star radii 3★/2★/1★: 6 / 20 / 50 km · rule: `order_west_east`

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | מדרון הכרמל בחיפה (`haifa_carmel_slope`) | 32.805, 34.99 | summer 18 | פטיש סלעים | 4.8 km |
| 2 | נחל כזיב, הגליל המערבי (`nahal_kziv`) | 33.045, 35.235 | spring 10 | free looks only | 0.6 km |
| 3 | שפך הירדן לכנרת (`jordan_inflow_kinneret`) | 32.8926, 35.6256 | autumn 8 | מד גובה | 4.0 km |

Solver average 3.1 km (3★ ≤ 6). Constant pins average: ירושלים 128.9, מרכז הארץ 167.5, תל אביב 106.2, באר שבע 192.2 km (2★ needs ≤ 20).

Trap: בחתך ממערב למזרח הרצועות באות תמיד באותו סדר: מישור החוף, אזור ההר, ואז הבקע.

Verified solution (solver, 2026-10-31): 1) פטיש סלעים → pin 32.765, 35.008, 4.8 km off; 2) looking only → pin 33.040, 35.235, 0.6 km off; 3) מד גובה → pin 32.860, 35.646, 4.1 km off. Average 3.1 km → 3★.

## עולם 2 — איפה נגמר הגשם

### 6. הצפון הירוק

Charges: 8 · star radii 3★/2★/1★: 8 / 25 / 60 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | יער הר מירון, הגליל העליון (`meron_forest`) | 32.996, 35.41 | winter 10 | מד גובה, מד גשם | 0.7 km |
| 2 | יער ברעם, הגליל העליון (`baram_forest`) | 33.045, 35.43 | spring 13 | מד גובה, מד גשם | 4.4 km |
| 3 | מורדות החרמון ליד נווה אטי"ב (`hermon_neve_ativ`) | 33.26, 35.74 | winter 12 | פטיש סלעים, מד גובה, מד גשם | 4.5 km |

Solver average 3.2 km (3★ ≤ 8). Constant pins average: ירושלים 150.0, מרכז הארץ 191.6, תל אביב 133.4, באר שבע 217.3 km (2★ needs ≤ 25).

Trap: הגשם אינו עולה ככל שמתקדמים מזרחה: הוא פוחת מצפון לדרום וממערב למזרח, והמדרונות הפונים מערבה מקבלים יותר. לכן הצפון ההררי רטוב במיוחד.

Verified solution (solver, 2026-10-31): 1) מד גובה + מד גשם → pin 32.990, 35.410, 0.7 km off; 2) מד גובה + מד גשם → pin 33.020, 35.394, 4.4 km off; 3) פטיש סלעים + מד גובה + מד גשם → pin 33.220, 35.730, 4.5 km off. Average 3.2 km → 3★.

### 7. על הקו

Charges: 6 · star radii 3★/2★/1★: 5 / 12 / 40 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | שדות הלס מצפון לבאר שבע (`beersheva_loess`) | 31.3, 34.79 | spring 9 | מד גשם | 1.3 km |
| 2 | יער להב (`lahav_forest`) | 31.38, 34.87 | winter 14 | פטיש סלעים | 0.8 km |
| 3 | מישור הלס ליד רביבים (`revivim_loess`) | 31.05, 34.7 | autumn 16 | מד גובה, מד גשם | 6.1 km |

Solver average 2.7 km (3★ ≤ 5). Constant pins average: ירושלים 73.2, מרכז הארץ 28.0, תל אביב 93.3, באר שבע 15.2 km (2★ needs ≤ 12).

Trap: קו הצחיחות (כ־200 מ״מ גשם בשנה) עובר בצפון הנגב, ליד באר שבע. סביבו אקלים ערבתי, ומדרום לו כבר אי אפשר לסמוך על חקלאות בעל.

Verified solution (solver, 2026-10-31): 1) מד גשם → pin 31.304, 34.803, 1.3 km off; 2) פטיש סלעים → pin 31.376, 34.878, 0.8 km off; 3) מד גובה + מד גשם → pin 31.104, 34.693, 6.1 km off. Average 2.7 km → 3★.

### 8. גרניט ושיטה

Charges: 5 · star radii 3★/2★/1★: 8 / 25 / 60 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | הרי אילת, נחל שלמה (`eilat_granite`) | 29.53, 34.9 | winter 11 | מד גובה | 5.9 km |
| 2 | חוף האלמוגים, אילת (`coral_beach`) | 29.5108, 34.925 | spring 9 | מד גובה | 3.5 km |
| 3 | שיטים בערבה ליד יטבתה (`yotvata_acacias`) | 29.86, 35.06 | summer 7 | מד גובה, מד גשם | 9.3 km |

Solver average 6.2 km (3★ ≤ 8). Constant pins average: ירושלים 240.0, מרכז הארץ 202.1, תל אביב 272.7, באר שבע 180.7 km (2★ needs ≤ 25).

Trap: לא כל מדבר נראה אותו דבר: בהרי אילת הסלע הוא גרניט, לא חולות ולא גיר. (העשרה: עצי השיטה בערוצים הם מהעצים המעטים שגדלים במדבר כזה.)

Verified solution (solver, 2026-10-31): 1) מד גובה → pin 29.577, 34.928, 5.9 km off; 2) מד גובה → pin 29.539, 34.940, 3.4 km off; 3) מד גובה + מד גשם → pin 29.940, 35.088, 9.3 km off. Average 6.2 km → 3★.

### 9. האגם

Charges: 6 · star radii 3★/2★/1★: 16 / 35 / 80 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | חוף הכנרת דרומית לטבריה (`kinneret_tiberias`) | 32.7681, 35.5511 | spring 7 | פטיש סלעים | 1.5 km |
| 2 | עמק בית שאן (`beit_shean_valley`) | 32.46, 35.5 | winter 12 | מגדיר צמחים, מד גובה | 4.0 km |
| 3 | צפון ים המלח (`kalya_north_dead_sea`) | 31.755, 35.495 | autumn 7 | מד גובה, מד גשם | 32.1 km |

Solver average 12.5 km (3★ ≤ 16). Constant pins average: ירושלים 72.9, מרכז הארץ 114.3, תל אביב 87.3, באר שבע 140.4 km (2★ needs ≤ 35).

Trap: גם הכנרת נמצאת מתחת לפני הים, אבל היא אגם של מים מתוקים. מד הגובה מבדיל בינה לבין ים המלח, הנמוך ממנה בכמאתיים מטרים.

Verified solution (solver, 2026-10-31): 1) פטיש סלעים → pin 32.783, 35.553, 1.7 km off; 2) מגדיר צמחים + מד גובה → pin 32.469, 35.541, 4.0 km off; 3) מד גובה + מד גשם → pin 31.466, 35.485, 32.1 km off. Average 12.6 km → 3★.

### 10. שתי עונות (transfer)

Charges: 8 · star radii 3★/2★/1★: 12 / 14 / 40 km · rule: `rain_shadow`

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | מדבר יהודה, המדרון המזרחי (`judean_desert_east`) | 31.8, 35.39 | winter 10 | פטיש סלעים, מד גשם | 14.4 km |
| 2 | מדבר יהודה, המדרון המזרחי (`judean_desert_east`) | 31.8, 35.39 | summer 10 | מד גובה, מד גשם | 4.7 km |
| 3 | המדרון המערבי של הרי יהודה (`judean_west_slope`) | 31.8, 35.08 | winter 10 | פטיש סלעים, מד גובה, מד גשם | 16.0 km |

Solver average 11.7 km (3★ ≤ 12). Constant pins average: ירושלים 14.9, מרכז הארץ 51.6, תל אביב 57.7, באר שבע 78.0 km (2★ needs ≤ 14).

Trap: מדבר יהודה נמצא בצל הגשם: העננים מגיעים ממערב ומורידים את הגשם על המדרון המערבי, ומזרחית לקו פרשת המים נשאר יבש.

Verified solution (solver, 2026-10-31): 1) פטיש סלעים + מד גשם → pin 31.671, 35.379, 14.4 km off; 2) מד גובה + מד גשם → pin 31.759, 35.379, 4.7 km off; 3) פטיש סלעים + מד גובה + מד גשם → pin 31.921, 35.171, 16.0 km off. Average 11.7 km → 3★.

## עולם 3 — צורות הנוף

### 11. השפה

Charges: 5 · star radii 3★/2★/1★: 5 / 15 / 50 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | שפת מכתש רמון (`ramon_rim`) | 30.6079, 34.8059 | autumn 16 | מד גשם | 7.8 km |
| 2 | קרקעית מכתש רמון (`ramon_floor_west`) | 30.585, 34.86 | winter 11 | מד גובה | 1.5 km |
| 3 | מזרח מכתש רמון (`ramon_floor_east`) | 30.59, 34.94 | spring 9 | פטיש סלעים, מד גובה | 2.3 km |

Solver average 3.9 km (3★ ≤ 5). Constant pins average: ירושלים 136.3, מרכז הארץ 95.6, תל אביב 165.4, באר שבע 73.4 km (2★ needs ≤ 15).

Trap: מכתש אינו בור של פגיעת מטאוריט: הוא נוצר משילוב של הרמת שכבות, סלע רך מתחתן ונחל אכזב שסחף אותו החוצה. אף אחד מהשלושה לבדו לא היה יוצר מכתש.

Verified solution (solver, 2026-10-31): 1) מד גשם → pin 30.601, 34.881, 7.2 km off; 2) מד גובה → pin 30.579, 34.874, 1.5 km off; 3) פטיש סלעים + מד גובה → pin 30.598, 34.918, 2.3 km off. Average 3.7 km → 3★.

### 12. נהר יבש

Charges: 6 · star radii 3★/2★/1★: 12 / 25 / 60 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | קניון עין עבדת (`ein_avdat_canyon`) | 30.833, 34.771 | winter 12 | מד גובה | 1.0 km |
| 2 | שבטה: טרסות וסכרים נבטיים (`shivta_dams`) | 30.88, 34.63 | winter 15 | מד גשם | 27.9 km |
| 3 | נחל פארן ליד הערבה (`paran_wadi`) | 30.364, 35.147 | autumn 9 | פטיש סלעים, מד גובה | 5.8 km |

Solver average 11.5 km (3★ ≤ 12). Constant pins average: ירושלים 128.9, מרכז הארץ 87.7, תל אביב 155.6, באר שבע 64.8 km (2★ needs ≤ 25).

Trap: ואדי הוא ערוץ יבש שזורמים בו מים רק אחרי גשם. הנבטים ניצלו את השטפונות האלה בתעלות ובסכרים.

Verified solution (solver, 2026-10-31): 1) מד גובה → pin 30.838, 34.779, 1.0 km off; 2) מד גשם → pin 30.670, 34.789, 27.9 km off; 3) פטיש סלעים + מד גובה → pin 30.332, 35.194, 5.8 km off. Average 11.5 km → 3★.

### 13. מצוק מול הים

Charges: 4 · star radii 3★/2★/1★: 6 / 15 / 40 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | מצוק הכורכר באפולוניה (הרצליה) (`apollonia_cliff`) | 32.196, 34.809 | winter 15 | פטיש סלעים | 4.0 km |
| 2 | חוף פלמחים (`palmachim_cliff`) | 31.933, 34.708 | summer 18 | פטיש סלעים | 1.5 km |
| 3 | חוף זיקים (`zikim_coast`) | 31.607, 34.51 | spring 10 | פטיש סלעים | 5.4 km |

Solver average 3.6 km (3★ ≤ 6). Constant pins average: ירושלים 61.8, מרכז הארץ 62.5, תל אביב 29.8, באר שבע 76.4 km (2★ needs ≤ 15).

Trap: החוף אינו סלעי בכל מקום: לאורך מישור החוף יש גם חולות וגם מצוקי כורכר, והמצוקים נשחקים מהר יותר כשהחול מפסיק להגיע.

Verified solution (solver, 2026-10-31): 1) פטיש סלעים → pin 32.230, 34.821, 4.0 km off; 2) פטיש סלעים → pin 31.922, 34.699, 1.5 km off; 3) פטיש סלעים → pin 31.564, 34.484, 5.4 km off. Average 3.6 km → 3★.

### 14. חורים באדמה

Charges: 3 · star radii 3★/2★/1★: 3 / 15 / 40 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | בולענים בחוף מינרל, ים המלח (`mineral_sinkholes`) | 31.5406, 35.3981 | spring 8 | מד גובה | 0.4 km |
| 2 | קרקעית המכתש הקטן (`makhtesh_katan`) | 30.96, 35.195 | autumn 15 | מד גובה | 0.4 km |

Solver average 0.4 km (3★ ≤ 3). Constant pins average: ירושלים 60.8, מרכז הארץ 51.4, תל אביב 107.2, באר שבע 58.2 km (2★ needs ≤ 15).

Trap: בולען אינו מכתש: הבולענים נוצרים בעיקר מהמסת שכבות מלח כשמפלס ים המלח יורד, והמכתש נוצר משילוב של הרמת שכבות, סלע רך ונחל שסחף אותו.

Verified solution (solver, 2026-10-31): 1) מד גובה → pin 31.543, 35.400, 0.3 km off; 2) מד גובה → pin 30.958, 35.191, 0.4 km off. Average 0.4 km → 3★.

### 15. גלויה לילית (transfer)

Charges: 2 · star radii 3★/2★/1★: 5 / 20 / 45 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | חולות חלוצה (`halutza_dunes`) | 31.03, 34.5 | summer 23 night | פטיש סלעים, מד גשם | 3.7 km |

Solver average 3.7 km (3★ ≤ 5). Constant pins average: ירושלים 108.6, מרכז הארץ 63.3, תל אביב 119.7, באר שבע 36.9 km (2★ needs ≤ 20).

Trap: לא כל חול הוא חוף, והנגב אינו כולו חולות: כאן החול רחוק מהים, והגשם המעט מראה שזה מדבר.

Verified solution (solver, 2026-10-31): 1) פטיש סלעים + מד גשם → pin 31.051, 34.471, 3.7 km off. Average 3.7 km → 3★.

## עולם 4 — הפסיפס האנושי

### 16. מדרון אחד, הרבה אמונות

Charges: 3 · star radii 3★/2★/1★: 5 / 20 / 60 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | העיר העתיקה בנצרת (`nazareth_old_city`) | 32.704, 35.299 | spring 10 | free looks only | 0.2 km |
| 2 | העיר העתיקה בירושלים, ליד שער יפו (`jerusalem_old_city`) | 31.777, 35.228 | autumn 9 | מד גובה | 2.5 km |
| 3 | העיר העתיקה בעכו (`akko_old_city`) | 32.921, 35.069 | summer 18 | מד גובה | 1.7 km |

Solver average 1.5 km (3★ ≤ 5). Constant pins average: ירושלים 77.3, מרכז הארץ 117.4, תל אביב 78.7, באר שבע 142.7 km (2★ needs ≤ 20).

Trap: נוף תרבותי מספר את סיפור המקום: הדת, ההיסטוריה והכלכלה. כאן הבניינים הם הרמז, אבל הגובה והגשם מאשרים אותו.

Verified solution (solver, 2026-10-31): 1) looking only → pin 32.702, 35.298, 0.2 km off; 2) מד גובה → pin 31.770, 35.203, 2.5 km off; 3) מד גובה → pin 32.920, 35.088, 1.7 km off. Average 1.5 km → 3★.

### 17. זכוכית או אבן

Charges: 7 · star radii 3★/2★/1★: 9 / 25 / 60 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | רחוב מגדלי זכוכית בתל אביב (`tel_aviv_towers`) | 32.075, 34.792 | summer 12 | פטיש סלעים | 2.9 km |
| 2 | רחוב אבן ברחביה, ירושלים (`jerusalem_stone_street`) | 31.774, 35.213 | winter 15 | מד גובה, מצלמת עפיפון | 1.0 km |
| 3 | שכונה צפופה בבת ים (`bat_yam_dense`) | 32.017, 34.748 | autumn 17 | מצלמת עפיפון | 28.8 km |
| 4 | ירוחם (`yeruham_town`) | 30.988, 34.929 | spring 9 | מד גובה, מצלמת עפיפון | 1.8 km |

Solver average 8.6 km (3★ ≤ 9). Constant pins average: ירושלים 50.3, מרכז הארץ 58.0, תל אביב 46.1, באר שבע 70.0 km (2★ needs ≤ 25).

Trap: נוף גלובלי לא מספר איפה אתה: מגדלי זכוכית ורשתות נראים אותו דבר בכל מקום, ולכן רמזי הטבע מכריעים.

Verified solution (solver, 2026-10-31): 1) פטיש סלעים → pin 32.101, 34.792, 2.9 km off; 2) מד גובה + מצלמת עפיפון → pin 31.770, 35.203, 1.0 km off; 3) מצלמת עפיפון → pin 31.776, 34.637, 28.8 km off; 4) מד גובה + מצלמת עפיפון → pin 30.973, 34.933, 1.8 km off. Average 8.6 km → 3★.

### 18. הקפיצה האחרונה של יעלי (no hints)

Charges: 8 · star radii 3★/2★/1★: 7 / 20 / 60 km

| # | Place (id) | Lat, lon | Season / hour | Intended tools | Solver miss |
|---|---|---|---|---|---|
| 1 | שדות עמק יזרעאל (`jezreel_fields`) | 32.62, 35.3 | spring 9 | פטיש סלעים, מגדיר צמחים | 3.4 km |
| 2 | ערד (`arad_town`) | 31.259, 35.213 | autumn 16 | מד גשם, מצלמת עפיפון | 5.3 km |
| 3 | חולות אשדוד ים (`ashdod_yam_dunes`) | 31.772, 34.625 | winter 14 | מד גשם | 11.0 km |
| 4 | קרקעית המכתש הגדול (`makhtesh_gadol`) | 30.925, 34.99 | summer 7 | מד גובה | 4.3 km |
| 5 | גבעות הקירטון של בית גוברין (`beit_guvrin_chalk`) | 31.615, 34.895 | spring 15 | פטיש סלעים, מד גובה | 7.6 km |

Solver average 6.3 km (3★ ≤ 7). Constant pins average: ירושלים 68.8, מרכז הארץ 58.4, תל אביב 79.5, באר שבע 68.5 km (2★ needs ≤ 20).

Trap: כל מקום הוא מערכת נוף: סלע, גובה, גשם וצומח ביחד. רמז אחד לבדו מטעה, כמה רמזים יחד מכריעים.

Verified solution (solver, 2026-10-31): 1) פטיש סלעים + מגדיר צמחים → pin 32.603, 35.269, 3.4 km off; 2) מד גשם + מצלמת עפיפון → pin 31.224, 35.176, 5.3 km off; 3) מד גשם → pin 31.682, 34.575, 11.0 km off; 4) מד גובה → pin 30.890, 35.010, 4.3 km off; 5) פטיש סלעים + מד גובה → pin 31.590, 34.970, 7.6 km off. Average 6.3 km → 3★.
