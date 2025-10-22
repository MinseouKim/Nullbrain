import React, { useState, useEffect } from "react";
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
  const [feedbackMessage, setFeedbackMessage] =
    useState("운동을 설정하고 시작해주세요!");
  const [allSetResults, setAllSetResults] = useState<SetResult[]>([]);

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

  // ✅ CameraSection에서 한 세트 완료 시 호출
  const handleSetComplete = async (data: {
    exerciseName: "squat" | "pushup";
    landmarkHistory: Landmark[][];
    repCount: number;
    finalTime?: string;
  }) => {
    setIsWorkoutPaused(true);
    setFeedbackMessage("AI가 세트를 분석 중입니다...");

    try {
      const res = await fetch("http://localhost:8000/feedback/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: data.exerciseName,
          landmark_history: data.landmarkHistory,
          rep_count: data.repCount,
        }),
      });

      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const result = await res.json();
      console.log("✅ AI 피드백 수신:", result);

      const setResult: SetResult = {
        setNumber: currentSet,
        aiFeedback: result.feedback || "AI 피드백 없음",
        analysisData: result.analysisData || {},
        stats: result.stats || { accuracy: 0, calories: 0 },
      };
      const updatedResults = [...allSetResults, setResult];
      setAllSetResults(updatedResults);

      // ✅ 피드백을 즉시 표시 (사용자에게 보이게)
      setFeedbackMessage(setResult.aiFeedback);

      // 2초 후 자동으로 다음 세트로 넘어가기
      setTimeout(() => {
        if (workoutData && currentSet < workoutData.sets) {
          const nextSet = currentSet + 1;
          setCurrentSet(nextSet);
          setIsWorkoutPaused(false);
          setFeedbackMessage(`${nextSet}세트를 시작하세요!`);
        } else {
          console.log("🎯 모든 세트 완료 → 결과 페이지 이동");
          navigate("/result", {
            state: {
              workoutPlan: workoutData,
              performanceData: {
                finalTime: formatTime(timer),
                allSetResults: updatedResults,
              },
            },
          });
        }
      }, 2500);
    } catch (err) {
      console.error("❌ 세트 분석 실패:", err);
      setFeedbackMessage("AI 분석 실패. 다음 세트로 진행합니다.");
      setCurrentSet((prev) => prev + 1);
      setIsWorkoutPaused(false);
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
      {/* 📹 운동 중 */}
      <CameraSection
        workoutData={workoutData}
        isWorkoutPaused={isWorkoutPaused}
        targetReps={workoutData?.reps ?? 0}
        currentSet={currentSet}
        totalSets={workoutData?.sets ?? 0}
        feedbackMessage={feedbackMessage}
        onAdvanceSet={() => setCurrentSet((prev) => prev + 1)} // 자동 증가
        setFeedbackMessage={setFeedbackMessage} // ✅ 추가!
      />

      {/* ⚙️ 운동 설정 모달 */}
      <WorkoutSetupModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onStartWorkout={handleStartWorkout}
      />
    </MainLayout>
  );
}

export default Camera;
