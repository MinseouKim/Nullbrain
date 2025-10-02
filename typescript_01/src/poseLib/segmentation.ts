// src/lib/segmentation.ts
import { Size } from "./poseTypes";

export type SegMask = {
  data: Uint8ClampedArray; // length = width * height (0~255)
  width: number;
  height: number;
};

// 내부 유틸: y행에서 바디 픽셀 가로 폭(px)
function widthAtRow(mask: SegMask, y: number): number {
  const { data, width, height } = mask;
  const yy = Math.max(0, Math.min(height - 1, Math.round(y)));
  let left = -1, right = -1;
  for (let x = 0; x < width; x++) {
    const v = data[yy * width + x];
    if (v > 127) { left = x; break; }
  }
  for (let x = width - 1; x >= 0; x--) {
    const v = data[yy * width + x];
    if (v > 127) { right = x; break; }
  }
  if (left < 0 || right < 0 || right <= left) return 0;
  return right - left + 1;
}

/**
 * 매우 러프한 둘레 추정 (정면, 직립 가정)
 * - 마스크 폭(px) * cm/px * π ≈ 둘레(cm)
 */
export function estimateCircumferencesFromMask(
  mask: SegMask,
  cmPerPx: number | undefined,
  _size: Size
) {
  if (!cmPerPx) return undefined;
  const H = mask.height;
  const rows = {
    chest: Math.round(H * 0.35),
    waist: Math.round(H * 0.45),
    hip:   Math.round(H * 0.55),
  };
  const C = (wPx: number) => (wPx ? +(wPx * cmPerPx * Math.PI).toFixed(1) : undefined);
  return {
    chest: C(widthAtRow(mask, rows.chest)),
    waist: C(widthAtRow(mask, rows.waist)),
    hip:   C(widthAtRow(mask, rows.hip)),
  };
}

export {};
