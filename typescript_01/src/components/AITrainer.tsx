// src/components/AITrainer.tsx

import React, { useState, useRef, useEffect } from "react";

// TypeScript를 위한 타입 정의
interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface PoseResults {
  poseLandmarks: Landmark[];
  image: HTMLVideoElement;
}

// 컴포넌트가 받을 props 타입 정의
interface AITrainerProps {
  exercise: "squat" | "pushup";
  backendAddress?: string;
  isWorkoutPaused: boolean; // 부모로부터 운동 정지 상태를 받습니다.
}

const AITrainer: React.FC<AITrainerProps> = ({
  exercise,
  backendAddress = "localhost",
  isWorkoutPaused, // prop으로 상태를 받습니다.
}) => {
  const [feedbackFromAI, setFeedbackFromAI] = useState("AI 코칭 대기 중...");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const cameraRef = useRef<any>(null);
  const isInitialized = useRef(false);

  const getCameraErrorMessage = (e: any): string => {
    const name: string | undefined = e?.name;
    const isLocalhost =
      typeof window !== "undefined" &&
      ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      !isLocalhost
    ) {
      return "카메라는 HTTPS 또는 localhost 환경에서만 동작합니다. 주소창의 보안(https) 여부를 확인해주세요.";
    }
    if (name === "NotAllowedError" || name === "SecurityError") {
      return "카메라 권한이 차단되었습니다. 브라우저의 사이트 권한 설정에서 ‘허용’으로 바꿔주세요.";
    }
    if (name === "NotFoundError" || name === "OverconstrainedError") {
      return "사용 가능한 카메라 장치를 찾지 못했습니다.";
    }
    if (name === "NotReadableError") {
      return "다른 앱이 카메라를 사용 중입니다.";
    }
    if (name === "AbortError") {
      return "카메라 초기화가 중단되었습니다. 다시 시도해주세요.";
    }
    return "카메라 초기화에 실패했습니다. 권한/장치 상태를 확인해주세요.";
  };

  useEffect(() => {
    if (isInitialized.current) {
      return;
    }

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.crossOrigin = "anonymous";
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error(`Script load error for ${src}`));
        document.head.appendChild(script);
      });
    };

    const initializeMediaPipe = async () => {
      try {
        await Promise.all([
          loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js"
          ),
          loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257/drawing_utils.js"
          ),
          loadScript(
            "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js"
          ),
        ]);
      } catch (error) {
        console.error("MediaPipe 스크립트 로딩에 실패했습니다:", error);
        setFeedbackFromAI("AI 모델 로딩 실패");
        return;
      }

      const Pose = (window as any).Pose;
      const Camera = (window as any).Camera;
      const drawConnectors = (window as any).drawConnectors;
      const drawLandmarks = (window as any).drawLandmarks;
      const POSE_CONNECTIONS = (window as any).POSE_CONNECTIONS;

      if (!Pose || !Camera || !videoRef.current || !canvasRef.current) return;

      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext("2d")!;

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        videoElement.srcObject = stream;
        await videoElement.play().catch(() => {});

        // 비디오가 로드될 때까지 기다림
        await new Promise((resolve) => {
          videoElement.onloadedmetadata = () => {
            console.log(
              "Video loaded, dimensions:",
              videoElement.videoWidth,
              videoElement.videoHeight
            );
            resolve(void 0);
          };
        });
      } catch (e: any) {
        const msg = getCameraErrorMessage(e);
        setFeedbackFromAI(msg);
        window.alert(msg);
        return;
      }

      const wsURL = `ws://${backendAddress}:8000/ws/${exercise}`;
      ws.current = new WebSocket(wsURL);
      ws.current.onopen = () => console.log(`WebSocket connected to ${wsURL}`);
      ws.current.onmessage = (event) => {
        const serverData = JSON.parse(event.data);
        setFeedbackFromAI(serverData.feedback);
      };
      ws.current.onclose = () => console.log("WebSocket disconnected.");

      const pose = new Pose({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: PoseResults) => {
        // results.image가 null이 아닌지 확인
        if (!results.image) {
          console.warn("MediaPipe pose results image is null");
          return;
        }

        // 비디오 요소가 유효한지 확인
        if (!videoElement.videoWidth || !videoElement.videoHeight) {
          console.warn("Video element not ready");
          return;
        }

        canvasElement.width = results.image.width;
        canvasElement.height = results.image.height;
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );

        if (results.poseLandmarks) {
          drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 4,
          });
          drawLandmarks(canvasCtx, results.poseLandmarks, {
            color: "#FF0000",
            lineWidth: 2,
          });

          if (!isWorkoutPaused && ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(results.poseLandmarks));
          }
        }
        canvasCtx.restore();
      });

      cameraRef.current = new Camera(videoElement, {
        onFrame: async () => {
          if (
            videoElement &&
            videoElement.videoWidth > 0 &&
            videoElement.videoHeight > 0
          ) {
            try {
              await pose.send({ image: videoElement });
            } catch (error) {
              console.warn("Pose processing error:", error);
            }
          }
        },
        width: 1280,
        height: 720,
      });

      try {
        await cameraRef.current.start();
      } catch (e: any) {
        console.error("Camera start failed:", e);
        const msg = getCameraErrorMessage(e);
        setFeedbackFromAI(msg);
        window.alert(msg);
        if (ws.current && ws.current.readyState === WebSocket.OPEN)
          ws.current.close();
        return;
      }
    };

    initializeMediaPipe();
    isInitialized.current = true;

    return () => {
      if (ws.current) ws.current.close();
      if (cameraRef.current) {
        cameraRef.current.stop();
        isInitialized.current = false;
      }
    };
  }, [exercise, backendAddress]);

  const displayedFeedback = isWorkoutPaused
    ? "운동이 일시정지 되었습니다."
    : feedbackFromAI;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video
        ref={videoRef}
        style={{ display: "none" }}
        muted
        playsInline
      ></video>
      <canvas
        ref={canvasRef}
        width="1280px"
        height="720px"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          backgroundColor: "#000",
        }}
      ></canvas>
      <p
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "rgba(0,0,0,0.7)",
          color: isWorkoutPaused ? "#FFFF00" : "#0f0", // 일시정지 시 노란색으로 변경
          padding: "10px",
          borderRadius: "5px",
          fontSize: "18px",
          margin: 0,
        }}
      >
        {displayedFeedback}
      </p>
    </div>
  );
};

export default AITrainer;
