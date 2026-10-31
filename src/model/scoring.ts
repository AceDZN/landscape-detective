// Points, stars and the ibex chase, all from distance.

export const MAX_POINTS = 5000;
/** e-folding distance: 3 km ≈ 4,590 pts, 40 km ≈ 1,600 pts, 100 km ≈ 290 pts. */
export const SCORE_KM = 35;

export function pointsFor(km: number): number {
  return Math.round(MAX_POINTS * Math.exp(-Math.max(0, km) / SCORE_KM));
}

/** Stars 0..3 from the average distance and the case's radii. */
export function starsFor(avgKm: number, starKm: readonly [number, number, number]): number {
  if (avgKm <= starKm[0]) return 3;
  if (avgKm <= starKm[1]) return 2;
  if (avgKm <= starKm[2]) return 1;
  return 0;
}

/** How many ridges ahead the ibex is after a pin (0 = caught up, 3 = gone). */
export function ibexGap(km: number, starKm: readonly [number, number, number]): number {
  return km <= starKm[0] ? 0 : km <= starKm[1] ? 1 : km <= starKm[2] ? 2 : 3;
}
