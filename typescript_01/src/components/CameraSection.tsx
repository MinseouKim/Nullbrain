import React from "react";
import styled from "styled-components";
import AITrainer from "./AITrainer";

interface CameraSectionProps {
  workoutData?: {
    name: string;
    reps: number;
    sets: number;
  } | null;
}

// Styled Components
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

const CameraSection: React.FC<CameraSectionProps> = ({ workoutData }) => {
  const exerciseForAI = (name: string): "squat" | "pushup" => {
    const lowerCaseName = name.toLowerCase();
    if (lowerCaseName.includes("squat")) return "squat";
    if (lowerCaseName.includes("pushup")) return "pushup";
    return "squat";
  };

  return (
    <CameraSectionContainer>
      <FeedbackSection>{/* ... */}</FeedbackSection>

      <CameraContainer>
        {workoutData ? (
          // 운동 데이터가 있으면 AITrainer를 렌더링
          <AITrainer exercise={exerciseForAI(workoutData.name)} />
        ) : (
          // 운동 데이터가 없으면 플레이스홀더를 렌더링
          <CameraPlaceholder>{/* ... */}</CameraPlaceholder>
        )}
      </CameraContainer>
    </CameraSectionContainer>
  );
};

export default CameraSection;
