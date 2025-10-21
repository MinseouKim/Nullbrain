import React, { useEffect, useRef, useState } from "react";
import { Landmark } from "../types/Landmark";
import { handleSquat } from "../logic/exercise/SquatLogic";
import { exerciseHandlers } from "../logic/ExerciseHandler";

interface AITrainerProps {
  exercise: keyof typeof exerciseHandlers;
  isWorkoutPaused: boolean;
  targetReps: number;
  onSetComplete: (data: {
    exerciseName: "squat" | "pushup";
    landmarkHistory: Landmark[][];
    repCount: number;
  }) => Promise<void>;
  currentSet: number;
  totalSets: number;
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

  // onResults 콜백에서 'stale closure' 문제를 피하기 위함
  const stateRef = useRef({ isWorkoutPaused, targetReps });
  useEffect(() => {
    stateRef.current = { isWorkoutPaused, targetReps };
  }, [isWorkoutPaused, targetReps]);

  useEffect(() => {
    setRepCount(0);
    stage.current = "up";
    landmarkHistory.current = [];
    // 세트가 바뀔 때 녹화 세이프티: 진행 중이면 마무리
    stopRecordingSafely();
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

  // -----------------------------
  // 🎥 [추가] MediaRecorder 녹화 로직
  // -----------------------------
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);

  // 비디오 엘리먼트의 srcObject(웹캠 스트림)에서 레코더 생성
  const ensureRecorder = () => {
    if (mediaRecorderRef.current) return mediaRecorderRef.current;
    const vd = videoRef.current as HTMLVideoElement | null;
    const ms = (vd?.srcObject || null) as MediaStream | null;
    if (!ms) return null;
    try {
      const rec = new MediaRecorder(ms, { mimeType: "video/webm" });
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordingChunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        // 세트 완료 시점에 stop되며, 현재는 영상 저장/전달 안함(요구사항)
        // 필요하면 여기서 Blob을 다루면 됨.
      };
      mediaRecorderRef.current = rec;
      return rec;
    } catch (e) {
      console.warn("[AITrainer] MediaRecorder init failed:", e);
      return null;
    }
  };

  const startRecordingIfNeeded = () => {
    if (isRecordingRef.current) return;
    const rec = ensureRecorder();
    if (!rec) return;
    recordingChunksRef.current = [];
    try {
      rec.start();
      isRecordingRef.current = true;
      // console.log("[AITrainer] recording started");
    } catch (e) {
      console.warn("[AITrainer] recorder.start() failed:", e);
    }
  };

  const stopRecordingSafely = () => {
    const rec = mediaRecorderRef.current;
    if (rec && isRecordingRef.current) {
      try {
        rec.stop();
      } catch (e) {
        // 이미 정지 상태이면 무시
      }
    }
    isRecordingRef.current = false;
  };

  // 부모에 넘기는 onSetComplete를 래핑해서,
  // 먼저 녹화를 안전하게 종료한 뒤 원래 콜백 호출
  const wrappedOnSetComplete = async (data: {
    exerciseName: "squat" | "pushup";
    landmarkHistory: Landmark[][];
    repCount: number;
  }) => {
    stopRecordingSafely();
    await onSetComplete(data);
  };
  // -----------------------------

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

          if (!stateRef.current.isWorkoutPaused) {
            // 🔴 일시정지 상태가 아니면 첫 프레임에서 즉시 녹화 시작
            startRecordingIfNeeded();

            landmarkHistory.current.push(results.poseLandmarks as Landmark[]);

            const handler = exerciseHandlers[exercise];
            if (handler) {
              // ⚠️ onSetComplete 대신 wrappedOnSetComplete 전달 (녹화 종료 후 원 콜백 호출)
              handler(
                results.poseLandmarks,
                stage,
                setRepCount,
                stateRef,
                wrappedOnSetComplete,
                landmarkHistory
              );
            } else {
              console.warn(`[AITrainer] Unknown exercise: ${exercise}`);
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
            // 간헐적 오류는 무시
          }
        },
        width: 1280,
        height: 720,
      });

      await cameraRef.current.start();
      // MediaPipe Camera가 video.srcObject를 세팅하므로, 레코더 준비 시도
      ensureRecorder();
    })();

    return () => {
      isActive = false;
      stopRecordingSafely();
      try {
        cameraRef.current?.stop?.();
      } catch {}
      try {
        poseRef.current?.close?.();
      } catch {}
      // 트랙 정리
      const vd = videoRef.current;
      const ms = (vd?.srcObject || null) as MediaStream | null;
      ms?.getTracks().forEach((t) => t.stop());
      if (vd) vd.srcObject = null;
    };
  }, [exercise]);

  const setInfo = `Set ${currentSet} / ${totalSets}`;
  const repInfo = `Reps ${repCount} / ${targetReps}`;

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
      {/* 상태 표시 (일시정지/운동 중) */}
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
      ></p>
      {/* 세트와 횟수 표시 */}
      <p
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "10px",
          borderRadius: 5,
          fontSize: 22,
          fontWeight: "bold",
          margin: 0,
        }}
      >
        {`${setInfo} | ${repInfo}`}
      </p>
    </div>
  );
};

export default AITrainer;
