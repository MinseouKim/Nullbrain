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
  image: HTMLCanvasElement | HTMLImageElement;
}

// 컴포넌트가 받을 props 타입 정의
interface AITrainerProps {
  exercise: "squat" | "pushup";
  backendAddress?: string;
}

const AITrainer: React.FC<AITrainerProps> = ({
  exercise,
  backendAddress = "localhost",
}) => {
  const [feedback, setFeedback] = useState("AI 코칭 대기 중...");
  // const [isActive, setIsActive] = useState(false); // <-- 삭제

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // prop으로 받은 exercise가 있고, videoRef가 준비되면 바로 실행
    if (exercise && videoRef.current) {
      // --- 웹소켓 연결 ---
      const wsURL = `ws://${backendAddress}:8000/ws/${exercise}`;
      ws.current = new WebSocket(wsURL);
      ws.current.onopen = () => console.log(`WebSocket connected to ${wsURL}`);
      ws.current.onmessage = (event) => {
        const serverData = JSON.parse(event.data);
        setFeedback(serverData.feedback);
      };
      ws.current.onclose = () => console.log("WebSocket disconnected.");

      // --- MediaPipe 설정 ---
      const Pose = (window as any).Pose;
      const Camera = (window as any).Camera;
      const drawConnectors = (window as any).drawConnectors;
      const drawLandmarks = (window as any).drawLandmarks;
      const POSE_CONNECTIONS = (window as any).POSE_CONNECTIONS;

      const pose = new Pose({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: PoseResults) => {
        if (!canvasRef.current) return;
        const canvasCtx = canvasRef.current.getContext("2d")!;
        canvasCtx.save();
        canvasCtx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
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
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(results.poseLandmarks));
          }
        }
        canvasCtx.restore();
      });

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await pose.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start();

      // 정리 함수
      return () => {
        if (ws.current) ws.current.close();
        // camera.stop()을 호출하면 페이지 전환 시 안정성이 높아집니다.
        // camera 인스턴스를 useEffect 바깥으로 빼거나 state로 관리하면 더 좋습니다.
        // 우선은 이대로 두고, 문제가 발생하면 수정하겠습니다.
        camera.stop();
      };
    }
  }, [exercise, backendAddress]); // isActive 제거

  // handleToggle 함수 삭제

  return (
    // 버튼이 없는 UI 반환
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video ref={videoRef} style={{ display: "none" }}></video>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      ></canvas>
      <p
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "rgba(0,0,0,0.7)",
          color: "#0f0",
          padding: "10px",
          borderRadius: "5px",
          fontSize: "18px",
          margin: 0,
        }}
      >
        {feedback}
      </p>
    </div>
  );
};

export default AITrainer;
