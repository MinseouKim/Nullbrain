import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/Layouts/MainLayout";
import CameraSection from "../components/CameraSection";
import WorkoutSetupModal from "../components/WorkoutSetupModal";

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

  // [삭제] feedbackMessage 상태를 CameraSection으로 이동
  // const [feedbackMessage, setFeedbackMessage] = useState(...);

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
    // [삭제] feedbackMessage 설정 로직을 CameraSection으로 이동
    // setFeedbackMessage(`${exerciseData.name} 운동을 시작합니다!`);
  };

  // ✅ CameraSection이 세트 완료 후 호출할 함수
  const handleAdvanceSet = () => {
    if (workoutData && currentSet < workoutData.sets) {
      setCurrentSet((prevSet) => prevSet + 1);
    } else {
      // 모든 세트 완료 시 결과 페이지 이동은 CameraSection이 담당
      console.log(
        "모든 세트 완료. CameraSection에서 결과 페이지로 이동합니다."
      );
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
        // [수정] CameraSection이 요구하는 'onAdvanceSet' prop 전달
        onAdvanceSet={handleAdvanceSet}

        // [삭제] feedbackMessage 관련 props 전달 제거
        // feedbackMessage={feedbackMessage}
        // setFeedbackMessage={setFeedbackMessage}
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
