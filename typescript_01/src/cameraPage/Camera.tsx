import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/Layouts/MainLayout";
import CameraSection from "../components/CameraSection";
import WorkoutSetupModal from "../components/WorkoutSetupModal";
import { Landmark } from "../types/Landmark";

// 세트별 분석 결과 타입
interface SetResult {
  setNumber: number;
  aiFeedback: string;
  analysisData: any;
  stats: {
    accuracy: number;
    calories: number;
  };
}

function Camera() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);
  const [workoutData, setWorkoutData] = useState<{
    name: string;
    reps: number;
    sets: number;
    category: string;
  } | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [feedbackMessage, setFeedbackMessage] = useState("운동을 설정하고 시작해주세요!");
  const [allSetResults, setAllSetResults] = useState<SetResult[]>([]);

  // 🎥 녹화 관련 상태
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  // ⏱ 타이머 관리
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isWorkoutActive && !isWorkoutPaused) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorkoutActive, isWorkoutPaused]);

  // 🎥 카메라 스트림 및 녹화 시작
  useEffect(() => {
    if (isWorkoutActive) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => chunks.current.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks.current, { type: "video/webm" });
          setRecordedBlob(blob);
        };
        recorder.start();
      });
    } else {
      mediaRecorderRef.current?.stop();
    }
  }, [isWorkoutActive]);

  // 🏋️ 운동 시작
  const handleStartWorkout = (exerciseData: {
    name: string;
    reps: number;
    sets: number;
    category: string;
  }) => {
    setWorkoutData(exerciseData);
    setIsWorkoutActive(true);
    setIsWorkoutPaused(false);
    setTimer(0);
    setShowModal(false);
    setCurrentSet(1);
    setFeedbackMessage(`${exerciseData.name} 운동을 시작합니다!`);
    setAllSetResults([]);
  };

  // ✅ 세트 완료 시 백엔드 분석 요청
  const handleSetComplete = async (data: { landmarkHistory: Landmark[][]; repCount: number }) => {
    setIsWorkoutPaused(true);
    setFeedbackMessage("AI가 세트 분석 중입니다. 잠시만 기다려주세요...");

    const proceedToNextSet = (result: SetResult | null) => {
      setCurrentSet((prev) => {
        const nextSet = prev + 1;
        const feedbackText = result?.aiFeedback || "AI 분석 실패 — 계속 진행합니다.";
        if (workoutData && nextSet > workoutData.sets) {
          setFeedbackMessage(`${feedbackText} 모든 세트를 완료했습니다! 결과 페이지로 이동합니다.`);
          setTimeout(() => {
            navigate("/result", {
              state: {
                workoutPlan: workoutData,
                performanceData: {
                  finalTime: formatTime(timer),
                  allSetResults: [...allSetResults, result].filter(Boolean),
                },
                videoBlob: recordedBlob,
              },
            });
          }, 2500);
        } else {
          setFeedbackMessage(`${feedbackText} ${nextSet}세트를 준비해주세요.`);
        }
        return nextSet;
      });
    };

    try {
      const payload = {
        exerciseName: workoutData?.name.toLowerCase(),
        landmarkHistory: data.landmarkHistory,
        repCount: data.repCount,
        userProfile: { weight: 70 }, // 예시용
      };
      const res = await fetch("http://localhost:8000/api/analyze-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        const setResult: SetResult = {
          setNumber: currentSet,
          aiFeedback: result.ai_feedback,
          analysisData: result.set_analysis_data,
          stats: result.calculated_stats,
        };
        setAllSetResults((prev) => [...prev, setResult]);
        proceedToNextSet(setResult);
      } else {
        console.error("서버 오류:", res.status);
        proceedToNextSet(null);
      }
    } catch (err) {
      console.error("네트워크 오류:", err);
      proceedToNextSet(null);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <MainLayout
      isWorkoutActive={isWorkoutActive}
      isWorkoutPaused={isWorkoutPaused}
      onToggleWorkout={() => setIsWorkoutPaused((p) => !p)}
      onEndWorkout={() => navigate("/")}
      timer={formatTime(timer)}
      workoutData={workoutData}
    >
      <div style={{ textAlign: "center" }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: "640px", borderRadius: 10 }} />
      </div>

      <CameraSection
        workoutData={workoutData}
        isWorkoutPaused={isWorkoutPaused}
        targetReps={workoutData?.reps ?? 0}
        onSetComplete={handleSetComplete}
        currentSet={currentSet}
        totalSets={workoutData?.sets ?? 0}
        feedbackMessage={feedbackMessage}
      />

      <WorkoutSetupModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onStartWorkout={handleStartWorkout}
      />
    </MainLayout>
  );
}

export default Camera;
