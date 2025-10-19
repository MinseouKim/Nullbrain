// src/lib/segModel.ts
import type { SegMask } from "./segmentation";

let seg: any | null = null;
let ready: Promise<void> | null = null;

async function ensureSeg(): Promise<void> {
  if (seg) return;
  if (!ready) {
    ready = (async () => {
      // NPM 패키지에서만 import (← 여기서 더 이상 CDN import 안 함)
      // @ts-ignore - @mediapipe/selfie_segmentation 타입 선언이 없음
      const mp = await import("@mediapipe/selfie_segmentation");
      // 패키지 타입이 느슨해서 any 처리
      const SelfieSegmentation = (mp as any).SelfieSegmentation;

      seg = new SelfieSegmentation({
        // wasm/asset은 CDN에서 가져오도록 지정 (모듈 import와는 무관)
        locateFile: (f: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
      });
      seg.setOptions({ modelSelection: 1, selfieMode: true });
    })();
  }
  await ready;
}

/** HTMLCanvas/Video -> SegMask */
export async function runSegmentationToMask(
  source: HTMLCanvasElement | HTMLVideoElement
): Promise<SegMask | null> {
  try {
    await ensureSeg();
    if (!seg) return null;

    const results = await new Promise<any>((resolve, reject) => {
      try {
        seg.onResults((r: any) => resolve(r));
        seg.send({ image: source });
      } catch (e) {
        reject(e);
      }
    });

    const maskCanvas: HTMLCanvasElement | undefined = results?.segmentationMask;
    if (!maskCanvas) return null;

    const w = maskCanvas.width;
    const h = maskCanvas.height;
    const read = document.createElement("canvas");
    read.width = w;
    read.height = h;
    const ctx = read.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(maskCanvas, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const out = new Uint8ClampedArray(w * h);

    // alpha 채널 기준으로 이진화(>127 → 255)
    const data = img.data;
    for (let i = 0; i < w * h; i++) {
      const a = data[i * 4 + 3];
      out[i] = a > 127 ? 255 : 0;
    }
    return { data: out, width: w, height: h };
  } catch {
    return null;
  }
}
