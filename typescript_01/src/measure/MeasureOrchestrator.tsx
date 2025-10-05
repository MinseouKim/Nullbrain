// src/measure/MeasureOrchestrator.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import BodyAnalysisCamera from "../components/BodyAnalysisCamera";
import { KP, Size } from "../lib/poseTypes";
import { EMA, MedianBuffer } from "./filters";
import { SegMask, estimateCircumferencesFromMask } from "../lib/segmentation";
import { runSegmentationToMask } from "../lib/segModel"; // <-- 세그 모델 연동

/** 결과 타입 */
export type MeasureResult = {
  height_cm: number;
  cm_per_px?: number;

  baseline?: {
    shoulder_width_px?: number;
    wingspan_px?: number;
    pelvis_width_px?: number;
  };

  lengths_cm?: {
    upperArmL?: number;
    upperArmR?: number;
    forearmL?: number;
    forearmR?: number;
    thighL?: number;
    thighR?: number;
    shankL?: number;
    shankR?: number;
    legL_total?: number;
    legR_total?: number;
    trunk_len?: number;
  };

  circumferences_cm?: {
    upperArmL?: number;
    upperArmR?: number;
    forearmL?: number;
    forearmR?: number;
    thighL?: number;
    thighR?: number;
    shankL?: number;
    shankR?: number;
    chest?: number;
    waist?: number;
    hip?: number;
  };

  angles_deg?: {
    kneeL?: number;
    kneeR?: number;
    hipL_front?: number;
    hipR_front?: number;
    hip_side?: number;
    ankle_side?: number;
    elbowL?: number;
    elbowR?: number;
    shoulder_abd?: number;
    trunk_fwd?: number;
  };

  rom_deg?: {
    kneeL?: number;
    kneeR?: number;
    hipL?: number;
    hipR?: number;
    ankle?: number;
    elbowL?: number;
    elbowR?: number;
    shoulder_abd?: number;
    neck?: number;
  };

  symmetry?: {
    shoulder_delta_px?: number;
    pelvis_delta_px?: number;
    q_angle_L?: number;
    q_angle_R?: number;
  };

  posture?: {
    neck_fwd?: number;
    trunk_fwd?: number;
    varus_valgus_L?: number;
    varus_valgus_R?: number;
  };
};

/** 프롭 */
type Props = { heightCm: number; onDone: (r: MeasureResult) => void };

// ---- MP indices ----
const LM = {
  NOSE: 0,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

// ---- helpers ----
type Pt = { x: number; y: number; v?: number };
const visOK = (kp: KP, i: number, thr = 0.5) => {
  const lm = kp[i];
  return !!lm && (lm.visibility ?? 0) >= thr;
};
const getPx = (kp: KP, i: number, size: Size): Pt | null => {
  const lm = kp[i];
  if (!lm) return null;
  return { x: lm.x * size.w, y: lm.y * size.h, v: lm.visibility };
};
const dist = (A: Pt | null, B: Pt | null) =>
  A && B ? Math.hypot(A.x - B.x, A.y - B.y) : null;

const bboxOf = (pts: (Pt | null)[], margin = 24, size?: Size) => {
  const xs: number[] = [],
    ys: number[] = [];
  pts.forEach((p) => {
    if (p) {
      xs.push(p.x);
      ys.push(p.y);
    }
  });
  if (!xs.length || !ys.length || !size) return null;
  const x1 = Math.max(0, Math.min(...xs) - margin);
  const x2 = Math.min(size.w, Math.max(...xs) + margin);
  const y1 = Math.max(0, Math.min(...ys) - margin);
  const y2 = Math.min(size.h, Math.max(...ys) + margin);
  if (x2 <= x1 || y2 <= y1) return null;
  return { x1, y1, x2, y2 };
};

const angleABC = (A: Pt | null, B: Pt | null, C: Pt | null) => {
  if (!A || !B || !C) return null;
  const v1x = A.x - B.x,
    v1y = A.y - B.y,
    v2x = C.x - B.x,
    v2y = C.y - B.y;
  const n1 = Math.hypot(v1x, v1y),
    n2 = Math.hypot(v2x, v2y);
  if (n1 === 0 || n2 === 0) return null;
  const cos = (v1x * v2x + v1y * v2y) / (n1 * n2);
  const clamped = Math.max(-1, Math.min(1, cos));
  return (Math.acos(clamped) * 180) / Math.PI;
};

// 수직(위) 대비 각
const angleToVertical = (from: Pt | null, to: Pt | null) => {
  if (!from || !to) return null;
  const vx = to.x - from.x,
    vy = to.y - from.y;
  const n = Math.hypot(vx, vy);
  if (!n) return null;
  const cos = -vy / n;
  const clamped = Math.max(-1, Math.min(1, cos));
  return (Math.acos(clamped) * 180) / Math.PI;
};

// ---- UI chip ----
const Chip: React.FC<{ color: string; children: React.ReactNode }> = ({
  color,
  children,
}) => (
  <span
    style={{
      display: "inline-block",
      padding: "6px 10px",
      borderRadius: 999,
      border: "1px solid #ddd",
      background: color,
      color: "#111",
      fontSize: 13,
      fontWeight: 600,
      marginRight: 8,
    }}
  >
    {children}
  </span>
);

// ---- Steps ----
type StepId =
  | "full"
  | "tpose"
  | "side"
  | "ankle_rom"
  | "squat"
  | "elbow_flex"
  | "shoulder_abd"
  | "neck_rom"
  | "done";
type Step = { id: StepId; title: string; instruction: string };

const STEPS: Step[] = [
  {
    id: "full",
    title: "전신 프레임 확보",
    instruction: "정면 전체가 보이게 서세요(머리~발목).",
  },
  {
    id: "tpose",
    title: "T-포즈 기준 수집",
    instruction: "양팔을 좌우로 벌리고 손목이 어깨 이상.",
  },
  {
    id: "side",
    title: "측면 정렬 수집",
    instruction: "옆을 보고 어깨-엉덩이-무릎-발목 한 라인.",
  },
  {
    id: "ankle_rom",
    title: "발목 ROM(도스플렉션) 측정",
    instruction: "벽을 향해 무릎을 앞으로 밀었다가 돌아오기 2~3회.",
  },
  {
    id: "squat",
    title: "스쿼트 ROM",
    instruction: "천천히 앉았다 일어서기 2~3회.",
  },
  {
    id: "elbow_flex",
    title: "팔꿈치 ROM",
    instruction: "한쪽씩 완전 굽힘/신전 2~3회.",
  },
  {
    id: "shoulder_abd",
    title: "어깨 외전 ROM",
    instruction: "양팔 옆→머리 위까지 올렸다 내리기.",
  },
  {
    id: "neck_rom",
    title: "목 ROM",
    instruction: "숙임/뒤젖힘/좌우 기울임 최대 범위.",
  },
  { id: "done", title: "완료", instruction: "요약 확인 후 저장." },
];

const REQUIRED_VISIBLE_GROUPS = {
  fullCore: [
    [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
    [LM.LEFT_HIP, LM.RIGHT_HIP],
    [LM.LEFT_KNEE, LM.RIGHT_KNEE],
    [LM.LEFT_ANKLE, LM.RIGHT_ANKLE],
  ],
  upperCore: [
    [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
    [LM.LEFT_ELBOW, LM.RIGHT_ELBOW],
    [LM.LEFT_WRIST, LM.RIGHT_WRIST],
  ],
};

// ---- Component ----
const MeasureOrchestrator: React.FC<Props> = ({ heightCm, onDone }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [running, setRunning] = useState(true);
  const [focusRoi, setFocusRoi] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  // 자동 진행 끄기(수동 진행) / 조건 프레임
  const AUTO_ADVANCE = false;
  const REQ_FRAMES = { full: 24, tpose: 24, side: 24 };

  // 보정값: 중앙값 + EMA 혼합
  const heightSamples = useRef(new MedianBuffer(31));
  const cmPerPxEma = useRef(new EMA(0.25));
  const [cmPerPx, setCmPerPx] = useState<number | undefined>(undefined);

  // 상태
  const [baseline, setBaseline] = useState<
    MeasureResult["baseline"] | undefined
  >({});
  const [lengths, setLengths] = useState<
    MeasureResult["lengths_cm"] | undefined
  >({});
  const [angles, setAngles] = useState<MeasureResult["angles_deg"] | undefined>(
    {}
  );
  const [rom, setRom] = useState<MeasureResult["rom_deg"] | undefined>({});
  const [symmetry, setSymmetry] = useState<
    MeasureResult["symmetry"] | undefined
  >({});
  const [posture, setPosture] = useState<MeasureResult["posture"] | undefined>(
    {}
  );
  const [circ, setCirc] = useState<
    MeasureResult["circumferences_cm"] | undefined
  >({});

  const lastMask = useRef<SegMask | null>(null);

  // ROM trackers
  const romTrack = useRef({
    kneeL: { min: Infinity, max: -Infinity },
    kneeR: { min: Infinity, max: -Infinity },
    hipL: { min: Infinity, max: -Infinity },
    hipR: { min: Infinity, max: -Infinity },
    ankle: { min: Infinity, max: -Infinity },
    elbowL: { min: Infinity, max: -Infinity },
    elbowR: { min: Infinity, max: -Infinity },
    shoulder_abd: { min: Infinity, max: -Infinity },
    neck: { min: Infinity, max: -Infinity },
  });

  const stableFrames = useRef(0);
  const didFinish = useRef(false);
  const current = STEPS[stepIdx];

  const toCm = useCallback(
    (px: number | null | undefined) =>
      px != null && cmPerPx ? +(px * cmPerPx).toFixed(1) : undefined,
    [cmPerPx]
  );

  const next = useCallback(() => {
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
    stableFrames.current = 0;
  }, []);
  const prev = useCallback(() => {
    setStepIdx((i) => Math.max(0, i - 1));
    stableFrames.current = 0;
  }, []);

  const fullVisible = (kp: KP) =>
    REQUIRED_VISIBLE_GROUPS.fullCore.every(
      ([a, b]) => visOK(kp, a) && visOK(kp, b)
    );
  const upperVisible = (kp: KP) =>
    REQUIRED_VISIBLE_GROUPS.upperCore.every(
      ([a, b]) => visOK(kp, a) && visOK(kp, b)
    );

  // 세그 마스크 수집 (옵션)
  const onSegMask = useCallback((mask: SegMask) => {
    lastMask.current = mask;
  }, []);

  const finalize = useCallback(() => {
    if (didFinish.current) return;
    didFinish.current = true;
    onDone({
      height_cm: heightCm,
      cm_per_px: cmPerPx,
      baseline,
      lengths_cm: Object.keys(lengths ?? {}).length ? lengths : undefined,
      circumferences_cm: Object.keys(circ ?? {}).length ? circ : undefined,
      angles_deg: Object.keys(angles ?? {}).length ? angles : undefined,
      rom_deg: Object.keys(rom ?? {}).length ? rom : undefined,
      symmetry: Object.keys(symmetry ?? {}).length ? symmetry : undefined,
      posture: Object.keys(posture ?? {}).length ? posture : undefined,
    });
  }, [
    angles,
    baseline,
    circ,
    cmPerPx,
    heightCm,
    lengths,
    onDone,
    posture,
    rom,
    symmetry,
  ]);

  const onPose = useCallback(
    ({ kp, size }: { kp: KP; size: Size }) => {
      setFocusRoi(null);

      const nose = getPx(kp, LM.NOSE, size);
      const le = getPx(kp, LM.LEFT_EAR, size),
        re = getPx(kp, LM.RIGHT_EAR, size);
      const ls = getPx(kp, LM.LEFT_SHOULDER, size),
        rs = getPx(kp, LM.RIGHT_SHOULDER, size);
      const lelb = getPx(kp, LM.LEFT_ELBOW, size),
        relb = getPx(kp, LM.RIGHT_ELBOW, size);
      const lw = getPx(kp, LM.LEFT_WRIST, size),
        rw = getPx(kp, LM.RIGHT_WRIST, size);
      const lh = getPx(kp, LM.LEFT_HIP, size),
        rh = getPx(kp, LM.RIGHT_HIP, size);
      const lk = getPx(kp, LM.LEFT_KNEE, size),
        rk = getPx(kp, LM.RIGHT_KNEE, size);
      const la = getPx(kp, LM.LEFT_ANKLE, size),
        ra = getPx(kp, LM.RIGHT_ANKLE, size);

      // 키 픽셀 샘플 → 중앙값 → EMA
      const headTopY = Math.min(
        nose?.y ?? Infinity,
        le?.y ?? Infinity,
        re?.y ?? Infinity
      );
      const ankleBottomY = Math.max(la?.y ?? -Infinity, ra?.y ?? -Infinity);
      const heightPx =
        isFinite(headTopY) && isFinite(ankleBottomY)
          ? ankleBottomY - headTopY
          : null;
      if (heightPx && heightPx > size.h * 0.4) {
        heightSamples.current.push(heightPx);
        const med = heightSamples.current.median();
        if (med) {
          const raw = heightCm / med;
          const smooth = cmPerPxEma.current.update(raw);
          if (smooth) setCmPerPx(+smooth.toFixed(4));
        }
      }

      // === full: 전신 정면 ===
      if (current.id === "full") {
        if (fullVisible(kp) && cmPerPx) {
          // 길이
          const thighLpx = dist(lh, lk),
            thighRpx = dist(rh, rk);
          const shankLpx = dist(lk, la),
            shankRpx = dist(rk, ra);
          const legLpx =
            thighLpx != null && shankLpx != null ? thighLpx + shankLpx : null;
          const legRpx =
            thighRpx != null && shankRpx != null ? thighRpx + shankRpx : null;
          const trunkpx =
            ls && rs && lh && rh
              ? dist(
                  { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 },
                  { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 }
                )
              : null;

          setLengths((prev) => ({
            ...(prev ?? {}),
            thighL: toCm(thighLpx),
            thighR: toCm(thighRpx),
            shankL: toCm(shankLpx),
            shankR: toCm(shankRpx),
            legL_total: toCm(legLpx),
            legR_total: toCm(legRpx),
            trunk_len: toCm(trunkpx),
          }));

          // 비대칭/골반폭
          if (lh && rh) {
            setBaseline((b) => ({
              ...(b ?? {}),
              pelvis_width_px: +Math.hypot(rh.x - lh.x, rh.y - lh.y).toFixed(1),
            }));
            setSymmetry((s) => ({
              ...(s ?? {}),
              pelvis_delta_px: +(rh.y - lh.y).toFixed(1),
            }));
          }
          if (ls && rs) {
            setSymmetry((s) => ({
              ...(s ?? {}),
              shoulder_delta_px: +(rs.y - ls.y).toFixed(1),
            }));
          }

          // Q-angle / varus-valgus
          const qL = angleABC(lh, lk, la),
            qR = angleABC(rh, rk, ra);
          setSymmetry((s) => ({
            ...(s ?? {}),
            q_angle_L: qL != null ? +qL.toFixed(1) : s?.q_angle_L,
            q_angle_R: qR != null ? +qR.toFixed(1) : s?.q_angle_R,
          }));

          const lineAngle = (
            hip: Pt | null,
            ankle: Pt | null,
            knee: Pt | null
          ) => {
            if (!hip || !ankle || !knee) return null;
            const dx = knee.x - (hip.x + ankle.x) / 2;
            const dy = ankle.y - hip.y;
            if (dy <= 0) return null;
            return +((Math.atan2(dx, dy) * 180) / Math.PI).toFixed(1);
          };
          setPosture((p) => ({
            ...(p ?? {}),
            varus_valgus_L: lineAngle(lh, la, lk) ?? p?.varus_valgus_L,
            varus_valgus_R: lineAngle(rh, ra, rk) ?? p?.varus_valgus_R,
          }));

          // 목 정렬
          if (le && re && ls && rs) {
            const earMid: Pt = { x: (le.x + re.x) / 2, y: (le.y + re.y) / 2 };
            const shMid: Pt = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
            const vertTop: Pt = { x: shMid.x, y: shMid.y - 100 };
            const neckAng = angleABC(vertTop, shMid, earMid);
            if (neckAng != null) {
              setPosture((p) => ({
                ...(p ?? {}),
                neck_fwd: +neckAng.toFixed(1),
              }));
            }
          }

          // 세그마스크 → 둘레 추정
          if (cmPerPx && lastMask.current) {
            const est = estimateCircumferencesFromMask(
              lastMask.current,
              cmPerPx,
              size
            );
            if (est) setCirc((c) => ({ ...(c ?? {}), ...est }));
          }

          setFocusRoi(bboxOf([ls, rs, lh, rh, lk, rk, la, ra], 40, size));
          stableFrames.current++;
          if (AUTO_ADVANCE && stableFrames.current > REQ_FRAMES.full) next();
        } else {
          stableFrames.current = 0;
        }
      }

      // === tpose ===
      if (current.id === "tpose") {
        const ok = upperVisible(kp) && ls && rs && lw && rw;
        const wristsUp = ok && lw!.y < ls!.y && rw!.y < rs!.y;
        if (ok && wristsUp) {
          const shoulderW = dist(ls, rs);
          const wingspan = dist(lw, rw);
          setBaseline((b) => ({
            ...(b ?? {}),
            shoulder_width_px:
              shoulderW != null ? +shoulderW.toFixed(1) : b?.shoulder_width_px,
            wingspan_px:
              wingspan != null ? +wingspan.toFixed(1) : b?.wingspan_px,
          }));
          const upperArmL = toCm(dist(ls, lelb)),
            upperArmR = toCm(dist(rs, relb));
          const forearmL = toCm(dist(lelb, lw)),
            forearmR = toCm(dist(relb, rw));
          setLengths((prev) => ({
            ...(prev ?? {}),
            upperArmL,
            upperArmR,
            forearmL,
            forearmR,
          }));

          const elbowLA = angleABC(ls, lelb, lw),
            elbowRA = angleABC(rs, relb, rw);
          const shAbdL = angleToVertical(ls, lelb),
            shAbdR = angleToVertical(rs, relb);
          setAngles((a) => ({
            ...(a ?? {}),
            elbowL: elbowLA != null ? +elbowLA.toFixed(1) : a?.elbowL,
            elbowR: elbowRA != null ? +elbowRA.toFixed(1) : a?.elbowR,
            shoulder_abd:
              shAbdL != null && shAbdR != null
                ? +((shAbdL + shAbdR) / 2).toFixed(1)
                : a?.shoulder_abd,
          }));

          setFocusRoi(bboxOf([ls, rs, lelb, relb, lw, rw], 40, size));
          stableFrames.current++;
          if (AUTO_ADVANCE && stableFrames.current > REQ_FRAMES.tpose) next();
        } else {
          stableFrames.current = 0;
        }
      }

      // === side: 측면 각 ===
      if (current.id === "side") {
        if (ls && rs && lh && rh && rk && ra) {
          const shoulderSpanN = Math.abs(
            (kp[LM.LEFT_SHOULDER]?.x ?? 0) - (kp[LM.RIGHT_SHOULDER]?.x ?? 1)
          );
          const sideOK = shoulderSpanN < 0.05;
          if (sideOK) {
            const shMid: Pt = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
            const hipMid: Pt = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
            const trunkFwd = angleToVertical(hipMid, shMid);
            const hipSide = angleABC(shMid, hipMid, rk);
            const ankleSide = angleToVertical(rk, ra);

            setAngles((a) => ({
              ...(a ?? {}),
              trunk_fwd: trunkFwd != null ? +trunkFwd.toFixed(1) : a?.trunk_fwd,
              hip_side: hipSide != null ? +hipSide.toFixed(1) : a?.hip_side,
              ankle_side:
                ankleSide != null ? +ankleSide.toFixed(1) : a?.ankle_side,
            }));
            setPosture((p) => ({
              ...(p ?? {}),
              trunk_fwd: trunkFwd ?? p?.trunk_fwd,
            }));

            setFocusRoi(bboxOf([ls, rs, lh, rh, rk, ra], 40, size));
            stableFrames.current++;
            if (AUTO_ADVANCE && stableFrames.current > REQ_FRAMES.side) next();
          } else {
            stableFrames.current = 0;
          }
        } else {
          stableFrames.current = 0;
        }
      }

      // === ankle_rom ===
      if (current.id === "ankle_rom") {
        const ankleA = angleToVertical(rk, ra);
        if (ankleA != null && !isNaN(ankleA)) {
          const t = romTrack.current.ankle;
          romTrack.current.ankle = {
            min: Math.min(t.min, ankleA),
            max: Math.max(t.max, ankleA),
          };
        }
        setFocusRoi(bboxOf([rk, ra], 40, size));
      }

      // === squat ===
      if (current.id === "squat") {
        const kneeLA = angleABC(lh, lk, la);
        const kneeRA = angleABC(rh, rk, ra);
        const hipLA = ls && lh && lk ? angleABC(ls, lh, lk) : null;
        const hipRA = rs && rh && rk ? angleABC(rs, rh, rk) : null;
        const upd = (t: { min: number; max: number }, v: number | null) =>
          v == null ? t : { min: Math.min(t.min, v), max: Math.max(t.max, v) };
        romTrack.current.kneeL = upd(romTrack.current.kneeL, kneeLA);
        romTrack.current.kneeR = upd(romTrack.current.kneeR, kneeRA);
        romTrack.current.hipL = upd(romTrack.current.hipL, hipLA);
        romTrack.current.hipR = upd(romTrack.current.hipR, hipRA);
        setFocusRoi(bboxOf([lh, rh, lk, rk, la, ra], 40, size));
      }

      // === elbow_flex ===
      if (current.id === "elbow_flex") {
        const eL = angleABC(ls, lelb, lw);
        const eR = angleABC(rs, relb, rw);
        const upd = (t: { min: number; max: number }, v: number | null) =>
          v == null ? t : { min: Math.min(t.min, v), max: Math.max(t.max, v) };
        romTrack.current.elbowL = upd(romTrack.current.elbowL, eL);
        romTrack.current.elbowR = upd(romTrack.current.elbowR, eR);
        setFocusRoi(bboxOf([ls, rs, lelb, relb, lw, rw], 40, size));
      }

      // === shoulder_abd ===
      if (current.id === "shoulder_abd") {
        const abdL = angleToVertical(ls, lelb);
        const abdR = angleToVertical(rs, relb);
        const mean = abdL != null && abdR != null ? (abdL + abdR) / 2 : null;
        if (mean != null) {
          const t = romTrack.current.shoulder_abd;
          romTrack.current.shoulder_abd = {
            min: Math.min(t.min, mean),
            max: Math.max(t.max, mean),
          };
        }
        setFocusRoi(bboxOf([ls, rs, lelb, relb], 40, size));
      }

      // === neck_rom ===
      if (current.id === "neck_rom") {
        if (le && re && ls && rs) {
          const earMid: Pt = { x: (le.x + re.x) / 2, y: (le.y + re.y) / 2 };
          const shMid: Pt = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
          const vertTop: Pt = { x: shMid.x, y: shMid.y - 100 };
          const neckAng = angleABC(vertTop, shMid, earMid);
          if (neckAng != null) {
            const t = romTrack.current.neck;
            romTrack.current.neck = {
              min: Math.min(t.min, neckAng),
              max: Math.max(t.max, neckAng),
            };
          }
          setFocusRoi(bboxOf([le, re, ls, rs], 80, size));
        }
      }

      // === done ===
      if (current.id === "done") {
        const diff = (t: { min: number; max: number }) =>
          isFinite(t.min) && isFinite(t.max)
            ? +Math.max(0, t.max - t.min).toFixed(1)
            : undefined;

        setRom((prev) => ({
          ...(prev ?? {}),
          kneeL: diff(romTrack.current.kneeL),
          kneeR: diff(romTrack.current.kneeR),
          hipL: diff(romTrack.current.hipL),
          hipR: diff(romTrack.current.hipR),
          ankle: diff(romTrack.current.ankle),
          elbowL: diff(romTrack.current.elbowL),
          elbowR: diff(romTrack.current.elbowR),
          shoulder_abd: diff(romTrack.current.shoulder_abd),
          neck: diff(romTrack.current.neck),
        }));
        finalize();
      }
    },
    [current.id, finalize, heightCm, next, toCm, cmPerPx]
  );

  const badge = useMemo(() => {
    const map: Record<StepId, React.ReactNode> = {
      full: <Chip color="#e7f5ff">전신 프레임</Chip>,
      tpose: <Chip color="#e6ffed">T-포즈</Chip>,
      side: <Chip color="#f1f3f5">측면 정렬</Chip>,
      ankle_rom: <Chip color="#e0f2f1">발목 ROM</Chip>,
      squat: <Chip color="#fff3bf">스쿼트 ROM</Chip>,
      elbow_flex: <Chip color="#ffe3e3">팔꿈치 ROM</Chip>,
      shoulder_abd: <Chip color="#e0f7fa">어깨 ROM</Chip>,
      neck_rom: <Chip color="#fce4ec">목 ROM</Chip>,
      done: <Chip color="#ddd">완료</Chip>,
    };
    return map[STEPS[stepIdx].id];
  }, [stepIdx]);

  // 버튼에서 ROM 확정
  const finalizeStepRoms = () => {
    const diff = (t: { min: number; max: number }) =>
      isFinite(t.min) && isFinite(t.max)
        ? +Math.max(0, t.max - t.min).toFixed(1)
        : undefined;
    const id = STEPS[stepIdx].id;

    if (id === "ankle_rom") {
      setRom((r) => ({ ...(r ?? {}), ankle: diff(romTrack.current.ankle) }));
    }
    if (id === "squat") {
      setRom((r) => ({
        ...(r ?? {}),
        kneeL: diff(romTrack.current.kneeL),
        kneeR: diff(romTrack.current.kneeR),
        hipL: diff(romTrack.current.hipL),
        hipR: diff(romTrack.current.hipR),
      }));
    }
    if (id === "elbow_flex") {
      setRom((r) => ({
        ...(r ?? {}),
        elbowL: diff(romTrack.current.elbowL),
        elbowR: diff(romTrack.current.elbowR),
      }));
    }
    if (id === "shoulder_abd") {
      setRom((r) => ({
        ...(r ?? {}),
        shoulder_abd: diff(romTrack.current.shoulder_abd),
      }));
    }
    if (id === "neck_rom") {
      setRom((r) => ({ ...(r ?? {}), neck: diff(romTrack.current.neck) }));
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        gap: 24,
        height: "100%",
      }}
    >
      {/* Camera */}
      <div
        style={{
          position: "relative",
          border: "1px solid #e0e0e0",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <BodyAnalysisCamera
          running={running}
          onPose={onPose}
          focusRoi={focusRoi}
          mirrored
          onSegMask={onSegMask}
          // 세그멘테이션 모델 연결
          getSegmentation={runSegmentationToMask}
        />
      </div>

      {/* Side */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: 12,
            padding: 16,
            background: "#fff",
          }}
        >
          <div style={{ marginBottom: 8 }}>{badge}</div>
          <h3 style={{ margin: "4px 0 12px 0" }}>{STEPS[stepIdx].title}</h3>
          <p style={{ margin: 0, color: "#555", lineHeight: 1.6 }}>
            {STEPS[stepIdx].instruction}
          </p>
        </div>

        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: 12,
            padding: 16,
            background: "#fff",
          }}
        >
          <h4 style={{ marginTop: 0 }}>실시간 측정값</h4>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              color: "#333",
              lineHeight: 1.8,
            }}
          >
            <li>
              보정: <b>{cmPerPx ? `${cmPerPx.toFixed(4)} cm/px` : "-"}</b>
            </li>
            <li>
              기준(어깨/윙스팬/골반):{" "}
              <b>
                {baseline?.shoulder_width_px ?? "-"}px /{" "}
                {baseline?.wingspan_px ?? "-"}px /{" "}
                {baseline?.pelvis_width_px ?? "-"}px
              </b>
            </li>
            {circ && (circ.chest || circ.waist || circ.hip) && (
              <li>
                가슴/허리/엉덩이(마스크):{" "}
                <b>
                  {circ?.chest ?? "-"} / {circ?.waist ?? "-"} /{" "}
                  {circ?.hip ?? "-"} cm
                </b>
              </li>
            )}
          </ul>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 10,
              border: "1px solid #ddd",
              background: running ? "#ffe8cc" : "#d3f9d8",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {running ? "일시정지" : "다시 시작"}
          </button>
          <button
            onClick={prev}
            disabled={stepIdx === 0}
            style={{
              padding: 14,
              borderRadius: 10,
              border: "1px solid #ddd",
              background: stepIdx === 0 ? "#f1f3f5" : "#fff",
              cursor: stepIdx === 0 ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            이전
          </button>
          <button
            onClick={() => {
              finalizeStepRoms();
              next();
            }}
            disabled={stepIdx === STEPS.length - 1}
            style={{
              padding: 14,
              borderRadius: 10,
              border: "1px solid #ddd",
              background: stepIdx === STEPS.length - 1 ? "#f1f3f5" : "#fff",
              cursor: stepIdx === STEPS.length - 1 ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeasureOrchestrator;
