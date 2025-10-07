import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../components/Layouts/MainLayout";
import CameraSection from "../components/CameraSection";
import WorkoutSetupModal from "../components/WorkoutSetupModal";

function Camera() {
  const navigate = useNavigate();
  const location = useLocation() as any;
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

  // 타이머 효과
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isWorkoutActive && !isWorkoutPaused) {
      interval = setInterval(() => {
        setTimer((timer) => timer + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorkoutActive, isWorkoutPaused]);

  // ExerciseItems -> ExerciseModal에서 전달된 선택 값으로 초기화
  useEffect(() => {
    const preset = location?.state as
      | { name?: string; reps?: number; sets?: number; category?: string }
      | undefined;
    if (preset && preset.name) {
      // 이름 기준으로 기본 reps/sets 추정
      const lower = preset.name.toLowerCase();
      const defaults =
        lower.includes("스쿼트") || lower.includes("squat")
          ? { reps: 10, sets: 3 }
          : lower.includes("푸쉬업") || lower.includes("push")
          ? { reps: 10, sets: 3 }
          : lower.includes("플랭크") || lower.includes("plank")
          ? { reps: 30, sets: 3 }
          : lower.includes("런지") || lower.includes("lunge")
          ? { reps: 12, sets: 3 }
          : { reps: 10, sets: 3 };

      setWorkoutData({
        name: preset.name,
        reps: typeof preset.reps === "number" ? preset.reps : defaults.reps,
        sets: typeof preset.sets === "number" ? preset.sets : defaults.sets,
        category: preset.category || "전신",
      });
      // 모달 자동 표시
      setShowModal(true);
    }
  }, [location?.state]);

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
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleToggleWorkout = () => {
    if (isWorkoutActive && !isWorkoutPaused) {
      // 운동 정지
      setIsWorkoutPaused(true);
    } else if (isWorkoutActive && isWorkoutPaused) {
      // 운동 재시작
      setIsWorkoutPaused(false);
    }
  };

  const handleEndWorkout = () => {
    // 운동 상태 초기화
    setIsWorkoutActive(false);
    setIsWorkoutPaused(false);
    setTimer(0);
    setWorkoutData(null);

    // 메인페이지로 이동
    navigate("/");
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <MainLayout
      isWorkoutActive={isWorkoutActive}
      isWorkoutPaused={isWorkoutPaused}
      onToggleWorkout={handleToggleWorkout}
      onEndWorkout={handleEndWorkout}
      timer={formatTime(timer)}
      workoutData={workoutData}
    >
      <CameraSection
        workoutData={workoutData}
        isWorkoutPaused={isWorkoutPaused}
      />
      <WorkoutSetupModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onStartWorkout={handleStartWorkout}
        preset={
          workoutData
            ? {
                name: workoutData.name,
                reps: workoutData.reps,
                sets: workoutData.sets,
                category: workoutData.category,
              }
            : undefined
        }
      />
    </MainLayout>
  );
}
export default Camera;
