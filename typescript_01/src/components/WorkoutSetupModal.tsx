import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

interface WorkoutSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartWorkout: (exerciseData: {
    name: string;
    reps: number;
    sets: number;
    category: string;
    restTime: number;
  }) => void;
  preset?: {
    name: string;
    reps: number;
    sets: number;
    category: string;
    restTime?: number;
  };
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
  padding: 20px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  position: relative;
  animation: modalSlideIn 0.3s ease-out;
  margin: auto;

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 20px;
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
  padding: 20px;
  margin-bottom: 20px;
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

const RestTimeSection = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
`;

const RestTimeLabel = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  text-align: center;
`;

const RestTimeHorizontalContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }
`;

const RestTimeInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const TimeInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
`;

const TimeDropdownButton = styled.button`
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: background-color 0.2s ease, border-color 0.2s ease,
    color 0.2s ease;
  min-width: 40px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  outline: none;

  &:hover {
    background: #e9ecef;
    border-color: #850000;
    color: #850000;
  }

  &:active {
    background: #e9ecef;
    border-color: #850000;
    color: #850000;
  }

  &:focus {
    outline: none;
  }
`;

const TimeDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 160px;
  overflow-y: auto;
  margin-top: 4px;
  transform: translateZ(0);
  will-change: auto;

  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const TimeDropdownOption = styled.div<{ isSelected: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: ${(props) => (props.isSelected ? "#850000" : "#666")};
  background-color: ${(props) => (props.isSelected ? "#f8f9fa" : "white")};
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease, color 0.2s ease;
  transform: translateZ(0);

  &:hover {
    background-color: #f8f9fa;
    color: #850000;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TimeUnit = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #666;
`;

const RestTimeQuickSelect = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex: 2;
`;

const RestTimeSelectBox = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  max-width: 100%;
`;

const RestTimeOption = styled.div<{ isSelected: boolean }>`
  padding: 10px 8px;
  border: 2px solid ${(props) => (props.isSelected ? "#850000" : "transparent")};
  border-radius: 8px;
  background-color: ${(props) => (props.isSelected ? "#850000" : "white")};
  color: ${(props) => (props.isSelected ? "white" : "#666")};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  box-shadow: ${(props) =>
    props.isSelected
      ? "0 2px 4px rgba(133, 0, 0, 0.2)"
      : "0 1px 2px rgba(0, 0, 0, 0.1)"};

  &:hover {
    border-color: #850000;
    background-color: ${(props) => (props.isSelected ? "#850000" : "#f8f9fa")};
    color: ${(props) => (props.isSelected ? "white" : "#850000")};
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(133, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 8px 6px;
    font-size: 12px;
  }
`;

const AdditionalInfo = styled.div`
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
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
  preset,
}) => {
  const navigate = useNavigate();
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

  const [selectedExercise, setSelectedExercise] = useState<Exercise>(() => {
    if (preset) {
      const found = exerciseCategories
        .flatMap((c) => c.exercises)
        .find((e) => e.name === preset.name);
      return found || exerciseCategories[0].exercises[0];
    }
    return exerciseCategories[0].exercises[0];
  });
  const [reps, setReps] = useState<number>(
    () => preset?.reps ?? exerciseCategories[0].exercises[0].defaultReps
  );
  const [sets, setSets] = useState<number>(
    () => preset?.sets ?? exerciseCategories[0].exercises[0].defaultSets
  );
  const [restTime, setRestTime] = useState<number>(
    () => preset?.restTime ?? 60 // 기본 60초
  );
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowTimeDropdown(false);
      }
    };

    if (showTimeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTimeDropdown]);

  // 모달이 열려있을 때 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;

      // body 스타일 변경으로 스크롤 방지
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        // 모달이 닫힐 때 원래 스타일로 복원
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";

        // 스크롤 위치 복원
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // preset이 바뀔 때 모달 입력값 업데이트
  useEffect(() => {
    if (!preset) return;
    const found = exerciseCategories
      .flatMap((c) => c.exercises)
      .find((e) => e.name === preset.name);
    if (found) {
      setSelectedExercise(found);
    } else {
      setSelectedExercise({
        name: preset.name,
        defaultReps: preset.reps,
        defaultSets: preset.sets,
        category: preset.category,
      });
    }
    setReps(preset.reps);
    setSets(preset.sets);
    setRestTime(preset.restTime ?? 60);
  }, [preset]);

  const handleStartWorkout = () => {
    onStartWorkout({
      name: selectedExercise.name,
      reps: reps,
      sets: sets,
      category: selectedExercise.category,
      restTime: restTime,
    });
    onClose();
  };

  const handleViewPose = () => {
    // 운동자세 보기 클릭 시 운동 목록 페이지로 이동
    navigate("/exercise");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen}>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>자세ON</ModalTitle>
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

          <RestTimeSection>
            <RestTimeInputContainer>
              <InputLabel>쉬는시간 설정</InputLabel>
              <TimeInputWrapper ref={dropdownRef}>
                <TimeDropdownButton
                  onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                >
                  ▼
                </TimeDropdownButton>
                <NumberInput
                  type="number"
                  value={restTime}
                  onChange={(e) => setRestTime(parseInt(e.target.value) || 0)}
                  min="0"
                  max="120"
                  step="5"
                  style={{ width: "100px", height: "50px" }}
                />
                <TimeUnit>초</TimeUnit>
                {showTimeDropdown && (
                  <TimeDropdown>
                    {[20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map(
                      (time) => (
                        <TimeDropdownOption
                          key={time}
                          onClick={() => {
                            setRestTime(time);
                            setShowTimeDropdown(false);
                          }}
                          isSelected={restTime === time}
                        >
                          {time}초
                        </TimeDropdownOption>
                      )
                    )}
                  </TimeDropdown>
                )}
              </TimeInputWrapper>
            </RestTimeInputContainer>
          </RestTimeSection>
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
