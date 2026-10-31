// The authoritative simplified geography of Israel used by the solver, the field
// tools and the reveal overlay. Pure data: no imports except types.
//
// Physical geography only: these polygons are landscape zones, never political
// borders. Polygons are [lon, lat], 6–25 vertices, coarse but correct at the
// ~1–2 km scale. Coastline accuracy is not needed: the sea is masked by the relief.
//
// Lookup rule (see src/model/world.ts): later entries override earlier ones.
//   ROCK_ZONES: base rock on land = limestone (גיר).
//   BELT_ZONES: the mountain belt is a coarse base polygon; the Negev, the coastal
//               plain, the rift segments, the Golan and the Hermon override it.
//
// Sources: Workbook grade-9/chapter-2/landform-belts and grade-8/chapter-4/rocks-minerals
// and grade-8/chapter-5/landforms (which rock and which landform where); the 1:200,000
// Geological Map of Israel (Geological Survey of Israel) for the shape of the basalt,
// granite, loess, sand and chalk areas; vertices checked against the bundled SRTM relief
// (public/terrain/israel.bin) for the coastline, the rift escarpments and the makhtesh rims.
import type { Rock, Belt, Landform, CultureSign } from '../model/types';

export type LonLat = [number, number];

/* ------------------------------------------------------------------ rock */

export const ROCK_ZONES: { rock: Rock; nameHe: string; poly: LonLat[] }[] = [
  {
    // Inner coastal plain: kurkar ridges and the red sandy soils between them.
    rock: 'kurkar',
    nameHe: 'מישור החוף הדרומי: כורכר וחמרה',
    poly: [[34.745, 32.05], [34.945, 32.05], [34.95, 32.0], [34.88, 31.85], [34.83, 31.75], [34.78, 31.6], [34.72, 31.45], [34.62, 31.38], [34.4, 31.3], [34.25, 31.22], [34.12, 31.22], [34.18, 31.3], [34.3, 31.4], [34.4, 31.5], [34.487, 31.6], [34.565, 31.7], [34.625, 31.8], [34.68, 31.9], [34.725, 32.0]],
  },
  {
    rock: 'kurkar',
    nameHe: 'השרון וחוף הכרמל: רכסי כורכר',
    poly: [[34.745, 32.05], [34.945, 32.05], [34.98, 32.15], [35.03, 32.3], [35.06, 32.45], [34.955, 32.55], [34.965, 32.65], [34.968, 32.75], [34.962, 32.8], [34.95, 32.8], [34.925, 32.7], [34.91, 32.6], [34.887, 32.5], [34.857, 32.4], [34.832, 32.3], [34.802, 32.2], [34.77, 32.1]],
  },
  {
    rock: 'kurkar',
    nameHe: 'מפרץ חיפה ומישור עכו',
    poly: [[34.95, 32.8], [34.962, 32.8], [34.975, 32.825], [35.01, 32.815], [35.05, 32.8], [35.1, 32.77], [35.17, 32.85], [35.15, 32.93], [35.15, 33.03], [35.11, 33.1], [35.1, 33.12], [35.1, 33.1], [35.083, 33.0], [35.08, 32.9], [35.065, 32.86], [35.05, 32.835], [35.0, 32.822], [34.955, 32.84]],
  },
  {
    // Northern Negev: Be'er Sheva basin and the Arad plain (landforms module: "הנגב הצפוני מכוסה בחלקו שכבות עבות של לס").
    rock: 'loess',
    nameHe: 'מישורי הלס של צפון הנגב',
    poly: [
      [34.45, 31.25], [34.55, 31.4], [34.85, 31.42], [35.0, 31.36], [35.18, 31.31], [35.22, 31.22],
      [35.05, 31.1], [34.85, 31.0], [34.7, 30.98], [34.55, 31.1],
    ],
  },
  {
    rock: 'chalk',
    nameHe: 'גבעות הקירטון של השפלה',
    poly: [
      [34.83, 31.9], [34.98, 31.9], [34.985, 31.75], [34.97, 31.6], [34.975, 31.45], [34.94, 31.35],
      [34.83, 31.35], [34.8, 31.5], [34.82, 31.7],
    ],
  },
  {
    // East of the watershed: soft chalk hills of the rain shadow.
    rock: 'chalk',
    nameHe: 'מדבר יהודה: גבעות קירטון',
    poly: [
      [35.245, 31.92], [35.41, 31.92], [35.4, 31.75], [35.385, 31.6], [35.37, 31.45], [35.345, 31.33],
      [35.21, 31.33], [35.19, 31.45], [35.2, 31.6], [35.235, 31.75],
    ],
  },
  {
    rock: 'chalk',
    nameHe: 'רמת עבדת: קירטון וגיר',
    poly: [[34.72, 30.9], [34.83, 30.9], [34.84, 30.8], [34.8, 30.76], [34.73, 30.76], [34.7, 30.82]],
  },
  {
    rock: 'sand',
    nameHe: 'חולות החוף הדרומי',
    poly: [
      [34.765, 32.03], [34.735, 31.93], [34.705, 31.85], [34.675, 31.78], [34.64, 31.72], [34.585, 31.65],
      [34.53, 31.55], [34.45, 31.45], [34.36, 31.35], [34.28, 31.25], [34.13, 31.25], [34.18, 31.3],
      [34.3, 31.4], [34.4, 31.5], [34.487, 31.6], [34.565, 31.7], [34.625, 31.8], [34.68, 31.9], [34.725, 32.0], [34.74, 32.03],
    ],
  },
  {
    rock: 'sand',
    nameHe: 'חולות חדרה–קיסריה',
    poly: [[34.87, 32.42], [34.89, 32.42], [34.9, 32.47], [34.905, 32.53], [34.89, 32.53], [34.86, 32.47]],
  },
  {
    rock: 'sand',
    nameHe: 'חולות מפרץ חיפה',
    poly: [[35.03, 32.8], [35.06, 32.81], [35.085, 32.86], [35.085, 32.92], [35.065, 32.92], [35.05, 32.86], [35.02, 32.82]],
  },
  {
    // Western Negev sands (Halutza, Agur): dunes that are NOT on the coast.
    rock: 'sand',
    nameHe: 'חולות חלוצה ועגור',
    poly: [[34.35, 31.2], [34.55, 31.17], [34.67, 31.09], [34.62, 30.92], [34.45, 30.85], [34.3, 30.95]],
  },
  {
    // Arava floor: alluvial sand and gravel (the hammer reports the nearest Workbook term, חול).
    rock: 'sand',
    nameHe: 'מילוי הערבה: חול וחצץ',
    poly: [
      [35.29, 31.0], [35.2, 30.85], [35.16, 30.7], [35.12, 30.55], [35.1, 30.4], [35.1, 30.25],
      [35.05, 29.95], [34.97, 29.8], [34.96, 29.62], [35.06, 29.62], [35.1, 29.8], [35.17, 29.95],
      [35.25, 30.1], [35.3, 30.25], [35.35, 30.4], [35.42, 30.55], [35.42, 30.7], [35.48, 30.85], [35.52, 31.0],
    ],
  },
  {
    // Golan basalt (rocks-minerals: "רמת הגולן בנויה בעיקר בזלת"); the Hermon to the north stays limestone.
    rock: 'basalt',
    nameHe: 'רמת הגולן: בזלת',
    poly: [
      [35.655, 33.21], [35.66, 33.1], [35.645, 32.95], [35.655, 32.85], [35.65, 32.75], [35.68, 32.7],
      [35.8, 32.7], [35.9, 32.72], [35.95, 32.8], [35.95, 33.0], [35.9, 33.15], [35.84, 33.22], [35.72, 33.22],
    ],
  },
  {
    rock: 'basalt',
    nameHe: 'רמת כורזים ורמת דלתון: בזלת',
    poly: [[35.46, 33.06], [35.53, 33.06], [35.54, 33.0], [35.62, 32.99], [35.645, 32.89], [35.6, 32.88], [35.55, 32.9], [35.47, 33.0]],
  },
  {
    rock: 'basalt',
    nameHe: 'מזרח הגליל התחתון: בזלת',
    poly: [
      [35.42, 32.82], [35.53, 32.82], [35.555, 32.78], [35.56, 32.72], [35.56, 32.6], [35.52, 32.55],
      [35.45, 32.58], [35.41, 32.66], [35.42, 32.72],
    ],
  },
  {
    // Eilat mountains: ancient granite (rocks-minerals: "סלעי יסוד עתיקים מאוד (גרניט ודיוריט) ליד אילת").
    rock: 'granite',
    nameHe: 'הרי אילת: גרניט',
    poly: [[34.86, 29.48], [34.935, 29.48], [34.955, 29.56], [34.96, 29.62], [34.94, 29.7], [34.88, 29.7], [34.85, 29.6]],
  },
  {
    // Makhtesh floors: soft sandstone exposed under the hard rim (landforms: "שכבות רכות יותר כמו אבן חול וחרסית").
    rock: 'sandstone',
    nameHe: 'קרקעית מכתש רמון',
    poly: [
      [34.68, 30.545], [34.72, 30.575], [34.78, 30.59], [34.83, 30.615], [34.88, 30.635], [34.95, 30.62],
      [35.01, 30.6], [35.0, 30.555], [34.94, 30.545], [34.88, 30.515], [34.83, 30.52], [34.78, 30.545],
      [34.72, 30.53], [34.68, 30.525],
    ],
  },
  {
    rock: 'sandstone',
    nameHe: 'קרקעית המכתש הגדול',
    poly: [[34.95, 30.91], [34.98, 30.935], [35.04, 30.95], [35.08, 30.945], [35.075, 30.92], [35.03, 30.905], [34.97, 30.895]],
  },
  {
    rock: 'sandstone',
    nameHe: 'קרקעית המכתש הקטן',
    poly: [[35.168, 30.95], [35.18, 30.975], [35.2, 30.983], [35.214, 30.97], [35.212, 30.945], [35.195, 30.935], [35.175, 30.938]],
  },
  {
    // Rift fill from south of the Kinneret to the Sodom basin: Lisan marl, gypsum and salt.
    rock: 'marl_salt',
    nameHe: 'הבקע: חוואר הלשון ומלח',
    poly: [
      [35.545, 32.68], [35.53, 32.62], [35.44, 32.55], [35.44, 32.45], [35.48, 32.3], [35.44, 32.1],
      [35.41, 31.9], [35.405, 31.75], [35.385, 31.6], [35.375, 31.45], [35.355, 31.3], [35.34, 31.15],
      [35.3, 31.0], [35.52, 31.0], [35.55, 31.15], [35.58, 31.3], [35.65, 31.45], [35.57, 31.6],
      [35.62, 31.75], [35.7, 31.85], [35.62, 32.0], [35.63, 32.15], [35.62, 32.45], [35.62, 32.68],
    ],
  },
];

/* ------------------------------------------------------------------ belts */

export const BELT_ZONES: { belt: Belt; nameHe: string; poly: LonLat[] }[] = [
  {
    // Coarse base: the mountain ridge from the Galilee through Samaria and Judea, with the
    // Carmel, the inner valleys, the Shephelah foothills and the Judean Desert (the ridge's
    // eastern slope). The belts below cut it back to the right shape.
    belt: 'mountain',
    nameHe: 'אזור ההר',
    poly: [[34.7, 31.3], [35.45, 31.25], [35.6, 32.0], [35.7, 32.6], [35.7, 33.32], [35.1, 33.32], [34.9, 32.5], [34.7, 31.6]],
  },
  {
    // The Negev: Be'er Sheva basin, the Negev highlands with the makhteshim, the Eilat mountains.
    belt: 'negev',
    nameHe: 'הנגב',
    poly: [
      [34.25, 31.22], [34.4, 31.3], [34.62, 31.38], [34.72, 31.45], [34.78, 31.4], [34.92, 31.33],
      [35.05, 31.33], [35.2, 31.33], [35.34, 31.26], [35.4, 31.0], [35.33, 30.85], [35.29, 30.7],
      [35.27, 30.55], [35.2, 30.25], [35.1, 29.95], [35.0, 29.65], [34.97, 29.45], [34.6, 29.8], [34.3, 30.6],
    ],
  },
  {
    belt: 'coastal_plain',
    nameHe: 'מישור החוף הדרומי',
    poly: [[34.745, 32.05], [34.945, 32.05], [34.95, 32.0], [34.88, 31.85], [34.83, 31.75], [34.78, 31.6], [34.72, 31.45], [34.62, 31.38], [34.4, 31.3], [34.25, 31.22], [34.12, 31.22], [34.18, 31.3], [34.3, 31.4], [34.4, 31.5], [34.487, 31.6], [34.565, 31.7], [34.625, 31.8], [34.68, 31.9], [34.725, 32.0]],
  },
  {
    belt: 'coastal_plain',
    nameHe: 'מישור החוף: השרון וחוף הכרמל',
    poly: [[34.745, 32.05], [34.945, 32.05], [34.98, 32.15], [35.03, 32.3], [35.06, 32.45], [34.955, 32.55], [34.965, 32.65], [34.968, 32.75], [34.962, 32.8], [34.95, 32.8], [34.925, 32.7], [34.91, 32.6], [34.887, 32.5], [34.857, 32.4], [34.832, 32.3], [34.802, 32.2], [34.77, 32.1]],
  },
  {
    belt: 'coastal_plain',
    nameHe: 'מישור החוף: מפרץ חיפה ומישור עכו',
    poly: [[34.95, 32.8], [34.962, 32.8], [34.975, 32.825], [35.01, 32.815], [35.05, 32.8], [35.1, 32.77], [35.17, 32.85], [35.15, 32.93], [35.15, 33.03], [35.11, 33.1], [35.1, 33.12], [35.1, 33.1], [35.083, 33.0], [35.08, 32.9], [35.065, 32.86], [35.05, 32.835], [35.0, 32.822], [34.955, 32.84]],
  },
  {
    belt: 'rift',
    nameHe: 'הבקע: עמק החולה',
    poly: [[35.565, 33.3], [35.665, 33.3], [35.66, 33.15], [35.64, 33.03], [35.64, 32.97], [35.6, 32.97], [35.56, 33.03], [35.56, 33.15]],
  },
  {
    belt: 'rift',
    nameHe: 'הבקע: הכנרת',
    poly: [[35.55, 32.93], [35.64, 32.93], [35.655, 32.85], [35.645, 32.75], [35.63, 32.66], [35.52, 32.66], [35.52, 32.8], [35.505, 32.88]],
  },
  {
    belt: 'rift',
    nameHe: 'הבקע: עמק בית שאן ובקעת הירדן',
    poly: [
      [35.52, 32.66], [35.63, 32.66], [35.62, 32.45], [35.62, 32.3], [35.63, 32.15], [35.62, 32.0],
      [35.7, 31.85], [35.62, 31.77], [35.41, 31.77], [35.41, 31.9], [35.44, 32.1], [35.48, 32.3],
      [35.44, 32.45], [35.42, 32.55],
    ],
  },
  {
    belt: 'rift',
    nameHe: 'הבקע: ים המלח',
    poly: [
      [35.41, 31.77], [35.62, 31.77], [35.57, 31.6], [35.65, 31.45], [35.58, 31.3], [35.55, 31.15],
      [35.52, 31.0], [35.29, 31.0], [35.34, 31.15], [35.35, 31.3], [35.375, 31.45], [35.39, 31.6],
    ],
  },
  {
    belt: 'rift',
    nameHe: 'הבקע: הערבה ומפרץ אילת',
    poly: [
      [35.29, 31.0], [35.52, 31.0], [35.48, 30.85], [35.42, 30.7], [35.42, 30.55], [35.35, 30.4],
      [35.3, 30.25], [35.25, 30.1], [35.17, 29.95], [35.1, 29.8], [35.06, 29.65], [35.03, 29.45],
      [34.88, 29.45], [34.955, 29.56], [34.96, 29.65], [34.96, 29.8], [35.05, 29.95], [35.1, 30.25],
      [35.1, 30.4], [35.12, 30.55], [35.16, 30.7], [35.2, 30.85],
    ],
  },
  {
    // Not one of the three belts: landform-belts says the basalt Golan "נלווית אליהן בפינה הצפונית מזרחית".
    belt: 'golan',
    nameHe: 'רמת הגולן',
    poly: [
      [35.655, 33.21], [35.66, 33.1], [35.645, 32.95], [35.655, 32.85], [35.65, 32.75], [35.68, 32.7],
      [35.8, 32.7], [35.9, 32.72], [35.95, 32.8], [35.95, 33.0], [35.9, 33.15], [35.84, 33.22], [35.72, 33.22],
    ],
  },
  {
    // The Hermon: a limestone mountain block, grouped with the mountain belt here.
    belt: 'mountain',
    nameHe: 'החרמון',
    poly: [[35.62, 33.3], [35.665, 33.24], [35.72, 33.22], [35.84, 33.22], [35.92, 33.3], [35.95, 33.45], [35.75, 33.45], [35.62, 33.38]],
  },
];

/* ------------------------------------------------------------------ rain */

// IMS long-term yearly averages, multi-year average 1991–2020, as tabulated per station in
// the Israel Meteorological Service season summary 2021/22 ("סיכום עונת הגשמים 2021/22",
// station table "כמויות הגשם החודשיות והשנתיות", column "ממוצע רב שנתי").
// Coordinates converted from the table's Israel TM Grid (ITM) to WGS84.
const IMS = (id: string) =>
  `IMS normal 1991–2020, station ${id} (season summary 2021/22, https://ims.gov.il/sites/default/files/2022-09/סיכום עונת 2021_2022.pdf)`;

export const RAIN_STATIONS: { nameHe: string; lat: number; lon: number; mm: number; source: string }[] = [
  { nameHe: 'נהריה', lat: 33.0166, lon: 35.0982, mm: 615, source: IMS('110390') },
  { nameHe: 'עכו', lat: 32.9309, lon: 35.1005, mm: 586, source: IMS('110695') },
  { nameHe: 'חיפה נמל', lat: 32.8217, lon: 34.9970, mm: 566, source: IMS('120202') },
  { nameHe: 'עתלית', lat: 32.7053, lon: 34.9376, mm: 538, source: IMS('120900') },
  { nameHe: 'נחל תנינים', lat: 32.5456, lon: 34.9157, mm: 532, source: IMS('121870') },
  { nameHe: 'בית ינאי', lat: 32.3787, lon: 34.8631, mm: 501, source: IMS('131645') },
  { nameHe: 'געש', lat: 32.2270, lon: 34.8202, mm: 542, source: IMS('133649') },
  { nameHe: 'הרצליה', lat: 32.1702, lon: 34.8151, mm: 534, source: IMS('134110') },
  { nameHe: 'בית דגן', lat: 32.0061, lon: 34.8126, mm: 541, source: IMS('136739') },
  { nameHe: 'מקווה ישראל', lat: 32.0312, lon: 34.7829, mm: 522, source: IMS('136650') },
  { nameHe: 'פלמחים', lat: 31.9335, lon: 34.7040, mm: 474, source: IMS('137350') },
  { nameHe: 'ניר גלים', lat: 31.8252, lon: 34.6814, mm: 504, source: IMS('140050') },
  { nameHe: 'ניצנים', lat: 31.7186, lon: 34.6345, mm: 505, source: IMS('140900') },
  { nameHe: 'אשקלון', lat: 31.6633, lon: 34.5694, mm: 455, source: IMS('141625') },
  { nameHe: 'זיקים', lat: 31.6072, lon: 34.5235, mm: 447, source: IMS('142600') },
  { nameHe: 'נחל עוז', lat: 31.4708, lon: 34.4992, mm: 420, source: IMS('143952') },
  { nameHe: 'כיסופים', lat: 31.3746, lon: 34.3948, mm: 324, source: IMS('144604') },
  { nameHe: 'מגן', lat: 31.3000, lon: 34.4238, mm: 255, source: IMS('144800') },
  { nameHe: 'תלמי יוסף', lat: 31.1995, lon: 34.3648, mm: 163, source: IMS('144960') },
  { nameHe: 'קדימה', lat: 32.2805, lon: 34.9165, mm: 618, source: IMS('132905') },
  { nameHe: 'ראש העין', lat: 32.1020, lon: 34.9235, mm: 565, source: IMS('135160') },
  { nameHe: 'רחובות', lat: 31.8915, lon: 34.8025, mm: 536, source: IMS('138120') },
  { nameHe: 'גת', lat: 31.6290, lon: 34.7900, mm: 425, source: IMS('142302') },
  { nameHe: 'בית גוברין', lat: 31.6131, lon: 34.8923, mm: 404, source: IMS('247550') },
  { nameHe: 'צרעה', lat: 31.7603, lon: 34.9657, mm: 511, source: IMS('245500') },
  { nameHe: 'לטרון', lat: 31.8315, lon: 34.9792, mm: 519, source: IMS('242951') },
  { nameHe: 'אליאב', lat: 31.5284, lon: 34.9294, mm: 397, source: IMS('248010') },
  { nameHe: 'דורות', lat: 31.5058, lon: 34.6463, mm: 394, source: IMS('250151') },
  { nameHe: 'בית קמה', lat: 31.4459, lon: 34.7613, mm: 310, source: IMS('250398') },
  { nameHe: 'שובל', lat: 31.4133, lon: 34.7446, mm: 288, source: IMS('250600') },
  { nameHe: 'להב', lat: 31.3804, lon: 34.8720, mm: 301, source: IMS('248396') },
  { nameHe: 'אשל הנשיא', lat: 31.3239, lon: 34.6978, mm: 225, source: IMS('251451') },
  { nameHe: 'אורים', lat: 31.3041, lon: 34.5183, mm: 211, source: IMS('251550') },
  { nameHe: 'עומר', lat: 31.2730, lon: 34.8482, mm: 222, source: IMS('251599') },
  { nameHe: 'באר שבע', lat: 31.2503, lon: 34.7979, mm: 192, source: IMS('251691') },
  { nameHe: 'צאלים', lat: 31.2059, lon: 34.5305, mm: 150, source: IMS('252296') },
  { nameHe: 'נתיב הל״ה', lat: 31.6890, lon: 34.9732, mm: 452, source: IMS('247002') },
  { nameHe: 'נחושה', lat: 31.6313, lon: 34.9502, mm: 423, source: IMS('247420') },
  { nameHe: 'אפרת', lat: 31.6513, lon: 35.1504, mm: 567, source: IMS('247220') },
  { nameHe: 'טנא עומרים', lat: 31.3715, lon: 34.9540, mm: 301, source: IMS('248480') },
  { nameHe: 'שני', lat: 31.3564, lon: 35.0655, mm: 262, source: IMS('251011') },
  { nameHe: 'נבטים', lat: 31.2046, lon: 34.9219, mm: 134, source: IMS('252305') },
  { nameHe: 'ערד', lat: 31.2491, lon: 35.1843, mm: 135, source: IMS('251569') },
  { nameHe: 'מיתר', lat: 31.3318, lon: 34.9426, mm: 260, source: IMS('251120') },
  { nameHe: 'סוסיא', lat: 31.3898, lon: 35.1096, mm: 306, source: IMS('248375') },
  { nameHe: 'כרמל (הר חברון)', lat: 31.4286, lon: 35.1832, mm: 246, source: IMS('248360') },
  { nameHe: 'רביבים', lat: 31.0462, lon: 34.7192, mm: 98, source: IMS('252506') },
  { nameHe: 'אשלים', lat: 30.9821, lon: 34.7069, mm: 83, source: IMS('252730') },
  { nameHe: 'שדה בוקר', lat: 30.8696, lon: 34.7943, mm: 87, source: IMS('253000') },
  { nameHe: 'עבדת', lat: 30.7866, lon: 34.7696, mm: 84, source: IMS('253052') },
  { nameHe: 'עזוז', lat: 30.7906, lon: 34.4708, mm: 80, source: IMS('253745') },
  { nameHe: 'מצפה רמון', lat: 30.6090, lon: 34.8038, mm: 70, source: IMS('256003') },
  { nameHe: 'צומת הנגב', lat: 31.0700, lon: 34.8500, mm: 116, source: IMS('252428') },
  { nameHe: 'חצבה', lat: 30.7783, lon: 35.2387, mm: 39, source: IMS('340528') },
  { nameHe: 'פארן', lat: 30.3643, lon: 35.1470, mm: 34, source: IMS('342507') },
  { nameHe: 'יטבתה', lat: 29.8843, lon: 35.0758, mm: 27, source: IMS('345006') },
  { nameHe: 'תמנע', lat: 29.7272, lon: 35.0047, mm: 25, source: IMS('345903') },
  { nameHe: 'אילת', lat: 29.5521, lon: 34.9514, mm: 22, source: IMS('347702') },
  { nameHe: 'נאות סמדר', lat: 30.0475, lon: 35.0228, mm: 30, source: IMS('259132') },
  { nameHe: 'סדום', lat: 31.0298, lon: 35.3906, mm: 39, source: IMS('337001') },
  { nameHe: 'עין גדי', lat: 31.4194, lon: 35.3861, mm: 49, source: IMS('331210') },
  { nameHe: 'מצוקי דרגות', lat: 31.5872, lon: 35.3907, mm: 72, source: IMS('330810') },
  { nameHe: 'עינות צוקים', lat: 31.7161, lon: 35.4500, mm: 90, source: IMS('330455') },
  { nameHe: 'אלמוג', lat: 31.7593, lon: 35.4913, mm: 94, source: IMS('330381') },
  { nameHe: 'מצפה יריחו', lat: 31.8117, lon: 35.3932, mm: 133, source: IMS('243331') },
  { nameHe: 'כפר אדומים', lat: 31.8235, lon: 35.3288, mm: 230, source: IMS('243021') },
  { nameHe: 'מעלה אדומים', lat: 31.7767, lon: 35.2992, mm: 276, source: IMS('245463') },
  { nameHe: 'מעלה עמוס', lat: 31.5963, lon: 35.2284, mm: 276, source: IMS('247881') },
  { nameHe: 'ירושלים מרכז', lat: 31.7794, lon: 35.2200, mm: 522, source: IMS('244731') },
  { nameHe: 'צובה', lat: 31.7866, lon: 35.1250, mm: 656, source: IMS('244354') },
  { nameHe: 'קריית ענבים', lat: 31.8092, lon: 35.1187, mm: 658, source: IMS('243501') },
  { nameHe: 'רמת רזיאל', lat: 31.7748, lon: 35.0691, mm: 656, source: IMS('245005') },
  { nameHe: 'כפר עציון', lat: 31.6495, lon: 35.1135, mm: 531, source: IMS('247370') },
  { nameHe: 'בית ג׳מאל', lat: 31.7242, lon: 34.9752, mm: 506, source: IMS('246550') },
  { nameHe: 'מעלה החמישה', lat: 31.8182, lon: 35.1102, mm: 655, source: IMS('243310') },
  { nameHe: 'הר ברכה', lat: 32.1942, lon: 35.2625, mm: 627, source: IMS('241145') },
  { nameHe: 'בית אל', lat: 31.9390, lon: 35.2190, mm: 651, source: IMS('241985') },
  { nameHe: 'קדומים', lat: 32.2123, lon: 35.1575, mm: 642, source: IMS('241135') },
  { nameHe: 'גיתית', lat: 32.1012, lon: 35.3949, mm: 402, source: IMS('241296') },
  { nameHe: 'כוכב השחר', lat: 31.9597, lon: 35.3470, mm: 357, source: IMS('241861') },
  { nameHe: 'טלמון', lat: 31.9381, lon: 35.1291, mm: 648, source: IMS('242010') },
  { nameHe: 'גלגל', lat: 31.9965, lon: 35.4497, mm: 171, source: IMS('323402') },
  { nameHe: 'ארגמן', lat: 32.1731, lon: 35.5233, mm: 232, source: IMS('322651') },
  { nameHe: 'מחולה', lat: 32.3643, lon: 35.5145, mm: 280, source: IMS('322102') },
  { nameHe: 'טירת צבי', lat: 32.4211, lon: 35.5242, mm: 271, source: IMS('321850') },
  { nameHe: 'שלוחות', lat: 32.4708, lon: 35.4765, mm: 325, source: IMS('230950') },
  { nameHe: 'חמדיה', lat: 32.5194, lon: 35.5192, mm: 318, source: IMS('230601') },
  { nameHe: 'בית אלפא', lat: 32.5151, lon: 35.4309, mm: 407, source: IMS('230703') },
  { nameHe: 'מעלה גלבוע', lat: 32.4736, lon: 35.4201, mm: 402, source: IMS('240082') },
  { nameHe: 'נווה אור', lat: 32.5869, lon: 35.5514, mm: 388, source: IMS('321301') },
  { nameHe: 'עפולה', lat: 32.5955, lon: 35.2756, mm: 450, source: IMS('221604') },
  { nameHe: 'רמת דוד', lat: 32.6785, lon: 35.1989, mm: 535, source: IMS('220350') },
  { nameHe: 'מגידו', lat: 32.5856, lon: 35.1850, mm: 591, source: IMS('221705') },
  { nameHe: 'הושעיה', lat: 32.7569, lon: 35.2970, mm: 572, source: IMS('213894') },
  { nameHe: 'תמרה (עמק יזרעאל)', lat: 32.7055, lon: 35.2202, mm: 565, source: IMS('215051') },
  { nameHe: 'מזרע', lat: 32.6487, lon: 35.2852, mm: 521, source: IMS('220850') },
  { nameHe: 'תבור כדורי', lat: 32.7045, lon: 35.4058, mm: 527, source: IMS('215403') },
  { nameHe: 'גזית', lat: 32.6350, lon: 35.4461, mm: 472, source: IMS('216101') },
  { nameHe: 'עילבון', lat: 32.8334, lon: 35.3986, mm: 558, source: IMS('213201') },
  { nameHe: 'לביא', lat: 32.7874, lon: 35.4390, mm: 509, source: IMS('213598') },
  { nameHe: 'פארק הכרמל', lat: 32.7361, lon: 35.0346, mm: 737, source: IMS('120770') },
  { nameHe: 'דלית אל-כרמל', lat: 32.6937, lon: 35.0400, mm: 796, source: IMS('121030') },
  { nameHe: 'כרם מהר״ל', lat: 32.6468, lon: 34.9889, mm: 634, source: IMS('121142') },
  { nameHe: 'מצפה (כנרת)', lat: 32.7899, lon: 35.5106, mm: 452, source: IMS('213652') },
  { nameHe: 'מנורים', lat: 32.7628, lon: 35.5329, mm: 426, source: IMS('213881') },
  { nameHe: 'גינוסר', lat: 32.8494, lon: 35.5236, mm: 447, source: IMS('320099') },
  { nameHe: 'כפר נחום', lat: 32.8826, lon: 35.5782, mm: 443, source: IMS('311655') },
  { nameHe: 'דגניה א׳', lat: 32.7086, lon: 35.5732, mm: 385, source: IMS('320502') },
  { nameHe: 'האון', lat: 32.7265, lon: 35.6234, mm: 379, source: IMS('320350') },
  { nameHe: 'כוכב הירדן', lat: 32.5942, lon: 35.5174, mm: 440, source: IMS('216255') },
  { nameHe: 'יבנאל', lat: 32.7025, lon: 35.5039, mm: 455, source: IMS('215452') },
  { nameHe: 'מירון', lat: 32.9894, lon: 35.4353, mm: 881, source: IMS('211605') },
  { nameHe: 'צפת הר כנען', lat: 32.9793, lon: 35.5059, mm: 688, source: IMS('211900') },
  { nameHe: 'חורפיש', lat: 33.0184, lon: 35.3455, mm: 885, source: IMS('211251') },
  { nameHe: 'יחיעם', lat: 32.9950, lon: 35.2288, mm: 829, source: IMS('211350') },
  { nameHe: 'אילון', lat: 33.0644, lon: 35.2160, mm: 805, source: IMS('210748') },
  { nameHe: 'ברעם', lat: 33.0507, lon: 35.4226, mm: 760, source: IMS('210803') },
  { nameHe: 'מתת', lat: 33.0409, lon: 35.3551, mm: 885, source: IMS('211010') },
  { nameHe: 'בית ג׳אן', lat: 32.9651, lon: 35.3668, mm: 932, source: IMS('211941') },
  { nameHe: 'פרוד', lat: 32.9317, lon: 35.4319, mm: 737, source: IMS('212601') },
  { nameHe: 'חרשים', lat: 32.9562, lon: 35.3261, mm: 988, source: IMS('212168') },
  { nameHe: 'מלכיה', lat: 33.1001, lon: 35.5127, mm: 566, source: IMS('210453') },
  { nameHe: 'מטולה', lat: 33.2785, lon: 35.5778, mm: 825, source: IMS('210062') },
  { nameHe: 'כפר גלעדי', lat: 33.2424, lon: 35.5755, mm: 757, source: IMS('210151') },
  { nameHe: 'דיר חנא', lat: 32.8614, lon: 35.3730, mm: 616, source: IMS('213052') },
  { nameHe: 'יובלים', lat: 32.8769, lon: 35.2705, mm: 686, source: IMS('212980') },
  { nameHe: 'דפנה', lat: 33.2269, lon: 35.6344, mm: 615, source: IMS('310093') },
  { nameHe: 'כפר בלום', lat: 33.1711, lon: 35.6116, mm: 507, source: IMS('310552') },
  { nameHe: 'שמורת החולה', lat: 33.0683, lon: 35.6004, mm: 440, source: IMS('311070') },
  { nameHe: 'איילת השחר', lat: 33.0233, lon: 35.5724, mm: 473, source: IMS('311204') },
  { nameHe: 'כפר הנשיא', lat: 32.9736, lon: 35.6021, mm: 533, source: IMS('311501') },
  { nameHe: 'נווה אטי״ב', lat: 33.2616, lon: 35.7397, mm: 947, source: IMS('2488708') },
  { nameHe: 'מבצר נמרוד', lat: 33.2518, lon: 35.7182, mm: 816, source: IMS('2488800') },
  { nameHe: 'אל רום', lat: 33.1813, lon: 35.7693, mm: 901, source: IMS('2489600') },
  { nameHe: 'מרום גולן', lat: 33.1279, lon: 35.8032, mm: 811, source: IMS('2496028') },
  { nameHe: 'אלוני הבשן', lat: 33.0421, lon: 35.8358, mm: 700, source: IMS('2496501') },
  { nameHe: 'קשת', lat: 32.9809, lon: 35.8097, mm: 684, source: IMS('2496600') },
  { nameHe: 'יונתן', lat: 32.9359, lon: 35.7934, mm: 634, source: IMS('2493301') },
  { nameHe: 'גמלא', lat: 32.9045, lon: 35.7472, mm: 578, source: IMS('2493330') },
  { nameHe: 'רמת מגשימים', lat: 32.8421, lon: 35.8066, mm: 515, source: IMS('2494353') },
  { nameHe: 'אבני איתן', lat: 32.8161, lon: 35.7605, mm: 518, source: IMS('2494552') },
  { nameHe: 'יהודייה', lat: 32.9408, lon: 35.6993, mm: 541, source: IMS('2311572') },
  { nameHe: 'משושים', lat: 32.9365, lon: 35.6586, mm: 515, source: IMS('2492950') },
  { nameHe: 'בניאס', lat: 33.2474, lon: 35.6935, mm: 690, source: IMS('310083') },
  { nameHe: 'תל דן', lat: 33.2449, lon: 35.6484, mm: 689, source: IMS('310120') },
];

/* ------------------------------------------------------------------ visible landforms */

export const FEATURE_ZONES: { landform: Landform; nameHe: string; poly: LonLat[] }[] = [
  {
    landform: 'sea_west',
    nameHe: 'רצועת החוף הדרומית: הים במערב',
    poly: [[34.12, 31.22], [34.18, 31.3], [34.3, 31.4], [34.4, 31.5], [34.487, 31.6], [34.565, 31.7], [34.625, 31.8], [34.68, 31.9], [34.725, 32.0], [34.745, 32.05], [34.815, 32.05], [34.76, 31.9], [34.68, 31.75], [34.57, 31.6], [34.43, 31.45], [34.27, 31.3], [34.25, 31.22]],
  },
  {
    landform: 'sea_west',
    nameHe: 'רצועת החוף הצפונית: הים במערב',
    poly: [[34.745, 32.05], [34.77, 32.1], [34.802, 32.2], [34.832, 32.3], [34.857, 32.4], [34.887, 32.5], [34.91, 32.6], [34.925, 32.7], [34.95, 32.8], [34.95, 32.84], [35.05, 32.835], [35.078, 32.9], [35.083, 33.0], [35.1, 33.12], [35.16, 33.1], [35.13, 32.92], [35.08, 32.8], [35.01, 32.76], [35.0, 32.65], [34.96, 32.5], [34.91, 32.33], [34.855, 32.17], [34.815, 32.05]],
  },
  {
    // The Carmel ridge looks down on the sea.
    landform: 'sea_west',
    nameHe: 'הכרמל מול הים',
    poly: [[34.97, 32.82], [35.05, 32.79], [35.06, 32.7], [35.02, 32.6], [34.97, 32.6], [34.96, 32.7]],
  },
  {
    landform: 'dunes',
    nameHe: 'חולות החוף הדרומי',
    poly: [
      [34.765, 32.03], [34.735, 31.93], [34.705, 31.85], [34.675, 31.78], [34.64, 31.72], [34.585, 31.65],
      [34.53, 31.55], [34.45, 31.45], [34.36, 31.35], [34.28, 31.25], [34.13, 31.25], [34.18, 31.3],
      [34.3, 31.4], [34.4, 31.5], [34.487, 31.6], [34.565, 31.7], [34.625, 31.8], [34.68, 31.9], [34.725, 32.0], [34.74, 32.03],
    ],
  },
  { landform: 'dunes', nameHe: 'חולות חדרה–קיסריה', poly: [[34.87, 32.42], [34.89, 32.42], [34.9, 32.47], [34.905, 32.53], [34.89, 32.53], [34.86, 32.47]] },
  { landform: 'dunes', nameHe: 'חולות מפרץ חיפה', poly: [[35.03, 32.8], [35.06, 32.81], [35.085, 32.86], [35.085, 32.92], [35.065, 32.92], [35.05, 32.86], [35.02, 32.82]] },
  { landform: 'dunes', nameHe: 'חולות חלוצה ועגור', poly: [[34.35, 31.2], [34.55, 31.17], [34.67, 31.09], [34.62, 30.92], [34.45, 30.85], [34.3, 30.95]] },
  {
    // Kurkar ridges parallel to the shore (landform-belts), central and Carmel coast.
    landform: 'kurkar_ridge',
    nameHe: 'רכסי הכורכר של השרון וחוף הכרמל',
    poly: [
      [34.76, 32.03], [34.79, 32.03], [34.83, 32.17], [34.885, 32.33], [34.93, 32.5], [34.955, 32.65],
      [34.965, 32.75], [34.95, 32.8], [34.93, 32.75], [34.9, 32.6], [34.86, 32.45], [34.8, 32.25],
    ],
  },
  {
    // Kurkar cliffs (landforms: "לאורך רוב חוף הים התיכון של ישראל עומדים מצוקים של כורכר").
    landform: 'kurkar_cliff',
    nameHe: 'מצוקי הכורכר: תל אביב–נתניה',
    poly: [[34.765, 32.09], [34.79, 32.17], [34.815, 32.25], [34.84, 32.33], [34.855, 32.4], [34.875, 32.4], [34.86, 32.33], [34.835, 32.25], [34.815, 32.17], [34.79, 32.09]],
  },
  {
    landform: 'kurkar_cliff',
    nameHe: 'מצוקי הכורכר: פלמחים',
    poly: [[34.69, 31.9], [34.7, 31.9], [34.715, 31.96], [34.705, 31.97], [34.69, 31.94], [34.685, 31.91]],
  },
  {
    // Terraced Mediterranean slopes of the Judean and Samarian hills (west of the watershed).
    landform: 'terraces',
    nameHe: 'מדרונות מדורגים בהרי יהודה ושומרון',
    poly: [[34.99, 32.3], [35.3, 32.3], [35.27, 32.0], [35.23, 31.8], [35.2, 31.5], [35.0, 31.5], [34.98, 31.75], [35.0, 32.0]],
  },
  {
    landform: 'terraces',
    nameHe: 'מדרונות מדורגים בגליל',
    poly: [[35.2, 33.08], [35.48, 33.08], [35.5, 32.95], [35.45, 32.85], [35.25, 32.82], [35.18, 32.95]],
  },
  {
    // The line of cones in the northern and central Golan (Bental, Avital, Hermonit, Odem, Peres…).
    landform: 'volcanic_cones',
    nameHe: 'חרוטי הגעש של הגולן',
    poly: [[35.72, 33.21], [35.84, 33.22], [35.88, 33.05], [35.85, 32.94], [35.78, 32.94], [35.74, 33.1]],
  },
  {
    landform: 'basalt_plateau',
    nameHe: 'רמת הגולן',
    poly: [
      [35.665, 33.21], [35.67, 33.1], [35.655, 32.95], [35.665, 32.85], [35.66, 32.75], [35.68, 32.7],
      [35.8, 32.7], [35.9, 32.72], [35.95, 32.8], [35.95, 33.0], [35.9, 33.15], [35.84, 33.22], [35.72, 33.22],
    ],
  },
  {
    landform: 'salt_lake',
    nameHe: 'ים המלח וחופיו',
    poly: [[35.38, 31.79], [35.6, 31.79], [35.62, 31.5], [35.6, 31.0], [35.31, 31.0], [35.34, 31.15], [35.35, 31.3], [35.365, 31.45], [35.38, 31.6]],
  },
  {
    landform: 'fresh_lake',
    nameHe: 'הכנרת וחופיה',
    poly: [[35.5, 32.92], [35.66, 32.92], [35.67, 32.68], [35.53, 32.68], [35.5, 32.8]],
  },
  {
    landform: 'rift_cliffs',
    nameHe: 'מצוקי ההעתקים מעל ים המלח',
    poly: [[35.36, 31.85], [35.43, 31.85], [35.41, 31.6], [35.39, 31.45], [35.37, 31.3], [35.355, 31.1], [35.3, 31.0], [35.25, 31.0], [35.31, 31.15], [35.33, 31.3], [35.35, 31.45], [35.37, 31.6]],
  },
  {
    landform: 'rift_cliffs',
    nameHe: 'מצוק הגלבוע מעל עמק בית שאן',
    poly: [[35.38, 32.52], [35.47, 32.52], [35.52, 32.42], [35.48, 32.38], [35.42, 32.44]],
  },
  {
    landform: 'rift_cliffs',
    nameHe: 'מצוק רמת כורזים ומצוקי הגולן מעל הכנרת',
    poly: [[35.62, 32.9], [35.68, 32.9], [35.68, 32.7], [35.64, 32.7], [35.645, 32.8]],
  },
  {
    landform: 'makhtesh',
    nameHe: 'מכתש רמון',
    poly: [
      [34.66, 30.555], [34.72, 30.59], [34.78, 30.615], [34.83, 30.645], [34.88, 30.655], [34.95, 30.64],
      [35.03, 30.61], [35.02, 30.545], [34.94, 30.53], [34.88, 30.5], [34.78, 30.525], [34.7, 30.51], [34.66, 30.515],
    ],
  },
  { landform: 'makhtesh', nameHe: 'המכתש הגדול', poly: [[34.94, 30.9], [34.97, 30.945], [35.04, 30.962], [35.095, 30.955], [35.09, 30.91], [35.03, 30.893], [34.96, 30.882]] },
  { landform: 'makhtesh', nameHe: 'המכתש הקטן', poly: [[35.158, 30.95], [35.175, 30.985], [35.2, 30.995], [35.225, 30.975], [35.222, 30.94], [35.195, 30.925], [35.168, 30.93]] },
  {
    // Dry stream beds (ואדיות) of the Judean Desert and the Negev highlands.
    landform: 'wadi',
    nameHe: 'ואדיות מדבר יהודה',
    poly: [[35.25, 31.92], [35.42, 31.92], [35.4, 31.6], [35.37, 31.33], [35.22, 31.33], [35.2, 31.6], [35.24, 31.8]],
  },
  {
    landform: 'wadi',
    nameHe: 'ואדיות הר הנגב, הערבה והרי אילת',
    poly: [[34.7, 31.05], [35.3, 31.05], [35.42, 30.6], [35.25, 30.1], [35.05, 29.5], [34.86, 29.47], [34.55, 30.0], [34.4, 30.5], [34.55, 30.8]],
  },
  {
    landform: 'sinkholes',
    nameHe: 'בולעני חוף ים המלח המערבי',
    poly: [[35.385, 31.435], [35.408, 31.435], [35.42, 31.5], [35.425, 31.62], [35.4, 31.62], [35.39, 31.5]],
  },
  {
    landform: 'loess_plain',
    nameHe: 'מישורי הלס של צפון הנגב',
    poly: [[34.45, 31.25], [34.55, 31.4], [34.85, 31.42], [35.0, 31.36], [35.18, 31.31], [35.22, 31.22], [35.05, 31.1], [34.85, 31.0], [34.7, 30.98], [34.55, 31.1]],
  },
  { landform: 'granite_peaks', nameHe: 'הרי אילת', poly: [[34.86, 29.48], [34.935, 29.48], [34.955, 29.56], [34.96, 29.62], [34.94, 29.7], [34.88, 29.7], [34.85, 29.6]] },
  { landform: 'canyon', nameHe: 'קניון עין עבדת', poly: [[34.755, 30.815], [34.785, 30.815], [34.8, 30.85], [34.775, 30.855], [34.76, 30.84]] },
  { landform: 'canyon', nameHe: 'נחל ערוגות ונחל דוד', poly: [[35.33, 31.43], [35.39, 31.43], [35.39, 31.475], [35.33, 31.475]] },
  { landform: 'canyon', nameHe: 'קניון גמלא', poly: [[35.72, 32.89], [35.77, 32.89], [35.77, 32.915], [35.72, 32.915]] },
  { landform: 'canyon', nameHe: 'נחל כזיב', poly: [[35.18, 33.03], [35.27, 33.03], [35.28, 33.06], [35.18, 33.06]] },
];

/* ------------------------------------------------------------------ cities */

// City dots on the pin map (unlabelled until the reveal). Centre coordinates; culture
// signs are buildings and streets only.
export const CITIES: { id: string; nameHe: string; lat: number; lon: number; culture: CultureSign[]; onMap: boolean }[] = [
  { id: 'haifa', nameHe: 'חיפה', lat: 32.794, lon: 34.9896, culture: ['dense_town', 'glass_towers', 'multilingual_signs'], onMap: true },
  { id: 'akko', nameHe: 'עכו', lat: 32.9281, lon: 35.0818, culture: ['mosque', 'church', 'old_market', 'stone_houses'], onMap: false },
  { id: 'nazareth', nameHe: 'נצרת', lat: 32.7019, lon: 35.2971, culture: ['church', 'mosque', 'old_market', 'pilgrim_hotels', 'multilingual_signs', 'stone_houses', 'dense_town'], onMap: true },
  { id: 'tiberias', nameHe: 'טבריה', lat: 32.794, lon: 35.53, culture: ['dense_town', 'stone_houses'], onMap: true },
  { id: 'safed', nameHe: 'צפת', lat: 32.9646, lon: 35.496, culture: ['stone_houses'], onMap: true },
  { id: 'kiryat_shmona', nameHe: 'קריית שמונה', lat: 33.2073, lon: 35.5697, culture: ['dense_town'], onMap: false },
  { id: 'katzrin', nameHe: 'קצרין', lat: 32.9925, lon: 35.69, culture: ['sparse_town'], onMap: true },
  { id: 'netanya', nameHe: 'נתניה', lat: 32.3215, lon: 34.8532, culture: ['dense_town', 'chain_stores'], onMap: true },
  { id: 'tel_aviv', nameHe: 'תל אביב–יפו', lat: 32.0853, lon: 34.7818, culture: ['glass_towers', 'chain_stores', 'dense_town', 'multilingual_signs'], onMap: true },
  { id: 'jerusalem', nameHe: 'ירושלים', lat: 31.7683, lon: 35.2137, culture: ['stone_houses', 'church', 'mosque', 'old_market', 'multilingual_signs', 'dense_town'], onMap: true },
  { id: 'bat_yam', nameHe: 'בת ים', lat: 32.0171, lon: 34.7454, culture: ['dense_town', 'chain_stores'], onMap: false },
  { id: 'ashdod', nameHe: 'אשדוד', lat: 31.8044, lon: 34.6553, culture: ['dense_town', 'chain_stores'], onMap: true },
  { id: 'ashkelon', nameHe: 'אשקלון', lat: 31.6688, lon: 34.5743, culture: ['dense_town'], onMap: false },
  { id: 'beer_sheva', nameHe: 'באר שבע', lat: 31.252, lon: 34.7915, culture: ['dense_town', 'chain_stores'], onMap: true },
  { id: 'arad', nameHe: 'ערד', lat: 31.2589, lon: 35.2128, culture: ['sparse_town'], onMap: true },
  { id: 'dimona', nameHe: 'דימונה', lat: 31.07, lon: 35.03, culture: ['sparse_town'], onMap: true },
  { id: 'yeruham', nameHe: 'ירוחם', lat: 30.9873, lon: 34.9298, culture: ['sparse_town'], onMap: false },
  { id: 'mitzpe_ramon', nameHe: 'מצפה רמון', lat: 30.61, lon: 34.8013, culture: ['sparse_town'], onMap: true },
  { id: 'eilat', nameHe: 'אילת', lat: 29.5577, lon: 34.9519, culture: ['dense_town', 'chain_stores', 'multilingual_signs'], onMap: true },
];
