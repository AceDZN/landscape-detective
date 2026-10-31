// Daily case: 5 postcards seeded by date from the solver-verified pool.
import pool from '../data/daily-pool.json';
import { hash01, mulberry32 } from './geo';
import type { CaseDef, Season, ToolId } from './types';

export const DAILY_CLUES: ToolId[] = ['hammer', 'altimeter', 'rain'];
export const DAILY_STAR_KM: [number, number, number] = [18, 40, 80];

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dailyCase(key: string): CaseDef {
  const ids = [...(pool as { verified: string[] }).verified];
  const rnd = mulberry32(Math.floor(hash01(`daily:${key}`) * 2 ** 31));
  const pick: string[] = [];
  while (pick.length < 5 && ids.length) pick.push(ids.splice(Math.floor(rnd() * ids.length), 1)[0]);
  const seasons: Season[] = ['winter', 'spring', 'summer', 'autumn'];
  return {
    id: 0,
    world: 1,
    titleHe: `התיק היומי · ${key}`,
    introHe: 'חמש גלויות חדשות מכל הארץ. שלושה כלים לכל גלויה — בחרו בחוכמה.',
    postcards: pick.map((placeId, i) => ({ placeId, season: seasons[i % 4], hour: 9 + i * 1.5 })),
    charges: 10,
    hints: true,
    starKm: DAILY_STAR_KM,
    intended: pick.map(() => DAILY_CLUES),
  };
}
