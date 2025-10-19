
import React, { useCallback, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import BodyAnalysisCamera from "../components/BodyAnalysisCamera";
import { KP, Size } from "../poseLib/poseTypes";
import { EMA, MedianBuffer } from "./filters";
import { SegMask, estimateCircumferencesFromMask } from "../poseLib/segmentation";
import { runSegmentationToMask } from "../poseLib/segModel";

/* =========================
  Utilities: Filters
========================= */
class LowPass {
  private y = 0; private s = false; private a = 0;
  constructor(a: number) { this.a = a; }
  setAlpha(a:number){ this.a = a; }
  filter(x:number){ if(!this.s){ this.s = true; this.y = x; return x; } this.y = this.a*x + (1-this.a)*this.y; return this.y; }
  last(){ return this.y; }
}
const TWO_PI = 2*Math.PI;
const alpha = (cutoff:number, dt:number)=> {
  const tau = 1/(TWO_PI*cutoff);
  return 1/(1 + tau/dt);
};
class OneEuro {
  private minCutoff:number; private beta:number; private dCutoff:number;
  private x:LowPass; private dx:LowPass; private lastTs:number | null = null;
  constructor(minCutoff=1.3, beta=0.007, dCutoff=1.0) {
    this.minCutoff = minCutoff; this.beta = beta; this.dCutoff = dCutoff;
    this.x = new LowPass(1); this.dx = new LowPass(1);
  }
  update(x:number, nowMs:number){
    if(this.lastTs==null){ this.lastTs = nowMs; this.x.filter(x); this.dx.filter(0); return x; }
    const dt = Math.max((nowMs - this.lastTs)/1000, 1/120);
    this.lastTs = nowMs;
    const dx = (x - (this.x.last() ?? x)) / dt;
    const ad = alpha(this.dCutoff, dt);
    this.dx.setAlpha(ad);
    const edx = this.dx.filter(dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    const a = alpha(cutoff, dt);
    this.x.setAlpha(a);
    return this.x.filter(x);
  }
}

// Savitzky–Golay (length 7)
class SG7 {
  private buf:number[] = [];
  private readonly w = [-2, 3, 6, 7, 6, 3, -2].map(v=>v/21);
  update(v:number){
    this.buf.push(v);
    if(this.buf.length < 7) return v;
    if(this.buf.length > 7) this.buf.shift();
    let s = 0;
    for(let i=0;i<7;i++) s += this.buf[i]*this.w[i];
    return s;
  }
}

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
    upperArmL?: number; upperArmR?: number;
    forearmL?: number;  forearmR?: number;
    thighL?: number;    thighR?: number;
    shankL?: number;    shankR?: number;
    legL_total?: number; legR_total?: number;
    trunk_len?: number;
    /** ✅ 새로 추가: 손끝-바닥 최소거리(cm) */
    fingertip_to_floor?: number;
  };
  circumferences_cm?: {
    upperArmL?: number; upperArmR?: number;
    forearmL?: number;  forearmR?: number;
    thighL?: number;    thighR?: number;
    shankL?: number;    shankR?: number;
    chest?: number; waist?: number; hip?: number;
  };
  angles_deg?: {
    kneeL?: number; kneeR?: number;
    hipL_front?: number; hipR_front?: number;
    hip_side?: number;
    ankle_side?: number;
    elbowL?: number; elbowR?: number;
    shoulder_abd?: number;
    trunk_fwd?: number;
  };
  rom_deg?: {
    kneeL?: number; kneeR?: number;
    hipL?: number;  hipR?: number;
    elbowL?: number; elbowR?: number;
    shoulder_abd?: number;
    neck?: number;
    /** ✅ 새로 추가: 몸통(허리) 전굴 ROM(°) */
    trunk?: number;
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

// ---- MediaPipe indices (Pose 33) ----
const LM = {
  NOSE: 0,
  LEFT_EAR: 7, RIGHT_EAR: 8,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
} as const;

// ---- helpers ----
type Pt = { x: number; y: number; v?: number };
const visOK = (kp: KP, i: number, thr = 0.3) => !!kp[i] && (kp[i]!.visibility ?? 0) >= thr;
const dist = (A: Pt | null, B: Pt | null) => (A && B) ? Math.hypot(A.x - B.x, A.y - B.y) : null;
const clamp = (v:number, lo:number, hi:number)=> Math.max(lo, Math.min(hi, v));

const bboxOf = (pts: (Pt | null)[], margin = 24, size?: Size) => {
  const xs: number[] = [], ys: number[] = [];
  pts.forEach(p=>{ if (p) { xs.push(p.x); ys.push(p.y); } });
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
  const v1x = A.x - B.x, v1y = A.y - B.y, v2x = C.x - B.x, v2y = C.y - B.y;
  const n1 = Math.hypot(v1x, v1y), n2 = Math.hypot(v2x, v2y);
  if (n1 === 0 || n2 === 0) return null;
  const cos = (v1x*v2x + v1y*v2y) / (n1*n2);
  const clamped = clamp(cos, -1, 1);
  return (Math.acos(clamped) * 180) / Math.PI;
};

// 수직 대비 각(위쪽이 0°)
const angleToVertical = (from: Pt | null, to: Pt | null) => {
  if (!from || !to) return null;
  const vx = to.x - from.x, vy = to.y - from.y;
  const n = Math.hypot(vx, vy); if (!n) return null;
  const cos = (-vy) / n;
  const clamped = clamp(cos, -1, 1);
  return (Math.acos(clamped) * 180) / Math.PI;
};

// === 이동창/가동 관련 ===
type MotionWin = { t:number[]; v:number[] };
type MotionKey = "ankle" | "knee" | "hip" | "elbow" | "shoulder" | "neck";

/** 🔧 완화된 게이트 파라미터 */
const MOTION_WIN_MS = 1000;
const HOLD_MS = 2000;
const ARMING_MS = 600;
const MIN_STEP_TIME_MS = 1500;
const COOLDOWN_MS = 800;
const PREHOLD_NEAREND_MS = 250;

const recentDisp = (win: MotionWin, recentMs = 1200) => {
  const n = win.v.length; if (!n) return 0;
  const now = win.t[n-1]; let lo = Infinity, hi = -Infinity;
  for (let i=n-1; i>=0 && (now - win.t[i] <= recentMs); i--) {
    const v = win.v[i];
    if (v < lo) lo = v; if (v > hi) hi = v;
  }
  return (isFinite(lo) && isFinite(hi)) ? (hi - lo) : 0;
};

const winOf = (key: MotionKey, ref: {
  ankle: MotionWin; knee: MotionWin; hip: MotionWin; elbow: MotionWin; shoulder: MotionWin; neck: MotionWin;
}) =>
  key==="ankle"   ? ref.ankle   :
  key==="knee"    ? ref.knee    :
  key==="hip"     ? ref.hip     :
  key==="elbow"   ? ref.elbow   :
  key==="shoulder"? ref.shoulder: ref.neck;

const needVis = (kp: KP, idx: number[], thr = 0.55) =>
  idx.every(i => (kp[i]?.visibility ?? 0) >= thr);

// 정면 정렬 체크(완화)
const frontFacingOK = (
  leVis: number, reVis: number,
  noseX: number | null,
  shMidX: number,
  frameW: number
) => {
  const earGap = Math.abs(leVis - reVis);
  const noseOffN = noseX==null ? 0 : Math.abs(noseX - shMidX) / frameW;
  return earGap < 0.30 && noseOffN < 0.10;
};

// --- Side-facing heuristic (완화) ---
const SIDE_THRESH = {
  shoulderOverlapN: 0.060,
  hipOverlapN:      0.070,
  earDomDiff:       0.25,
  noseOffN:         0.12,
  minEarVis:        0.45,
  minCoreVis:       0.38,
};

type SideCheck = { ok:boolean; useRight:boolean; why?:string };

const sideProfileCheck = (kp: KP): SideCheck => {
  const ls = kp[LM.LEFT_SHOULDER], rs = kp[LM.RIGHT_SHOULDER];
  const lh = kp[LM.LEFT_HIP],      rh = kp[LM.RIGHT_HIP];
  const lk = kp[LM.LEFT_KNEE],     rk = kp[LM.RIGHT_KNEE];
  const la = kp[LM.LEFT_ANKLE],    ra = kp[LM.RIGHT_ANKLE];

  const coreVisOK =
    (ls?.visibility ?? 0) >= SIDE_THRESH.minCoreVis &&
    (rs?.visibility ?? 0) >= SIDE_THRESH.minCoreVis &&
    (lh?.visibility ?? 0) >= SIDE_THRESH.minCoreVis &&
    (rh?.visibility ?? 0) >= SIDE_THRESH.minCoreVis;

  if (!coreVisOK) return { ok:false, useRight:true, why:"core vis low" };

  const shSpanN = Math.abs((ls?.x ?? 0) - (rs?.x ?? 1));
  const hipSpanN= Math.abs((lh?.x ?? 0) - (rh?.x ?? 1));
  const overlapOK = (shSpanN <= SIDE_THRESH.shoulderOverlapN) && (hipSpanN <= SIDE_THRESH.hipOverlapN);

  const rightVis = (rk?.visibility ?? 0) + (ra?.visibility ?? 0) + (rh?.visibility ?? 0);
  const leftVis  = (lk?.visibility ?? 0) + (la?.visibility ?? 0) + (lh?.visibility ?? 0);
  const useRight = rightVis >= leftVis;

  return { ok: overlapOK, useRight };
};

// ---- 임계값들 ----
const AMP_THR = { ankle: 15, knee: 45, hip: 40, elbow: 35, shoulder_abd: 50, neck: 25 };
const STD_THR = { ankle: 3, squat: 4, elbow: 3, shoulder: 4, neck: 3 };
const VEL_THR = { ankle: 30, squat: 40, elbow: 35, shoulder: 40, neck: 30 };
const MOVING_VEL_MIN = { ankle: 120, knee: 140, hip: 120, elbow: 140, shoulder: 140, neck: 110 };
const MOVING_DISP_MIN = { ankle: 18, knee: 22, hip: 22, elbow: 18, shoulder: 24, neck: 14 };
const STATIC_STD = 2.6;
const STATIC_VEL = 14;
const MIN_SAMPLES = 5;
const SEG_ENERGY_ARM_THR = 0.010;
const REP_TARGET = 3;
const MIN_PEAK_MS = { ankle: 280, squat: 480, elbow: 280, shoulder: 320, neck: 240 };

/** ✅ 바닥 근접 판정 임계(cm). cm/px 미보정 시 화면높이 5% 대체 */
const FINGER_FLOOR_THR_CM = 10;

const MAX_SCALE_JUMP = 0.12;

// 반복 상태
type RepState = {
  prevVal: number | null;
  prevDir: -1 | 0 | 1;
  lastExtVal: number | null;
  lastExtTime: number;
  half: boolean;
  count: number;
};
const initRep = (): RepState => ({
  prevVal: null, prevDir: 0, lastExtVal: null, lastExtTime: 0, half: false, count: 0,
});

// ---- UI chip ----
const Chip: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span style={{ display:"inline-block", padding:"6px 10px", borderRadius:999, border:"1px solid #ddd",
    background:color, color:"#111", fontSize:13, fontWeight:600, marginRight:8 }}>{children}</span>
);

// ---- Steps ----
export type StepId =
  | "full" | "tpose" | "side" | "waist_flex"
  | "squat" | "elbow_flex" | "shoulder_abd" | "neck_rom"
  | "done";
type Step = { id: StepId; title: string; instruction: string };

const STEPS: Step[] = [
  { id:"full",        title:"전신 프레임 확보",     instruction:"정면 전체가 보이게 서세요(머리~발 포함). 2초 유지!" },
  { id:"tpose",       title:"T-포즈 기준 수집",     instruction:"양팔을 좌우로 쫙 펴고 손목이 어깨 이상. 2초 유지!" },
  { id:"side",        title:"측면 정렬 수집",       instruction:"옆을 보고 어깨-골반이 겹치게 정렬. 2초 유지!" },
  { id:"waist_flex",  title:"허리 유연성(전굴)",     instruction:"측면으로 선 뒤, 허리를 굽혀 손이 바닥에 닿게 내려가 2초 유지!" },
  { id:"squat",       title:"스쿼트 ROM",           instruction:"앉았다 일어서기 3회 반복해 주세요." },
  { id:"elbow_flex",  title:"팔꿈치 ROM",           instruction:"굽혔다 폈다 3회(한쪽씩 해도 OK)." },
  { id:"shoulder_abd",title:"어깨 외전 ROM",        instruction:"옆→머리 위까지 3회 반복해 주세요." },
  { id:"neck_rom",    title:"목 ROM",               instruction:"카메라에 상체만 보이게 가까이 오세요. 숙임/뒤젖힘/기울임을 합쳐 3회." },
  { id:"done",        title:"완료",                 instruction:"요약 확인 후 저장." },
];

// 이동창 유틸
const pushWin = (win: MotionWin, t: number, v: number, winMs: number) => {
  win.t.push(t); win.v.push(v);
  while (win.t.length && (t - win.t[0] > winMs)) { win.t.shift(); win.v.shift(); }
};
const statsWin = (win: MotionWin) => {
  const n = win.v.length;
  if (n < 2) return { std: 0, maxVel: 0, n, instVel: 0 };
  const mean = win.v.reduce((a,b)=>a+b,0)/n;
  const std = Math.sqrt(win.v.reduce((a,b)=>a+(b-mean)*(b-mean),0)/n);
  let maxVel = 0;
  for (let i=1;i<n;i++){
    const dt = (win.t[i]-win.t[i-1]) / 1000;
    if (dt>0) {
      const vel = Math.abs((win.v[i]-win.v[i-1]) / dt);
      if (vel > maxVel) maxVel = vel;
    }
  }
  const dtLast = (win.t[n-1]-win.t[n-2]) / 1000;
  const instVel = dtLast>0 ? Math.abs((win.v[n-1]-win.v[n-2]) / dtLast) : 0;
  return { std, maxVel, n, instVel };
};

// 포즈 품질(visibility 기반 간단 지표)
const poseQuality = (kp:KP, indices:number[], thr=0.55)=>{
  const vis = indices.map(i => kp[i]?.visibility ?? 0);
  return vis.filter(v=>v>=thr).length / Math.max(1, vis.length);
};

const maxMerge = (oldV?: number, newV?: number) =>
  newV == null ? oldV : (oldV == null ? newV : Math.max(oldV, newV));


/* =========================
  Component
========================= */

const MeasureOrchestrator: React.FC<Props> = ({ heightCm, onDone }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [running, setRunning] = useState(true);
  const [focusRoi, setFocusRoi] = useState<{x1:number;y1:number;x2:number;y2:number}|null>(null);

  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState<string>("필수 부위 인식 중…");
  const holdStartMs = useRef<number | null>(null);
  const gateArmedAt = useRef<number | null>(null);
  const lastCommitAt = useRef(0);
  const stepStartedAt = useRef(performance.now());
  const committingRef = useRef(false);
  const holdScaleRef = useRef<number | undefined>(undefined);
  const waistMinHandFloorPx = useRef<number>(Infinity);



  // 보정
  const heightSamples = useRef(new MedianBuffer(31));
  const cmPerPxEma = useRef(new EMA(0.25));
  const [cmPerPx, setCmPerPx] = useState<number | undefined>(undefined);

  // 상태 누적
  const [baseline, setBaseline] = useState<MeasureResult["baseline"] | undefined>({});
  const [lengths,  setLengths]  = useState<MeasureResult["lengths_cm"] | undefined>({});
  const [angles,   setAngles]   = useState<MeasureResult["angles_deg"] | undefined>({});
  const [rom,      setRom]      = useState<MeasureResult["rom_deg"] | undefined>({});
  const [symmetry, setSymmetry] = useState<MeasureResult["symmetry"] | undefined>({});
  const [posture,  setPosture]  = useState<MeasureResult["posture"] | undefined>({});
  const [circ,     setCirc]     = useState<MeasureResult["circumferences_cm"] | undefined>({});

  const lastMask = useRef<SegMask | null>(null);

  // 실시간 패널용
  const lastKp = useRef<KP>([]);
  const lastSize = useRef<Size>({ w: 0, h: 0 });
  const pulseRef = useRef(0);
  const [uiPulse, setUiPulse] = useState(0);

  // 반복계수
  const repRef = useRef({
    ankle: initRep(),
    squat: initRep(),
    elbow: initRep(),
    shoulder: initRep(),
    neck: initRep(),
  });

  const cmPerPxPrevRef = useRef<number | undefined>(undefined);
useEffect(() => { cmPerPxPrevRef.current = cmPerPx; }, [cmPerPx]);


  const updateRep = useCallback((
    key: keyof typeof repRef.current,
    val: number,
    ampThr: number,
    minMs: number
  ) => {
    const s = repRef.current[key];
    const t = performance.now();

    if (val == null || Number.isNaN(val)) return s.count;
    if (s.prevVal == null) { s.prevVal = val; s.lastExtVal = val; s.lastExtTime = t; return s.count; }

    const dv = val - s.prevVal;
    const dir: -1 | 0 | 1 = dv === 0 ? s.prevDir : (dv > 0 ? 1 : -1);

    if (s.prevDir !== 0 && dir !== s.prevDir) {
      const peakVal = s.prevVal!;
      const amp = Math.abs(peakVal - (s.lastExtVal ?? peakVal));
      const dt = t - (s.lastExtTime || 0);
      if (amp >= ampThr && dt >= minMs) {
        s.half = !s.half;
        s.lastExtVal = peakVal;
        s.lastExtTime = t;
        if (!s.half) s.count += 1;
      }
    }

    s.prevDir = dir;
    s.prevVal = val;
    return s.count;
  }, []);

  const resetReps = useCallback(() => {
    (Object.keys(repRef.current) as (keyof typeof repRef.current)[]).forEach(k => {
      repRef.current[k] = initRep();
    });
  }, []);

  // ROM trackers
  const romTrack = useRef({
    /** ✅ 허리 전굴 */
    trunk:{min:Infinity,max:-Infinity},
    kneeL:{min:Infinity,max:-Infinity}, kneeR:{min:Infinity,max:-Infinity},
    hipL:{min:Infinity,max:-Infinity},  hipR:{min:Infinity,max:-Infinity},
    ankle:{min:Infinity,max:-Infinity},
    elbowL:{min:Infinity,max:-Infinity}, elbowR:{min:Infinity,max:-Infinity},
    shoulder_abd:{min:Infinity,max:-Infinity},
    neck:{min:Infinity,max:-Infinity},
  });

  /** ✅ 허리 전굴용: 손-바닥 최소거리(cm) */
  const waistMinHandFloorCm = useRef<number>(Infinity);

  // 최근 “움직임 증거”
  const lastHighVelAt = useRef({
    ankle: 0, knee: 0, hip: 0, elbow: 0, shoulder: 0, neck: 0,
  });

  // 1초 이동창
  const motionWinRef = useRef({
    ankle:   { t:[] as number[], v:[] as number[] },
    knee:    { t:[] as number[], v:[] as number[] },
    hip:     { t:[] as number[], v:[] as number[] },
    elbow:   { t:[] as number[], v:[] as number[] },
    shoulder:{ t:[] as number[], v:[] as number[] },
    neck:    { t:[] as number[], v:[] as number[] },
    trunk:   { t:[] as number[], v:[] as number[] },
  });

  // 스냅샷
  const stepSnaps = useRef<Partial<Record<StepId, MeasureResult>>>({});
  const didFinish = useRef(false);
  const current = STEPS[stepIdx];

  // 단계별 Arming 상태
  const armedRef = useRef({
    tpose:false, side:false,
    ankle:false, squat:false, elbow:false, shoulder:false, neck:false
  });
  const sideArmingSince = useRef<number|null>(null);

  // anti-false-positive
  const segEnergy = useRef(0);
  const prevMask = useRef<SegMask|null>(null);
  const nearEndAccumMsRef = useRef(0);
  const lastGateTsRef = useRef<number | null>(null);

  // Keypoint smoothing
  const oeX = useRef<Record<number, OneEuro>>({});
  const oeY = useRef<Record<number, OneEuro>>({});
  const getOE = (map:Record<number, OneEuro>, i:number)=> (map[i] ??= new OneEuro(1.4, 0.015, 1.0));

  // Angle smoothing
  const sgBank = useRef<Record<string, SG7>>({});
  const sg = (k:string)=> (sgBank.current[k] ??= new SG7());

  const toCm = useCallback((px: number | null | undefined) =>
    (px != null && cmPerPx) ? +(px * cmPerPx).toFixed(1) : undefined, [cmPerPx]);

  const prev = useCallback(()=> setStepIdx(i=>Math.max(0, i-1)),[]);
  const clearWin = (w: MotionWin) => { w.t.length = 0; w.v.length = 0; };
  const clearAllWins = () => Object.values(motionWinRef.current).forEach(clearWin);
  const resetRange = (r:{min:number,max:number}) => { r.min = Infinity; r.max = -Infinity; };

  // 스텝 바뀔 때 초기화
  useEffect(()=>{
    holdStartMs.current = null;
    gateArmedAt.current = null;
    setProgress(0);
    setProgressText("자세 인식 대기 중…");
    clearAllWins();
    stepStartedAt.current = performance.now();

    const id = STEPS[stepIdx].id;
    if (id==="waist_flex") { resetRange(romTrack.current.trunk); waistMinHandFloorCm.current = Infinity; }
    if (id==="squat") { resetRange(romTrack.current.kneeL); resetRange(romTrack.current.kneeR); resetRange(romTrack.current.hipL); resetRange(romTrack.current.hipR); }
    if (id==="elbow_flex") { resetRange(romTrack.current.elbowL); resetRange(romTrack.current.elbowR); }
    if (id==="shoulder_abd") resetRange(romTrack.current.shoulder_abd);
    if (id==="neck_rom") resetRange(romTrack.current.neck);

    const now = performance.now();
    lastHighVelAt.current = { ankle: now-5000, knee: now-5000, hip: now-5000, elbow: now-5000, shoulder: now-5000, neck: now-5000 };

    armedRef.current = { tpose:false, side:false, ankle:false, squat:false, elbow:false, shoulder:false, neck:false };
    sideArmingSince.current = null;

    nearEndAccumMsRef.current = 0;
    lastGateTsRef.current = null;
    resetReps();

  },[stepIdx, resetReps]);

  // 세그 마스크 기반 움직임 에너지
  const getMaskWH = (m:SegMask)=> {
    const anyM:any = m as any;
    const w:number = anyM.w ?? anyM.width ?? 0;
    const h:number = anyM.h ?? anyM.height ?? 0;
    return { w, h };
  };
  const segDiffFrac = (a:SegMask, b:SegMask) => {
    let diff = 0, tot = 0;
    const step = 4;
    const { w:wa, h:ha } = getMaskWH(a);
    const { w:wb, h:hb } = getMaskWH(b);
    const w = Math.min(wa, wb), h = Math.min(ha, hb);
    if (!w || !h) return 0;
    const da = (a as any).data as Uint8Array | Uint8ClampedArray;
    const db = (b as any).data as Uint8Array | Uint8ClampedArray;
    for (let y=0; y<h; y+=step) for (let x=0; x<w; x+=step) {
      const ia = da[y*wa + x], ib = db[y*wb + x];
      if (ia>=128 || ib>=128) { tot++; if ((ia>=128)!==(ib>=128)) diff++; }
    }
    return tot ? diff/tot : 0;
  };

  const onSegMask = useCallback((mask: SegMask)=>{
    if (prevMask.current) {
      const d = segDiffFrac(mask, prevMask.current);
      segEnergy.current = 0.85*segEnergy.current + 0.15*d; // EMA
    }
    prevMask.current = mask;
    lastMask.current = mask;
  },[]);

  // 스냅샷/머지
  const nonEmpty = <T extends object | undefined>(o: T): T | undefined =>
    (o && Object.values(o as any).some(v => v != null)) ? o : undefined;

  const makeSnapshot = useCallback((): MeasureResult => ({
    height_cm: heightCm, cm_per_px: cmPerPx,
    baseline: nonEmpty(baseline),
    lengths_cm: nonEmpty(lengths),
    circumferences_cm: nonEmpty(circ),
    angles_deg: nonEmpty(angles),
    rom_deg: nonEmpty(rom),
    symmetry: nonEmpty(symmetry),
    posture: nonEmpty(posture),
  }), [heightCm, cmPerPx, baseline, lengths, circ, angles, rom, symmetry, posture]);

  const mergeNumeric = (a?: number, b?: number) => (a!=null && b!=null) ? +(((a+b)/2).toFixed(1)) : (a ?? b);
  const mergeObj = (A?: any, B?: any) => {
    if (!A && !B) return undefined;
    const out:any = {}; const keys = new Set([...(A?Object.keys(A):[]), ...(B?Object.keys(B):[])]);
    keys.forEach(k=>{
      const va=A?.[k], vb=B?.[k];
      if (typeof va === "number" || typeof vb === "number") out[k] = mergeNumeric(va,vb);
      else if ((va && typeof va === "object") || (vb && typeof vb === "object")) out[k] = mergeObj(va,vb);
      else out[k] = va ?? vb;
    });
    return nonEmpty(out);
  };
  const mergeResults = (A: MeasureResult, B: MeasureResult): MeasureResult => ({
    height_cm: A.height_cm ?? B.height_cm,
    cm_per_px: mergeNumeric(A.cm_per_px, B.cm_per_px),
    baseline: mergeObj(A.baseline, B.baseline),
    lengths_cm: mergeObj(A.lengths_cm, B.lengths_cm),
    circumferences_cm: mergeObj(A.circumferences_cm, B.circumferences_cm),
    angles_deg: mergeObj(A.angles_deg, B.angles_deg),
    rom_deg: mergeObj(A.rom_deg, B.rom_deg),
    symmetry: mergeObj(A.symmetry, B.symmetry),
    posture: mergeObj(A.posture, B.posture),
  });
  const mergeAllSnaps = () => {
    const snaps = Object.values(stepSnaps.current).filter(Boolean) as MeasureResult[];
    if (!snaps.length) return makeSnapshot();
    return snaps.reduce((acc, cur) => mergeResults(acc, cur));
  };
  const applyMergedToState = (m: MeasureResult) => {
    if (m.baseline) setBaseline(m.baseline);
    if (m.lengths_cm) setLengths(m.lengths_cm);
    if (m.circumferences_cm) setCirc(m.circumferences_cm);
    if (m.angles_deg) setAngles(m.angles_deg);
    if (m.rom_deg) setRom(m.rom_deg);
    if (m.symmetry) setSymmetry(m.symmetry);
    if (m.posture) setPosture(m.posture);
    if (m.cm_per_px) setCmPerPx(m.cm_per_px);
  };

  const finalize = useCallback(()=>{
    if (didFinish.current) return;
    didFinish.current = true;
    const merged = mergeResults(mergeAllSnaps(), makeSnapshot());
    onDone(merged);
  },[onDone, makeSnapshot]);

  const finalizeStepRoms = useCallback((id: StepId)=>{
    const diff = (t:{min:number,max:number}) =>
      (isFinite(t.min) && isFinite(t.max)) ? +(Math.max(0, t.max - t.min).toFixed(1)) : undefined;
    if (id === "waist_flex") {
    // 몸통 전굴 ROM
    setRom(r=>({ ...(r ?? {}), trunk: diff(romTrack.current.trunk) }));

    // ✅ 커밋 순간의 스케일(holdScaleRef) 우선 → 그다음 직전 스케일 → 현재 스케일
    const s =
      holdScaleRef.current ??
      cmPerPxPrevRef.current ??
      cmPerPx;

    if (isFinite(waistMinHandFloorPx.current) && s) {
      const df = +(waistMinHandFloorPx.current * s).toFixed(1);
      setLengths(l => ({ ...(l ?? {}), fingertip_to_floor: df }));
    } else if (isFinite(waistMinHandFloorCm.current)) {
      // 백업: 실시간으로 누적한 cm 최소값
      setLengths(l => ({ ...(l ?? {}), fingertip_to_floor: +waistMinHandFloorCm.current.toFixed(1) }));
    }
  }
    if (id === "squat") setRom(r=>({ ...(r ?? {}),
      kneeL: diff(romTrack.current.kneeL), kneeR: diff(romTrack.current.kneeR),
      hipL: diff(romTrack.current.hipL),   hipR: diff(romTrack.current.hipR),
    }));
    if (id === "elbow_flex") setRom(r=>({ ...(r ?? {}), elbowL: diff(romTrack.current.elbowL), elbowR: diff(romTrack.current.elbowR) }));
    if (id === "shoulder_abd") setRom(r=>({ ...(r ?? {}), shoulder_abd: diff(romTrack.current.shoulder_abd) }));
    if (id === "neck_rom") setRom(r=>({ ...(r ?? {}), neck: diff(romTrack.current.neck) }));
  },[cmPerPx]);

  const commitStep = useCallback((id: StepId)=>{
    if (committingRef.current) return;
    committingRef.current = true;

    finalizeStepRoms(id);

    requestAnimationFrame(() => {
      try {
        const snap = makeSnapshot();
        stepSnaps.current[id] = snap;
        applyMergedToState(mergeAllSnaps());
        if (id !== "done") setStepIdx(i=>Math.min(i+1, STEPS.length-1));
      } finally {
        holdStartMs.current = null;
        gateArmedAt.current = null;
        setProgress(0);
        committingRef.current = false;
        lastCommitAt.current = performance.now();
        nearEndAccumMsRef.current = 0;
        lastGateTsRef.current = null;
      }
    });
  }, [finalizeStepRoms, makeSnapshot]);

  // 메인 포즈 루프
  const onPose = useCallback(({ kp, size }: { kp: KP; size: Size })=>{
    if (!running) return;
    setFocusRoi(null);

    // 실시간 패널 갱신
    lastKp.current = kp; lastSize.current = size;
    if (++pulseRef.current % 5 === 0) setUiPulse(x=>x+1);

    // ---- Keypoint smoothing ----
    const nowMs = performance.now();
    const getPxSmoothed = (i:number): Pt | null => {
      const lm = kp[i]; if (!lm) return null;
      const vis = lm.visibility ?? 0;
      if (vis <= 0) return null;
      const rawX = lm.x * size.w;
      const rawY = lm.y * size.h;
      const x = getOE(oeX.current, i).update(rawX, nowMs);
      const y = getOE(oeY.current, i).update(rawY, nowMs);
      return { x, y, v: vis };
    };

    // 좌표 추출
    const nose = getPxSmoothed(LM.NOSE);
    const le = getPxSmoothed(LM.LEFT_EAR),  re = getPxSmoothed(LM.RIGHT_EAR);
    const ls = getPxSmoothed(LM.LEFT_SHOULDER), rs = getPxSmoothed(LM.RIGHT_SHOULDER);
    const lelb = getPxSmoothed(LM.LEFT_ELBOW), relb = getPxSmoothed(LM.RIGHT_ELBOW);
    const lw = getPxSmoothed(LM.LEFT_WRIST),  rw = getPxSmoothed(LM.RIGHT_WRIST);
    const lh = getPxSmoothed(LM.LEFT_HIP),    rh = getPxSmoothed(LM.RIGHT_HIP);
    const lk = getPxSmoothed(LM.LEFT_KNEE),   rk = getPxSmoothed(LM.RIGHT_KNEE);
    const la = getPxSmoothed(LM.LEFT_ANKLE),  ra = getPxSmoothed(LM.RIGHT_ANKLE);

    // 키 보정 (EMA)
    const headTopY = Math.min(
      nose?.y ?? Infinity, le?.y ?? Infinity, re?.y ?? Infinity,
      ls?.y ?? Infinity, rs?.y ?? Infinity
    );
    const bottomY  = Math.max(la?.y ?? -Infinity, ra?.y ?? -Infinity, lk?.y ?? -Infinity, rk?.y ?? -Infinity);
    const heightPx = (isFinite(headTopY) && isFinite(bottomY)) ? (bottomY - headTopY) : null;
    if (heightPx && heightPx > size.h * 0.3) {
  heightSamples.current.push(heightPx);
  const med = heightSamples.current.median();
  if (med) {
    const proposed = heightCm / med;
    // 이전값 대비 점프 가드 (이전 스케일이 있을 때만)
const prevS = cmPerPxPrevRef.current ?? cmPerPx;
    const jumpOK = !prevS || Math.abs(proposed/prevS - 1) < MAX_SCALE_JUMP;
    if (jumpOK) {
  const smooth = cmPerPxEma.current.update(proposed);
  if (smooth) {
    const s = +smooth.toFixed(4);
    setCmPerPx(s);
    cmPerPxPrevRef.current = s; // 최근 스케일 보관
  }
}
  }
}

    // ROI
   let roiPts: Pt[] = [];
let roiMargin = 40;
if (STEPS[stepIdx].id === "neck_rom") {
  roiPts = [le, re, nose, ls, rs].filter(Boolean) as Pt[]; // 머리+어깨만
  roiMargin = 72; // 조금 넉넉히
} else {
  roiPts = [ls, rs, lh, rh, lk, rk, la, ra].filter(Boolean) as Pt[];
}

if (roiPts.length) setFocusRoi(bboxOf(roiPts, roiMargin, size));
    // === 프레임별 각도 ===
    const trunkFwdRaw = (()=>{
      if (!ls || !rs || !lh || !rh) return null;
      const shMid: Pt = { x:(ls.x+rs.x)/2, y:(ls.y+rs.y)/2 };
      const hipMid:Pt = { x:(lh.x+rh.x)/2, y:(lh.y+rh.y)/2 };
      return angleToVertical(hipMid, shMid);
    })();
    const trunkFwd = trunkFwdRaw!=null ? sg("trunk").update(trunkFwdRaw) : null;

    const ankleR = angleToVertical(rk, ra);
    const ankleL = angleToVertical(lk, la);
    const kneeLA = angleABC(lh, lk, la), kneeRA = angleABC(rh, rk, ra);
    const hipLA  = (ls && lh && lk) ? angleABC(ls, lh, lk) : null;
    const hipRA  = (rs && rh && rk) ? angleABC(rs, rh, rk) : null;
    const eL = angleABC(ls, lelb, lw); const eR = angleABC(rs, relb, rw);
    const abdL = angleToVertical(ls, lelb); const abdR = angleToVertical(rs, relb);
    const meanAbdRaw = (abdL!=null && abdR!=null)? (abdL+abdR)/2 : null;
    const meanAbd = meanAbdRaw!=null ? sg("abd").update(meanAbdRaw) : null;

    // 목
    let neckAng: number | null = null;
    if (le && re && ls && rs) {
      const earMid: Pt = { x:(le.x+re.x)/2, y:(le.y+re.y)/2 };
      const shMid:  Pt = { x:(ls.x+rs.x)/2, y:(ls.y+rs.y)/2 };
      const vertTop:Pt = { x: shMid.x, y: shMid.y - 100 };
      const n = angleABC(vertTop, shMid, earMid);
      neckAng = n!=null ? sg("neck").update(n) : null;
    }

    // === 이동창 업데이트 ===
    const now = performance.now();
    const shWin = motionWinRef.current.shoulder;
    if (meanAbd!=null)          pushWin(shWin, now, meanAbd, MOTION_WIN_MS);
    const elbWin = motionWinRef.current.elbow;
    const eMax   = Math.max(eL ?? -Infinity, eR ?? -Infinity);
    if (isFinite(eMax))         pushWin(elbWin, now, sg("elbowMax").update(eMax), MOTION_WIN_MS);
    const kneeWin = motionWinRef.current.knee;
    const kneeMax = Math.max(kneeLA ?? -Infinity, kneeRA ?? -Infinity);
    if (isFinite(kneeMax))      pushWin(kneeWin, now, sg("kneeMax").update(kneeMax), MOTION_WIN_MS);
    const hipWin = motionWinRef.current.hip;
    const hipMax  = Math.max(hipLA ?? -Infinity, hipRA ?? -Infinity);
    if (isFinite(hipMax))       pushWin(hipWin, now, sg("hipMax").update(hipMax), MOTION_WIN_MS);
    const ankWin = motionWinRef.current.ankle;
    const ankMea = (ankleR!=null ? ankleR : ankleL);
    if (ankMea!=null && !isNaN(ankMea)) pushWin(ankWin, now, sg("ankle").update(ankMea), MOTION_WIN_MS);
    const neckWin = motionWinRef.current.neck;
    if (neckAng!=null)          pushWin(neckWin, now, neckAng, MOTION_WIN_MS);
    const trunkWin = motionWinRef.current.trunk;
    if (trunkFwd!=null)         pushWin(trunkWin, now, trunkFwd, MOTION_WIN_MS);

    // 통계 + 최근 “움직임 증거”
    const stat = {
      ankle:   statsWin(ankWin),
      knee:    statsWin(kneeWin),
      hip:     statsWin(hipWin),
      elbow:   statsWin(elbWin),
      shoulder:statsWin(shWin),
      neck:    statsWin(neckWin),
      trunk:   statsWin(trunkWin),
    };
    if (stat.ankle.instVel   >= MOVING_VEL_MIN.ankle)   lastHighVelAt.current.ankle   = now;
    if (stat.knee.instVel    >= MOVING_VEL_MIN.knee)    lastHighVelAt.current.knee    = now;
    if (stat.hip.instVel     >= MOVING_VEL_MIN.hip)     lastHighVelAt.current.hip     = now;
    if (stat.elbow.instVel   >= MOVING_VEL_MIN.elbow)   lastHighVelAt.current.elbow   = now;
    if (stat.shoulder.instVel>= MOVING_VEL_MIN.shoulder)lastHighVelAt.current.shoulder= now;
    if (stat.neck.instVel    >= MOVING_VEL_MIN.neck)    lastHighVelAt.current.neck    = now;

    const hasSamples = (w:MotionWin, min=MIN_SAMPLES)=> w.v.length >= min;

    // ===== 값 누적(정면 보일 때만) =====
    const fullVisible = (() => {
      const v = (i:number)=>visOK(kp, i, 0.3);
      const shouldersOK = v(LM.LEFT_SHOULDER) && v(LM.RIGHT_SHOULDER);
      const hipsOK      = v(LM.LEFT_HIP)      && v(LM.RIGHT_HIP);
  const legsOK      = v(LM.LEFT_KNEE) && v(LM.RIGHT_KNEE) && v(LM.LEFT_ANKLE) && v(LM.RIGHT_ANKLE);
      const headOK      = v(LM.NOSE) || v(LM.LEFT_EAR) || v(LM.RIGHT_EAR);
      return shouldersOK && hipsOK && legsOK && headOK;
    })();

    const frontSanity = (()=>{
      if (!ls || !rs || !size.w) return false;
      const span = Math.abs((kp[LM.LEFT_SHOULDER]?.x ?? 0) - (kp[LM.RIGHT_SHOULDER]?.x ?? 1));
      if (span < 0.05) return false;
      const leVis = kp[LM.LEFT_EAR]?.visibility ?? 0;
      const reVis = kp[LM.RIGHT_EAR]?.visibility ?? 0;
      const shMidX = ((ls?.x ?? 0)+(rs?.x ?? 0))/2;
      const noseX = nose ? nose.x : null;
      return frontFacingOK(leVis, reVis, noseX, shMidX, size.w);
    })();

    if (fullVisible) {
      const thighLpx = dist(lh, lk), thighRpx = dist(rh, rk);
      const shankLpx = dist(lk, la), shankRpx = dist(rk, ra);
      const legLpx = (thighLpx!=null && shankLpx!=null)? thighLpx+shankLpx : null;
      const legRpx = (thighRpx!=null && shankRpx!=null)? thighRpx+shankRpx : null;
      const trunkpx = (ls && rs && lh && rh)
        ? dist({x:(ls.x+rs.x)/2,y:(ls.y+rs.y)/2}, {x:(lh.x+rh.x)/2,y:(lh.y+rh.y)/2}) : null;

      setLengths(prev=>({
        ...(prev ?? {}),
        thighL: toCm(thighLpx), thighR: toCm(thighRpx),
        shankL: toCm(shankLpx), shankR: toCm(shankRpx),
        legL_total: toCm(legLpx), legR_total: toCm(legRpx),
        trunk_len: toCm(trunkpx),
      }));

      if (ls && rs && lelb && relb && lw && rw && cmPerPx) {
  const upperArmLpx = dist(ls, lelb);
  const upperArmRpx = dist(rs, relb);
  const forearmLpx  = dist(lelb, lw);
  const forearmRpx  = dist(relb, rw);
  setLengths(prev => ({
    ...(prev ?? {}),
    upperArmL: maxMerge(prev?.upperArmL, toCm(upperArmLpx)),
    upperArmR: maxMerge(prev?.upperArmR, toCm(upperArmRpx)),
    forearmL:  maxMerge(prev?.forearmL,  toCm(forearmLpx)),
    forearmR:  maxMerge(prev?.forearmR,  toCm(forearmRpx)),
  }));
}

      // 기준치 업데이트(정면일 때만)
      if (lh && rh && frontSanity) {
        const pw = +Math.hypot(rh.x-lh.x, rh.y-lh.y).toFixed(1);
        setBaseline(b=>({ ...(b ?? {}), pelvis_width_px: pw }));
      }
      if (ls && rs && frontSanity) {
        const sw = +Math.hypot(rs.x-ls.x, rs.y-ls.y).toFixed(1);
        setBaseline(b=>({ ...(b ?? {}), shoulder_width_px: sw }));
      }

      // 대칭/자세
      if (lh && rh) setSymmetry(s=>({ ...(s ?? {}), pelvis_delta_px:+(rh.y-lh.y).toFixed(1) }));
      if (ls && rs) setSymmetry(s=>({ ...(s ?? {}), shoulder_delta_px:+(rs.y-ls.y).toFixed(1) }));

      const qL = angleABC(lh, lk, la), qR = angleABC(rh, rk, ra);
      setSymmetry(s=>({
        ...(s ?? {}),
        q_angle_L: qL!=null? +qL.toFixed(1) : s?.q_angle_L,
        q_angle_R: qR!=null? +qR.toFixed(1) : s?.q_angle_R,
      }));

      if (neckAng != null) {
        const neckVal = +neckAng.toFixed(1);
        setPosture(p => ({ ...(p ?? {}), neck_fwd: neckVal }));
      }
      if (trunkFwd != null) setPosture(p => ({ ...(p ?? {}), trunk_fwd: trunkFwd }));

      // 세그 기반 둘레
      if (cmPerPx && lastMask.current) {
        const est = estimateCircumferencesFromMask(lastMask.current, cmPerPx, size);
        if (est) setCirc(c=>({ ...(c ?? {}), ...est }));
      }
    }

    // === ROM 누적 ===
    const upd = (t:{min:number,max:number}, v:number|null)=> v==null? t : {min:Math.min(t.min,v), max:Math.max(t.max,v)};

    // ✅ 허리 전굴 ROM 누적
    if (trunkFwd != null) romTrack.current.trunk = upd(romTrack.current.trunk, trunkFwd);

    // 기존 ROM들 유지(다른 스텝에서 사용)
    romTrack.current.kneeL = upd(romTrack.current.kneeL, kneeLA);
    romTrack.current.kneeR = upd(romTrack.current.kneeR, kneeRA);
    romTrack.current.hipL  = upd(romTrack.current.hipL,  hipLA);
    romTrack.current.hipR  = upd(romTrack.current.hipR,  hipRA);
    romTrack.current.elbowL= upd(romTrack.current.elbowL, eL);
    romTrack.current.elbowR= upd(romTrack.current.elbowR, eR);
    if (meanAbd!=null) romTrack.current.shoulder_abd = upd(romTrack.current.shoulder_abd, meanAbd);
    if (neckAng!=null) romTrack.current.neck = upd(romTrack.current.neck, neckAng);

    // ✅ 손-바닥 거리(cm) 갱신 (발목 y를 바닥 근사로 사용)
    if ((lw || rw) && (la || ra)) {
  const wristY = Math.max(lw?.y ?? -Infinity, rw?.y ?? -Infinity);
  const ankleY = Math.max(la?.y ?? -Infinity, ra?.y ?? -Infinity);
  const dfPx = Math.max(0, ankleY - wristY);
  waistMinHandFloorPx.current = Math.min(waistMinHandFloorPx.current, dfPx);

  // 기존처럼 바로 cm도 갱신해 두되(실시간 UI 용), 최종 저장은 커밋에서 스냅샷 스케일 사용
  if (cmPerPx) {
    const dfCm = +(dfPx * cmPerPx).toFixed(1);
    waistMinHandFloorCm.current = Math.min(waistMinHandFloorCm.current, dfCm);
  }
}



    // === 게이트 유틸 ===
    const setHoldGate = (ok: boolean, opts: {
      okMsg: string; ngMsg: string;
      stable?: boolean;
      unstableMsg?: string;
      requireNearEnd?: boolean;
      nearEnd?: boolean;
      requireRecentMotionKey?: keyof typeof lastHighVelAt.current;
      requireArmedFlag?: keyof typeof armedRef.current;
      armingMsg?: string;
    }) => {
      const { okMsg, ngMsg, stable, unstableMsg, requireNearEnd, nearEnd, requireRecentMotionKey, requireArmedFlag, armingMsg } = opts;

      const now2 = performance.now();
      const dtGate = (lastGateTsRef.current==null) ? 0 : (now2 - lastGateTsRef.current);
      lastGateTsRef.current = now2;

      if (performance.now() - stepStartedAt.current < MIN_STEP_TIME_MS) {
        setProgressText("준비 중… 잠시만요.");
        holdStartMs.current = null; setProgress(0); return;
      }

      if (!ok) {
        setProgressText(ngMsg);
        holdStartMs.current = null;
        gateArmedAt.current = null;
        setProgress(0);
        nearEndAccumMsRef.current = 0;
          holdScaleRef.current = undefined;

        return;
      }

      if (requireArmedFlag && !armedRef.current[requireArmedFlag]) {
        setProgressText(armingMsg ?? "먼저 충분한 움직임을 만들어 주세요.");
        holdStartMs.current = null;
        setProgress(0);
        nearEndAccumMsRef.current = 0;
        return;
      }

      if (stable === false) {
        setProgressText(unstableMsg ?? "움직임 감지 — 자세를 고정해 주세요.");
        holdStartMs.current = null;
        setProgress(0);
        nearEndAccumMsRef.current = 0;
          holdScaleRef.current = undefined;

        return;
      }

      if (requireRecentMotionKey) {
        const key = requireRecentMotionKey as MotionKey;
        const now3 = performance.now();
        const velOK = (now3 - lastHighVelAt.current[key]) <= 1200;
        const dispOK = recentDisp(winOf(key, motionWinRef.current), 1200) >= MOVING_DISP_MIN[key];
        if (!(velOK && dispOK)) {
          setProgressText("먼저 크게 움직인 뒤, 끝자세에서 2초 고정해 주세요.");
          holdStartMs.current = null;
          setProgress(0);
          nearEndAccumMsRef.current = 0;
          return;
        }
      }

      if (requireNearEnd) {
        if (nearEnd) {
          nearEndAccumMsRef.current += dtGate;
        } else {
          nearEndAccumMsRef.current = 0;
        }
        if (nearEndAccumMsRef.current < PREHOLD_NEAREND_MS) {
          setProgressText("최대 범위 근처에서 조금 더 유지해 주세요.");
          holdStartMs.current = null;
          setProgress(0);
          return;
        }
      }

      if (now2 - lastCommitAt.current < COOLDOWN_MS) {
        setProgressText("잠시 대기 중…");
        setProgress(0);
        return;
      }

      if (gateArmedAt.current == null) gateArmedAt.current = now2;
      const armed = (now2 - gateArmedAt.current) >= ARMING_MS;
      if (!armed) {
        setProgressText("포즈 확인 중…");
        setProgress(0);
        return;
      }

      setProgressText(okMsg);
if (holdStartMs.current == null) {
  holdStartMs.current = now2;
  // 현재 스케일이 유효하다면 스냅샷
  if (cmPerPx) holdScaleRef.current = cmPerPx;
}      const p = clamp((now2 - holdStartMs.current) / HOLD_MS, 0, 1);
      setProgress(p);
      if (p >= 1) commitStep(STEPS[stepIdx].id);
    };

    // === 스텝별 게이트 ===

    // FULL
    if (current.id === "full") {
      const pqi = poseQuality(kp,[LM.LEFT_SHOULDER,LM.RIGHT_SHOULDER,LM.LEFT_HIP,LM.RIGHT_HIP,LM.NOSE],0.52);
      const stable = hasSamples(motionWinRef.current.trunk) &&
                     (stat.trunk.std < STATIC_STD) && (stat.trunk.maxVel < STATIC_VEL);
      const upright = (trunkFwd!=null) && trunkFwd < 18;
      const fullVisOK = needVis(kp, [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP], 0.52);
      setHoldGate(
        fullVisible && fullVisOK && upright && frontSanity && pqi>=0.55,
        {
          okMsg:"전신 인식 — 2초 유지 중…",
          ngMsg:"머리부터 발까지 전신이 프레임에 들어오게(정면) 서 주세요.",
          stable,
          unstableMsg:"몸이 흔들립니다 — 2초 동안 가만히 서 주세요。",
        }
      );
    }

    // T-POSE
    if (current.id === "tpose") {
      const ready = !!(ls && rs && lelb && relb && lw && rw);
      const visReady = needVis(kp, [LM.LEFT_SHOULDER,LM.RIGHT_SHOULDER,LM.LEFT_ELBOW,LM.RIGHT_ELBOW,LM.LEFT_WRIST,LM.RIGHT_WRIST], 0.58);
      const abd = meanAbd ?? 0;
      if (abd > 55 && visReady) armedRef.current.tpose = true;

      const leVis2 = kp[LM.LEFT_EAR]?.visibility ?? 0; const reVis2 = kp[LM.RIGHT_EAR]?.visibility ?? 0;
      const shMidX2 = ((ls?.x ?? 0)+(rs?.x ?? 0))/2; const noseX2 = nose ? nose.x : null;
      const facingFront = frontFacingOK(leVis2, reVis2, noseX2, shMidX2, size.w);

      const wristsUp = !!(lw && ls && rw && rs && lw.y < ls.y && rw.y < rs.y);
      const elbowsStraight = ( (angleABC(ls, lelb, lw) ?? 0) > 160 ) && ( (angleABC(rs, relb, rw) ?? 0) > 160 );
      const abdOK = abd > 65 && abd < 115;
      const shoulderW = (dist(ls, rs) ?? 0);
      const handsFar = shoulderW>0 &&
        Math.abs((lw?.x ?? 0) - (ls?.x ?? 0)) > shoulderW*0.85 &&
        Math.abs((rw?.x ?? 0) - (rs?.x ?? 0)) > shoulderW*0.85;
      const wristsLevel = Math.abs((lw?.y ?? 0) - (ls?.y ?? 0)) < (size.h*0.06);
      const shouldersLevel = Math.abs((ls?.y ?? 0) - (rs?.y ?? 0)) < (size.h*0.035);
      const trunkUpright = (trunkFwd!=null) && trunkFwd < 22;

      const pqi = poseQuality(kp,[LM.LEFT_SHOULDER,LM.RIGHT_SHOULDER,LM.LEFT_ELBOW,LM.RIGHT_ELBOW,LM.LEFT_WRIST,LM.RIGHT_WRIST],0.58);

      const gate = ready && visReady && wristsUp && elbowsStraight && abdOK && handsFar && wristsLevel && shouldersLevel && trunkUpright && facingFront && pqi>=0.58;

      // 윙스팬 최대값 갱신
      if (gate && lw && rw) {
        const span = +Math.hypot(rw.x-lw.x, rw.y-lw.y).toFixed(1);
        setBaseline(b=>({ ...(b ?? {}), wingspan_px: Math.max(b?.wingspan_px ?? 0, span) }));
      }

      if (gate && ls && rs && lelb && relb && lw && rw) {
  // 팔꿈치 폄 상태에서만 저장 (이미 gate 조건에 포함되어 있지만 한 번 더 안전장치)
  const elbowsStraightOK =
    ( (angleABC(ls, lelb, lw) ?? 0) > 160 ) &&
    ( (angleABC(rs, relb, rw) ?? 0) > 160 );

  if (elbowsStraightOK && cmPerPx) {
    const upperArmLpx = dist(ls, lelb);
    const upperArmRpx = dist(rs, relb);
    const forearmLpx  = dist(lelb, lw);
    const forearmRpx  = dist(relb, rw);

    setLengths(prev => ({
      ...(prev ?? {}),
      upperArmL: maxMerge(prev?.upperArmL, toCm(upperArmLpx)),
      upperArmR: maxMerge(prev?.upperArmR, toCm(upperArmRpx)),
      forearmL:  maxMerge(prev?.forearmL,  toCm(forearmLpx)),
      forearmR:  maxMerge(prev?.forearmR,  toCm(forearmRpx)),
    }));
  }
}

      const stable = hasSamples(shWin) && (stat.shoulder.std < STATIC_STD) && (stat.shoulder.maxVel < STATIC_VEL);
      setHoldGate(gate, {
        okMsg:"T-포즈 인식 — 2초 유지 중…",
        ngMsg:"양팔을 옆으로 쭉 펴고(손목↑, 팔꿈치 펴고) 수평/정면을 맞춰 주세요.",
        stable,
        unstableMsg:"팔이 흔들립니다 — 2초 고정해 주세요.",
        requireArmedFlag:"tpose",
        armingMsg:"팔을 먼저 위로 올려(외전 55°↑) T-포즈로 진입해 주세요.",
      });
    }

    // SIDE
    if (current.id === "side") {
      const { ok: sideOK } = sideProfileCheck(kp);

      const stable = (() => {
        const trunkWin = motionWinRef.current.trunk;
        const st = statsWin(trunkWin);
        return (trunkWin.v.length >= MIN_SAMPLES) && st.std < 2.6 && st.maxVel < 14;
      })();

      // 측면일 때만 단일프레임 각도 기록
      if (sideOK) {
        const k = rk ?? lk;
        const a = ra ?? la;
        const shMid = (ls && rs) ? { x:(ls.x+rs.x)/2, y:(ls.y+rs.y)/2 } : null;
        const hipMid= (lh && rh) ? { x:(lh.x+rh.x)/2, y:(lh.y+rh.y)/2 } : null;

        const hipSide  = (shMid && hipMid && k) ? angleABC(shMid, hipMid, k) : null;
        const ankleSide= angleToVertical(k, a);

        if (trunkFwd!=null) setAngles(g=>({ ...(g ?? {}), trunk_fwd:+trunkFwd.toFixed(1) }));
        setAngles(g=>({
          ...(g ?? {}),
          hip_side:  hipSide  !=null ? +hipSide.toFixed(1)   : g?.hip_side,
          ankle_side:ankleSide!=null ? +ankleSide.toFixed(1) : g?.ankle_side,
        }));
      }

      setHoldGate(sideOK, {
        okMsg:"측면 정렬 — 2초 유지 중…",
        ngMsg:"어깨와 골반의 좌우가 화면 x축에서 거의 겹치도록 몸통만 옆으로 돌려 주세요(얼굴은 어디를 봐도 OK).",
        stable,
        unstableMsg:"몸이 흔들립니다 — 같은 자세로 2초 유지해 주세요.",
        requireArmedFlag:"side",
        armingMsg:"옆모습을 먼저 만들고 잠시 유지해 주세요.",
      });

      // arming: 조건 달성 0.5s 누적
      const sc = sideProfileCheck(kp);
      if (sc.ok) {
        if (sideArmingSince.current == null) sideArmingSince.current = performance.now();
        if (performance.now() - (sideArmingSince.current ?? 0) > 500) {
          armedRef.current.side = true;
        }
      } else {
        sideArmingSince.current = null;
      }
    }

    // ===== 새 허리 유연성 스텝 =====
    if (current.id === "waist_flex") {
      const { ok: sideOK } = sideProfileCheck(kp);

      // 안정도 체크
      const stable = (() => {
        const tw = motionWinRef.current.trunk;
        const st = statsWin(tw);
        return (tw.v.length >= MIN_SAMPLES) && st.std < 2.6 && st.maxVel < 14;
      })();

      // 손-바닥 근접(또는 깊은 전굴각) 판정
      let nearFloor = false;
      if ((lw || rw) && (la || ra)) {
        const wristY = Math.max(lw?.y ?? -Infinity, rw?.y ?? -Infinity);
        const ankleY = Math.max(la?.y ?? -Infinity, ra?.y ?? -Infinity);
        const dfPx = Math.max(0, ankleY - wristY);
        nearFloor = cmPerPx
          ? (dfPx * cmPerPx) <= FINGER_FLOOR_THR_CM
          : dfPx <= lastSize.current.h * 0.05; // 보정 전: 화면 높이 5%
      }
      const deepFlex = (trunkFwd ?? 0) >= 70; // 충분한 전굴각일 때도 허용

      setHoldGate(sideOK && (nearFloor || deepFlex), {
        okMsg:"좋아요! 바닥에 거의 닿았어요 — 2초 유지…",
        ngMsg:"측면으로 선 뒤, 허리를 깊게 굽혀 손을 바닥까지 내려주세요.",
        stable,
        unstableMsg:"살짝 흔들려요 — 같은 자세로 2초 유지해 주세요.",
      });
    }

    if (current.id === "squat") {
      const squatVal = Math.max(
        (kneeLA ?? -Infinity), (kneeRA ?? -Infinity),
        (hipLA  ?? -Infinity), (hipRA  ?? -Infinity)
      );
      if (Number.isFinite(squatVal)) {
        const thr = Math.min(AMP_THR.knee, AMP_THR.hip);
        const c = updateRep("squat", squatVal, thr, MIN_PEAK_MS.squat);
        setProgress(Math.min(1, c / REP_TARGET));
        setProgressText(`스쿼트 ${c}/${REP_TARGET}회 — 앉았다 일어서기 반복해 주세요.`);
        if (c >= REP_TARGET) commitStep("squat");
      } else {
        setProgress(0);
        setProgressText("스쿼트 각도 인식 중…");
      }
    }

    if (current.id === "elbow_flex") {
      const v = Math.max(eL ?? -Infinity, eR ?? -Infinity);
      if (Number.isFinite(v)) {
        const c = updateRep("elbow", v, AMP_THR.elbow, MIN_PEAK_MS.elbow);
        setProgress(Math.min(1, c / REP_TARGET));
        setProgressText(`팔꿈치 굽힘/신전 ${c}/${REP_TARGET}회 — 한쪽씩 해도 돼요.`);
        if (c >= REP_TARGET) commitStep("elbow_flex");
      } else {
        setProgress(0);
        setProgressText("팔꿈치 각도 인식 중…");
      }
    }

    if (current.id === "shoulder_abd") {
      const v = meanAbd;
      if (v != null) {
        const c = updateRep("shoulder", v, AMP_THR.shoulder_abd, MIN_PEAK_MS.shoulder);
        setProgress(Math.min(1, c / REP_TARGET));
        setProgressText(`어깨 외전 ${c}/${REP_TARGET}회 — 옆에서 머리 위까지 올렸다 내리기.`);
        if (c >= REP_TARGET) commitStep("shoulder_abd");
      } else {
        setProgress(0);
        setProgressText("어깨 각도 인식 중…");
      }
    }

    if (current.id === "neck_rom") {
      const v = neckAng;
      if (v != null) {
        const c = updateRep("neck", v, AMP_THR.neck, MIN_PEAK_MS.neck);
        setProgress(Math.min(1, c / REP_TARGET));
        setProgressText(`목 ROM ${c}/${REP_TARGET}회 — 숙임/뒤젖힘/기울임 크게 반복.`);
        if (c >= REP_TARGET) commitStep("neck_rom");
      } else {
        setProgress(0);
        setProgressText("목 각도 인식 중…");
      }
    }

    if (STEPS[stepIdx].id === "done") {
      finalize();
      console.log(stepSnaps.current);
    }
  },[current.id, finalize, heightCm, cmPerPx, running, stepIdx, commitStep, updateRep]);

  const badge = useMemo(()=>{
    const map: Record<StepId, ReactNode> = {
      full:<Chip color="#e7f5ff">전신 프레임</Chip>,
      tpose:<Chip color="#e6ffed">T-포즈</Chip>,
      side:<Chip color="#f1f3f5">측면 정렬</Chip>,
      waist_flex:<Chip color="#ffe8ef">허리 유연성</Chip>,
      squat:<Chip color="#fff3bf">스쿼트 ROM</Chip>,
      elbow_flex:<Chip color="#ffe3e3">팔꿈치 ROM</Chip>,
      shoulder_abd:<Chip color="#e0f7fa">어깨 ROM</Chip>,
      neck_rom:<Chip color="#fce4ec">목 ROM</Chip>,
      done:<Chip color="#ddd">완료</Chip>,
    };
    return map[STEPS[stepIdx].id];
  },[stepIdx]);

  // 실시간 표기
  const fmtNum = (v?: number|null) => (v==null ? "-" : `${v}`);
  const fmtPx = (v?: number|null) => (v==null ? "-" : `${(+v).toFixed(1)} px`);

  const livePanel = useMemo(()=>{
    const kp = lastKp.current, size = lastSize.current;
    if (!size.w || !size.h) return null;
    const p = (i:number)=> {
      const lm = kp[i]; if (!lm) return null;
      return { x: lm.x * size.w, y: lm.y * size.h, v: lm.visibility };
    };
    const D = (i:number, j:number)=> dist(p(i), p(j));
    const showLen = (px: number | null) =>
      (px==null) ? "-" : (cmPerPx ? `${(px*cmPerPx).toFixed(1)} cm` : `${px.toFixed(1)} px`);
    const A = (i:number, j:number, k:number)=> {
      const a = angleABC(p(i), p(j), p(k));
      return a==null ? "-" : `${a.toFixed(1)}°`;
    };
    const V = (from:number, to:number)=>{
      const a = angleToVertical(p(from), p(to));
      return a==null ? "-" : `${a.toFixed(1)}°`;
    };

    // ✅ 실시간 손-바닥 거리
    const handFloorStr = (() => {
      const lw = p(LM.LEFT_WRIST), rw = p(LM.RIGHT_WRIST);
      const la = p(LM.LEFT_ANKLE), ra = p(LM.RIGHT_ANKLE);
      if (!cmPerPx || (!lw && !rw) || (!la && !ra)) return "-";
      const wristY = Math.max(lw?.y ?? -Infinity, rw?.y ?? -Infinity);
      const ankleY = Math.max(la?.y ?? -Infinity, ra?.y ?? -Infinity);
      const dfPx = Math.max(0, ankleY - wristY);
      return `${(dfPx*cmPerPx).toFixed(1)} cm`;
    })();

    return {
      len: {
        upperArmL: showLen(D(LM.LEFT_SHOULDER, LM.LEFT_ELBOW)),
        upperArmR: showLen(D(LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW)),
        forearmL:  showLen(D(LM.LEFT_ELBOW, LM.LEFT_WRIST)),
        forearmR:  showLen(D(LM.RIGHT_ELBOW, LM.RIGHT_WRIST)),
        thighL:    showLen(D(LM.LEFT_HIP, LM.LEFT_KNEE)),
        thighR:    showLen(D(LM.RIGHT_HIP, LM.RIGHT_KNEE)),
        shankL:    showLen(D(LM.LEFT_KNEE, LM.LEFT_ANKLE)),
        shankR:    showLen(D(LM.RIGHT_KNEE, LM.RIGHT_ANKLE)),
        legL:      showLen((D(LM.LEFT_HIP, LM.LEFT_KNEE) ?? 0) + (D(LM.LEFT_KNEE, LM.LEFT_ANKLE) ?? 0)),
        legR:      showLen((D(LM.RIGHT_HIP, LM.RIGHT_KNEE) ?? 0) + (D(LM.RIGHT_KNEE, LM.RIGHT_ANKLE) ?? 0)),
        trunk:     showLen(
          dist(
            p(LM.LEFT_SHOULDER) && p(LM.RIGHT_SHOULDER)
              ? { x:(p(LM.LEFT_SHOULDER)!.x + p(LM.RIGHT_SHOULDER)!.x)/2, y:(p(LM.LEFT_SHOULDER)!.y + p(LM.RIGHT_SHOULDER)!.y)/2 }
              : null,
            p(LM.LEFT_HIP) && p(LM.RIGHT_HIP)
              ? { x:(p(LM.LEFT_HIP)!.x + p(LM.RIGHT_HIP)!.x)/2, y:(p(LM.LEFT_HIP)!.y + p(LM.RIGHT_HIP)!.y)/2 }
              : null
          )
        ),
      },
      ang: {
        elbowL: A(LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST),
        elbowR: A(LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST),
        shoulderAbd: (()=>{
          const l = angleToVertical(p(LM.LEFT_SHOULDER), p(LM.LEFT_ELBOW));
          const r = angleToVertical(p(LM.RIGHT_SHOULDER), p(LM.RIGHT_ELBOW));
          if (l==null || r==null) return "-";
          return `${(((l+r)/2).toFixed(1))}°`;
        })(),
        trunkFwd: (()=>{
          const ls = p(LM.LEFT_SHOULDER), rs = p(LM.RIGHT_SHOULDER);
          const lh = p(LM.LEFT_HIP), rh = p(LM.RIGHT_HIP);
          if (!ls || !rs || !lh || !rh) return "-";
          const shMid = { x:(ls.x+rs.x)/2, y:(ls.y+rs.y)/2 };
          const hipMid= { x:(lh.x+rh.x)/2, y:(lh.y+rh.y)/2 };
          const a = angleToVertical(hipMid, shMid);
          return a==null? "-" : `${a.toFixed(1)}°`;
        })(),
        hipSide: (()=>{
          const ls=p(LM.LEFT_SHOULDER), rs=p(LM.RIGHT_SHOULDER);
          const lh=p(LM.LEFT_HIP), rh=p(LM.RIGHT_HIP), rk=p(LM.RIGHT_KNEE);
          if (!ls||!rs||!lh||!rh||!rk) return "-";
          const shMid = { x:(ls.x+rs.x)/2, y:(ls.y+rs.y)/2 };
          const hipMid= { x:(lh.x+rh.x)/2, y:(lh.y+rh.y)/2 };
          const a = angleABC(shMid, hipMid, rk);
          return a==null? "-" : `${a.toFixed(1)}°`;
        })(),
        ankleSide: V(LM.RIGHT_KNEE, LM.RIGHT_ANKLE),
      },
      /** ✅ 유연성 섹션 표시용 */
      flex: {
        handFloor: handFloorStr
      }
    };
  }, [cmPerPx, uiPulse, stepIdx]);

  useEffect(() => {
    if (STEPS[stepIdx].id === "done") {
      finalize();
      console.log(stepSnaps.current);
    }
  }, [stepIdx, finalize]);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:24, height:"100%" }}>
      {/* Camera + 오버레이 */}
      <div style={{ position:"relative", border:"1px solid #e0e0e0", borderRadius:12, overflow:"hidden" }}>
        <BodyAnalysisCamera
          running={running}
          onPose={onPose}
          focusRoi={focusRoi}
          mirrored
          onSegMask={onSegMask}
          getSegmentation={runSegmentationToMask}
        />

        {STEPS[stepIdx].id !== "done" && (
          <div style={{
            position:"absolute", left:"50%", top:"50%", transform:"translate(-50%, -50%)",
            background:"rgba(0,0,0,0.6)", color:"#fff", padding:16, borderRadius:12, width: "min(520px, 92%)",
            boxShadow:"0 6px 18px rgba(0,0,0,0.35)", border:"1px solid rgba(255,255,255,0.15)"
          }}>
            <div style={{ fontWeight:800, fontSize:16, marginBottom:8, letterSpacing:0.2 }}>{STEPS[stepIdx].title}</div>
            <div style={{ whiteSpace:"pre-line", fontSize:13, opacity:0.9 }}>{progressText}</div>
            <div style={{ height:10, borderRadius:999, background:"rgba(255,255,255,0.2)", marginTop:12, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.round(progress*100)}%`, background:"#39b3ff", transition:"width 200ms ease" }} />
            </div>
          </div>
        )}
      </div>

      {/* Side 패널 */}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ border:"1px solid #e0e0e0", borderRadius:12, padding:16, background:"#fff" }}>
          <div style={{ marginBottom:8 }}>{badge}</div>
          <h3 style={{ margin:"4px 0 12px 0" }}>{STEPS[stepIdx].title}</h3>
          <p style={{ margin:0, color:"#555", lineHeight:1.6 }}>{STEPS[stepIdx].instruction}</p>
        </div>

        <div style={{ border:"1px solid #e0e0e0", borderRadius:12, padding:16, background:"#fff" }}>
          <h4 style={{ marginTop:0 }}>실시간 측정값</h4>
          <ul style={{ margin:0, paddingLeft:18, color:"#333", lineHeight:1.8 }}>
            <li>보정: <b>{cmPerPx ? `${cmPerPx.toFixed(4)} cm/px` : "(보정 전) px 단위 표시"}</b></li>
            <li>기준(어깨/윙스팬/골반): <b>
              {fmtPx(baseline?.shoulder_width_px)} / {fmtPx(baseline?.wingspan_px)} / {fmtPx(baseline?.pelvis_width_px)}
            </b></li>
          </ul>

          <div style={{ marginTop: 12, fontWeight: 700, color: "#850000" }}>길이</div>
          <ul style={{ margin:0, paddingLeft:18, color:"#333", lineHeight:1.8 }}>
            <li>상완 L/R: <b>{livePanel?.len.upperArmL ?? "-"} / {livePanel?.len.upperArmR ?? "-"}</b></li>
            <li>전완 L/R: <b>{livePanel?.len.forearmL ?? "-"} / {livePanel?.len.forearmR ?? "-"}</b></li>
            <li>대퇴 L/R: <b>{livePanel?.len.thighL ?? "-"} / {livePanel?.len.thighR ?? "-"}</b></li>
            <li>하퇴 L/R: <b>{livePanel?.len.shankL ?? "-"} / {livePanel?.len.shankR ?? "-"}</b></li>
            <li>다리 합 L/R: <b>{livePanel?.len.legL ?? "-"} / {livePanel?.len.legR ?? "-"}</b></li>
            <li>몸통 길이: <b>{livePanel?.len.trunk ?? "-"}</b></li>
          </ul>

          {(circ?.chest || circ?.waist || circ?.hip) && (
            <>
              <div style={{ marginTop:12, fontWeight:700, color:"#850000" }}>둘레 (세그)</div>
              <ul style={{ margin:0, paddingLeft:18, color:"#333", lineHeight:1.8 }}>
                <li>가슴/허리/엉덩이: <b>
                  {fmtNum(circ?.chest)} / {fmtNum(circ?.waist)} / {fmtNum(circ?.hip)} cm
                </b></li>
              </ul>
            </>
          )}

          <div style={{ marginTop:12, fontWeight:700, color:"#850000" }}>각도</div>
          <ul style={{ margin:0, paddingLeft:18, color:"#333", lineHeight:1.8 }}>
            <li>팔꿈치 L/R: <b>{livePanel?.ang.elbowL ?? "-"} / {livePanel?.ang.elbowR ?? "-"}</b></li>
            <li>어깨 외전(평균): <b>{livePanel?.ang.shoulderAbd ?? "-"}</b></li>
            <li>몸통 전경: <b>{livePanel?.ang.trunkFwd ?? "-"}</b></li>
            <li>고관절(측면): <b>{livePanel?.ang.hipSide ?? "-"}</b></li>
            <li>발목(측면): <b>{livePanel?.ang.ankleSide ?? "-"}</b></li>
          </ul>

          {/* ✅ 유연성 */}
          <div style={{ marginTop:12, fontWeight:700, color:"#850000" }}>유연성</div>
          <ul style={{ margin:0, paddingLeft:18, color:"#333", lineHeight:1.8 }}>
            <li>손-바닥 거리: <b>{livePanel?.flex.handFloor ?? "-"}</b></li>
            <li>허리 전굴(몸통): <b>{livePanel?.ang.trunkFwd ?? "-"}</b></li>
          </ul>
        </div>

        <div style={{ display:"flex", gap:8, marginTop:"auto" }}>
          <button
            onClick={()=> setRunning(r=>!r)}
            style={{ flex:1, padding:14, borderRadius:10, border:"1px solid #ddd",
              background: running ? "#ffe8cc" : "#d3f9d8", cursor:"pointer", fontWeight:700 }}
          >
            {running ? "일시정지" : "다시 시작"}
          </button>
          <button
            onClick={prev}
            disabled={stepIdx===0}
            style={{ padding:14, borderRadius:10, border:"1px solid #ddd",
              background: stepIdx===0 ? "#f1f3f5" : "#fff",
              cursor: stepIdx===0 ? "not-allowed" : "pointer", fontWeight:700 }}
          >
            이전
          </button>
          <button
            onClick={()=> commitStep(STEPS[stepIdx].id)}
            disabled={stepIdx===STEPS.length-1}
            style={{ padding:14, borderRadius:10, border:"1px solid #ddd",
              background: stepIdx===STEPS.length-1 ? "#f1f3f5" : "#fff",
              cursor: stepIdx===STEPS.length-1 ? "not-allowed" : "pointer", fontWeight:700 }}
          >
            다음(수동)
          </button>
        </div>
      </div>
    </div>
  );
};

/** 결과 모달 컴포넌트 */
const Row: React.FC<{label:string; value:React.ReactNode}> = ({label, value}) => (
  <div style={{ display:"grid", gridTemplateColumns:"160px 1fr", gap:12, padding:"6px 0", borderBottom:"1px solid #eee" }}>
    <div style={{ color:"#666" }}>{label}</div>
    <div style={{ fontWeight:600 }}>{value ?? "-"}</div>
  </div>
);

const SectionBox: React.FC<{title:string; children:React.ReactNode}> = ({title, children}) => (
  <div style={{ border:"1px solid #eee", borderRadius:12, padding:12, background:"#fff" }}>
    <div style={{ fontWeight:800, marginBottom:8 }}>{title}</div>
    {children}
  </div>
);

export const ResultModal: React.FC<{
  open:boolean;
  result: MeasureResult | null;
  onClose: ()=>void;
  onSave: () => void; 
}> = ({ open, result, onClose, onSave }) => {
  if (!open || !result) return null;

  const copyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      alert("JSON 복사됨!");
    } catch {
      alert("복사에 실패했어요. 브라우저 권한을 확인해 주세요.");
    }
  };

  const px = (v?: number)=> (v==null? "-" : `${v.toFixed(1)} px`);
  const num = (v?: number)=> (v==null? "-" : `${v}`);
  const deg = (v?: number)=> (v==null? "-" : `${v}°`);
  const cm  = (v?: number)=> (v==null? "-" : `${v} cm`);

  return (
    <div style={{
      position:"fixed", top:0, left:0, right:0, bottom:0,
      background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999
    }}>
      <div style={{
        width:"min(920px, 92vw)", maxHeight:"90vh", overflow:"hidden",
        background:"#f8f9fa", borderRadius:16, boxShadow:"0 20px 80px rgba(0,0,0,0.35)",
        border:"1px solid #e9ecef", display:"flex", flexDirection:"column"
      }}>
        <div style={{ padding:16, borderBottom:"1px solid #e9ecef", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontWeight:900, fontSize:18 }}>측정 결과</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={copyJSON} style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #ddd", background:"#fff", cursor:"pointer", fontWeight:700 }}>
              JSON 복사
            </button>
            <button onClick={onSave} style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #ddd", background:"#fff", cursor:"pointer", fontWeight:700 }}>
              저장
            </button>
            <button onClick={onClose} style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #ddd", background:"#fff", cursor:"pointer", fontWeight:700 }}>
              닫기
            </button>
          </div>
        </div>

        <div style={{ padding:16, overflowY:"auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <SectionBox title="보정 & 기준치">
              <Row label="키" value={cm(result.height_cm)} />
              <Row label="cm/px" value={result.cm_per_px==null? "-" : result.cm_per_px.toFixed(4)} />
              <Row label="어깨폭(px)" value={px(result.baseline?.shoulder_width_px)} />
              <Row label="윙스팬(px)" value={px(result.baseline?.wingspan_px)} />
              <Row label="골반폭(px)" value={px(result.baseline?.pelvis_width_px)} />
            </SectionBox>

            <SectionBox title="자세/정렬">
              <Row label="목 전방" value={deg(result.posture?.neck_fwd)} />
              <Row label="몸통 전경" value={deg(result.posture?.trunk_fwd)} />
              <Row label="어깨 높낮이(px)" value={num(result.symmetry?.shoulder_delta_px)} />
              <Row label="골반 높낮이(px)" value={num(result.symmetry?.pelvis_delta_px)} />
              <Row label="Q-angle L/R" value={
                `${num(result.symmetry?.q_angle_L)} / ${num(result.symmetry?.q_angle_R)}`
              }/>
            </SectionBox>

            <SectionBox title="길이(추정)">
              <Row label="상완 L/R" value={`${cm(result.lengths_cm?.upperArmL)} / ${cm(result.lengths_cm?.upperArmR)}`} />
              <Row label="전완 L/R" value={`${cm(result.lengths_cm?.forearmL)} / ${cm(result.lengths_cm?.forearmR)}`} />
              <Row label="대퇴 L/R" value={`${cm(result.lengths_cm?.thighL)} / ${cm(result.lengths_cm?.thighR)}`} />
              <Row label="하퇴 L/R" value={`${cm(result.lengths_cm?.shankL)} / ${cm(result.lengths_cm?.shankR)}`} />
              <Row label="다리 합 L/R" value={`${cm(result.lengths_cm?.legL_total)} / ${cm(result.lengths_cm?.legR_total)}`} />
              <Row label="몸통 길이" value={cm(result.lengths_cm?.trunk_len)} />
            </SectionBox>

            <SectionBox title="둘레(세그 기반)">
              <Row label="가슴/허리/엉덩이" value={
                `${cm(result.circumferences_cm?.chest)} / ${cm(result.circumferences_cm?.waist)} / ${cm(result.circumferences_cm?.hip)}`
              }/>
              <Row label="상완 L/R" value={`${cm(result.circumferences_cm?.upperArmL)} / ${cm(result.circumferences_cm?.upperArmR)}`} />
              <Row label="전완 L/R" value={`${cm(result.circumferences_cm?.forearmL)} / ${cm(result.circumferences_cm?.forearmR)}`} />
              <Row label="대퇴 L/R" value={`${cm(result.circumferences_cm?.thighL)} / ${cm(result.circumferences_cm?.thighR)}`} />
              <Row label="하퇴 L/R" value={`${cm(result.circumferences_cm?.shankL)} / ${cm(result.circumferences_cm?.shankR)}`} />
            </SectionBox>

            <SectionBox title="각도(단일 프레임)">
              <Row label="고관절(측면)" value={deg(result.angles_deg?.hip_side)} />
              <Row label="발목(측면)" value={deg(result.angles_deg?.ankle_side)} />
              <Row label="어깨 외전(평균)" value={deg(result.angles_deg?.shoulder_abd)} />
              <Row label="몸통 전경" value={deg(result.angles_deg?.trunk_fwd)} />
            </SectionBox>

            {/* ✅ 새 유연성 섹션 */}
            <SectionBox title="유연성">
              <Row label="손-바닥 거리" value={cm(result.lengths_cm?.fingertip_to_floor)} />
              <Row label="허리 전굴 ROM" value={deg(result.rom_deg?.trunk)} />
            </SectionBox>

            <SectionBox title="ROM(가동범위)">
              {/* 발목 ROM 항목 제거 */}
              <Row label="무릎 L/R" value={`${deg(result.rom_deg?.kneeL)} / ${deg(result.rom_deg?.kneeR)}`} />
              <Row label="고관절 L/R" value={`${deg(result.rom_deg?.hipL)} / ${deg(result.rom_deg?.hipR)}`} />
              <Row label="팔꿈치 L/R" value={`${deg(result.rom_deg?.elbowL)} / ${deg(result.rom_deg?.elbowR)}`} />
              <Row label="어깨 외전" value={deg(result.rom_deg?.shoulder_abd)} />
              <Row label="목" value={deg(result.rom_deg?.neck)} />
            </SectionBox>
          </div>

          <div style={{ marginTop:16 }}>
            <div style={{ fontWeight:800, marginBottom:8 }}>Raw JSON</div>
            <pre style={{
              margin:0, padding:12, background:"#212529", color:"#f8f9fa",
              borderRadius:10, overflow:"auto", maxHeight:260, fontSize:12
            }}>
{JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeasureOrchestrator;
