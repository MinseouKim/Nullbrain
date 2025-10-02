// src/components/BodyAnalysisCamera.tsx
import React, { useEffect, useRef, useState } from "react";
import { KP, Size } from "../poseLib/poseTypes";
import type { SegMask } from "../poseLib/segmentation";

type Props = {
  running: boolean;
  onPose?: (arg: { kp: KP; size: Size }) => void;
  focusRoi?: { x1: number; y1: number; x2: number; y2: number } | null;
  mirrored?: boolean;
  /** (선택) 세그멘테이션 함수 - 비디오/캔버스를 받아 마스크 반환 */
  getSegmentation?: (
    source: HTMLCanvasElement | HTMLVideoElement
  ) => Promise<SegMask | null>;
  /** (선택) 마스크 콜백 */
  onSegMask?: (mask: SegMask) => void;
};

const CDN = {
  cam: "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js",
  draw: "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257/drawing_utils.js",
  pose: "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js",
};

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

  useEffect(() => {
    setFeedback(
      running
        ? "체형 분석 중... 자세를 유지해주세요."
        : "분석이 일시정지 되었습니다."
    );
  }, [running]);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          loadScript(CDN.cam),
          loadScript(CDN.draw),
          loadScript(CDN.pose),
        ]);
      } catch (err) {
        console.error("MediaPipe 스크립트 로딩 실패:", err);
        setFeedback("AI 모델 로딩에 실패했습니다.");
        return;
      }

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
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: mirrored,
      });
      poseRef.current = pose;

      pose.onResults(async (results: any) => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        canvas.width = results.image.width;
        canvas.height = results.image.height;

        // 1) 프레임
        ctx.save();
        if (mirrored) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // 2) 포즈 콜백
        const kp: KP = results.poseLandmarks ? results.poseLandmarks : [];
        onPose?.({
          kp,
          size: {
            width: canvas.width,
            height: canvas.height,
            w: canvas.width,
            h: canvas.height,
          },
        });

        // 3) 스켈레톤
        if (results.poseLandmarks) {
          ctx.save();
          if (mirrored) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            lineWidth: 3,
          });
          drawLandmarks(ctx, results.poseLandmarks, { lineWidth: 1 });
          ctx.restore();
        }

        // 4) ROI
        if (focusRoi) {
          const { x1, y1, x2, y2 } = focusRoi;
          ctx.save();
          if (mirrored) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#39b3ff";
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          ctx.restore();
        }

        // 5) (옵션) 세그멘테이션 — 매 5프레임마다 한 번만
        frameCount.current++;
        if (getSegmentation && onSegMask && frameCount.current % 5 === 0) {
          try {
            const mask = await getSegmentation(videoRef.current!);
            if (mask) onSegMask(mask);
          } catch (e) {
            // segmentation은 옵션이므로 실패해도 조용히 패스
          }
        }
      });

      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          // if (!running) return;  // 완전 정지하려면 주석 해제
          await poseRef.current?.send({ image: videoRef.current });
        },
        width: 1280,
        height: 720,
      });
      await cameraRef.current.start();
    })();

    return () => {
      cameraRef.current?.stop?.();
      poseRef.current?.close?.();
    };
  }, [mirrored]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video ref={videoRef} style={{ display: "none" }} muted playsInline />
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          backgroundColor: "#000",
          borderRadius: 12,
        }}
      />
      <p
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(0,0,0,0.7)",
          color: running ? "#0f0" : "#FFFF00",
          padding: "10px",
          borderRadius: 5,
          fontSize: 18,
          margin: 0,
        }}
      >
        {feedback}
      </p>
    </div>
  );
};

export default BodyAnalysisCamera;
