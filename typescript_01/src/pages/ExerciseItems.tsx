import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ExerciseCard from '../components/ExerciseCard';
import ExerciseModal from '../components/ExerciseModal';
import { EXERCISE_DETAILS, type ExerciseDetail } from '../datas/data';

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
  gap: 15px;
  margin-bottom: 30px; 
  justify-content: center;
`;

  const FilterButton = styled.button<{ active?: boolean }>`
    min-width: 120px;
    padding: 12px 20px;
    border: 1px solid #ddd;
    border-radius: 25px;
    background: ${({ active }) => (active ? "#9d2020" : "#f1f1f1")};
    color: ${({ active }) => (active ? "#fff" : "#000")};
    font-weight: ${({ active }) => (active ? "bold" : "normal")};
    cursor: pointer;
    font-size: 1rem;
    text-align: center;
    transition: all 0.2s ease;

    &:hover {
      background-color: ${({ active }) => (active ? '#7a1919' : '#e0e0e0')};
    }
  `;

const SortBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 20px 20px;
  align-self: flex-end;
`;

const SortButton = styled.button<{ active?: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${({ active }) => (active ? '#9d2020' : '#ddd')};
  border-radius: 20px;
  background: ${({ active }) => (active ? '#9d2020' : 'white')};
  color: ${({ active }) => (active ? 'white' : 'black')};
  font-weight: ${({ active }) => (active ? 'bold' : 'normal')};
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background-color: #f1f1f1;
    border-color: #ccc;
  }
`;

const ExerciseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
  gap: 25px;
  width: 100%; 
  padding: 0 20px; 
  box-sizing: border-box; 
`;

const ExerciseItems = () => {
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null);
  
  // 필터 및 정렬 상태
  const [activeTab, setActiveTab] = useState('전체');
  const [sortOrder, setSortOrder] = useState('latest');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = ['전체', '상체', '하체', '전신', '유산소'];

  // 모달 핸들러
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

  // 1. 검색어 기준으로 1차 필터링
  const searchedExercises = useMemo(() => {
    if (!searchTerm) {
      return EXERCISE_DETAILS;
    }
    return EXERCISE_DETAILS.filter(exercise =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // 2. 카테고리 기준으로 2차 필터링
  const filteredExercises = useMemo(() => {
    if (activeTab === '전체') {
      return searchedExercises;
    }
    return searchedExercises.filter(exercise => exercise.category === activeTab);
  }, [searchedExercises, activeTab]);

  // 3. 최종 정렬
  const sortedExercises = useMemo(() => {
    const sortableExercises = [...filteredExercises];
    switch (sortOrder) {
      case 'ascending':
        return sortableExercises.sort((a, b) => a.name.localeCompare(b.name));
      case 'descending':
        return sortableExercises.sort((a, b) => b.name.localeCompare(a.name));
      case 'popular':
        return sortableExercises.sort((a, b) => b.popularity - a.popularity);
      case 'latest':
      default:
        return sortableExercises.sort((a, b) => b.id - a.id);
    }
  }, [filteredExercises, sortOrder]);

  const sortOptions = [
    { key: 'latest', label: '최신순' },
    { key: 'popular', label: '인기순' },
    { key: 'ascending', label: '오름차순' },
    { key: 'descending', label: '내림차순' },
  ];

  return (
    <>
      <Header />
      <Container>
        <Main>
          <SearchBar>
            <input
              type="text"
              placeholder="어떤 운동 자세가 궁금하신가요?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button>🔍</button>
          </SearchBar>

          <FilterTabs>
            {tabs.map((tab) => (
              <FilterButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                {tab}
              </FilterButton>
            ))}
          </FilterTabs>

          <SortBar>
            {sortOptions.map(option => (
              <SortButton key={option.key} active={sortOrder === option.key} onClick={() => setSortOrder(option.key)}>
                {option.label}
              </SortButton>
            ))}
          </SortBar>

          <ExerciseGrid>
            {sortedExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                name={exercise.name}
                imageUrl={exercise.imageUrl}
                onClick={() => handleCardClick(exercise.id)}
              />
            ))}
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