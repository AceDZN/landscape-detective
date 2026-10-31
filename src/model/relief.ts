// Readers for the bundled relief grids (Int16 decimetres, row 0 = north).
import { COUNTRY, PATCH, M_PER_DEG_LAT, mPerDegLon } from './relief-spec';

export class CountryRelief {
  constructor(readonly data: Int16Array) {
    if (data.length !== COUNTRY.rows * COUNTRY.cols) throw new Error('country grid size mismatch');
  }

  cell(r: number, c: number): number {
    r = Math.max(0, Math.min(COUNTRY.rows - 1, r));
    c = Math.max(0, Math.min(COUNTRY.cols - 1, c));
    return this.data[r * COUNTRY.cols + c] / 10;
  }

  /** Bilinear elevation in metres. */
  at(lat: number, lon: number): number {
    const fr = (COUNTRY.north - lat) / COUNTRY.step;
    const fc = (lon - COUNTRY.west) / COUNTRY.step;
    const r = Math.floor(fr), c = Math.floor(fc);
    const tr = fr - r, tc = fc - c;
    return (this.cell(r, c) * (1 - tc) + this.cell(r, c + 1) * tc) * (1 - tr) + (this.cell(r + 1, c) * (1 - tc) + this.cell(r + 1, c + 1) * tc) * tr;
  }

  static latOf(r: number) {
    return COUNTRY.north - r * COUNTRY.step;
  }
  static lonOf(c: number) {
    return COUNTRY.west + c * COUNTRY.step;
  }
}

/** A 4 km local patch centred on a place; x east, z south, metres from the centre. */
export class PatchRelief {
  readonly half = ((PATCH.size - 1) / 2) * PATCH.spacingM;
  constructor(readonly data: Int16Array, readonly lat: number, readonly lon: number) {
    if (data.length !== PATCH.size * PATCH.size) throw new Error('patch size mismatch');
  }

  sample(r: number, c: number): number {
    r = Math.max(0, Math.min(PATCH.size - 1, r));
    c = Math.max(0, Math.min(PATCH.size - 1, c));
    return this.data[r * PATCH.size + c] / 10;
  }

  /** Bicubic-free smooth bilinear height at local x (east) / z (south) in metres. */
  at(x: number, z: number): number {
    const fc = (x + this.half) / PATCH.spacingM;
    const fr = (z + this.half) / PATCH.spacingM;
    const r = Math.floor(fr), c = Math.floor(fc);
    const tr = fr - r, tc = fc - c;
    return (this.sample(r, c) * (1 - tc) + this.sample(r, c + 1) * tc) * (1 - tr) + (this.sample(r + 1, c) * (1 - tc) + this.sample(r + 1, c + 1) * tc) * tr;
  }

  centre(): number {
    return this.at(0, 0);
  }

  toLatLon(x: number, z: number): [number, number] {
    return [this.lat - z / M_PER_DEG_LAT, this.lon + x / mPerDegLon(this.lat)];
  }
}

export function int16FromBuffer(buf: ArrayBuffer | Uint8Array): Int16Array {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Int16Array(copy.buffer);
}
