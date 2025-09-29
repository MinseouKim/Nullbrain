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
interface BodyAnalysisCameraProps {
  isAnalysisRunning: boolean; // 분석 진행 상태
}

const BodyAnalysisCamera: React.FC<BodyAnalysisCameraProps> = ({ isAnalysisRunning }) => {
  const [feedback, setFeedback] = useState("AI 모델을 준비 중입니다...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    // MediaPipe 스크립트 동적 로드 함수
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
        script.onerror = () => reject(new Error(`Script load error for ${src}`));
        document.head.appendChild(script);
      });
    };

    // MediaPipe 초기화 및 카메라 시작
    const initializeMediaPipe = async () => {
      try {
        await Promise.all([
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js"),
        ]);
      } catch (error) {
        console.error("MediaPipe 스크립트 로딩 실패:", error);
        setFeedback("AI 모델 로딩에 실패했습니다.");
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

      // 웹소켓 연결 (필요 시 주소 변경)
      // ws.current = new WebSocket(`ws://localhost:8000/ws/body-analysis`);
      // ws.current.onopen = () => console.log("Body analysis WebSocket connected.");
      // ws.current.onmessage = (event) => setFeedback(JSON.parse(event.data).feedback);
      // ws.current.onclose = () => console.log("WebSocket disconnected.");

      const pose = new Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: PoseResults) => {
        canvasElement.width = results.image.width;
        canvasElement.height = results.image.height;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        if (results.poseLandmarks) {
          drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#00FF00", lineWidth: 4 });
          drawLandmarks(canvasCtx, results.poseLandmarks, { color: "#FF0000", lineWidth: 2 });

          // isAnalysisRunning이 true일 때만 데이터 전송 (현재는 콘솔 출력)
          if (isAnalysisRunning && ws.current?.readyState === WebSocket.OPEN) {
             // ws.current.send(JSON.stringify(results.poseLandmarks));
          }
        }
        canvasCtx.restore();
      });

      cameraRef.current = new Camera(videoElement, {
        onFrame: async () => {
          await pose.send({ image: videoElement });
        },
        width: 1280,
        height: 720,
      });
      
      cameraRef.current.start();
    };

    initializeMediaPipe();

    // 컴포넌트 unmount 시 리소스 정리
    return () => {
      ws.current?.close();
      cameraRef.current?.stop();
    };
  }, []); // 최초 1회만 실행

  // isAnalysisRunning 상태에 따라 피드백 메시지 업데이트
  useEffect(() => {
    if(isAnalysisRunning) {
        setFeedback("체형 분석 중... 자세를 유지해주세요.");
    } else {
        setFeedback("분석이 일시정지 되었습니다.");
    }
  }, [isAnalysisRunning])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video ref={videoRef} style={{ display: 'none' }} playsInline />
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          backgroundColor: '#000',
          borderRadius: '12px'
        }}
      />
      <p style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: isAnalysisRunning ? '#0f0' : '#FFFF00',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '18px',
        margin: 0,
      }}>
        {feedback}
      </p>
    </div>
  );
};

export default BodyAnalysisCamera;