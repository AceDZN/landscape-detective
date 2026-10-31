// Grid specs shared by the relief build script and the runtime readers.

/** Whole-country grid: north-west origin, square degree cells. */
export const COUNTRY = { north: 33.45, west: 34.1, step: 0.005, rows: 811, cols: 381, zoom: 10 } as const;

/** Per-place local patch: PATCH.size x PATCH.size samples, PATCH.spacingM apart, centred on the place. */
export const PATCH = { size: 201, spacingM: 20, zoom: 13 } as const;

export const M_PER_DEG_LAT = 110_950;
export const mPerDegLon = (lat: number) => 111_320 * Math.cos((lat * Math.PI) / 180);
