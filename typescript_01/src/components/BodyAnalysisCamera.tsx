import React, { useEffect, useRef, useState } from "react";
import { KP, Size } from "../poseLib/poseTypes";
import type { SegMask } from "../poseLib/segmentation";

type Props = {
  running: boolean;
  onPose?: (arg: { kp: KP; size: Size }) => void;
  focusRoi?: { x1: number; y1: number; x2: number; y2: number } | null;
  mirrored?: boolean; // if true, mirror visually only on canvas
  getSegmentation?: (source: HTMLCanvasElement | HTMLVideoElement) => Promise<SegMask | null>;
  onSegMask?: (mask: SegMask) => void;
};

const CDN = {
  cam: "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js",
  draw: "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257/drawing_utils.js",
  pose: "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js",
};

// script loader
const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Script load error: ${src}`));
    document.head.appendChild(s);
  });

let scriptsReady: Promise<void> | null = null;
function ensureScripts() {
  if (!scriptsReady) {
    scriptsReady = Promise.all([loadScript(CDN.cam), loadScript(CDN.draw), loadScript(CDN.pose)]).then(() => {});
  }
  return scriptsReady;
}

const BodyAnalysisCamera: React.FC<Props> = ({
  running,
  onPose,
  focusRoi,
  mirrored = true,
  getSegmentation,
  onSegMask,
}) => {
  const [feedback, setFeedback] = useState("AI 모델을 준비 중입니다...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);
  const poseRef = useRef<any>(null);

  const frameCount = useRef(0);

  // seg throttle/lock
  const segPending = useRef(false);
  const lastSegTs = useRef(0);

  // 🔧 최신 콜백/프로퍼티를 참조하기 위한 refs (클로저 고착 방지)
  const onPoseRef = useRef<Props["onPose"] | null>(null);
const focusRoiRef = useRef<Props["focusRoi"] | null>(null);
const getSegRef = useRef<Props["getSegmentation"] | null>(null);
const onSegMaskRef = useRef<Props["onSegMask"] | null>(null);

  const runningRef = useRef<boolean>(running);


  useEffect(() => { onPoseRef.current = onPose ?? null; }, [onPose]);
useEffect(() => { focusRoiRef.current = focusRoi ?? null; }, [focusRoi]);
useEffect(() => { getSegRef.current = getSegmentation ?? null; }, [getSegmentation]);
useEffect(() => { onSegMaskRef.current = onSegMask ?? null; }, [onSegMask]);

useEffect(() => {
  runningRef.current = running;
  setFeedback(running ? "체형 분석 중... 자세를 유지해주세요." : "분석이 일시정지 되었습니다.");
}, [running]);

  // ⚠️ 초기화 이펙트: running에 의존하지 않도록 수정 (running 토글 시 재초기화 방지)
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await ensureScripts();
      } catch (err) {
        console.error("MediaPipe script load failed:", err);
        setFeedback("AI 모델 로딩에 실패했습니다.");
        return;
      }
      if (cancelled) return;

      const Pose = (window as any).Pose;
      const Camera = (window as any).Camera;
      const drawConnectors = (window as any).drawConnectors;
      const drawLandmarks = (window as any).drawLandmarks;
      const POSE_CONNECTIONS = (window as any).POSE_CONNECTIONS;

      if (!Pose || !Camera || !videoRef.current || !canvasRef.current) return;

      const pose = new Pose({
        locateFile: (f: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}`,
      });
      pose.setOptions({
        modelComplexity: 2,          // more stable (heavier)
        smoothLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
        selfieMode: false,           // keep semantic left/right; we mirror only in canvas
      });
      poseRef.current = pose;

      pose.onResults(async (results: any) => {
        if (!canvasRef.current) return;
        if (!results?.image) return;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        canvas.width = results.image.width;
        canvas.height = results.image.height;

        const withMirror = (fn: () => void) => {
          if (!mirrored) { fn(); return; }
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          fn();
          ctx.restore();
        };

        // draw frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        withMirror(() => {
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        });

        // pose callback (landmarks are original-space)
        const kp: KP = results.poseLandmarks ? results.poseLandmarks : [];
onPoseRef.current?.({ kp, size: { w: canvas.width, h: canvas.height } });

        // skeleton overlay
        if (results.poseLandmarks) {
          withMirror(() => {
            drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { lineWidth: 3 });
            drawLandmarks(ctx, results.poseLandmarks, { lineWidth: 1 });
          });
        }

        // ROI overlay (최신 값 ref 사용)
        const roi = focusRoiRef.current;
        if (roi) {
          const { x1, y1, x2, y2 } = roi;
          withMirror(() => {
            ctx.setLineDash([6, 4]);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#39b3ff";
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          });
        }

        // segmentation throttled: 5 frames + 200ms (최신 함수 ref 사용)
        frameCount.current++;
const now = performance.now();
const wantSeg = !!(getSegRef.current && onSegMaskRef.current && frameCount.current % 5 === 0);
if (wantSeg && !segPending.current && now - lastSegTs.current > 200) {
  segPending.current = true;
  try {
    // 현재 ref 스냅샷을 로컬 변수로 잡아 안전하게 사용
    const segFn = getSegRef.current!;
    const segCb = onSegMaskRef.current!;
const src = videoRef.current ?? canvasRef.current;
if (src) {
   const mask = await segFn(src);
   if (mask) segCb(mask);
 }
  } catch {
  } finally {
    lastSegTs.current = performance.now();
    segPending.current = false;
  }
}
      });

      cameraRef.current = new (window as any).Camera(videoRef.current, {
  onFrame: async () => {
    const vv = videoRef.current;
    const pr = poseRef.current;

    // 실행/마운트/레디 상태 모두 체크
    if (!runningRef.current) return;
    if (!pr || !vv) return;
    if (vv.readyState < 2) return;            // HAVE_CURRENT_DATA 미만이면 패스
    if (!vv.videoWidth || !vv.videoHeight) return;

    try {
      await pr.send({ image: vv });
    } catch (e) {
      // 프레임 스킵
      // console.warn("pose.send failed", e);
    }
  },
  width: 1280,
  height: 720,
});

      await cameraRef.current.start();
      setFeedback("체형 분석 중... 자세를 유지해주세요.");
    }

    init();
    return () => {
      try { cameraRef.current?.stop?.(); } catch {}
      try { poseRef.current?.close?.(); } catch {}
      cameraRef.current = null;
      poseRef.current = null;
    };
  // ⬇️ mirrored만 의존하도록 수정 (running 제거)
  }, [mirrored]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video ref={videoRef} style={{ display: "none" }} muted playsInline autoPlay />
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000", borderRadius: 12 }}
      />
      <p
        style={{
          position: "absolute", top: 10, left: 10,
          background: "rgba(0,0,0,0.7)",
          color: running ? "#0f0" : "#FFFF00",
          padding: "10px", borderRadius: 5, fontSize: 18, margin: 0,
        }}
      >
        {feedback}
      </p>
    </div>
  );
};

export default BodyAnalysisCamera;
