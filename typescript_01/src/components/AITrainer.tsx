// src/components/AITrainer.tsx

import React, { useEffect, useRef, useState } from "react";
import { Landmark } from "../types/Landmark";

interface AITrainerProps {
  exercise: "squat" | "pushup";
  isWorkoutPaused: boolean;
  targetReps: number;
  onSetComplete: (data: {
    exerciseName: "squat" | "pushup";
    landmarkHistory: Landmark[][];
    repCount: number;
  }) => Promise<void>;
}

const CDN = {
  cam: "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js",
  draw: "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257/drawing_utils.js",
  pose: "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js",
};

const AITrainer: React.FC<AITrainerProps> = ({
  exercise,
  isWorkoutPaused,
  targetReps,
  onSetComplete,
}) => {
  const [repCount, setRepCount] = useState(0);

  // DOM 요소 및 Mediapipe 인스턴스 Ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);
  const poseRef = useRef<any>(null);

  // 운동 로직 관련 Ref
  const stage = useRef<"up" | "down">("up");
  const landmarkHistory = useRef<Landmark[][]>([]);

  // ★ 1. 최신 props 값을 추적하기 위한 Ref 객체
  // onResults 콜백에서 'stale closure' 문제를 피하기 위함
  const stateRef = useRef({ isWorkoutPaused, targetReps });

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

  const calculateAngle = (a: Landmark, b: Landmark, c: Landmark): number => {
    const rad =
      Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((rad * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  // ★ 2. props가 변경될 때마다 stateRef를 업데이트하는 가벼운 useEffect
  useEffect(() => {
    stateRef.current = { isWorkoutPaused, targetReps };
  }, [isWorkoutPaused, targetReps]);

  // ★ 3. 운동 종류가 바뀔 때 횟수와 상태를 초기화하는 useEffect
  useEffect(() => {
    setRepCount(0);
    stage.current = "up";
    landmarkHistory.current = [];
  }, [exercise]);

  // ★ 4. Mediapipe 초기화 및 설정을 담당하는 무거운 useEffect
  // 이 훅은 exercise가 변경될 때만 다시 실행됨
  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        await Promise.all([
          loadScript(CDN.cam),
          loadScript(CDN.draw),
          loadScript(CDN.pose),
        ]);

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        console.error("Mediapipe 로딩 실패:", err);
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
      });
      poseRef.current = pose;

      pose.onResults((results: any) => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        canvas.width = results.image.width;
        canvas.height = results.image.height;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
          drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 3,
          });
          drawLandmarks(ctx, results.poseLandmarks, {
            color: "#FF0000",
            lineWidth: 2,
          });

          // prop 대신 stateRef의 최신 값을 사용!
          if (!stateRef.current.isWorkoutPaused) {
            landmarkHistory.current.push(results.poseLandmarks as Landmark[]);

            if (exercise === "squat") {
              const hip = results.poseLandmarks[23];
              const knee = results.poseLandmarks[25];
              const ankle = results.poseLandmarks[27];
              if (hip && knee && ankle) {
                const angle = calculateAngle(hip, knee, ankle);

                if (angle < 90 && stage.current === "up") {
                  stage.current = "down";
                } else if (angle > 160 && stage.current === "down") {
                  stage.current = "up";

                  setRepCount((prev) => {
                    const newRep = prev + 1;
                    // prop 대신 stateRef의 최신 값을 사용!
                    if (newRep >= stateRef.current.targetReps) {
                      onSetComplete({
                        exerciseName: exercise,
                        landmarkHistory: landmarkHistory.current,
                        repCount: stateRef.current.targetReps,
                      });
                      landmarkHistory.current = [];
                      return 0;
                    }
                    return newRep;
                  });
                }
              }
            }
          }
        }
        ctx.restore();
      });

      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          if (!isActive || !videoRef.current) return;
          try {
            await pose.send({ image: videoRef.current });
          } catch (err) {
            console.warn("pose.send 실패 (무시 가능):", err);
          }
        },
        width: 1280,
        height: 720,
      });

      cameraRef.current.start();
    })();

    return () => {
      isActive = false;
      cameraRef.current?.stop?.();
      poseRef.current?.close?.();
    };
  }, [exercise]); // 의존성 배열에서 isWorkoutPaused, targetReps 제거!

  const displayedFeedback = isWorkoutPaused
    ? `일시정지 | ${repCount} / ${targetReps} 회`
    : `${repCount} / ${targetReps} 회`;

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
        }}
      />
      <p
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(0,0,0,0.7)",
          color: isWorkoutPaused ? "#FFFF00" : "#0f0",
          padding: "10px",
          borderRadius: 5,
          fontSize: 18,
          margin: 0,
        }}
      >
        {displayedFeedback}
      </p>
    </div>
  );
};

export default AITrainer;
