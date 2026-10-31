// Pure data types shared by the geography model, the levels and the scene.
// No Three.js imports anywhere under src/model or src/data.

/** Rock in front of the player, as the rock hammer reports it (Workbook terms). */
export type Rock =
  | 'limestone' // גיר
  | 'chalk' // קירטון
  | 'basalt' // בזלת
  | 'kurkar' // כורכר
  | 'sand' // חול
  | 'granite' // גרניט
  | 'loess' // לס
  | 'marl_salt' // חוואר ומלח (לשון)
  | 'sandstone'; // אבן חול (קרקעית מכתש)

/** Natural vegetation, as the field guide reports it. */
export type Vegetation =
  | 'maquis' // חורש ים תיכוני
  | 'batha' // בתה וצומח ערבתי
  | 'desert' // צומח מדברי דליל
  | 'acacia' // שיטים בערוצים
  | 'dune' // צמחי חולות
  | 'oasis' // צמחיית מעיינות ונאות מדבר
  | 'bare'; // כמעט ללא צומח (מלח)

export type Climate = 'mediterranean' | 'steppe' | 'desert';

/** Landform belts as Workbook grade 9 ch. 2 names them, plus the Golan and the Negev. */
export type Belt = 'coastal_plain' | 'mountain' | 'rift' | 'golan' | 'negev';

/** Things you can see without spending a tool charge. */
export type Landform =
  | 'sea_west' // הים נראה במערב
  | 'dunes'
  | 'kurkar_ridge'
  | 'kurkar_cliff'
  | 'terraces'
  | 'volcanic_cones'
  | 'basalt_plateau'
  | 'salt_lake' // ים המלח
  | 'fresh_lake' // הכנרת
  | 'rift_cliffs'
  | 'makhtesh'
  | 'wadi'
  | 'sinkholes'
  | 'loess_plain'
  | 'granite_peaks'
  | 'canyon';

/** Cultural landscape signs (buildings, streets, signs: never people). */
export type CultureSign =
  | 'church'
  | 'mosque'
  | 'old_market'
  | 'pilgrim_hotels'
  | 'multilingual_signs'
  | 'stone_houses' // אבן ירושלמית
  | 'glass_towers' // נוף גלובלי
  | 'chain_stores'
  | 'dense_town'
  | 'sparse_town'
  | 'kibbutz_fields'
  | 'nabatean_dam'
  | 'olive_groves'
  | 'wheat_fields';

export type ToolId = 'hammer' | 'guide' | 'altimeter' | 'rain' | 'kite';

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

/** A real place. Values are authored from sources and checked by tests against the pure zone model and the bundled relief. */
export interface Place {
  id: string;
  nameHe: string; // standard Hebrew name, shown only at the reveal
  lat: number;
  lon: number;
  rock: Rock;
  vegetation: Vegetation;
  rainMm: number; // long-term yearly average, rounded
  climate: Climate;
  belt: Belt;
  landforms: Landform[];
  culture: CultureSign[];
  /** Water surface in metres if the scene shows a lake or sea in view (sea 0, Kinneret −211, Dead Sea −435). */
  waterLevelM?: number;
  /** Which way the camera starts looking, degrees clockwise from north. */
  startHeadingDeg?: number;
  /** One Hebrew line for the reveal: best clue → answer. */
  revealHe: string;
  /** Workbook module paths (e.g. /geography/grade-9/chapter-2/landform-belts) this place teaches. */
  modules: string[];
  sources: string[];
}

export interface Postcard {
  placeId: string;
  season: Season;
  hour: number; // local solar hour, 0–24
  night?: boolean;
  /** Extra short line in the postcard's corner, never naming the place. */
  stampHe?: string;
}

export interface CaseDef {
  id: number; // 1..18
  world: 1 | 2 | 3 | 4;
  titleHe: string;
  introHe: string; // one or two lines from the ranger radio
  postcards: Postcard[];
  /** Tool charges for the whole case (shared across postcards). Tutorial uses Infinity. */
  charges: number;
  hints: boolean;
  transfer?: boolean;
  /** Distance radii in km for 3, 2 and 1 star (per postcard average). */
  starKm: [number, number, number];
  /** The clue set the solver uses to prove the case: per postcard, the tools a careful player spends. */
  intended: ToolId[][];
  /** Special rule: e.g. pins must be in the right west→east order (case 5), or name the rain-shadow card (case 10). */
  rule?: 'order_west_east' | 'rain_shadow';
  /** The misconception this case traps, in Hebrew, for the reveal after a far miss. */
  trapHe?: string;
}
