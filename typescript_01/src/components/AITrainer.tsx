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
  suppressMessages?: boolean; // 부모가 피드백 띄우는 동안 메시지 억제
  displayName?: string;
}

const CDN = {
  cam: "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js",
  draw: "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257/drawing_utils.js",
  pose: "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js",
};

const AITrainer: React.FC<AITrainerProps> = (props) => {
  const { currentSet, exercise } = props;

  const [repCount, setRepCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);
  const poseRef = useRef<any>(null);

  const stage = useRef<"up" | "down">("up");
  const landmarkHistory = useRef<Landmark[][]>([]);

  // 최신 props/state 참조용
  const propsAndStateRef = useRef({ ...props, repCount });
  useEffect(() => {
    propsAndStateRef.current = { ...props, repCount };
  }, [props, repCount]);

  const startTimeRef = useRef<number | null>(null);
  const hasFullBodyRef = useRef(false); // 세트별로 동작 판별 허용
  const shownFullBodyMessageRef = useRef(false); // ✅ “전신 인식 완료” 문구는 최초 1회만
  const lastSavedTimeRef = useRef<number>(0);
  const isSetProcessing = useRef(false);

  // 부모 메시지에 안전하게 전달
  const setMsgSafe = (msg: string) => {
    const { suppressMessages, setFeedbackMessage } = propsAndStateRef.current;
    if (!isSetProcessing.current && !suppressMessages) {
      setFeedbackMessage(msg);
    }
  };

  // 세트가 변경되면 카운트/버퍼만 초기화 (전신 인식 안내 문구는 최초 1회만)
  useEffect(() => {
    setRepCount(0);
    stage.current = "up";
    landmarkHistory.current = [];
    startTimeRef.current = null;
    isSetProcessing.current = false;
    hasFullBodyRef.current = false; // 세트별 감지를 위해 false로
    // shownFullBodyMessageRef는 유지 → 안내 문구는 최초 1회만 노출
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

  // ✅ 메시지는 항상 정상 좌표계로 출력되도록 내부에서 좌표계 리셋
  const drawMessage = (ctx: CanvasRenderingContext2D, msg: string) => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // 변환 초기화(언미러)
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

  useEffect(() => {
    let isActive = true;

    const setupCameraAndPose = async () => {
      try {
        await ensureCameraReady({ probe: true, constraints: { video: true } });

        setMsgSafe("AI 모델 로딩 중");
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

        setMsgSafe("AI 모델 초기화 중");
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
          selfieMode: false, // ✅ 입력 자체는 정방향
        });

        pose.onResults((res: any) => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (!canvas || !ctx || !isActive) return;

          // 캔버스 초기화
          canvas.width = res.image.width;
          canvas.height = res.image.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // ✅ 프레임/스켈레톤만 언미러-고정 좌표계에서 그림
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);

          // 원본 프레임
          ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);

          const lms = res.poseLandmarks as Landmark[] | undefined;
          if (!lms) {
            ctx.restore(); // ← 반드시 복구 후 메시지(정상 좌표계) 출력
            setMsgSafe("카메라 안에 전신이 보이게 서주세요");
            drawMessage(ctx, "카메라 안에 전신이 보이게 서주세요");
            return;
          }

          if (!hasFullBodyRef.current) {
            const visible = isFullBodyVisible(lms);
            if (visible) {
              hasFullBodyRef.current = true;
              if (!shownFullBodyMessageRef.current) {
                shownFullBodyMessageRef.current = true;
                ctx.restore(); // 메시지는 정상 좌표계에서
                setMsgSafe("✅ 전신 인식 완료! 세트를 시작합니다!");
                const nameForUI = propsAndStateRef.current.displayName;
                setTimeout(
                  () => setMsgSafe(`${nameForUI} 운동을 시작하세요!`),
                  1500
                );
                // 다음 프레임에서 계속
                return;
              }
            } else {
              ctx.restore();
              setMsgSafe("전신이 화면에 들어오게 서주세요");
              drawMessage(ctx, "전신이 화면에 들어오게 서주세요");
              return;
            }
          }

          // 랜드마크/커넥터는 반전 좌표계에서 함께 그림
          drawConnectors(ctx, lms, POSE_CONNECTIONS, {
            color: "#39b3ff",
            lineWidth: 1.5,
          });
          drawLandmarks(ctx, lms, { color: "#000", lineWidth: 1, radius: 1.8 });

          ctx.restore(); // ✅ 좌표계 원복 (이후 로직/텍스트는 정상)

          // ---- 이하 기존 로직 동일 ----
          const now = Date.now();
          const { isWorkoutPaused, targetReps, exercise } =
            propsAndStateRef.current;

          if (
            !isWorkoutPaused &&
            hasFullBodyRef.current &&
            now - lastSavedTimeRef.current > 100 &&
            !isSetProcessing.current
          ) {
            if (!startTimeRef.current) startTimeRef.current = now;
            lastSavedTimeRef.current = now;
            // 저장되는 landmark는 원본 좌표(반전 없음) → 분석/서버 전송에 안전
            landmarkHistory.current.push(lms);

            const handler =
              exerciseHandlers[exercise as keyof typeof exerciseHandlers];
            if (typeof handler === "function") {
              handler(lms, stage, () => {
                if (isSetProcessing.current) return;

                const currentRepCount = propsAndStateRef.current.repCount;
                const targetRepCount = propsAndStateRef.current.targetReps;
                const next = currentRepCount + 1;

                if (next >= targetRepCount) {
                  isSetProcessing.current = true;
                  setRepCount(targetRepCount);

                  const end = Date.now();
                  const elapsed = startTimeRef.current
                    ? ((end - startTimeRef.current) / 1000).toFixed(1)
                    : "0";

                  setTimeout(() => {
                    propsAndStateRef.current.onSetComplete({
                      exerciseName: propsAndStateRef.current.exercise,
                      landmarkHistory: landmarkHistory.current,
                      repCount: targetRepCount,
                      finalTime: `${elapsed}초`,
                    });
                  }, 200);
                } else {
                  setRepCount(next);
                }
              });
            }
          }
        });

        setMsgSafe("카메라 설정 중");
        if (!videoRef.current || !isActive) return;

        cameraRef.current = new (window as any).Camera(videoRef.current, {
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
          setMsgSafe("카메라 시작 중");
          await cameraRef.current.start();
        } catch (e) {
          const msg = getCameraErrorMessage(e);
          setMsgSafe(`❌ ${msg}`);
          return;
        }
      } catch (e) {
        const msg = getCameraErrorMessage(e);
        console.error("❌ 카메라 또는 AI 설정 실패:", msg);
        let errorMessage = "알 수 없는 오류가 발생했습니다.";
        if (e instanceof Error) errorMessage = e.message;
        setMsgSafe(`❌ 카메라/AI 초기화 실패: ${errorMessage}`);
      }
    };

    setupCameraAndPose();

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
        {`Set ${props.currentSet} / ${props.totalSets} | Reps ${repCount} / ${props.targetReps}`}
      </p>
    </div>
  );
};

export default AITrainer;
