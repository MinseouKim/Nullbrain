import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { type ExerciseDetail } from "../datas/data";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  padding: 40px;
  border-radius: 20px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;

  display: grid;
  grid-template-areas:
    "image info"
    "action action";
  grid-template-columns: 1fr 1.2fr;
  gap: 30px 40px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 2rem;
  font-weight: bold;
  color: #555;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.2);
  }
`;

const ImageSection = styled.div`
  grid-area: image;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 0;

  h2 {
    margin-top: 0;
    margin-bottom: 20px;
    flex-shrink: 0;
  }

  img {
    width: 100%;
    flex: 1;
    max-width: 300px;
    border-radius: 10px;
    object-fit: contain;
    min-height: 0;
  }
`;

const InfoSection = styled.div`
  grid-area: info;
`;

const DetailItem = styled.div`
  background-color: #f1f1f1;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 15px;

  h3 {
    margin: 0 0 10px 0;
    font-size: 1.1rem;
    font-weight: bold;
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }

  li {
    line-height: 1.6;
    color: #333;
  }
`;

const ActionSection = styled.div`
  grid-area: action;
  display: flex;
  justify-content: center;
  padding-top: 10px;
`;

const StartButton = styled.button`
  background-color: #9d2020;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 25px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  width: 50%;
  max-width: 300px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #7a1919;
  }
`;

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: ExerciseDetail | null;
}

const ExerciseModal = ({ isOpen, onClose, exercise }: ExerciseModalProps) => {
  const navigate = useNavigate();

  const handleStartWorkout = () => {
    if (!exercise) return;
    // 선택한 운동명을 camera 페이지로 전달 (기본 횟수/세트는 camera에서 설정)
    navigate("/camera", {
      state: {
        name: exercise.name,
        // reps/sets은 Camera 페이지에서 운동명으로 기본값을 계산
        category: exercise.category,
      },
    });
  };
  if (!isOpen || !exercise) {
    return null;
  }

  const handleStart = () => {
    handleStartWorkout();
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>

        <ImageSection>
          <h2>{exercise.name}</h2>
          <img src={exercise.imageUrl} alt={exercise.name} />
        </ImageSection>

        <InfoSection>
          <DetailItem>
            <h3>자극 부위</h3>
            <ul>
              {exercise.stimulationArea &&
                exercise.stimulationArea.map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
            </ul>
          </DetailItem>
          <DetailItem>
            <h3>효과</h3>
            <ul>
              {exercise.effect &&
                exercise.effect.map((eff, index) => <li key={index}>{eff}</li>)}
            </ul>
          </DetailItem>
          <DetailItem>
            <h3>주의사항</h3>
            <ul>
              {exercise.caution &&
                exercise.caution.map((cau, index) => (
                  <li key={index}>{cau}</li>
                ))}
            </ul>
          </DetailItem>
        </InfoSection>

        <ActionSection>
          <StartButton onClick={handleStartWorkout}>운동 시작하기</StartButton>
        </ActionSection>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ExerciseModal;
