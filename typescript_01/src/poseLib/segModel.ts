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
      seg.setOptions({ modelSelection: 1, selfieMode: true });
    })();
  }
  await ready;
}

export async function initializeSegmentationModel(): Promise<void> {
  await ensureSeg();
}

/** HTMLCanvas/Video -> binary SegMask(0/255) — concurrent calls are dropped */
export async function runSegmentationToMask(
  source: HTMLCanvasElement | HTMLVideoElement
): Promise<SegMask | null> {
  await ensureSeg();
  if (!seg || inflight) return null;
  inflight = true;
  try {
    const results = await new Promise<any>((resolve, reject) => {
      try {
        seg.onResults((r: any) => resolve(r));
        seg.send({ image: source });
      } catch (e) { reject(e); }
    });

    const maskCanvas: HTMLCanvasElement | undefined = results?.segmentationMask;
    if (!maskCanvas) return null;

    const w = maskCanvas.width, h = maskCanvas.height;
    const read = document.createElement("canvas");
    read.width = w; read.height = h;
    const ctx = read.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(maskCanvas, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h).data;
    const out = new Uint8ClampedArray(w * h);
    for (let i = 0; i < w * h; i++) out[i] = img[i * 4 + 3] > 127 ? 255 : 0;
    return { data: out, width: w, height: h };
  } catch {
    return null;
  } finally {
    inflight = false;
  }
}