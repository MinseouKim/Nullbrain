// src/measure/MaskOutlineOverlay.tsx
import React, { useEffect, useRef } from "react";
import type { SegMask } from "../poseLib/segmentation";
import type { KP, Size } from "../poseLib/poseTypes";

type Pt = { x:number; y:number };

type Props = {
  mask: SegMask | null;
  kp?: KP | null;
  size?: Size | null;
  mirrored?: boolean;
  color?: string;
  lineWidth?: number;
  gridW?: number;
  /** "front" = 차렷 기준, "side" = 발 겹침 기준 */
  guideMode?: "front" | "side";
};

const MaskOutlineOverlay: React.FC<Props> = ({
  mask,
  kp,
  size,
  mirrored = true,
  color = "#FF6A83",
  lineWidth = 4,
  gridW = 96,
  guideMode = "front",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ---------- marching & helpers ---------- */
  const marching = (mask: SegMask, gridW: number) => {
    const W = (mask as any).width ?? (mask as any).w ?? 640;
    const H = (mask as any).height ?? (mask as any).h ?? 360;
    const data: Uint8Array | Uint8ClampedArray = (mask as any).data;

    const gW = Math.min(gridW, W);
    const gH = Math.max(2, Math.round(H * (gW / W)));
    const sx = W / gW, sy = H / gH;
    const thr = 127;

    const grid = new Array(gH + 1).fill(0).map(()=>new Array(gW + 1).fill(0));
    for (let gy=0; gy<=gH; gy++){
      for (let gx=0; gx<=gW; gx++){
        const x = Math.min(W-1, Math.round(gx*sx));
        const y = Math.min(H-1, Math.round(gy*sy));
        grid[gy][gx] = data[y*W + x] > thr ? 1 : 0;
      }
    }

    type Seg = [Pt, Pt];
    const segs: Seg[] = [];
    const add = (a:Pt,b:Pt)=>segs.push([a,b]);

    for (let y=0; y<gH; y++){
      for (let x=0; x<gW; x++){
        const a = grid[y][x];       // TL
        const b = grid[y][x+1];     // TR
        const c = grid[y+1][x+1];   // BR
        const d = grid[y+1][x];     // BL
        const idx = (a?8:0)|(b?4:0)|(c?2:0)|(d?1:0);
        if (idx===0 || idx===15) continue;

        const P = {
          top:    { x:(x+0.5)*sx, y:(y+0  )*sy },
          right:  { x:(x+1  )*sx, y:(y+0.5)*sy },
          bottom: { x:(x+0.5)*sx, y:(y+1  )*sy },
          left:   { x:(x+0  )*sx, y:(y+0.5)*sy },
        };

        const topOn = a!==b, rightOn=b!==c, bottomOn=c!==d, leftOn=d!==a;
        const pts:Pt[] = [];
        if (topOn) pts.push(P.top);
        if (rightOn) pts.push(P.right);
        if (bottomOn) pts.push(P.bottom);
        if (leftOn) pts.push(P.left);
        if (pts.length===2){ add(pts[0], pts[1]); }
        else if (pts.length===4){ add(pts[0],pts[1]); add(pts[2],pts[3]); }
      }
    }
    return { segs, W, H };
  };

  const rotateAround = (p:Pt, o:Pt, theta:number):Pt=>{
    const x = p.x - o.x, y = p.y - o.y;
    const c = Math.cos(theta), s = Math.sin(theta);
    return { x: o.x + c*x - s*y, y: o.y + s*x + c*y };
  };

  const clamp = (v:number, lo:number, hi:number)=>Math.max(lo, Math.min(hi, v));
  const lerp = (a:number,b:number,t:number)=>a+(b-a)*t;

  // 어깨/골반에서 상체 축 기울기(= 수직 대비 각) 추정
  const torsoAngle = (kp?:KP|null, W?:number, H?:number)=>{
    if (!kp || !W || !H) return null;
    const v=(i:number)=> (kp[i]?.visibility ?? 0) >= 0.3;
    const get=(i:number)=> v(i)?{x:kp[i]!.x*W, y:kp[i]!.y*H}:null;
    const LS=11, RS=12, LH=23, RH=24;
    const ls=get(LS), rs=get(RS), lh=get(LH), rh=get(RH);
    if (!ls||!rs||!lh||!rh) return null;
    const shMid = { x:(ls.x+rs.x)/2, y:(ls.y+rs.y)/2 };
    const hpMid = { x:(lh.x+rh.x)/2, y:(lh.y+rh.y)/2 };
    // (hpMid -> shMid)이 “완전 수직(위쪽)”이 되도록 회전시킬 각도
    // 수직축(0,1)과의 각 = atan2(dx, dy)
    const dx = shMid.x - hpMid.x, dy = shMid.y - hpMid.y;
    return Math.atan2(dx, dy); // 라디안
  };

  // 발 기준점(ankle) 탐색: 우선 키포인트, 실패 시 하단 밴드에서 좌/우 최저점
  const feetAnchors = (segs:[Pt,Pt][], kp?:KP|null, W?:number, H?:number): { left:Pt; right:Pt; mid:Pt } | null => {
    if (!W || !H) return null;

    // 1) KP 우선
    const ok=(i:number)=> kp && (kp[i]?.visibility ?? 0) >= 0.28;
    const px=(i:number)=> ({ x:(kp![i]!.x)*W!, y:(kp![i]!.y)*H! });
    const LA=27, RA=28;
    if (kp && ok(LA) && ok(RA)) {
      const l = px(LA), r = px(RA);
      const mid = { x:(l.x+r.x)/2, y:(l.y+r.y)/2 };
      return { left:l, right:r, mid };
    }

    // 2) 마스크 하단 밴드에서 좌/우 가장 낮은 점 근사
    if (!segs.length) return null;
    let bottomY = -Infinity;
    for (const [a,b] of segs){ bottomY = Math.max(bottomY, a.y, b.y); }
    const bandY = bottomY - (H*0.06);
    const cand: Pt[] = [];
    for (const [a,b] of segs){
      if (a.y>=bandY) cand.push(a);
      if (b.y>=bandY) cand.push(b);
    }
    if (!cand.length) return null;
    cand.sort((p,q)=>p.x-q.x);
    const left = cand[0], right = cand[cand.length-1];
    const mid = { x:(left.x+right.x)/2, y:Math.max(left.y,right.y) };
    return { left, right, mid };
  };

  useEffect(()=>{
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const W = size?.w ?? (mask as any)?.width ?? 640;
    const H = size?.h ?? (mask as any)?.height ?? 360;
    cvs.width = W; cvs.height = H;
    ctx.clearRect(0,0,W,H);

    if (!mask) return;

    // 1) 실제 테두리(세그먼트) 추출
    const { segs } = marching(mask, gridW);

    // 2) 발/중심 축/회전각 계산
    const feet = feetAnchors(segs, kp ?? null, W, H);
    const mid = feet?.mid ?? { x: W/2, y: Math.max(0.82*H, H-1) };

    // 상체 각: hp→sh 수직 보정 각(라디안)
    const phi = torsoAngle(kp ?? null, W, H) ?? 0;

    // front: 수직 정렬(차렷) / side: 수직 정렬 + 발 겹치도록 x-압축
    const rotateTheta = -phi; // “위쪽이 수직”이 되도록
    const ankleGap = feet ? Math.abs(feet.left.x - feet.right.x) : 0;

    // 3) 세그먼트 변환(발 기준 회전 → 단계별 x-보정)
    const transformed: Array<[Pt,Pt]> = [];
    for (const [a0,b0] of segs){
      // (i) 발 중앙 around 회전
      let a = rotateAround(a0, mid, rotateTheta);
      let b = rotateAround(b0, mid, rotateTheta);

      // (ii) 단계별 보정
      if (guideMode === "front") {
        // 차렷: y에 따른 몸통 폭을 가볍게 제한 (팔 내려 보정)
        const yTop = H*0.28, yBot = H*0.62;
        const hw = (y:number)=>{
          const t = clamp((y - yTop)/Math.max(1,(yBot - yTop)), 0, 1);
          const shoulderW = (size?.w ?? W) * 0.09;
          const hipW      = (size?.w ?? W) * 0.11;
          return lerp(shoulderW, hipW, t);
        };
        const clampX = (p:Pt)=> ({ x: clamp(p.x, mid.x - hw(p.y), mid.x + hw(p.y)), y:p.y });
        a = clampX(a); b = clampX(b);
      } else {
        // 측면: 두 발 겹치게 x-압축(현재 발 간격 -> 목표 6px)
        const target = 6; // px
        const s = ankleGap > 1 ? clamp(target/ankleGap, 0.2, 1.0) : 1.0;
        const squash = (p:Pt)=> ({ x: mid.x + (p.x - mid.x)*s, y: p.y });
        a = squash(a); b = squash(b);
      }

      transformed.push([a,b]);
    }

    // 4) 렌더
    ctx.save();
    if (mirrored){ ctx.translate(W,0); ctx.scale(-1,1); }

    // 글로우
    ctx.beginPath();
    for (const [a,b] of transformed){ ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); }
    ctx.lineJoin="round"; ctx.lineCap="round";
    ctx.globalAlpha = 0.25; ctx.lineWidth = Math.max(8, lineWidth*2.2);
    ctx.strokeStyle = color; ctx.stroke();

    // 본선
    ctx.beginPath();
    for (const [a,b] of transformed){ ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); }
    ctx.globalAlpha = 1.0; ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color; ctx.stroke();

    // 바닥선 힌트(발 보이면)
    if (feet){
      ctx.beginPath();
      const y = Math.max(feet.left.y, feet.right.y);
      ctx.moveTo(0, y); ctx.lineTo(W, y);
      ctx.globalAlpha = 0.20; ctx.lineWidth = 2;
      ctx.strokeStyle = color; ctx.setLineDash([8,8]); ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [mask, kp, size?.w, size?.h, mirrored, color, lineWidth, gridW, guideMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain", pointerEvents:"none" }}
    />
  );
};

export default MaskOutlineOverlay;
