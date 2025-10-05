import React, { useState } from "react";
import styled from "styled-components";

interface WorkoutSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartWorkout: (exerciseData: {
    name: string;
    reps: number;
    sets: number;
    category: string;
  }) => void;
}

interface Exercise {
  name: string;
  defaultReps: number;
  defaultSets: number;
  category: string;
}

interface ExerciseCategory {
  name: string;
  exercises: Exercise[];
}

// Styled Components
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 16px;
  padding: 30px;
  max-width: 90vw;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  position: relative;
  animation: modalSlideIn 0.3s ease-out;
  margin: auto;

  /* 노트북 화면 크기 대응 */
  @media (min-width: 1024px) and (max-width: 1440px) {
    max-width: 600px;
    padding: 35px;
  }

  /* 데스크톱 화면 크기 대응 */
  @media (min-width: 1441px) {
    max-width: 700px;
    padding: 40px;
  }

  /* 태블릿 화면 크기 대응 */
  @media (max-width: 768px) {
    max-width: 95vw;
    padding: 20px;
    max-height: 95vh;
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const ModalTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Instructions = styled.div`
  color: #666;
  font-size: 21px;
  line-height: 1.6;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const RedText = styled.div`
  color: #dc3545;
  font-size: 16px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ExerciseSetup = styled.div`
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
  border: 1px solid #e9ecef;
`;

const ExerciseName = styled.h3`
  font-size: 25px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 22px;
  }
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const InputLabel = styled.label`
  font-size: 19px;
  color: #666;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const NumberInput = styled.input`
  width: 80px;
  height: 50px;
  border: 2px solid #ddd;
  border-radius: 8px;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  transition: all 0.2s;

  @media (max-width: 768px) {
    width: 70px;
    height: 45px;
    font-size: 16px;
  }

  &:focus {
    outline: none;
    border-color: #850000;
    box-shadow: 0 0 0 3px rgba(133, 0, 0, 0.1);
  }

  &[type="text"] {
    text-align: left;
    padding: 0 10px;
  }
`;

const MultiplySign = styled.span`
  font-size: 24px;
  font-weight: 600;
  color: #666;
  margin: 0 10px;
`;

const AdditionalInfo = styled.div`
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 30px;
`;

const InfoText = styled.div`
  color: #856404;
  font-size: 16px;
  line-height: 1.5;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;

  @media (max-width: 768px) {
    gap: 10px;
    flex-direction: column;
  }
`;

const Button = styled.button<{ variant?: "primary" | "secondary" }>`
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  min-width: 140px;

  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 14px;
    min-width: 120px;
  }

  ${(props) =>
    props.variant === "primary"
      ? `
    background-color: #850000;
    color: white;
    
    &:hover {
      background-color: #6b0000;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(133, 0, 0, 0.3);
    }
  `
      : `
    background-color: transparent;
    color: #850000;
    border: 2px solid #850000;
    
    &:hover {
      background-color: #850000;
      color: white;
      transform: translateY(-2px);
    }
  `}
`;

const WorkoutSetupModal: React.FC<WorkoutSetupModalProps> = ({
  isOpen,
  onClose,
  onStartWorkout,
}) => {
  const exerciseCategories: ExerciseCategory[] = [
    {
      name: "하체",
      exercises: [
        { name: "스쿼트", defaultReps: 10, defaultSets: 3, category: "하체" },
        {
          name: "점프스쿼트",
          defaultReps: 15,
          defaultSets: 3,
          category: "하체",
        },
        { name: "런지", defaultReps: 12, defaultSets: 3, category: "하체" },
        {
          name: "월마운틴클라이머",
          defaultReps: 20,
          defaultSets: 3,
          category: "하체",
        },
      ],
    },
    {
      name: "상체",
      exercises: [
        { name: "푸쉬업", defaultReps: 10, defaultSets: 3, category: "상체" },
        { name: "플랭크", defaultReps: 30, defaultSets: 3, category: "상체" },
        {
          name: "사이드플랭크",
          defaultReps: 30,
          defaultSets: 3,
          category: "상체",
        },
        {
          name: "마운틴클라이머",
          defaultReps: 20,
          defaultSets: 3,
          category: "상체",
        },
      ],
    },
    {
      name: "어깨",
      exercises: [
        {
          name: "숄더프레스",
          defaultReps: 12,
          defaultSets: 3,
          category: "어깨",
        },
        {
          name: "레터럴레이즈",
          defaultReps: 15,
          defaultSets: 3,
          category: "어깨",
        },
        {
          name: "프론트레이즈",
          defaultReps: 15,
          defaultSets: 3,
          category: "어깨",
        },
        {
          name: "리어델트플라이",
          defaultReps: 12,
          defaultSets: 3,
          category: "어깨",
        },
      ],
    },
    {
      name: "팔",
      exercises: [
        { name: "버피", defaultReps: 8, defaultSets: 3, category: "팔" },
        { name: "트라이셉딥", defaultReps: 10, defaultSets: 3, category: "팔" },
        { name: "바이셉컬", defaultReps: 12, defaultSets: 3, category: "팔" },
        { name: "해머컬", defaultReps: 12, defaultSets: 3, category: "팔" },
      ],
    },
  ];

  const [selectedExercise, setSelectedExercise] = useState<Exercise>(
    exerciseCategories[0].exercises[0]
  );
  const [reps, setReps] = useState(
    exerciseCategories[0].exercises[0].defaultReps
  );
  const [sets, setSets] = useState(
    exerciseCategories[0].exercises[0].defaultSets
  );

  const handleStartWorkout = () => {
    onStartWorkout({
      name: selectedExercise.name,
      reps,
      sets,
      category: selectedExercise.category,
    });
  };

  const handleViewPose = () => {
    // 운동 자세 보기 기능 (추후 구현)
    alert("운동 자세 보기 기능은 추후 구현됩니다.");
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>자세온</ModalTitle>
          <Instructions>먼저 각 운동 별 목표 갯수 및 세트 설정</Instructions>
          <Instructions>운동이 준비 되었다면 시작 버튼을,</Instructions>
          <Instructions>
            운동자세를 볼려면 운동자세 보기를 눌러주세요
          </Instructions>
          <RedText>*운동 생략을 원하시면 0을 입력해주세요.</RedText>
        </ModalHeader>

        <ExerciseSetup>
          <InputRow>
            <InputContainer>
              <InputLabel>운동명</InputLabel>
              <NumberInput
                type="text"
                value={selectedExercise.name}
                onChange={(e) =>
                  setSelectedExercise({
                    ...selectedExercise,
                    name: e.target.value,
                  })
                }
                placeholder="운동명 입력"
                style={{ width: "120px" }}
              />
            </InputContainer>
            <MultiplySign>×</MultiplySign>
            <InputContainer>
              <InputLabel>횟수</InputLabel>
              <NumberInput
                type="number"
                value={reps}
                onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                min="0"
              />
            </InputContainer>
            <MultiplySign>×</MultiplySign>
            <InputContainer>
              <InputLabel>세트</InputLabel>
              <NumberInput
                type="number"
                value={sets}
                onChange={(e) => setSets(parseInt(e.target.value) || 0)}
                min="0"
              />
            </InputContainer>
          </InputRow>
        </ExerciseSetup>

        <AdditionalInfo>
          <InfoText>
            *운동은 기본 10~15회씩 3~5세트 기본으로 합니다. 처음이시라면 10회씩
            3세트에서 천천히 늘려보세요!
          </InfoText>
        </AdditionalInfo>

        <ButtonContainer>
          <Button variant="secondary" onClick={handleViewPose}>
            [운동자세 보기]
          </Button>
          <Button variant="primary" onClick={handleStartWorkout}>
            운동 시작하기
          </Button>
        </ButtonContainer>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default WorkoutSetupModal;
