import React, { useState } from 'react';
import styled from 'styled-components';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ExerciseCard from '../components/ExerciseCard';
import ExerciseModal from '../components/ExerciseModal';
import { EXERCISE_DETAILS, type ExerciseDetail } from '../datas/data'; 

const Container = styled.div`
  padding: 0;
  margin: 0;
  height: 100vh;
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 30px auto;
  display: flex;
`;

const SortBar = styled.div`
  gap: 15px;
  margin: 20px;
`;

const SortLabel = styled.span`
  background-color: #333;
  color: white;
  padding: 5px 12px;
  border-radius: 5px;
  font-weight: bold;
`;

const ExerciseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
`;

const ExerciseCardBox = styled.div`
  border-radius: 15px;
  background-color: #f1f1f1;
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
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null);

  const [activeTab, setActiveTab] = useState('전체');
  const tabs = ['전체', '상체', '하체', '전신', '유산소'];
  
  const handleCardClick = (exerciseId: number) => {
    const exercise = EXERCISE_DETAILS.find(ex => ex.id === exerciseId);
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
        <div className="search-bar">
          <input type="text" placeholder="어떤 운동 자세가 궁금하신가요?" />
          <button>🔍</button>
        </div>
        <div className="filter-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <SortBar>
          <SortLabel>정렬</SortLabel>
        </SortBar>
        <ExerciseGrid>
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
        </ExerciseGrid>
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
