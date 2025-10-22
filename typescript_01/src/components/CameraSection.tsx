import React, { useState } from "react";
import styled from "styled-components";
import AITrainer from "./AITrainer";
import { Landmark } from "../types/Landmark";
import { useNavigate } from "react-router-dom";
import { ExerciseName } from "../types/ExerciseTypes";
import { exerciseForAI } from "../utils/exerciseMapper";

interface CameraSectionProps {
  workoutData?: {
    name: string;
    reps: number;
    sets: number;
    category: string;
  } | null;
  isWorkoutPaused: boolean;
  targetReps: number;
  feedbackMessage: string;
  setFeedbackMessage: (msg: string) => void;
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

const KEYPOINTS = [0, 11, 12, 23, 24, 25, 26, 27, 28]; // 머리/어깨/엉덩이/무릎/발목

const CameraSection: React.FC<CameraSectionProps> = ({
  workoutData,
  isWorkoutPaused,
  targetReps,
  feedbackMessage,
  setFeedbackMessage,
  currentSet,
  totalSets,
  onAdvanceSet,
}) => {
  const navigate = useNavigate();
  const [allSetResults, setAllSetResults] = useState<any[]>([]);

  // ✅ 세트 완료 처리
  const handleSetComplete = async (data: {
    exerciseName: ExerciseName;
    landmarkHistory: Landmark[][];
    repCount: number;
    finalTime?: string;
  }) => {
    try {
      setFeedbackMessage("🤖 AI가 세트를 분석 중입니다...");

      // --- AI 피드백 요청 ---
      const res = await fetch("http://localhost:8000/api/feedback/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: data.exerciseName,
          rep_count: data.repCount,
          analysis_data: data.landmarkHistory,
        }),
      });

      const feedbackResult = await res.json();
      const feedbackText =
        feedbackResult.feedback || "AI 피드백을 불러올 수 없습니다.";

      const newSet = {
        aiFeedback: feedbackText,
        stats: feedbackResult.stats || {},
        analysisData: feedbackResult.analysisData || {},
      };
      const combinedResults = [...allSetResults, newSet];
      setAllSetResults(combinedResults);

      // --- 마지막 세트 처리 ---
      if (currentSet >= totalSets) {
        setFeedbackMessage(`💬 ${feedbackText}\n📊 전체 운동 분석 중입니다...`);

        const overallRes = await fetch(
          "http://localhost:8000/api/feedback/overall",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ set_results: combinedResults }),
          }
        );

        const overall = await overallRes.json();

        navigate("/result", {
          state: {
            workoutPlan: workoutData,
            performanceData: {
              finalTime: data.finalTime,
              allSetResults: combinedResults,
              overallFeedback: overall,
            },
          },
        });
      } else {
        // --- 다음 세트 진행 ---
        setFeedbackMessage(
          `💬 ${feedbackText}\n✅ ${currentSet}세트 완료! 다음 세트를 준비하세요.`
        );

        // 다음 세트로 증가 및 안내 문구 표시
        setTimeout(() => {
          onAdvanceSet?.();
          setFeedbackMessage(`${currentSet + 1}세트를 시작합니다!`);
        }, 2000);
      }
    } catch (err) {
      console.error("❌ 세트 분석 실패:", err);
      setFeedbackMessage("⚠️ AI 피드백 요청 중 오류가 발생했습니다.");
    }
  };

  const exerciseForAI = (name: string): "squat" | "pushup" => {
    const lower = name.toLowerCase();
    if (lower.includes("squat") || lower.includes("스쿼트")) return "squat";
    if (lower.includes("pushup") || lower.includes("푸쉬업")) return "pushup";
    return "squat";
  };

  return (
    <CameraSectionContainer>
      <FeedbackSection>
        <FeedbackMessage>{feedbackMessage}</FeedbackMessage>
      </FeedbackSection>

      <CameraContainer>
        {workoutData ? (
          <AITrainer
            exercise={exerciseForAI(workoutData.name)}
            isWorkoutPaused={isWorkoutPaused}
            targetReps={targetReps}
            onSetComplete={handleSetComplete}
            currentSet={currentSet}
            totalSets={totalSets}
            setFeedbackMessage={setFeedbackMessage}
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
