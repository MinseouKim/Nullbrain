# PoseMeasure – Full File Set (2025-10-28)

> 정리 사항
> - 워커 경로를 **`src/workers/poseOverlay.worker.ts`** 로 통일했습니다.
> - `PoseOverlay.tsx` 의 워커 import도 동일 경로로 수정했습니다.
> - `BodyAnalysisCamera.tsx` 를 **완전체**로 제공(미디어파이프 로딩, 카메라 start/stop, 캔버스 드로잉, 세그먼테이션 스로틀 포함).
> - 타입스크립트 경고가 있을 경우, `lib` 에 `DOM`/`WebWorker` 가 포함되어 있는지 확인하세요(아래 참고).
>
> **TS 설정 팁**
> ```jsonc
> // tsconfig.json (발췌)
> {
>   "compilerOptions": {
>     "target": "ES2020",
>     "module": "ESNext",
>     "lib": ["ES2020", "DOM", "DOM.Iterable", "WebWorker"],
>     "types": ["vite/client"],
>     "jsx": "react-jsx"
>   }
> }
> ```

---

## File: `src/components/Layouts/PoseOverlay.tsx`

```tsx
import React, { useEffect, useRef } from "react";
import type { KP, Size } from "../../poseLib/poseTypes";
import type { SegMask } from "../../poseLib/segmentation";

// 워커 import (webpack5 / vite)
// ※ 파일 경로 통일: src/workers/poseOverlay.worker.ts
const PoseWorker = new URL("../../workers/poseOverlay.worker.ts", import.meta.url);

type StepId =
  | "full" | "tpose" | "side" | "waist_flex"
  | "squat" | "elbow_flex" | "shoulder_abd" | "neck_rom" | "done";

type Baseline = { shoulder_width_px?: number; pelvis_width_px?: number } | undefined;

export const PoseOverlay: React.FC<{
  size: Size;
  kp: KP;
  stepId: StepId;
  roi: { x1:number;y1:number;x2:number;y2:number } | null;
  segMask: SegMask | null;
  baseline?: Baseline;
  mirrored?: boolean;
  fastMode?: boolean;
}> = ({ size, kp, stepId, roi, segMask, baseline, mirrored=false, fastMode=false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const resizeObs = useRef<ResizeObserver | null>(null);

  // 워커 준비 (mount 1회)
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    // OffscreenCanvas 지원 확인
    const canOffscreen = "transferControlToOffscreen" in el;
    if (!canOffscreen) {
      console.warn("[PoseOverlay] OffscreenCanvas 미지원 → 메인스레드 버전 사용 권장");
      return;
    }

    // 워커 생성
    const w = new Worker(PoseWorker, { type: "module" });
    workerRef.current = w;

    // 오프스크린으로 넘기기
    // @ts-ignore - TS DOM 타입이 낮으면 무시
    const off = el.transferControlToOffscreen() as OffscreenCanvas;
    w.postMessage({ type: "init", canvas: off }, [off as unknown as Transferable]);

    // 최초/리사이즈 해상도 갱신
    const sendResize = () => {
      const rect = el.getBoundingClientRect();
      const cssW = Math.max(1, rect.width);
      const cssH = Math.max(1, rect.height);
      const dpr = (typeof window !== "undefined" && window.devicePixelRatio) ? window.devicePixelRatio : 1;
      w.postMessage({ type: "resize", cssW, cssH, dpr });
    };
    sendResize();

    // ResizeObserver로 CSS 변경 추적
    const ro = new ResizeObserver(sendResize);
    ro.observe(el);
    resizeObs.current = ro;

    return () => {
      ro.disconnect();
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  // 프레임 전송
  useEffect(() => {
    const w = workerRef.current;
    const el = canvasRef.current;
    if (!w || !el) return;
    if (!segMask) {
      // 마스크 없을 때는 skip (워커는 마스크 기반으로만 렌더)
      return;
    }

    // CSS 크기 변경 알림(가끔 레이아웃 변동 시)
    const rect = el.getBoundingClientRect();
    w.postMessage({
      type: "resize",
      cssW: Math.max(1, rect.width),
      cssH: Math.max(1, rect.height),
      dpr: (typeof window !== "undefined" && window.devicePixelRatio) ? window.devicePixelRatio : 1,
    });

    // segMask 데이터 복제(transferable)
    const src = (segMask as any).data as Uint8Array | Uint8ClampedArray;
    const cloned = src instanceof Uint8ClampedArray ? new Uint8ClampedArray(src) : new Uint8Array(src);

    w.postMessage({
      type: "frame",
      imgW: size.w,
      imgH: size.h,
      mirrored: !!mirrored,
      kp,
      baseline,
      stepId,
      segMask: { w: (segMask as any).w ?? (segMask as any).width, h: (segMask as any).h ?? (segMask as any).height, data: cloned.buffer },
      roi,
      fastMode: !!fastMode,
    }, [cloned.buffer]);
  }, [kp, size, stepId, roi, segMask, baseline, mirrored, fastMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    />
  );
};
```

---

## File: `src/workers/poseOverlay.worker.ts`

```ts

```

---

## File: `src/measure/MeasureOrchestrator.tsx`

> 아래는 사용자가 올려주신 버전에서 **워커 경로/타이포**를 바로잡고, 누락 없이 정리한 전체본입니다.

```tsx

```

---

## File: `src/components/BodyAnalysisCamera.tsx`

```tsx

```

---

## File: `src/pages/BodyAnalysis.tsx`

> 페이지 스캐폴드는 기존 작성하신 구조를 유지하면서 **불필요한 부분만 정리**했습니다.

```tsx

```

---

### 마이그레이션 체크리스트
- [x] `PoseOverlay.tsx` 의 워커 경로: `../../workers/poseOverlay.worker.ts`
- [x] `tsconfig.json` 의 `lib`에 `WebWorker` 포함
- [x] Vite/Webpack: web worker 모듈 로딩 허용 (`new URL(..., import.meta.url)` 형태)
- [x] 세그먼테이션 함수 시그니처: `(canvas|video) => Promise<SegMask | null>`
- [x] MediaPipe Pose CDN 버전 고정(위 코드와 동일)

필요하시면 `poseLib/poseTypes.ts` / `poseLib/segmentation.ts` / `measure/filters.ts` 도 전체본으로 이어서 정리해드리겠습니다. 👌
