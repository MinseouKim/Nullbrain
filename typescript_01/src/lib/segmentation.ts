// src/lib/segmentation.ts
export interface SegMask {
  data: Uint8Array | Float32Array;
  width: number;
  height: number;
}

export interface CircumferenceMeasurements {
  chest: number;
  waist: number;
  hip: number;
  thigh: number;
  arm: number;
}

export function estimateCircumferencesFromMask(
  mask: SegMask,
  cmPerPx?: number,
  size?: any
): CircumferenceMeasurements {
  // 임시 구현 - 실제로는 세그멘테이션 마스크를 분석하여 둘레를 계산
  const scale = cmPerPx || 1;
  return {
    chest: 90 * scale,
    waist: 75 * scale,
    hip: 95 * scale,
    thigh: 55 * scale,
    arm: 30 * scale,
  };
}

export function createEmptyMask(width: number, height: number): SegMask {
  return {
    data: new Uint8Array(width * height),
    width,
    height,
  };
}
