import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import AITrainer from "./AITrainer";
import { Landmark } from "../types/Landmark";
import { useNavigate } from "react-router-dom";
import { ExerciseName } from "../types/ExerciseTypes";
import { exerciseForAI } from "../utils/exerciseMapper";

interface CameraSectionProps {
  workoutData?: {
    name: string; // 사용자가 입력한 이름 ("스쿼트")이 들어옴
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

// ... (styled-components 코드는 이전과 동일) ...
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
  const navigate = useNavigate();
  const [allSetResults, setAllSetResults] = useState<any[]>([]);
  const [feedbackMessage, setFeedbackMessage] =
    useState("운동을 설정하고 시작해주세요!");

  const isProcessingSet = useRef(false);

  useEffect(() => {
    if (workoutData) {
      // workoutData.name은 사용자가 입력한 "스쿼트"
      setFeedbackMessage(`${workoutData.name} 운동을 시작합니다!`);
      setAllSetResults([]);
    } else {
      setFeedbackMessage("운동을 설정하고 시작해주세요!");
    }
  }, [workoutData]);

  useEffect(() => {
    isProcessingSet.current = false;
  }, [currentSet]);

  // ✅ 세트 완료 처리
  const handleSetComplete = async (data: {
    exerciseName: ExerciseName; // 실제로는 "squat" 같은 ID가 AITrainer에서 옴
    landmarkHistory: Landmark[][];
    repCount: number;
    finalTime?: string;
  }) => {
    if (isProcessingSet.current) return;
    isProcessingSet.current = true;

    try {
      setFeedbackMessage("🤖 AI가 세트를 분석 중입니다...");

      const res = await fetch("http://localhost:8000/api/feedback/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: data.exerciseName, // AITrainer가 넘겨준 ID("squat")
          rep_count: data.repCount,
          analysis_data: data.landmarkHistory,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI 서버 오류: ${res.status}`);
      }

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

      // --- 마지막 세트 처리 (AI 성공) ---
      if (currentSet >= totalSets) {
        setFeedbackMessage(
          "모든 운동을 완료하셨습니다. 결과페이지로 이동합니다."
        );

        setTimeout(async () => {
          try {
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
                workoutPlan: workoutData, // workoutData.name은 "스쿼트"
                performanceData: {
                  finalTime: data.finalTime,
                  allSetResults: combinedResults,
                  overallFeedback: overall,
                },
              },
            });
          } catch (overallErr) {
            navigate("/result", {
              state: {
                workoutPlan: workoutData,
                performanceData: {
                  finalTime: data.finalTime,
                  allSetResults: combinedResults,
                  overallFeedback: { error: "전체 분석 실패" },
                },
              },
            });
          }
        }, 2000);
      } else {
        // --- 다음 세트 진행 ---
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

      // --- 마지막 세트 처리 (AI 실패) ---
      if (currentSet >= totalSets) {
        setFeedbackMessage(
          "모든 운동을 완료하셨습니다. 결과페이지로 이동합니다."
        );
        console.log(
          "AI 분석 실패. 마지막 세트이므로 결과 페이지로 이동합니다."
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
        }, 2000);
      } else {
        // --- 다음 세트 진행 (AI 실패) ---
        setFeedbackMessage("⚠️ AI 분석 실패. 다음 세트로 진행합니다.");
        setTimeout(() => {
          onAdvanceSet?.();
          setFeedbackMessage(
            `⚠️ AI 분석 오류. ${currentSet + 1}세트를 시작합니다!`
          );
        }, 2000);
      }
    }
  };

  // [원복] exerciseForAI 함수를 사용하는 부분 복구
  return (
    <CameraSectionContainer>
      <FeedbackSection>
        <FeedbackMessage>{feedbackMessage}</FeedbackMessage>
      </FeedbackSection>

      <CameraContainer>
        {workoutData ? (
          <AITrainer
            // [수정] workoutData.name("스쿼트")을 exerciseForAI로 변환하여 전달
            exercise={exerciseForAI(workoutData.name) as ExerciseName}
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
