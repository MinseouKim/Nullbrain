import React, { useState } from "react";
import styled from "styled-components";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ExerciseCard, { CardContainer } from "../components/ExerciseCard";
import ExerciseModal from "../components/ExerciseModal";
import { EXERCISE_DETAILS, type ExerciseDetail } from "../datas/data";

const Container = styled.div`
  padding: 0;
  margin: 0;
  min-height: 100vh;
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 30px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SearchBar = styled.div`
  position: relative;
  max-width: 800px;
  width: 100%;
  margin: 20px auto;

  input {
    width: 100%;
    padding: 15px 25px;
    border: 2px solid #000;
    border-radius: 30px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  button {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px; 
  justify-content: center;
`;

const FilterButton = styled.button<{ active?: boolean }>`
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: ${({ active }) => (active ? "#9d2020" : "#f1f1f1")};
  color: ${({ active }) => (active ? "#fff" : "#000")};
  font-weight: ${({ active }) => (active ? "bold" : "normal")};
  cursor: pointer;
  font-size: 1rem;
`;

/* 정렬 */
const SortBar = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 20px;
`;

const SortLabel = styled.span`
  background: #333;
  color: white;
  padding: 5px 12px;
  border-radius: 5px;
  font-weight: bold;
`;

/* 운동 카드 */
const ExerciseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
`;

const ExerciseCardBox = styled.div`
  border-radius: 15px;
  background: #f1f1f1;
  text-align: center;
  overflow: hidden;
`;

const ImagePlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  width: 100%;
  color: #333;
  font-size: 2.5rem;
  font-weight: bold;
`;

const ExerciseItems = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseDetail | null>(null);

  const [activeTab, setActiveTab] = useState("전체");
  const tabs = ["전체", "상체", "하체", "전신", "유산소"];

  const handleCardClick = (exerciseId: number) => {
    const exercise = EXERCISE_DETAILS.find((ex) => ex.id === exerciseId);
    if (exercise) {
      setSelectedExercise(exercise);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExercise(null);
  };

  return (
    <>
      <Header />
      <Container>
        <Main>
          <SearchBar>
            <input type="text" placeholder="어떤 운동 자세가 궁금하신가요?" />
            <button>🔍</button>
          </SearchBar>

          <FilterTabs>
            {tabs.map((tab) => (
              <FilterButton
                key={tab}
                active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </FilterButton>
            ))}
          </FilterTabs>

          <SortBar>
            <SortLabel>정렬(오름차순, 내림차순, 최신순)</SortLabel>
          </SortBar>

          <CardContainer>
            {EXERCISE_DETAILS.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                name={exercise.name}
                onClick={() => handleCardClick(exercise.id)}
              />
            ))}
            <ExerciseCardBox>
              <ImagePlaceholder>추가 예정</ImagePlaceholder>
            </ExerciseCardBox>
          </CardContainer>
        </Main>

        <ExerciseModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          exercise={selectedExercise}
        />
      </Container>
      <Footer />
    </>
  );
};

export default ExerciseItems;
