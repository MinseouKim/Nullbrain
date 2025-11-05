import React, { useEffect, useMemo, useRef } from "react";
import type { KP, Size } from "../poseLib/poseTypes";
import type { SegMask } from "../poseLib/segmentation";

/** ===== 내부 타입/유틸 ===== */
type Pt = { x: number; y: number };
type Props = {
  /** 비디오 실제 사이즈 (onPose로 수신한 size) */
  size: Size | null | undefined;
  /** 최신 세그먼트 마스크 (원본 해상도: mask.width x mask.height) */
  mask: SegMask | null | undefined;
  /** 포즈 키포인트(세그가 없을 때 대비용 실루엣 생성) */
  kp?: KP | null;
  /** 카메라 미러링 여부(BodyAnalysisCamera와 동일하게 적용) */
  mirrored?: boolean;
  /** 비디오와 동일하게 contain/cover 기준을 맞추고 싶다면 사용 (기본: contain 권장) */
  fit?: "contain" | "cover";
  /** CSS 기준 선두께(px) */
  lineWidthCssPx?: number;
  /** 라인 색상 */
  color?: string;
  /** 0~1 (프레임간 보간 강도; 높을수록 더 부드럽게) */
  smoothLerp?: number;
  /** Chaikin 스무딩 반복 횟수(0~3 권장) */
  smoothIter?: number;
};

const DEFAULTS = {
  lineWidthCssPx: 2.0,
  color: "#00FFC2",
  smoothLerp: 0.35,
  smoothIter: 2,
} as const;

/** Monotone chain convex hull (포즈 점 기반 폴리곤 생성용) */
function convexHull(pts: Pt[]): Pt[] {
  if (pts.length <= 3) return pts.slice();
  const P = pts.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const p of P) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

/** Chaikin corner-cutting */
function chaikin(path: Pt[]): Pt[] {
  if (path.length < 3) return path;
  const out: Pt[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i], q = path[i + 1];
    out.push({ x: 0.75 * p.x + 0.25 * q.x, y: 0.75 * p.y + 0.25 * q.y });
    out.push({ x: 0.25 * p.x + 0.75 * q.x, y: 0.25 * p.y + 0.75 * q.y });
  }
  return out;
}
function chaikinN(path: Pt[], n = 1) {
  let p = path;
  for (let i = 0; i < n; i++) p = chaikin(p);
  return p;
}

/** 경로 길이 기반 균등 리샘플링 */
function resample(path: Pt[], N = 180): Pt[] {
  if (path.length < 2) return path.slice();
  // 닫힌 형태로 가정
  const closed = path[0].x === path[path.length - 1].x && path[0].y === path[path.length - 1].y ? path.slice() : path.concat([path[0]]);
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < closed.length; i++) {
    const d = Math.hypot(closed[i].x - closed[i - 1].x, closed[i].y - closed[i - 1].y);
    segs.push(d); total += d;
  }
  const step = total / N;
  const out: Pt[] = [];
  let acc = 0, j = 1, carry = 0;
  for (let k = 0; k < N; k++) {
    const target = k * step;
    while (carry + segs[j - 1] < target) { carry += segs[j - 1]; j++; if (j >= closed.length) j = closed.length - 1; }
    const t = (target - carry) / (segs[j - 1] || 1e-6);
    const A = closed[j - 1], B = closed[j];
    out.push({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t });
  }
  return out;
}

/** 포인트 배열 보간 */
function lerpPath(prev: Pt[] | null, curr: Pt[], a: number): Pt[] {
  if (!prev || prev.length !== curr.length) return curr.slice();
  const out = new Array(curr.length);
  for (let i = 0; i < curr.length; i++) out[i] = { x: prev[i].x + (curr[i].x - prev[i].x) * a, y: prev[i].y + (curr[i].y - prev[i].y) * a };
  return out;
}

/** 간단한 Marching Squares로 외곽선(가장 큰 컨투어) 추출 */
function largestContourFromMask(mask: SegMask, stride = 2, thr = 127): Pt[] | null {
  const { width: W, height: H } = mask;
  const data = (mask as any).data as Uint8Array | Uint8ClampedArray;
  if (!data || !W || !H) return null;

  // 바이너리 맵
  const bin = new Uint8Array(W * H);
  for (let i = 0; i < bin.length; i++) bin[i] = data[i] > thr ? 1 : 0;

  // 경계 추적 (간단한 border-following)
  // 시작점 탐색
  let sx = -1, sy = 0;
  outer: for (let y = 0; y < H; y += stride) {
    for (let x = 0; x < W; x += stride) {
      if (bin[y * W + x]) { sx = x; sy = y; break outer; }
    }
  }
  if (sx < 0) return null;

  // Moore-Neighbor tracing
  const dirs = [
    [1, 0],[1, 1],[0, 1],[-1, 1],[-1, 0],[-1, -1],[0, -1],[1, -1]
  ];
  let cx = sx, cy = sy, d = 0, safety = W * H, started = false;
  const path: Pt[] = [];

  do {
    path.push({ x: cx, y: cy });
    started = true;
    let found = false;
    for (let k = 0; k < 8; k++) {
      const kk = (d + k) % 8;
      const nx = cx + dirs[kk][0] * stride;
      const ny = cy + dirs[kk][1] * stride;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && bin[ny * W + nx]) {
        cx = nx; cy = ny; d = (kk + 6) % 8; // turn left
        found = true;
        break;
      }
    }
    if (!found) break;
    if (--safety <= 0) break;
  } while (!(cx === sx && cy === sy) || !started);

  if (path.length < 8) return null;
  // 닫히게
  if (path[0].x !== path[path.length - 1].x || path[0].y !== path[path.length - 1].y) path.push({ ...path[0] });
  return path;
}

/** 포즈 기반 백업 실루엣(상체만 나와도 동작) */
function fallbackSilhouetteFromKP(kp?: KP | null, size?: Size | null): Pt[] | null {
  if (!kp || !size) return null;
  const take = (i: number) => kp[i] && (kp[i]!.visibility ?? 0) > 0.3 ? { x: kp[i]!.x * size.w, y: kp[i]!.y * size.h } : null;

  // 상체 위주 + 양팔/골반/무릎/발목 가능한 것만
  const ids = [0,7,8,11,12,13,14,15,16,23,24,25,26,27,28];
  const pts: Pt[] = [];
  ids.forEach(i => { const p = take(i); if (p) pts.push(p); });
  if (pts.length < 3) return null;

  // 볼록헐 → 부드럽게 → 리샘플
  const hull = convexHull(pts);
  return resample(chaikinN(hull, 1), 180);
}

const PoseSilhouetteOverlay: React.FC<Props> = ({
  size,
  mask,
  kp,
  mirrored = true,
  fit = "contain",
  lineWidthCssPx = DEFAULTS.lineWidthCssPx,
  color = DEFAULTS.color,
  smoothLerp = DEFAULTS.smoothLerp,
  smoothIter = DEFAULTS.smoothIter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevPathRef = useRef<Pt[] | null>(null);
  const targetPathRef = useRef<Pt[] | null>(null);
  const animRef = useRef<number | null>(null);

  // 비디오 픽셀 사이즈에 맞춰 캔버스 스케일(좌표계)을 고정
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !size?.w || !size?.h) return;
    c.width = size.w;
    c.height = size.h;
  }, [size?.w, size?.h]);

  // 새 마스크 들어오면 타깃 경로 갱신
  useEffect(() => {
    if (!size?.w || !size?.h) return;
    let next: Pt[] | null = null;

    if (mask && (mask as any).data) {
      const raw = largestContourFromMask(mask, 2, 127);
      if (raw && raw.length >= 8) {
        // 마스크 좌표계 → 비디오 좌표계
        const sx = size.w / mask.width, sy = size.h / mask.height;
        const scaled = raw.map(p => ({ x: p.x * sx, y: p.y * sy }));
        next = resample(chaikinN(scaled, smoothIter), 220);
      }
    }

    // 마스크가 없거나 취소선택 시 포즈 기반 백업
    if (!next) {
      const fb = fallbackSilhouetteFromKP(kp, size);
      if (fb) next = fb;
    }

    targetPathRef.current = next;
    // 애니메이션 루프 가동
    if (animRef.current == null) animRef.current = requestAnimationFrame(drawLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mask, kp, size?.w, size?.h, smoothIter]);

  // 그리기 루프 (이전→목표 경로로 부드럽게 보간)
  const drawLoop = () => {
    const c = canvasRef.current;
    const S = size;
    if (!c || !S?.w || !S?.h) { animRef.current = requestAnimationFrame(drawLoop); return; }

    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);

    const target = targetPathRef.current;
    if (target && target.length >= 3) {
      const prev = prevPathRef.current;
      const curr = resample(target, 220); // 안전히 고정 포인트 수
      const drawPath = lerpPath(prev, curr, smoothLerp);

      // 미러링은 카메라와 동일 트랜스폼
      if (mirrored) {
        ctx.save(); ctx.translate(c.width, 0); ctx.scale(-1, 1);
      }

      ctx.beginPath();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      // CSS px를 디바이스 픽셀에 맞추기: 스타일로 100% contain이므로 여기선 원본 공간 단위=픽셀 그대로 사용
      ctx.lineWidth = Math.max(1, lineWidthCssPx);

      // 경로 그리기
      const first = drawPath[0];
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < drawPath.length; i++) ctx.lineTo(drawPath[i].x, drawPath[i].y);
      ctx.closePath();
      ctx.stroke();

      if (mirrored) ctx.restore();

      prevPathRef.current = drawPath;
    } else {
      prevPathRef.current = null; // 목표가 없으면 리셋
    }

    animRef.current = requestAnimationFrame(drawLoop);
  };

  useEffect(() => {
    animRef.current = requestAnimationFrame(drawLoop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); animRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 컨테이너는 카메라와 동일한 레이어 위에 absolute로 겹침
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 11, // 가이드라인(z=9)보다 위
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: fit,
          borderRadius: 12,
        }}
      />
    </div>
  );
};

export default PoseSilhouetteOverlay;
