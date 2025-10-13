// src/components/CameraSection.tsx

import React from "react";
import styled from "styled-components";
import AITrainer from "./AITrainer";

interface CameraSectionProps {
  workoutData?: {
    name: string;
    reps: number;
    sets: number;
    category: string;
    restTime: number;
  } | null;
  isWorkoutPaused: boolean;
}

// Styled Components (기존 디자인 코드 복원)
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
  min-height: 0;
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
}) => {
  const exerciseForAI = (name: string): "squat" | "pushup" => {
    const lowerCaseName = name.toLowerCase();
    if (lowerCaseName.includes("squat") || lowerCaseName.includes("스쿼트")) {
      return "squat";
    }
    if (lowerCaseName.includes("pushup") || lowerCaseName.includes("푸쉬업")) {
      return "pushup";
    }
    return "squat"; // 기본값
  };

  return (
    <CameraSectionContainer>
      <FeedbackSection>
        <FeedbackMessage>
          {workoutData
            ? `${workoutData.name} 운동을 시작합니다!`
            : "운동을 설정하고 시작해주세요!"}
        </FeedbackMessage>
      </FeedbackSection>

      <CameraContainer>
        {workoutData ? (
          // 운동 데이터가 있으면 AITrainer를 렌더링
          <AITrainer
            exercise={exerciseForAI(workoutData.name)}
            isWorkoutPaused={isWorkoutPaused}
          />
        ) : (
          // 운동 데이터가 없으면 플레이스홀더를 렌더링
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
