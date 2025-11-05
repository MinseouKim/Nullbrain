import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/Layouts/MainLayout";
import CameraSection from "../components/CameraSection";
import WorkoutSetupModal from "../components/WorkoutSetupModal";
import { Landmark } from "../types/Landmark";

// 세트별 분석 결과를 저장하기 위한 타입 정의
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
    setCurrentSet(1);
    setFeedbackMessage(`${exerciseData.name} 운동을 시작합니다!`);
    setAllSetResults([]);
  };

  const handleCloseModal = () => {
    if (!workoutData) {
      alert("운동을 선택해야 시작할 수 있습니다!");
      setShowModal(true);
      return;
    }
    setShowModal(false);
  };

  const handleToggleWorkout = () => {
    setIsWorkoutPaused((prev) => !prev);
  };

  const handleEndWorkout = () => {
    setIsWorkoutActive(false);
    setIsWorkoutPaused(false);
    setTimer(0);
    setWorkoutData(null);
    setFeedbackMessage("운동을 설정하고 시작해주세요!");
    navigate("/");
  };

  // 👇 [수정] 비동기 타이밍 문제를 해결한 최종 버전
  const handleSetComplete = async (data: {
    landmarkHistory: Landmark[][];
    repCount: number;
  }) => {
    setIsWorkoutPaused(true);
    setFeedbackMessage("AI가 세트 분석 중입니다. 잠시만 기다려주세요...");

    // 성공/실패 여부와 관계없이 세트 진행 로직을 실행하는 함수
    const proceedToNextStep = (result: SetResult | null) => {
      setCurrentSet((prevCurrentSet) => {
        const nextSet = prevCurrentSet + 1;
        const feedbackToShow =
          result?.aiFeedback ||
          "AI 피드백 분석에 실패했습니다. 운동 흐름을 계속 진행합니다.";

        if (workoutData && nextSet > workoutData.sets) {
          const finalMessage = `${feedbackToShow} 모든 세트를 완료했습니다! 3초 후 결과 페이지로 이동합니다.`;
          setFeedbackMessage(finalMessage);

          setTimeout(() => {
            navigate("/result", {
              state: {
                workoutPlan: workoutData,
                performanceData: {
                  finalTime: formatTime(timer),
                  allSetResults: [...allSetResults, result].filter(Boolean),
                },
              },
            });
          }, 3000);
        } else {
          const nextSetMessage = `${feedbackToShow} 휴식 후 '계속' 버튼을 눌러 ${nextSet}세트를 시작하세요.`;
          setFeedbackMessage(nextSetMessage);
        }
        return nextSet;
      });
    };

    // 백엔드 통신
    try {
      const payload = {
        exerciseName: workoutData?.name.toLowerCase(),
        landmarkHistory: data.landmarkHistory,
        repCount: data.repCount,
        userProfile: { weight: 70 }, // (임시)
      };
      const response = await fetch("http://localhost:8000/api/analyze-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        const currentSetResult: SetResult = {
          setNumber: currentSet,
          aiFeedback: result.ai_feedback,
          analysisData: result.set_analysis_data,
          stats: result.calculated_stats,
        };
        setAllSetResults((prev) => [...prev, currentSetResult]);
        proceedToNextStep(currentSetResult); // 성공 시 결과와 함께 다음 단계 진행
      } else {
        console.error("서버 응답 오류:", response.status);
        proceedToNextStep(null); // 서버 오류 시 결과 없이 다음 단계 진행
      }
    } catch (error) {
      console.error("네트워크 요청 실패:", error);
      proceedToNextStep(null); // 네트워크 실패 시 결과 없이 다음 단계 진행
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
        currentSet={currentSet}
        totalSets={workoutData?.sets ?? 0}
        feedbackMessage={feedbackMessage}
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
