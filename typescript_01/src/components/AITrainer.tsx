import React, { useEffect, useRef, useState } from "react";
import { Landmark } from "../types/Landmark";
import { exerciseHandlers } from "../logic/ExerciseHandler";
import { ExerciseName } from "../types/ExerciseTypes";

const DEBUG_IGNORE_FULLBODY = true;

interface AITrainerProps {
  exercise: ExerciseName;
  isWorkoutPaused: boolean;
  targetReps: number;
  currentSet: number;
  totalSets: number;
  onSetComplete: (data: {
    exerciseName: ExerciseName;
    landmarkHistory: Landmark[][];
    repCount: number;
    finalTime?: string;
  }) => Promise<void>;
  setFeedbackMessage: (msg: string) => void;
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
  currentSet,
  totalSets,
  setFeedbackMessage,
}) => {
  const [repCount, setRepCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);
  const poseRef = useRef<any>(null);

  const stage = useRef<"up" | "down">("up");
  const landmarkHistory = useRef<Landmark[][]>([]);
  const stateRef = useRef({ isWorkoutPaused, targetReps });
  const startTimeRef = useRef<number | null>(null);
  const hasFullBodyRef = useRef(false);
  const lastSavedTimeRef = useRef<number>(0);
  const isSetProcessing = useRef(false);

  useEffect(() => {
    stateRef.current = { isWorkoutPaused, targetReps };
  }, [isWorkoutPaused, targetReps]);

  useEffect(() => {
    setRepCount(0);
    stage.current = "up";
    landmarkHistory.current = [];
    startTimeRef.current = null;
    isSetProcessing.current = false;
  }, [exercise, currentSet]);

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

  const isFullBodyVisible = (lms: Landmark[]): boolean => {
    const safe = (i: number) => {
      const lm = lms[i];
      return lm && typeof lm.visibility === "number" && lm.visibility > 0.6;
    };
    const ids = [0, 11, 12, 23, 24, 25, 26, 27, 28];
    return ids.every(safe);
  };

  const drawMessage = (ctx: CanvasRenderingContext2D, msg: string) => {
    ctx.save();
    ctx.font = "30px Pretendard, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const x = ctx.canvas.width / 2;
    const y = ctx.canvas.height / 2;
    const textWidth = ctx.measureText(msg).width;
    const boxWidth = textWidth + 80;
    const boxHeight = 80;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.roundRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight, 18);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(msg, x, y + 3);
    ctx.restore();
  };

  const handleSetComplete = async () => {
    if (isSetProcessing.current) return;
    isSetProcessing.current = true;

    setFeedbackMessage("⏳ AI 피드백 분석 중입니다...");

    const end = Date.now();
    const elapsed = startTimeRef.current
      ? ((end - startTimeRef.current) / 1000).toFixed(1)
      : "0";

    const timeoutPromise = new Promise<void>((resolve) =>
      setTimeout(() => {
        console.warn("⚠️ AI 피드백 응답 없음 → 자동 다음 세트 이동");
        resolve();
      }, 3000)
    );

    try {
      await Promise.race([
        onSetComplete({
          exerciseName: exercise,
          landmarkHistory: landmarkHistory.current,
          repCount,
          finalTime: `${elapsed}초`,
        }),
        timeoutPromise,
      ]);
    } catch (e) {
      console.warn("❌ AI 피드백 요청 실패:", e);
    }

    setFeedbackMessage("✅ 세트 완료! 다음 세트를 준비하세요!");

    setTimeout(() => {
      setRepCount(0);
      landmarkHistory.current = [];
      isSetProcessing.current = false;
      setFeedbackMessage("운동을 시작하세요!");
    }, 2500);
  };

  useEffect(() => {
    let isActive = true;
    (async () => {
      await Promise.all([
        loadScript(CDN.cam),
        loadScript(CDN.draw),
        loadScript(CDN.pose),
      ]);

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

      pose.onResults((res: any) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        canvas.width = res.image.width;
        canvas.height = res.image.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);

        const lms = res.poseLandmarks as Landmark[] | undefined;
        if (!lms) {
          if (!DEBUG_IGNORE_FULLBODY)
            drawMessage(ctx, "카메라 안에 전신이 보이게 서주세요");
          return;
        }

        if (!hasFullBodyRef.current) {
          if (DEBUG_IGNORE_FULLBODY || isFullBodyVisible(lms)) {
            hasFullBodyRef.current = true;
            setFeedbackMessage("✅ 전신 인식 완료! 세트를 시작합니다!");
            setTimeout(() => setFeedbackMessage("운동을 시작하세요!"), 1500);
          } else {
            drawMessage(ctx, "전신이 화면에 들어오게 서주세요");
            return;
          }
        }

        drawConnectors(ctx, lms, POSE_CONNECTIONS, {
          color: "#39b3ff",
          lineWidth: 1.5,
        });
        drawLandmarks(ctx, lms, { color: "#000", lineWidth: 1, radius: 1.8 });

        const now = Date.now();
        if (
          !stateRef.current.isWorkoutPaused &&
          hasFullBodyRef.current &&
          now - lastSavedTimeRef.current > 100 &&
          !isSetProcessing.current
        ) {
          if (!startTimeRef.current) startTimeRef.current = now;
          lastSavedTimeRef.current = now;
          landmarkHistory.current.push(lms);

          const handler =
            exerciseHandlers[exercise as keyof typeof exerciseHandlers];
          if (typeof handler === "function") {
            handler(lms, stage, () => {
              setRepCount((prev) => {
                const next = prev + 1;
                if (next === stateRef.current.targetReps) {
                  setTimeout(() => handleSetComplete(), 500);
                }
                return Math.min(next, stateRef.current.targetReps);
              });
            });
          }
        }
      });

      poseRef.current = pose;
      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          if (!isActive || !videoRef.current) return;
          await pose.send({ image: videoRef.current });
        },
        width: 1280,
        height: 720,
      });

      await cameraRef.current.start();
    })();

    return () => {
      isActive = false;
      try {
        cameraRef.current?.stop?.();
        poseRef.current?.close?.();
      } catch {}
      const vd = videoRef.current;
      const ms = (vd?.srcObject || null) as MediaStream | null;
      ms?.getTracks().forEach((t) => t.stop());
      if (vd) vd.srcObject = null;
    };
  }, [exercise]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
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
          bottom: 10,
          left: 10,
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "10px",
          borderRadius: 5,
          fontSize: 20,
          fontWeight: "bold",
        }}
      >
        {`Set ${currentSet} / ${totalSets} | Reps ${repCount} / ${targetReps}`}
      </p>
    </div>
  );
};

export default AITrainer;
