import type { SegMask } from "./segmentation";

let seg: any | null = null;
let ready: Promise<void> | null = null;
let inflight = false;

async function ensureSeg(): Promise<void> {
  if (seg) return;
  if (!ready) {
    ready = (async () => {
      const mp = await import("@mediapipe/selfie_segmentation");
      const SelfieSegmentation = (mp as any).SelfieSegmentation;
      seg = new SelfieSegmentation({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
      });
      // ⬇ 빠른 모델(0)로 전환 + selfieMode
      seg.setOptions({ modelSelection: 0, selfieMode: false });
    })();
  }
  await ready;
}

export async function initializeSegmentationModel(): Promise<void> {
  await ensureSeg();
}

/** HTMLCanvas/Video -> binary SegMask(0/255), 입력 다운스케일로 가속 */
export async function runSegmentationToMask(
  source: HTMLCanvasElement | HTMLVideoElement
): Promise<SegMask | null> {
  await ensureSeg();
  if (!seg || inflight) return null;
  inflight = true;
  try {
    // 1) 입력 다운스케일 (최대 320px 한 변)
    const sw = (source as any).videoWidth ?? (source as HTMLCanvasElement).width ?? 0;
    const sh = (source as any).videoHeight ?? (source as HTMLCanvasElement).height ?? 0;
    if (!sw || !sh) { inflight = false; return null; }

    const MAX_W = 320, MAX_H = 320;
    const scale = Math.min(MAX_W / sw, MAX_H / sh, 1);
    const tw = Math.max(1, Math.round(sw * scale));
    const th = Math.max(1, Math.round(sh * scale));
    const srcSmall = document.createElement("canvas");
    srcSmall.width = tw; srcSmall.height = th;
    const sctx = srcSmall.getContext("2d");
    if (!sctx) { inflight = false; return null; }
    sctx.drawImage(source, 0, 0, tw, th);

    const results = await new Promise<any>((resolve, reject) => {
      try {
        seg.onResults((r: any) => resolve(r));
        seg.send({ image: srcSmall });
      } catch (e) { reject(e); }
    });

    const maskCanvas: HTMLCanvasElement | undefined = results?.segmentationMask;
    if (!maskCanvas) { inflight = false; return null; }

    // 2) 마스크 읽기
    const w = maskCanvas.width, h = maskCanvas.height;
    const read = document.createElement("canvas");
    read.width = w; read.height = h;
    const ctx = read.getContext("2d");
    if (!ctx) { inflight = false; return null; }
    ctx.drawImage(maskCanvas, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h).data;
    const out = new Uint8ClampedArray(w * h);
    for (let i = 0; i < w * h; i++) out[i] = img[i * 4 + 3] > 127 ? 255 : 0;

    inflight = false;
    return { data: out, width: w, height: h };
  } catch {
    inflight = false;
    return null;
  }
}
