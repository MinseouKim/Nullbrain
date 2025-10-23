// src/components/AITrainer.tsx
import React, { useEffect, useRef, useState } from "react";
import { Landmark } from "../types/Landmark";
import { exerciseHandlers } from "../logic/ExerciseHandler";
import { ExerciseName } from "../types/ExerciseTypes";
import { ensureCameraReady, getCameraErrorMessage } from "../utils/camera";

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

const AITrainer: React.FC<AITrainerProps> = (props) => {
  // [수정] props를 구조분해하지 않고 props 객체 자체를 사용
  const { currentSet, exercise } = props;

  const [repCount, setRepCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);
  const poseRef = useRef<any>(null);

  const stage = useRef<"up" | "down">("up");
  const landmarkHistory = useRef<Landmark[][]>([]);

  // [핵심 수정]
  // onResults 콜백은 한 번만 생성되므로,
  // 콜백 내부에서 항상 최신 props와 state를 참조할 수 있도록 ref를 사용합니다.
  const propsAndStateRef = useRef({ ...props, repCount });

  // 렌더링될 때마다 ref의 값을 최신 props와 state로 업데이트
  useEffect(() => {
    propsAndStateRef.current = { ...props, repCount };
  }, [props, repCount]);

  const startTimeRef = useRef<number | null>(null);
  const hasFullBodyRef = useRef(false);
  const lastSavedTimeRef = useRef<number>(0);
  const isSetProcessing = useRef(false);

  // 세트가 변경될 때마다 카메라 재시작 없이 상태만 초기화
  useEffect(() => {
    setRepCount(0);
    stage.current = "up";
    landmarkHistory.current = [];
    startTimeRef.current = null;
    isSetProcessing.current = false;
    hasFullBodyRef.current = false;
  }, [currentSet, exercise]);

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
      return !!(lm && typeof lm.visibility === "number" && lm.visibility > 0.6);
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
    const radius = 18;
    const left = x - boxWidth / 2;
    const top = y - boxHeight / 2;
    ctx.moveTo(left + radius, top);
    ctx.lineTo(left + boxWidth - radius, top);
    ctx.quadraticCurveTo(left + boxWidth, top, left + boxWidth, top + radius);
    ctx.lineTo(left + boxWidth, top + boxHeight - radius);
    ctx.quadraticCurveTo(
      left + boxWidth,
      top + boxHeight,
      left + boxWidth - radius,
      top + boxHeight
    );
    ctx.lineTo(left + radius, top + boxHeight);
    ctx.quadraticCurveTo(left, top + boxHeight, left, top + boxHeight - radius);
    ctx.lineTo(left, top + radius);
    ctx.quadraticCurveTo(left, top, left + radius, top);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(msg, x, y + 3);
    ctx.restore();
  };

  // 카메라 설정 useEffect (운동이 바뀔 때만 실행)
  useEffect(() => {
    let isActive = true;

    const setupCameraAndPose = async () => {
      try {
        await ensureCameraReady({ probe: true, constraints: { video: true } });

        // [수정] setFeedbackMessage를 props에서 직접 가져오지 않고 ref를 통해 호출
        propsAndStateRef.current.setFeedbackMessage("AI 모델 로딩 중");
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

        if (!Pose || !Camera)
          throw new Error("MediaPipe 객체를 찾을 수 없습니다.");
        if (!videoRef.current || !canvasRef.current)
          throw new Error("HTML 요소를 찾을 수 없습니다.");
        if (!isActive) return;

        propsAndStateRef.current.setFeedbackMessage("AI 모델 초기화 중");
        const pose = new Pose({
          locateFile: (f: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}`,
        });
        poseRef.current = pose;

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((res: any) => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (!canvas || !ctx || !isActive) return;

          canvas.width = res.image.width;
          canvas.height = res.image.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);

          const lms = res.poseLandmarks as Landmark[] | undefined;
          if (!lms) {
            propsAndStateRef.current.setFeedbackMessage(
              "카메라 안에 전신이 보이게 서주세요"
            );
            drawMessage(ctx, "카메라 안에 전신이 보이게 서주세요");
            return;
          }

          if (!hasFullBodyRef.current) {
            const visible = isFullBodyVisible(lms);
            if (visible) {
              hasFullBodyRef.current = true;
              propsAndStateRef.current.setFeedbackMessage(
                "✅ 전신 인식 완료! 세트를 시작합니다!"
              );
              setTimeout(
                () =>
                  propsAndStateRef.current.setFeedbackMessage(
                    `${exercise}운동을 시작하세요!`
                  ),
                1500
              );
            } else {
              propsAndStateRef.current.setFeedbackMessage(
                "전신이 화면에 들어오게 서주세요"
              );
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

          // [핵심 수정] 모든 변수를 propsAndStateRef.current에서 읽어옴
          const { isWorkoutPaused, targetReps, repCount, exercise } =
            propsAndStateRef.current;

          if (
            !isWorkoutPaused &&
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
                if (isSetProcessing.current) return;

                // [핵심 수정] 횟수도 ref에서 직접 읽어옴
                const currentRepCount = propsAndStateRef.current.repCount;
                const targetRepCount = propsAndStateRef.current.targetReps;

                const next = currentRepCount + 1;

                if (next >= targetRepCount) {
                  isSetProcessing.current = true;
                  setRepCount(targetRepCount); // UI 업데이트

                  const end = Date.now();
                  const elapsed = startTimeRef.current
                    ? ((end - startTimeRef.current) / 1000).toFixed(1)
                    : "0";

                  setTimeout(() => {
                    // [핵심 수정] onSetComplete도 ref에서 호출
                    propsAndStateRef.current.onSetComplete({
                      exerciseName: propsAndStateRef.current.exercise,
                      landmarkHistory: landmarkHistory.current,
                      repCount: targetRepCount,
                      finalTime: `${elapsed}초`,
                    });
                  }, 200);
                } else {
                  setRepCount(next); // UI 업데이트
                }
              });
            }
          }
        });

        propsAndStateRef.current.setFeedbackMessage("카메라 설정 중");
        if (!videoRef.current || !isActive) return;

        cameraRef.current = new Camera(videoRef.current, {
          onFrame: async () => {
            if (!isActive || !videoRef.current || !poseRef.current) return;
            try {
              await poseRef.current.send({ image: videoRef.current });
            } catch (e) {
              console.error("Pose send error:", e);
            }
          },
          width: 1280,
          height: 720,
        });

        try {
          propsAndStateRef.current.setFeedbackMessage("카메라 시작 중");
          await cameraRef.current.start();
        } catch (e) {
          const msg = getCameraErrorMessage(e);
          propsAndStateRef.current.setFeedbackMessage(`❌ ${msg}`);
          return;
        }
      } catch (e) {
        const msg = getCameraErrorMessage(e);
        console.error("❌ 카메라 또는 AI 설정 실패:", msg);

        // [수정] err 타입 에러 해결
        let errorMessage = "알 수 없는 오류가 발생했습니다.";
        if (e instanceof Error) {
          errorMessage = e.message;
        }
        propsAndStateRef.current.setFeedbackMessage(
          `❌ 카메라/AI 초기화 실패: ${errorMessage}`
        );
      }
    };

    setupCameraAndPose(); // 설정 함수 실행

    return () => {
      isActive = false;
      try {
        cameraRef.current?.stop?.();
        poseRef.current?.close?.();
        cameraRef.current = null;
        poseRef.current = null;
      } catch (e) {
        console.error("Camera cleanup error:", e);
      }
      const vd = videoRef.current;
      const ms = (vd?.srcObject || null) as MediaStream | null;
      ms?.getTracks().forEach((t) => t.stop());
      if (vd) vd.srcObject = null;
    };
  }, [exercise]); // 운동이 바뀔 때만 카메라/AI 재설정

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
        {/* [수정] 표시되는 횟수도 props에서 직접 받도록 변경 */}
        {`Set ${props.currentSet} / ${props.totalSets} | Reps ${repCount} / ${props.targetReps}`}
      </p>
    </div>
  );
};

export default AITrainer;
