// src/cameraPage/CameraSection.tsx
import React, { useState, useEffect, useRef, useContext } from "react";
import styled from "styled-components";
import AITrainer from "../components/AITrainer";
import { Landmark } from "../types/Landmark";
import { useNavigate } from "react-router-dom";
import { ExerciseName } from "../types/ExerciseTypes";
import { exerciseForAI } from "../utils/exerciseMapper";
import { AuthContext } from "../context/AuthContext";

interface CameraSectionProps {
  workoutData?: {
    name: string;
    reps: number;
    sets: number;
    category: string;
  } | null;
  isWorkoutPaused: boolean;
  targetReps: number;
  currentSet: number;
  totalSets: number;
  onAdvanceSet?: () => void;
}

const CameraSectionContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  box-sizing: border-box;
`;

const FeedbackSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 25px 30px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  min-height: 80px;
`;

const FeedbackMessage = styled.div`
  color: #333;
  font-size: 22px;
  font-weight: 700;
  white-space: pre-line;
  text-align: center;
`;

const CameraContainer = styled.div`
  width: 100%;
  flex: 1;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const CameraPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: #666;
`;
const CameraIcon = styled.div`
  font-size: 48px;
  opacity: 0.7;
`;
const CameraText = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: #666;
`;
const CameraSubtitle = styled.div`
  font-size: 14px;
  color: #999;
  font-style: italic;
`;

const CameraSection: React.FC<CameraSectionProps> = ({
  workoutData,
  isWorkoutPaused,
  targetReps,
  currentSet,
  totalSets,
  onAdvanceSet,
}) => {
  const { user } = useContext(AuthContext);
  const userId = user?.id ?? "dev-user-01";
  const navigate = useNavigate();

  const [allSetResults, setAllSetResults] = useState<any[]>([]);
  const [feedbackMessage, setFeedbackMessage] =
    useState("운동을 설정하고 시작해주세요!");

  const isProcessingSet = useRef(false);
  const [feedbackLocked, setFeedbackLocked] = useState(false);

  useEffect(() => {
    if (workoutData) {
      setFeedbackMessage(`${workoutData.name} 운동을 시작합니다!`);
      setAllSetResults([]);
    } else {
      setFeedbackMessage("운동을 설정하고 시작해주세요!");
    }
  }, [workoutData]);

  useEffect(() => {
    isProcessingSet.current = false;
    setFeedbackLocked(false); // 새 세트 들어오면 메시지 억제 해제
  }, [currentSet]);

  // ✅ 세트 완료 처리
  const handleSetComplete = async (data: {
    exerciseName: ExerciseName; // 영어 ID ("squat")
    landmarkHistory: Landmark[][];
    repCount: number;
    finalTime?: string;
  }) => {
    if (isProcessingSet.current) return;
    isProcessingSet.current = true;

    try {
      setFeedbackLocked(true);
      setFeedbackMessage("🤖 AI가 세트를 분석 중입니다...");

      // 👇 한글명, 세트/타깃 포함해서 보냄
      const res = await fetch("http://localhost:8000/api/feedback/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId, // 로그인한 사용자
          exerciseId: data.exerciseName, // 내부 ID (영문)
          exerciseName: workoutData?.name, // 표시명 (한글)
          rep_count: data.repCount,
          set_index: currentSet, // 1-based
          total_sets: totalSets,
          target_reps: targetReps,
          analysis_data: data.landmarkHistory, // landmark history
        }),
      });

      if (!res.ok) throw new Error(`AI 서버 오류: ${res.status}`);
      const feedbackResult = await res.json();
      const feedbackText =
        feedbackResult.feedback || "AI 피드백을 불러올 수 없습니다.";

      const newSet = {
        aiFeedback: feedbackText,
        stats: feedbackResult.stats || {},
        analysisData: feedbackResult.analysisData || {},
        meta: {
          setIndex: currentSet,
          totalSets,
          targetReps,
          exerciseId: data.exerciseName,
          exerciseName: workoutData?.name,
        },
      };

      const combinedResults = [...allSetResults, newSet];
      setAllSetResults(combinedResults);

      if (currentSet >= totalSets) {
        // ✅ 마지막 세트: 짧게 보여주고 곧바로 결과 페이지로 이동
        setFeedbackMessage(
          `💬 ${feedbackText}\n✅ 모든 세트 완료! 결과 페이지로 이동합니다...`
        );

        setTimeout(() => {
          navigate("/result", {
            state: {
              workoutPlan: workoutData,
              performanceData: {
                finalTime: data.finalTime,
                allSetResults: combinedResults,
                // overall은 결과 페이지에서 mount 시 비동기 호출
              },
            },
          });
        }, 600); // ⏱ 600ms로 단축
      } else {
        // 다음 세트로 자동 진행(기존 2초 유지)
        setFeedbackMessage(
          `💬 ${feedbackText}\n✅ ${currentSet}세트 완료! 다음 세트를 준비하세요.`
        );
        setTimeout(() => {
          onAdvanceSet?.();
          setFeedbackMessage(`${currentSet + 1}세트를 시작합니다!`);
        }, 2000);
      }
    } catch (err) {
      console.error("❌ 세트 분석 실패:", err);
      if (currentSet >= totalSets) {
        setFeedbackMessage(
          "모든 운동을 완료하셨습니다. 결과페이지로 이동합니다."
        );
        setTimeout(() => {
          navigate("/result", {
            state: {
              workoutPlan: workoutData,
              performanceData: {
                finalTime: data.finalTime,
                allSetResults: allSetResults,
                overallFeedback: { error: "AI 분석 실패" },
              },
            },
          });
        }, 800);
      } else {
        setFeedbackMessage("⚠️ AI 분석 실패. 다음 세트로 진행합니다.");
        setTimeout(() => {
          onAdvanceSet?.();
          setFeedbackMessage(
            `⚠️ AI 분석 오류. ${currentSet + 1}세트를 시작합니다!`
          );
        }, 1500);
      }
    } finally {
      setFeedbackLocked(false);
      isProcessingSet.current = false;
    }
  };

  return (
    <CameraSectionContainer>
      <FeedbackSection>
        <FeedbackMessage>{feedbackMessage}</FeedbackMessage>
      </FeedbackSection>

      <CameraContainer>
        {workoutData ? (
          <AITrainer
            exercise={exerciseForAI(workoutData.name) as ExerciseName}
            isWorkoutPaused={isWorkoutPaused}
            targetReps={targetReps}
            onSetComplete={handleSetComplete}
            currentSet={currentSet}
            totalSets={totalSets}
            setFeedbackMessage={setFeedbackMessage}
            suppressMessages={feedbackLocked} // ✅ 피드백 노출 중 덮어쓰기 방지
            displayName={workoutData.name}
          />
        ) : (
          <CameraPlaceholder>
            <CameraIcon>📹</CameraIcon>
            <CameraText>운동 시작 대기 중</CameraText>
            <CameraSubtitle>모달에서 운동을 설정해주세요.</CameraSubtitle>
          </CameraPlaceholder>
        )}
      </CameraContainer>
    </CameraSectionContainer>
  );
};

export default CameraSection;
