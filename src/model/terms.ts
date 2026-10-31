// Hebrew terms (Workbook wording) for every enum value. Checked against docs/hebrew-terms.md.
import type { Belt, Climate, CultureSign, Landform, Rock, ToolId, Vegetation } from './types';

export const ROCK_HE: Record<Rock, string> = {
  limestone: 'גיר',
  chalk: 'קירטון',
  basalt: 'בזלת',
  kurkar: 'כורכר',
  sand: 'חול',
  granite: 'גרניט',
  loess: 'לס',
  marl_salt: 'חוואר ומלח',
  sandstone: 'אבן חול',
};

export const VEG_HE: Record<Vegetation, string> = {
  maquis: 'חורש ים תיכוני',
  batha: 'בתה וצומח ערבתי',
  desert: 'צומח מדברי דליל',
  acacia: 'שיטים בערוצים',
  dune: 'צמחי חולות',
  oasis: 'צמחיית מעיינות',
  bare: 'כמעט ללא צומח',
};

export const CLIMATE_HE: Record<Climate, string> = {
  mediterranean: 'אקלים ים תיכוני',
  steppe: 'אקלים ערבתי',
  desert: 'אקלים מדברי',
};

export const BELT_HE: Record<Belt, string> = {
  coastal_plain: 'מישור החוף',
  mountain: 'אזור ההר',
  rift: 'הבקע',
  golan: 'רמת הגולן',
  negev: 'הנגב',
};

export const LANDFORM_HE: Record<Landform, string> = {
  sea_west: 'ים במערב',
  dunes: 'דיונות חול',
  kurkar_ridge: 'רכס כורכר',
  kurkar_cliff: 'מצוק כורכר',
  terraces: 'טרסות',
  volcanic_cones: 'חרוטי געש',
  basalt_plateau: 'רמה בזלתית',
  salt_lake: 'אגם מלוח',
  fresh_lake: 'אגם מים מתוקים',
  rift_cliffs: 'מצוקי העתקים',
  makhtesh: 'מכתש',
  wadi: 'ואדי (ערוץ יבש)',
  sinkholes: 'בולענים',
  loess_plain: 'מישור לס',
  granite_peaks: 'פסגות גרניט',
  canyon: 'קניון',
};

export const CULTURE_HE: Record<CultureSign, string> = {
  church: 'כנסייה',
  mosque: 'מסגד',
  old_market: 'שוק עתיק',
  pilgrim_hotels: 'בתי מלון לצליינים',
  multilingual_signs: 'שלטים בכמה שפות',
  stone_houses: 'בתי אבן',
  glass_towers: 'מגדלי זכוכית',
  chain_stores: 'רשתות בינלאומיות',
  dense_town: 'יישוב צפוף',
  sparse_town: 'יישוב דליל',
  kibbutz_fields: 'שדות קיבוץ',
  nabatean_dam: 'סכר נבטי',
  olive_groves: 'מטעי זיתים',
  wheat_fields: 'שדות חיטה',
};

export const TOOL_HE: Record<ToolId, { name: string; verb: string }> = {
  hammer: { name: 'פטיש סלעים', verb: 'סלע' },
  guide: { name: 'מגדיר צמחים', verb: 'צומח' },
  altimeter: { name: 'מד גובה', verb: 'גובה' },
  rain: { name: 'מד גשם', verb: 'גשם שנתי' },
  kite: { name: 'מצלמת עפיפון', verb: 'מבט מלמעלה' },
};
