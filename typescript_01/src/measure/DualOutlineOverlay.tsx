import React, { useEffect, useRef } from "react";

/** ===== Types ===== */
type FitMode = "contain" | "cover" | "fill";
type Pt = [number, number];

type KP =
  | any[] // MediaPipe style landmarks
  | { poseLandmarks?: any[]; landmarks?: any[] }
  | null
  | undefined;

type SegMask =
  | null
  | undefined
  | { data: Uint8Array | Uint8ClampedArray | Float32Array; width?: number; w?: number; height?: number; h?: number };

type Mode = "front" | "side" | "squat" | "flex";

type Props = {
  kp?: KP;
  mask?: SegMask;

  fit?: FitMode;
  mirrored?: boolean;

  /** 고정형 가이드의 자세(형태)는 모드로만 바뀜 */
  mode?: Mode;

  /** 스타일 */
  personColor?: string;
  guideColor?: string;
  personLineWidth?: number;
  guideLineWidth?: number;
  fillAlpha?: number;

  /** 가이드가 사람 발/키를 따라가는 부드러움(0=즉시, 0.7~0.9 권장) */
  followSmooth?: number;

  /** 디버그 점/뷰박스/신뢰도 색상 보기 */
  debug?: boolean;
};

const DualOutlineOverlay: React.FC<Props> = ({
  kp,
  mask,
  fit = "contain",
  mirrored = true,
  mode = "front",
  personColor = "#25A0FF",
  guideColor = "#FF7A00",
  personLineWidth = 2.4,
  guideLineWidth = 2.2,
  fillAlpha = 0.06,
  followSmooth = 0.85,
  debug = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 오프스크린(사람 윤곽 추출)
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const octxRef = useRef<CanvasRenderingContext2D | null>(null);

  // 추종 상태(발 앵커/키/신뢰도)
  const anchorRef = useRef<{ x: number; y: number } | null>(null);
  const heightRef = useRef<number | null>(null);
  const confRef = useRef<number>(0);

  // 사람 윤곽 포인트(바운딩 계산용) 캐시
  const personPtsRef = useRef<Pt[] | null>(null);
  const personPathRef = useRef<Path2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const DPR = globalThis.devicePixelRatio || 1;

    if (!offRef.current) {
      offRef.current = document.createElement("canvas");
      octxRef.current = offRef.current.getContext("2d", { willReadFrequently: true })!;
    }
    const off = offRef.current!;
    const octx = octxRef.current!;

    let raf = 0;
    const loop = () => {
      const cssW = canvas.clientWidth | 0;
      const cssH = canvas.clientHeight | 0;
      if (cssW <= 0 || cssH <= 0) { raf = requestAnimationFrame(loop); return; }

      const pxW = Math.max(1, Math.round(cssW * DPR));
      const pxH = Math.max(1, Math.round(cssH * DPR));
      if (canvas.width !== pxW) canvas.width = pxW;
      if (canvas.height !== pxH) canvas.height = pxH;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      if (off.width !== cssW) off.width = cssW;
      if (off.height !== cssH) off.height = cssH;
      octx.setTransform(1, 0, 0, 1, 0, 0);
      octx.clearRect(0, 0, cssW, cssH);

      const { viewW, viewH, offX, offY } = computeViewBox(cssW, cssH, fit);

      /* ============ 1) 사람 윤곽(1개) 추출 ============ */
      const person = buildPersonOutline(octx, cssW, cssH, offX, offY, viewW, viewH, kp, mask);
      if (person) {
        personPtsRef.current = person.pts;
        personPathRef.current = person.path;
      }

      /* ============ 2) 발 앵커/키 즉시 산출(계층형 fallback 포함) ============ */
      const prevState = (anchorRef.current && heightRef.current)
        ? { anchor: anchorRef.current!, height: heightRef.current! }
        : null;

      const est = estimateAnchorHeight(cssW, cssH, viewW, viewH, offX, offY, kp, mask, personPtsRef.current, prevState);
      let instA: { x: number; y: number } | null = null;
      let instH: number | null = null;
      let instC = 0;

      if (est) {
        instA = est.anchor;
        instH = est.height;
        instC = est.conf;
      } else if (personPtsRef.current && personPtsRef.current.length >= 4) {
        // 최소 fallback: 윤곽 박스 사용
        const tmp = anchorAndHeightFromPts(personPtsRef.current);
        instA = tmp.anchor;
        instH = tmp.height;
        instC = 0.4;
      } else if (prevState) {
        instA = prevState.anchor;
        instH = prevState.height;
        instC = 0.35;
      } else {
        // 화면 하단 근처에 임시 고정
        instA = { x: offX + viewW * 0.5, y: offY + viewH * 0.98 };
        instH = viewH * 0.9;
        instC = 0.3;
      }

      /* ============ 3) 렌더 ============ */
      ctx.save();
      if (mirrored) { ctx.translate(cssW, 0); ctx.scale(-1, 1); }

      // (a) 사람 테두리 (실시간)
      const personPath = personPathRef.current;
      if (personPath) {
        if (fillAlpha > 0) {
          ctx.save(); ctx.fillStyle = `rgba(37,160,255,${fillAlpha})`; ctx.fill(personPath); ctx.restore();
        }
        ctx.save();
        ctx.strokeStyle = personColor; ctx.lineWidth = personLineWidth;
        ctx.lineJoin = "round"; ctx.lineCap = "round";
        ctx.stroke(personPath);
        ctx.restore();
      }

      // (b) 가이드(형태 고정 + 발/키 추종) — 즉시값으로 먼저 그림
      if (instA && instH) {
        const norm = getGuideContour(mode);        // 단일 폐곡선(0~1), 바닥앵커(0.5,1.0)
        const placed = placeGuide(norm, instA.x, instA.y, instH);
        const gPath = pathFromPts(placed);

        // 신뢰도에 따른 시각 보정
        const conf = clamp01(instC);
        const wMul = lerp(0.9, 1.15, conf);      // 선 두께 보정
        const aFill = fillAlpha * lerp(0.35, 1.0, conf); // 채움 알파 보정
        const col = guideColor;

        // 그림자
        ctx.save();
        ctx.strokeStyle = "rgba(0,0,0,0.82)";
        ctx.lineWidth = Math.max(1, guideLineWidth * 1.6 * wMul);
        ctx.lineJoin = "round"; ctx.lineCap = "round";
        ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 6;
        ctx.stroke(gPath);
        ctx.restore();

        if (aFill > 0) {
          ctx.save(); ctx.fillStyle = hexToRgba(col, 0.08 * aFill); ctx.fill(gPath); ctx.restore();
        }
        ctx.save();
        ctx.strokeStyle = conf < 0.6 ? withAlpha(col, 0.75) : col;
        ctx.lineWidth = Math.max(1, guideLineWidth * wMul);
        ctx.setLineDash(conf < 0.5 ? [8, 6] : []); // 신뢰도 낮을 때 점선
        ctx.lineJoin = "round"; ctx.lineCap = "round";
        ctx.stroke(gPath);
        ctx.restore();
      }

      if (debug) {
        const vb = { x: offX, y: offY, w: viewW, h: viewH };
        ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = "red"; ctx.fillRect(vb.x, vb.y, vb.w, vb.h); ctx.restore();
        // 발 앵커 점
        if (instA) { ctx.save(); ctx.fillStyle = "lime"; ctx.beginPath(); ctx.arc(instA.x, instA.y, 4, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
        // 신뢰도 표시
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.font = "12px sans-serif";
        ctx.fillText(`conf=${instC.toFixed(2)}`, vb.x + 8, vb.y + 16);
        ctx.restore();
      }

      ctx.restore();

      /* ============ 4) 스무딩 상태 갱신(렌더 이후) ============ */
      if (instA && instH) {
        const a = clamp01(followSmooth);
        const prevA = anchorRef.current;
        const prevH = heightRef.current;
        anchorRef.current = prevA
          ? { x: prevA.x + (instA.x - prevA.x) * (1 - a), y: prevA.y + (instA.y - prevA.y) * (1 - a) }
          : instA;
        heightRef.current = prevH != null ? prevH + (instH - prevH) * (1 - a) : instH;
        confRef.current = instC * 0.6 + confRef.current * 0.4; // 부드러운 conf
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [kp, mask, fit, mirrored, mode, personColor, guideColor, personLineWidth, guideLineWidth, fillAlpha, followSmooth, debug]);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 30 }} />;
};

export default DualOutlineOverlay;

/* ================= helpers ================= */

function clamp01(x:number){ return Math.max(0, Math.min(1, x)); }
function lerp(a:number,b:number,t:number){ return a+(b-a)*t; }
function withAlpha(hex:string, a:number){ return hexToRgba(hex, a); }
function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#",""); const v = parseInt(h.length===3? h.split("").map(c=>c+c).join(""): h,16);
  const r=(v>>16)&255, g=(v>>8)&255, b=v&255;
  return `rgba(${r},${g},${b},${clamp01(a)})`;
}

function computeViewBox(cssW: number, cssH: number, fit: FitMode) {
  if (fit === "fill") return { viewW: cssW, viewH: cssH, offX: 0, offY: 0 };
  const s = fit === "contain" ? Math.min(cssW, cssH) : Math.max(cssW, cssH);
  const viewW = s, viewH = s;
  return { viewW, viewH, offX: (cssW - viewW) / 2, offY: (cssH - viewH) / 2 };
}

/** 사람 윤곽: (mask 우선) + (skeleton 튜브 보강) → marching squares → 단일 루프 Path */
function buildPersonOutline(
  octx: CanvasRenderingContext2D,
  cssW: number, cssH: number,
  offX: number, offY: number, viewW: number, viewH: number,
  kp?: KP, mask?: SegMask
): { pts: Pt[]; path: Path2D } | null {
  octx.clearRect(0, 0, cssW, cssH);
  let used = false;

  // 1) 세그 마스크 (있으면 알파로 투사)
let maskUsed = false;
if (mask) {
  const MW = (mask as any).width ?? (mask as any).w ?? 0;
  const MH = (mask as any).height ?? (mask as any).h ?? 0;
  const raw: any = (mask as any).data;
  if (MW && MH && raw && raw.length) {
    const isRGBA = raw.length === 4 * MW * MH;

    // ⬇️ 임시 캔버스 사용: 자기 자신에 drawImage 금지
    const tmp = document.createElement("canvas");
    tmp.width = MW; tmp.height = MH;
    const tctx = tmp.getContext("2d", { willReadFrequently: true })!;

    const img = tctx.createImageData(MW, MH);
    if (isRGBA) {
      for (let i = 0; i < MW * MH; i++) {
        const a = (raw[4 * i + 3] ?? 0) | 0;
        const b = 4 * i;
        img.data[b] = 255; img.data[b+1] = 255; img.data[b+2] = 255; img.data[b+3] = a;
      }
    } else {
      for (let i = 0; i < MW * MH; i++) {
        const v = raw[i]; const b = 4 * i; const on = v > 0.5;
        img.data[b] = 255; img.data[b+1] = 255; img.data[b+2] = 255; img.data[b+3] = on ? 255 : 0;
      }
    }
    tctx.putImageData(img, 0, 0);

    octx.globalCompositeOperation = "source-over"; // 안전
    octx.drawImage(tmp, 0, 0, MW, MH, offX, offY, viewW, viewH);

    maskUsed = true;
  }
}


  // 2) 스켈레톤 튜브 보강
  const lms = landmarksFromAny(kp);
  if (lms.length) {
    const tube = (k:number)=> Math.max(2, Math.min(viewW, viewH) * 0.06 * k);
    const bones: Array<[number, number, number]> = [
      [11,12,0.7],[11,13,0.7],[13,15,0.55],[12,14,0.7],[14,16,0.55],
      [23,24,0.8],[11,23,0.75],[12,24,0.75],[23,25,0.75],[25,27,0.65],
      [24,26,0.75],[26,28,0.65],[27,31,0.55],[28,32,0.55],
    ];
    const toView = (nx:number, ny:number):Pt => [offX + nx*viewW, offY + ny*viewH];

    octx.save();
    octx.fillStyle = "white";
    octx.strokeStyle = "white";
    octx.lineJoin = "round"; octx.lineCap = "round";

    for (const [a,b,k] of bones) {
      const A=lms[a], B=lms[b];
      if (!A || !B || (A.visibility??0)<=0 || (B.visibility??0)<=0) continue;
      const pA = toView(A.x, A.y), pB = toView(B.x, B.y);
      const w = tube(k);
      octx.lineWidth = w;
      octx.beginPath(); octx.moveTo(pA[0], pA[1]); octx.lineTo(pB[0], pB[1]); octx.stroke();
      octx.beginPath(); octx.arc(pA[0], pA[1], w*0.5, 0, Math.PI*2);
      octx.arc(pB[0], pB[1], w*0.5, 0, Math.PI*2); octx.fill();
      used = true;
    }
    octx.restore();
  }

  if (!used) return null;

  // 3) marching squares → 최대 루프 → 스무딩/리샘플 → Path
  const img = octx.getImageData(0, 0, cssW, cssH);
  const A = img.data;
  const bin = new Uint8Array(cssW*cssH);
  for (let y=1;y<cssH-1;y++){
    for (let x=1;x<cssW-1;x++){
      const idx=(y*cssW + x)*4 + 3;
      bin[y*cssW+x] = A[idx] > 16 ? 1 : 0;
    }
  }
  const lcc = largestComponent(bin, cssW, cssH);
  if (lcc.count < 24) return null;

  const segs = marchingSquares((x,y)=>(lcc.map[y*cssW + x]?1:0), cssW, cssH);
  const loops = connectSegmentsToLoops(segs);
  if (!loops.length) return null;

  // 가장 큰 루프 선택
  let kmax = 0; const areas = loops.map(polygonAreaAbs);
  for (let i=1;i<areas.length;i++) if (areas[i] > areas[kmax]) kmax = i;
  let pts = loops[kmax];

  // 스무딩 + 리샘플
  pts = chaikin(pts as Pt[], 0.26);
  pts = chaikin(pts as Pt[], 0.26);
  pts = resample(pts as Pt[], 220);

  return { pts, path: pathFromPts(pts) };
}

function pathFromPts(pts: Pt[]) {
  const p = new Path2D();
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i=1;i<pts.length;i++) p.lineTo(pts[i][0], pts[i][1]);
  p.closePath();
  return p;
}

/* ====== Guide: 단일 폐곡선(정규화 0~1), 바닥 앵커(0.5,1.0) ====== */
function getGuideContour(mode: Mode): Pt[] {
  switch (mode) {
    case "side":  return GUIDE_SIDE;
    case "squat": return GUIDE_SQUAT;
    case "flex":  return GUIDE_FLEX;
    default:      return GUIDE_FRONT;
  }
}

function placeGuide(norm: Pt[], footX:number, footY:number, heightPx:number): Pt[] {
  const bb = bboxPts(norm);
  const sc = heightPx / Math.max(1e-3, bb.h);
  const cx = 0.5, by = 1.0; // 바닥 앵커
  return norm.map(([x,y]) => [footX + (x - cx)*sc, footY + (y - by)*sc]) as Pt[];
}

/* ===== 봉긋한 사람 Front 단일 폐곡선 ===== */
const GUIDE_FRONT: Pt[] = (() => {
  const pts: Pt[] = [];
  const add = (p:Pt)=>pts.push(p);
  const arc = (cx:number, cy:number, r:number, a0:number, a1:number, n:number)=>{
    for (let i=0;i<=n;i++){ const t=a0+(a1-a0)*i/n; add([cx+Math.cos(t)*r, cy+Math.sin(t)*r]); }
  };
  const line = (xs:number, ys:number, xe:number, ye:number, n:number)=>{
    for (let i=0;i<=n;i++){ const t=i/n; add([xs+(xe-xs)*t, ys+(ye-ys)*t]); }
  };

  // 규격(0~1)
  const headC:Pt=[0.5,0.14], headR=0.095;
  const neckY=0.22;
  const shY=0.28, shHalf=0.19;
  const armBulgeX=0.82, armLowY=0.62;
  const waistY=0.55, waistHalf=0.13;
  const hipY=0.70, hipHalf=0.17;
  const crotchY=0.78, legGap=0.06;
  const footY=1.00, footHalf=0.10;

  // 머리 상단(좌→우)
  arc(headC[0], headC[1], headR, Math.PI*1.05, Math.PI*1.95, 24);

  // 오른쪽 외곽
  line(0.57, neckY, 0.50+shHalf, shY, 6);
  line(0.50+shHalf, shY, armBulgeX, (shY+armLowY)*0.5, 6);
  line(armBulgeX, (shY+armLowY)*0.5, 0.50+waistHalf, waistY, 6);
  line(0.50+waistHalf, waistY, 0.50+hipHalf, hipY, 5);
  line(0.50+hipHalf, hipY, 0.50+legGap*0.5+0.04, crotchY, 5);
  line(0.50+legGap*0.5+0.04, crotchY, 0.50+footHalf*0.85, footY, 6);
  line(0.50+footHalf*0.85, footY, 0.50+footHalf*0.35, footY, 3);

  // 가운데(발 사이)
  line(0.50+footHalf*0.35, footY, 0.50+legGap*0.5, footY-0.02, 3);
  line(0.50+legGap*0.5, footY-0.02, 0.50-legGap*0.5, footY-0.02, 4);
  line(0.50-legGap*0.5, footY-0.02, 0.50-footHalf*0.35, footY, 3);

  // 왼쪽 외곽
  line(0.50-footHalf*0.35, footY, 0.50-footHalf*0.85, footY, 3);
  line(0.50-footHalf*0.85, footY, 0.50-legGap*0.5-0.04, crotchY, 6);
  line(0.50-legGap*0.5-0.04, crotchY, 0.50-hipHalf, hipY, 6);
  line(0.50-hipHalf, hipY, 0.50-waistHalf, waistY, 5);
  line(0.50-waistHalf, waistY, 0.50-shHalf, shY, 6);
  line(0.50-shHalf, shY, 0.43, neckY, 6);

  // 머리 하단(우→좌)
  arc(headC[0], headC[1], headR, Math.PI*0.95, Math.PI*0.05, 24);

  return resample(pts, 200);
})();

/* 간단한 옆모습/스쿼트/플렉스도 단일 폐곡선(대략형) */
const GUIDE_SIDE: Pt[] = (() => {
  const pts: Pt[] = []; const add=(p:Pt)=>pts.push(p);
  const arc=(cx:number,cy:number,r:number,a0:number,a1:number,n:number)=>{
    for(let i=0;i<=n;i++){const t=a0+(a1-a0)*i/n; add([cx+Math.cos(t)*r, cy+Math.sin(t)*r]);}
  };
  arc(0.52,0.14,0.09,Math.PI*1.1,Math.PI*1.9,28);
  add([0.56,0.22]); add([0.58,0.34]); add([0.58,0.48]); add([0.56,0.62]); add([0.53,0.70]);
  add([0.54,0.82]); add([0.52,0.96]); add([0.48,1.00]); add([0.44,1.00]);
  add([0.46,0.90]); add([0.47,0.78]); add([0.47,0.58]); add([0.48,0.42]); add([0.50,0.24]);
  add([0.50,0.20]); arc(0.52,0.14,0.09,Math.PI*0.9,Math.PI*0.1,28);
  return resample(pts, 180);
})();

const GUIDE_SQUAT: Pt[] = (() => {
  const pts: Pt[] = []; const add=(p:Pt)=>pts.push(p);
  add([0.45,0.25]); add([0.55,0.25]); add([0.60,0.38]); add([0.58,0.52]);
  add([0.54,0.62]); add([0.64,0.74]); add([0.60,0.86]); add([0.48,0.90]); add([0.40,0.82]);
  add([0.38,0.90]); add([0.34,0.98]); add([0.30,1.00]); add([0.28,0.98]); add([0.32,0.86]);
  add([0.36,0.72]); add([0.40,0.62]); add([0.42,0.52]); add([0.42,0.38]); add([0.45,0.25]);
  return resample(pts, 170);
})();

const GUIDE_FLEX: Pt[] = (() => {
  const pts: Pt[] = []; const add=(p:Pt)=>pts.push(p);
  add([0.44,0.28]); add([0.52,0.22]); add([0.60,0.30]); add([0.60,0.44]);
  add([0.56,0.58]); add([0.50,0.64]); add([0.46,0.58]); add([0.44,0.46]);
  add([0.44,0.28]);
  return resample(pts, 160);
})();

/* ====== 기하/마스크 유틸 ====== */
function landmarksFromAny(kp: KP): any[] {
  if (!kp) return [];
  if (Array.isArray(kp)) return kp as any[];
  const o = kp as any;
  if (Array.isArray(o.poseLandmarks)) return o.poseLandmarks;
  if (Array.isArray(o.landmarks)) return o.landmarks;
  return [];
}

function bboxPts(pts: Pt[]) {
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  for (const [x,y] of pts){ if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y; }
  return { x:minX, y:minY, w:maxX-minX, h:maxY-minY, cx:(minX+maxX)/2, cy:(minY+maxY)/2 };
}

type Seg = [Pt, Pt];
function marchingSquares(at:(x:number,y:number)=>0|1, W:number, H:number): Seg[] {
  const segs: Seg[] = [];
  const T=(x:number,y:number):Pt=>[x+0.5,y], R=(x:number,y:number):Pt=>[x+1,y+0.5], B=(x:number,y:number):Pt=>[x+0.5,y+1], L=(x:number,y:number):Pt=>[x,y+0.5];
  for (let y=0;y<H-1;y++) for (let x=0;x<W-1;x++){
    const tl=at(x,y), tr=at(x+1,y), br=at(x+1,y+1), bl=at(x,y+1);
    const idx=(tl<<3)|(tr<<2)|(br<<1)|bl; if (idx===0||idx===15) continue;
    switch(idx){
      case 1:  segs.push([L(x,y),B(x,y)]); break;
      case 2:  segs.push([B(x,y),R(x,y)]); break;
      case 3:  segs.push([L(x,y),R(x,y)]); break;
      case 4:  segs.push([T(x,y),R(x,y)]); break;
      case 5:  segs.push([T(x,y),L(x,y)]); segs.push([R(x,y),B(x,y)]); break;
      case 6:  segs.push([T(x,y),B(x,y)]); break;
      case 7:  segs.push([T(x,y),L(x,y)]); break;
      case 8:  segs.push([L(x,y),T(x,y)]); break;
      case 9:  segs.push([B(x,y),T(x,y)]); break;
      case 10: segs.push([L(x,y),B(x,y)]); segs.push([T(x,y),R(x,y)]); break;
      case 11: segs.push([R(x,y),T(x,y)]); break;
      case 12: segs.push([R(x,y),L(x,y)]); break;
      case 13: segs.push([R(x,y),B(x,y)]); break;
      case 14: segs.push([B(x,y),L(x,y)]); break;
    }
  }
  return segs;
}
function connectSegmentsToLoops(segments: Seg[]): Pt[][] {
  const key = (p: Pt) => `${p[0].toFixed(2)}|${p[1].toFixed(2)}`;
  const adj = new Map<string, Pt[]>();
  for (const [a,b] of segments){
    const ka=key(a), kb=key(b);
    (adj.get(ka)??adj.set(ka,[]).get(ka)!).push(b);
    (adj.get(kb)??adj.set(kb,[]).get(kb)!).push(a);
  }
  const used = new Set<string>(); const loops: Pt[][] = [];
  for (const [a,b] of segments){
    const ka=key(a), kb=key(b);
    if (used.has(ka) && used.has(kb)) continue;
    let start=a, curr=a; const loop:Pt[]=[start]; used.add(key(start));
    let guard=0;
    while (guard++<200000){
      const neigh = adj.get(key(curr)) || [];
      let next:Pt|undefined;
      for (const p of neigh){ const k=key(p); if (!used.has(k)){ next=p; break; } }
      if (!next) break;
      loop.push(next); used.add(key(next)); curr = next;
      if (Math.hypot(curr[0]-start[0], curr[1]-start[1])<1e-2 && loop.length>4) break;
    }
    if (loop.length>=4 && Math.hypot(loop[0][0]-loop[loop.length-1][0], loop[0][1]-loop[loop.length-1][1])<1e-2)
      loops.push(loop);
  }
  return loops;
}
function polygonAreaAbs(pts: Pt[]) { let s=0; for (let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; s += a[0]*b[1] - b[0]*a[1]; } return Math.abs(s*0.5); }
function chaikin(pts: Pt[], f=0.25){ if (pts.length<4) return pts.slice(); const out:Pt[]=[]; for (let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; const Q:Pt=[(1-f)*a[0]+f*b[0], (1-f)*a[1]+f*b[1]]; const R:Pt=[f*a[0]+(1-f)*b[0], f*a[1]+(1-f)*b[1]]; out.push(Q,R);} return out; }
function resample(pts: Pt[], N: number) {
  if (pts.length < 2) return pts.slice();
  const len:number[]=[]; let total=0;
  for (let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; const d=Math.hypot(a[0]-b[0], a[1]-b[1]); len.push(d); total+=d; }
  if (total < 1e-6) return pts.slice();
  const out:Pt[]=[]; let acc=0, k=0, target=0;
  for (let i=0;i<pts.length;i++){
    const a=pts[i], b=pts[(i+1)%pts.length]; const L=len[i]; if (L<=1e-6) continue; let u=0;
    while (acc+(1-u)*L >= target && k<N){
      const need=target-acc; const uu = need/L + u;
      out.push([a[0]+(b[0]-a[0])*uu, a[1]+(b[1]-a[1])*uu]); k++; target=(k/N)*total; u=uu;
    }
    acc += (1-u)*L;
  }
  while (out.length < N) out.push(pts[out.length % pts.length]);
  return out;
}

function largestComponent(bin: Uint8Array, W: number, H: number) {
  // 8-이웃 연결 성분 중 가장 큰 성분만 반환
  const seen = new Uint8Array(W * H);
  const tagMap = new Uint16Array(W * H);
  let bestCount = 0, bestTag = 0, tag = 1;

  const qx: number[] = [];
  const qy: number[] = [];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      if (!bin[idx] || seen[idx]) continue;

      // BFS
      let cnt = 0;
      qx.length = 0; qy.length = 0;
      seen[idx] = 1;
      qx.push(x); qy.push(y);
      tag++;

      while (qx.length) {
        const cx = qx.pop()!, cy = qy.pop()!;
        const ii = cy * W + cx;
        tagMap[ii] = tag;
        cnt++;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if ((dx | dy) === 0) continue;
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const ni = ny * W + nx;
            if (bin[ni] && !seen[ni]) {
              seen[ni] = 1;
              qx.push(nx); qy.push(ny);
            }
          }
        }
      }

      if (cnt > bestCount) { bestCount = cnt; bestTag = tag; }
    }
  }

  const out = new Uint8Array(W * H);
  if (bestCount > 0) {
    for (let i = 0; i < W * H; i++) if (tagMap[i] === bestTag) out[i] = 1;
  }
  return { map: out, count: bestCount };
}

/** 윤곽 포인트만 있을 때의 간단 앵커/키 */
function anchorAndHeightFromPts(pts: [number, number][]) {
  const bb = bboxPts(pts);
  return {
    anchor: { x: bb.cx, y: bb.y + bb.h },   // 발 중앙(바닥) 앵커
    height: Math.max(10, bb.h),             // 사람 키(픽셀)
  };
}

/** 발이 안 보여도 유지되는 계층형 앵커/키 추정 */
function estimateAnchorHeight(
  cssW:number, cssH:number,
  viewW:number, viewH:number, offX:number, offY:number,
  kp?: KP, mask?: SegMask, personPts?: Pt[] | null,
  prev?: { anchor:{x:number,y:number}, height:number } | null
): { anchor:{x:number,y:number}, height:number, conf:number } | null {

  const lms = landmarksFromAny(kp);
  const toView = (nx:number, ny:number) => [offX + nx*viewW, offY + ny*viewH] as [number,number];

  // 1) 마스크 바닥 (가장 강함)
  const m = maskBottomQuantile(mask, viewW, viewH, offX, offY);
  if (m) {
    const H = estimateHeightFromLandmarks(lms, toView) ??
              estimateHeightFromPersonPts(personPts) ??
              (viewH*0.88);
    return { anchor: { x: m.xCenter, y: m.yBottom }, height: H, conf: 0.9 };
  }

  // 2) 발/발목 랜드마크
  const feet = pickFeet(lms);
  if (feet.length) {
    const ps = feet.map(p => toView(p.x,p.y));
    const y = Math.max(...ps.map(p=>p[1]));
    const x = avg(ps.map(p=>p[0]));
    const H = estimateHeightFromLandmarks(lms, toView) ??
              estimateHeightFromPersonPts(personPts) ?? (viewH*0.88);
    return { anchor: {x, y}, height: H, conf: 0.85 };
  }

  // 3) 무릎 + 골반
  const knees = pickKnees(lms);
  const hips  = pickHips(lms);
  const headT = headTop(lms, toView);
  if (knees && hips && headT != null) {
    const k = toView(knees.cx, knees.y);
    const h = toView(hips.cx,  hips.y);
    // 정강이 길이 ≈ 허벅지 길이 가정
    const footY = k[1] + Math.max(6, (k[1] - h[1]));
    const footX = h[0];
    const H = (h[1] - headT) / 0.53; // 머리~골반 53%
    return { anchor: { x: footX, y: footY }, height: H, conf: 0.7 };
  }

  // 4) 골반 + 머리만 가능
  if (hips && headT != null) {
    const hV = toView(hips.cx, hips.y);
    const H = (hV[1] - headT) / 0.53;
    const footY = hV[1] + H * 0.47;
    const footX = hV[0];
    return { anchor: {x: footX, y: footY}, height: H, conf: 0.55 };
  }

  // 5) 상반신만 → 화면 하단 고정 + 이전값
  if (prev) return { anchor: prev.anchor, height: prev.height, conf: 0.4 };

  return {
    anchor: { x: offX + viewW*0.5, y: offY + viewH*0.98 },
    height: viewH*0.9,
    conf: 0.35
  };
}

/* ====== 마스크 바닥/랜드마크/비율 유틸 ====== */
function maskBottomQuantile(mask: SegMask, viewW:number, viewH:number, offX:number, offY:number) {
  if (!mask) return null;
  const MW = (mask as any).width ?? (mask as any).w ?? 0;
  const MH = (mask as any).height ?? (mask as any).h ?? 0;
  const raw: any = (mask as any).data;
  if (!MW || !MH || !raw || !raw.length) return null;

  const isRGBA = raw.length === 4 * MW * MH;
  const ON = (i:number) => isRGBA ? ((raw[4*i+3] ?? 0) > 16) : (raw[i] > 0.5);

  // 아래쪽에서부터 첫 "충분히 채워진" 행 찾기
  const minCount = Math.max(6, Math.floor(MW * 0.02));
  for (let y = MH - 1; y >= 0; y--) {
    let cnt = 0;
    let sumX = 0;
    for (let x = 0; x < MW; x++) {
      const i = y * MW + x;
      if (ON(i)) { cnt++; sumX += x; }
    }
    if (cnt >= minCount) {
      const xCenter = sumX / cnt;
      return {
        yBottom: offY + (y / MH) * viewH,
        xCenter: offX + (xCenter / MW) * viewW
      };
    }
  }
  return null;
}

function pickFeet(lms:any[]) {
  const ids = [31,32,27,28]; // foot_index, ankles
  const pts = ids.map(id => lms[id]).filter(Boolean)
    .filter((p:any)=> (p.visibility??0) > 0.2);
  return pts;
}
function pickKnees(lms:any[]) {
  const L = lms[25], R = lms[26];
  if (!L && !R) return null;
  const cand = [L,R].filter(Boolean).filter((p:any)=>(p.visibility??0)>0.15);
  if (!cand.length) return null;
  const cx = avg(cand.map((p:any)=>p.x));
  const y  = avg(cand.map((p:any)=>p.y));
  return { cx, y };
}
function pickHips(lms:any[]) {
  const L = lms[23], R = lms[24];
  if (!L || !R) return null;
  const vis = (L.visibility??0)+(R.visibility??0);
  if (vis < 0.1) return null;
  return { cx:(L.x+R.x)/2, y:(L.y+R.y)/2 };
}
function headTop(lms:any[], toView:(x:number,y:number)=>[number,number]) {
  const cand = [lms[0], lms[7], lms[8], lms[9], lms[10]].filter(Boolean)
    .filter((p:any)=> (p.visibility??0) > 0.15);
  if (!cand.length) return null;
  const ys = cand.map((p:any)=> toView(p.x,p.y)[1]);
  return Math.min(...ys);
}
function estimateHeightFromLandmarks(lms:any[], toView:(x:number,y:number)=>[number,number]) {
  const hips = pickHips(lms); const ht = headTop(lms,toView);
  if (hips && ht != null) {
    const hV = toView(hips.cx, hips.y)[1];
    return (hV - ht) / 0.53;
  }
  // 어깨만 있을 때: 머리~어깨 ≈ 0.28H
  const sh = [lms[11], lms[12]].filter(Boolean).filter((p:any)=>(p.visibility??0)>0.2);
  const nose = lms[0];
  if (sh.length && nose && (nose.visibility??0)>0.15) {
    const sy = avg(sh.map((p:any)=>toView(p.x,p.y)[1]));
    const ny = toView(nose.x,nose.y)[1];
    const headToShoulder = Math.abs(sy - ny);
    if (headToShoulder > 2) return headToShoulder / 0.28;
  }
  return null;
}
function estimateHeightFromPersonPts(pts?:Pt[]|null){
  if (!pts || pts.length<4) return null;
  const bb = bboxPts(pts);
  return Math.max(20, bb.h);
}

function avg(a:number[]){ return a.length? a.reduce((s,v)=>s+v,0)/a.length : 0; }
