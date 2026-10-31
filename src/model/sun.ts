// Sun direction for a postcard's season and local solar hour (a free clue: it sets in the west).
import type { Season } from './types';

const DECL: Record<Season, number> = { winter: -21, spring: 2, summer: 22, autumn: -6 };

/** Elevation and azimuth (degrees; azimuth clockwise from north) at a latitude. */
export function sunPosition(lat: number, season: Season, hour: number): { elevation: number; azimuth: number } {
  const toR = Math.PI / 180;
  const d = DECL[season] * toR;
  const phi = lat * toR;
  const h = (hour - 12) * 15 * toR;
  const sinEl = Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(h);
  const el = Math.asin(sinEl);
  const cosAz = (Math.sin(d) - Math.sin(el) * Math.sin(phi)) / (Math.cos(el) * Math.cos(phi));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) / toR;
  if (h > 0) az = 360 - az;
  return { elevation: el / toR, azimuth: az };
}

/** Unit vector toward the sun in scene space (x east, y up, z south). */
export function sunVector(lat: number, season: Season, hour: number): [number, number, number] {
  const { elevation, azimuth } = sunPosition(lat, season, hour);
  const e = (elevation * Math.PI) / 180, a = (azimuth * Math.PI) / 180;
  return [Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a)];
}
