import type { Size } from "./poseTypes";

export type SegMask = { data: Uint8ClampedArray; width: number; height: number };

export function createEmptyMask(width: number, height: number): SegMask {
  return { data: new Uint8ClampedArray(width * height), width, height };
}

// 3x3 Morphological Close (dilate → erode) - binary(0/255)
function morphClose(mask: SegMask, iterations = 1): SegMask {
  let { data, width: W, height: H } = mask;

  const dilate = (src: Uint8ClampedArray) => {
    const out = new Uint8ClampedArray(src.length);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let on = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const xx = x + i, yy = y + j;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        if (src[yy * W + xx] > 127) { on = 255; break; }
      }
      out[y * W + x] = on;
    }
    return out;
  };
  const erode = (src: Uint8ClampedArray) => {
    const out = new Uint8ClampedArray(src.length);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let all = 255;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const xx = x + i, yy = y + j;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        if (src[yy * W + xx] <= 127) { all = 0; break; }
      }
      out[y * W + x] = all;
    }
    return out;
  };

  let cur = data;
  for (let k = 0; k < iterations; k++) cur = erode(dilate(cur));
  return { data: cur, width: W, height: H };
}

// body width at a row
function widthAtRow(mask: SegMask, y: number): number {
  const { data, width, height } = mask;
  const yy = Math.max(0, Math.min(height - 1, Math.round(y)));
  let left = -1, right = -1;
  for (let x = 0; x < width; x++) { if (data[yy * width + x] > 127) { left = x; break; } }
  for (let x = width - 1; x >= 0; x--) { if (data[yy * width + x] > 127) { right = x; break; } }
  return (left >= 0 && right >= 0 && right >= left) ? (right - left + 1) : 0;
}

/** Rough circumferences under upright front-facing assumption: width(px) * cm/px * π */
export function estimateCircumferencesFromMask(
  mask: SegMask,
  cmPerPx: number | undefined,
  _size: Size,
  smooth = true,
) {
  if (!cmPerPx) return undefined;
  const H = mask.height;

  const m = smooth ? morphClose(mask, 1) : mask;
  const rows = {
    chest: Math.round(H * 0.35),
    waist: Math.round(H * 0.45),
    hip:   Math.round(H * 0.55),
  };
  const C = (wPx: number) => (wPx ? +(wPx * cmPerPx * Math.PI).toFixed(1) : undefined);

  return {
    chest: C(widthAtRow(m, rows.chest)),
    waist: C(widthAtRow(m, rows.waist)),
    hip:   C(widthAtRow(m, rows.hip)),
  };
}