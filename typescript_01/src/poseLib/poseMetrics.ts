import { Landmark, KP, PL } from "./poseTypes";

// ---------- 공통 유틸 ----------
export function toPx(k:Landmark, W:number, H:number){ return {x:k.x*W, y:k.y*H, z:k.z, v:k.visibility}; }
export function dist(a?:Landmark, b?:Landmark): number|null {
  if(!a||!b) return null;
  return Math.hypot(a.x-b.x, a.y-b.y);
}
export function angleDeg(a?:Landmark, b?:Landmark, c?:Landmark): number|null {
  if(!a||!b||!c) return null;
  const v1 = {x:a.x-b.x, y:a.y-b.y};
  const v2 = {x:c.x-b.x, y:c.y-b.y};
  const n1 = Math.hypot(v1.x, v1.y), n2 = Math.hypot(v2.x, v2.y);
  if(n1===0||n2===0) return null;
  const cos = Math.max(-1, Math.min(1, (v1.x*v2.x + v1.y*v2.y)/(n1*n2)));
  return Math.acos(cos)*180/Math.PI;
}
export function mid(a?:Landmark, b?:Landmark): Landmark | undefined {
  if(!a||!b) return undefined;
  return { x:(a.x+b.x)/2, y:(a.y+b.y)/2, z:(a.z+b.z)/2, visibility: Math.min(a.visibility??1, b.visibility??1) };
}
export function lineAngleDeg(ax:number, ay:number, bx:number, by:number){
  return Math.atan2(by-ay, bx-ax)*180/Math.PI;
}

// ---------- 커버리지 ----------
export function coverage(kp:KP){
  const thr = 0.35;
  const v = (i:PL) => !!kp[i] && (kp[i]!.visibility ?? 0) >= thr;
  const both = (a:PL,b:PL)=> v(a)&&v(b);
  const any = (arr:PL[])=> arr.some(i=>v(i));

  const visible_groups = {
    head: any([PL.NOSE,PL.LEFT_EAR,PL.RIGHT_EAR]),
    shoulders: both(PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER),
    elbows: both(PL.LEFT_ELBOW, PL.RIGHT_ELBOW),
    wrists: both(PL.LEFT_WRIST, PL.RIGHT_WRIST),
    hips: both(PL.LEFT_HIP, PL.RIGHT_HIP),
    knees: both(PL.LEFT_KNEE, PL.RIGHT_KNEE),
    ankles: both(PL.LEFT_ANKLE, PL.RIGHT_ANKLE),
    feet: any([PL.LEFT_FOOT_INDEX, PL.RIGHT_FOOT_INDEX, PL.LEFT_HEEL, PL.RIGHT_HEEL]),
  };
  const weights = {head:1, shoulders:2, elbows:1, wrists:1, hips:2, knees:2, ankles:2, feet:1};
  const got = Object.entries(visible_groups)
    .reduce((s,[k,ok]) => s + (ok ? (weights as any)[k] : 0), 0);
  const tot = Object.values(weights).reduce((a,b)=>a+b,0);
  const score = +(got/tot).toFixed(3);
  const full = visible_groups.shoulders && visible_groups.hips && visible_groups.knees && visible_groups.ankles
               && (visible_groups.head || visible_groups.feet);
  const state = full ? "full" : (score>=0.2 ? "partial" : "no_person");
  return { score, state, visible_groups };
}

// ---------- 길이/스케일 ----------
export function cmPerPxFromHeight(kp:KP, heightCm:number): number|null {
  const nose = kp[PL.NOSE];
  const lf = kp[PL.LEFT_FOOT_INDEX], rf = kp[PL.RIGHT_FOOT_INDEX];
  const foot = lf || rf;
  if(!nose || !foot) return null;
  const px = Math.abs((foot.y - nose.y));
  return px>0 ? +(heightCm/px).toFixed(4) : null;
}

export function limbLengthsCm(kp:KP, cmPerPx:number){
  const len = (a:PL,b:PL)=> {
    const d = dist(kp[a], kp[b]); if(d==null) return null;
    return +(d*cmPerPx).toFixed(1);
  };
  return {
    upperArmL: len(PL.LEFT_SHOULDER, PL.LEFT_ELBOW),
    upperArmR: len(PL.RIGHT_SHOULDER, PL.RIGHT_ELBOW),
    forearmL: len(PL.LEFT_ELBOW, PL.LEFT_WRIST),
    forearmR: len(PL.RIGHT_ELBOW, PL.RIGHT_WRIST),
    thighL: len(PL.LEFT_HIP, PL.LEFT_KNEE),
    thighR: len(PL.RIGHT_HIP, PL.RIGHT_KNEE),
    shankL: len(PL.LEFT_KNEE, PL.LEFT_ANKLE),
    shankR: len(PL.RIGHT_KNEE, PL.RIGHT_ANKLE),
  };
}

// ---------- 기본 포즈 지표(스쿼트 등) ----------
export function postureBasics(kp:KP){
  const kneeL = angleDeg(kp[PL.LEFT_HIP], kp[PL.LEFT_KNEE], kp[PL.LEFT_ANKLE]);
  const kneeR = angleDeg(kp[PL.RIGHT_HIP], kp[PL.RIGHT_KNEE], kp[PL.RIGHT_ANKLE]);
  const trunkL = angleDeg(kp[PL.LEFT_SHOULDER], kp[PL.LEFT_HIP], kp[PL.LEFT_ANKLE]);
  const trunkR = angleDeg(kp[PL.RIGHT_SHOULDER], kp[PL.RIGHT_HIP], kp[PL.RIGHT_ANKLE]);
  const trunkMaxFlexionDeg = Math.max(trunkL??0, trunkR??0) || null;
  const kneeMinDeg = Math.min(kneeL ?? 999, kneeR ?? 999);
  const wristsOverShoulder =
    ((kp[PL.LEFT_WRIST]?.y ?? 1) < (kp[PL.LEFT_SHOULDER]?.y ?? 0)) ||
    ((kp[PL.RIGHT_WRIST]?.y ?? 1) < (kp[PL.RIGHT_SHOULDER]?.y ?? 0));
  return {
    kneeMinDeg: isFinite(kneeMinDeg) ? Math.round(kneeMinDeg) : null,
    trunkMaxFlexionDeg: trunkMaxFlexionDeg ? +trunkMaxFlexionDeg.toFixed(1) : null,
    wristsOverShoulder
  };
}

// ---------- 비대칭/상세 지표 ----------
export function shoulderTiltDeg(kp:KP){
  const L = kp[PL.LEFT_SHOULDER], R = kp[PL.RIGHT_SHOULDER]; if(!L||!R) return null;
  const deg = lineAngleDeg(L.x, L.y, R.x, R.y);
  return +deg.toFixed(1); // 0°가 이상적 (수평)
}
export function pelvisObliquityDeg(kp:KP){
  const L = kp[PL.LEFT_HIP], R = kp[PL.RIGHT_HIP]; if(!L||!R) return null;
  const deg = lineAngleDeg(L.x, L.y, R.x, R.y);
  return +deg.toFixed(1);
}
export function shoulderProtractionIndex(kp:KP){
  const ear = kp[PL.RIGHT_EAR] || kp[PL.LEFT_EAR];
  const sh  = kp[PL.RIGHT_SHOULDER] || kp[PL.LEFT_SHOULDER];
  if(!ear||!sh) return null;
  return +(sh.x - ear.x).toFixed(2);
}
export function lateralShiftPx(kp:KP){
  const ms = mid(kp[PL.LEFT_SHOULDER], kp[PL.RIGHT_SHOULDER]);
  const mh = mid(kp[PL.LEFT_HIP], kp[PL.RIGHT_HIP]);
  if(!ms||!mh) return null;
  return +(ms.x - mh.x).toFixed(3);
}
export function kneeValgusIndex(kp:KP, side:"L"|"R"){
  const H = side==="L"? PL.LEFT_HIP: PL.RIGHT_HIP;
  const K = side==="L"? PL.LEFT_KNEE: PL.RIGHT_KNEE;
  const A = side==="L"? PL.LEFT_ANKLE: PL.RIGHT_ANKLE;
  const h=kp[H], k=kp[K], a=kp[A];
  if(!h||!k||!a) return null;
  const base = Math.max(8e-3, Math.abs(a.x - h.x)); // normalize (노멀값 보호)
  return +(((k.x - h.x) - (a.x - h.x))/base).toFixed(3);
}
export function heelLift(kp:KP, side:"L"|"R"){
  const HE = side==="L"? PL.LEFT_HEEL: PL.RIGHT_HEEL;
  const AN = side==="L"? PL.LEFT_ANKLE: PL.RIGHT_ANKLE;
  const he=kp[HE], an=kp[AN];
  if(!he||!an) return null;
  return +(an.y - he.y).toFixed(3); // +면 뒤꿈치가 아래(정상). 0보다 작으면 들림 의심
}
export function kneeOverToe(kp:KP, side:"L"|"R"){
  const K = side==="L"? PL.LEFT_KNEE: PL.RIGHT_KNEE;
  const F = side==="L"? PL.LEFT_FOOT_INDEX: PL.RIGHT_FOOT_INDEX;
  const k=kp[K], f=kp[F];
  if(!k||!f) return null;
  return +(k.x - f.x).toFixed(3);
}
export function footAngle(kp:KP, side:"L"|"R"){
  const HE= side==="L"? PL.LEFT_HEEL: PL.RIGHT_HEEL;
  const FI= side==="L"? PL.LEFT_FOOT_INDEX: PL.RIGHT_FOOT_INDEX;
  const he=kp[HE], fi=kp[FI];
  if(!he||!fi) return null;
  return +lineAngleDeg(he.x, he.y, fi.x, fi.y).toFixed(1);
}
export function neckFlexionDeg(kp:KP){
  // 귀-어깨 vs 수평 (정면 근사), |deg| 클수록 거북목 경향
  const ear = kp[PL.RIGHT_EAR] || kp[PL.LEFT_EAR];
  const sh  = kp[PL.RIGHT_SHOULDER] || kp[PL.LEFT_SHOULDER];
  if(!ear||!sh) return null;
  return +Math.abs(lineAngleDeg(ear.x, ear.y, sh.x, sh.y)).toFixed(1);
}
export function neckRotationDeg(kp:KP){
  const nose = kp[PL.NOSE]; const ear = kp[PL.RIGHT_EAR] || kp[PL.LEFT_EAR];
  if(!nose||!ear) return null;
  return +Math.abs(lineAngleDeg(ear.x, ear.y, nose.x, nose.y)).toFixed(1);
}
// 측면 프록시
export function sideSagittalProxies(kp:KP){
  const sh = mid(kp[PL.LEFT_SHOULDER], kp[PL.RIGHT_SHOULDER]);
  const hp = mid(kp[PL.LEFT_HIP], kp[PL.RIGHT_HIP]);
  const an = mid(kp[PL.LEFT_ANKLE], kp[PL.RIGHT_ANKLE]);
  const nose = kp[PL.NOSE];
  if(!sh||!hp||!an) return {forwardHead:null, swayBack:null, pelvicTilt:null, trunkDeg:null};
  const trunkDeg = Math.abs(lineAngleDeg(hp.x, hp.y, sh.x, sh.y) - 90);
  const pelvicDeg= Math.abs(lineAngleDeg(an.x, an.y, hp.x, hp.y) - 90);
  const forwardHead = nose ? +(sh.x - nose.x).toFixed(3) : null;
  const swayBack = +((hp.x - an.x)).toFixed(3);
  const pelvicTilt = +pelvicDeg.toFixed(1);
  return { forwardHead, swayBack, pelvicTilt, trunkDeg:+trunkDeg.toFixed(1) };
}

// ---------- 보조 ROI ----------
export function roiFromNames(kp:KP, names:PL[], w:number, h:number, marginPx=0.05){
  const xs:number[] = [], ys:number[] = [];
  names.forEach(i=>{
    const k = kp[i];
    if(k && (k.visibility??0) > 0.25){ xs.push(k.x*w); ys.push(k.y*h); }
  });
  if(!xs.length) return null;
  const x1 = Math.max(0, Math.min(...xs) - w*marginPx);
  const x2 = Math.min(w, Math.max(...xs) + w*marginPx);
  const y1 = Math.max(0, Math.min(...ys) - h*marginPx);
  const y2 = Math.min(h, Math.max(...ys) + h*marginPx);
  return {x1,y1,x2,y2};
}

// 측면 점수(어깨폭 대비 화면폭)
export function sideFacingScore(kp:KP, w:number){
  const L = kp[PL.LEFT_SHOULDER], R = kp[PL.RIGHT_SHOULDER];
  if(!L||!R) return 0;
  const span = Math.abs(L.x - R.x);
  return span < 0.05 ? 1 : 0; // 어깨폭이 좁게 보이면 측면으로 간주(가벼운 근사)
}
