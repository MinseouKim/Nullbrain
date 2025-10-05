// src/cameraPage/Camera.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/Layouts/MainLayout";
import CameraSection from "../components/CameraSection";
import WorkoutSetupModal from "../components/WorkoutSetupModal";
import { Landmark } from "../types/Landmark";

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
    if (!workoutData) {
      alert("운동을 선택해야 시작할 수 있습니다!");
      setShowModal(true); // 모달 다시 열기
      return;
    }
    setShowModal(false); // 운동 데이터 있으면 정상적으로 닫기
  };

  const handleToggleWorkout = () => {
    setIsWorkoutPaused((prev) => !prev);
  };

  const handleEndWorkout = () => {
    setIsWorkoutActive(false);
    setIsWorkoutPaused(false);
    setTimer(0);
    setWorkoutData(null);
    navigate("/");
  };

  // 세트가 완료되었을 때 호출될 함수
  const handleSetComplete = async (data: {
    landmarkHistory: Landmark[][];
    repCount: number;
  }) => {
    console.log(
      "한 세트 완료! 백엔드로 데이터 전송:",
      data.landmarkHistory.length,
      "개의 프레임"
    );

    setIsWorkoutPaused(true); // 분석 중에는 잠시 정지

    const payload = {
      exerciseName: workoutData?.name.toLowerCase(),
      landmarkHistory: data.landmarkHistory,
      repCount: data.repCount,
      // userProfile: (로그인 구현 후, DB에서 가져온 체형 분석 데이터)
    };

    try {
      // 백엔드에 새로운 '세트 분석' API 주소로 fetch 요청
      const response = await fetch("http://localhost:8000/api/analyze-set", {
        // 새로운 API 주소
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      console.log("백엔드 종합 피드백:", result.analysis_feedback);
      alert(`세트 분석 결과: ${result.analysis_feedback}`);

      // 다음 세트를 준비하거나 운동을 종료하는 로직 추가
      // 예: 남은 세트가 있으면 setIsWorkoutPaused(false)로 다시 시작
      setIsWorkoutPaused(false);
    } catch (error) {
      console.error("분석 요청 실패:", error);
      alert("분석 요청에 실패했습니다.");
      setIsWorkoutPaused(false); // 오류 발생 시 다시 재개
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
        targetReps={workoutData?.reps ?? 0}
        onSetComplete={handleSetComplete}
      />
      <WorkoutSetupModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onStartWorkout={handleStartWorkout}
      />
    </MainLayout>
  );
}
export default Camera;
