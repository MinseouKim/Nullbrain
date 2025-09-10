import React, { useState } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterTabs from './components/FilterTabs';
import ExerciseCard from './components/ExerciseCard';
import ExerciseModal from './components/ExerciseModal';
import './App.css';
import { EXERCISE_DETAILS, type ExerciseDetail } from './data'; 


function App() {
  // 모달의 열림/닫힘 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 모달에 보여줄 운동 데이터
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null);

  // 운동 카드를 클릭했을 때 모달을 열고 데이터 설정
  const handleCardClick = (exerciseId: number) => {
    const exercise = EXERCISE_DETAILS.find(ex => ex.id === exerciseId);
    if (exercise) {
      setSelectedExercise(exercise);
      setIsModalOpen(true);
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExercise(null); // 모달 닫을 때 선택된 운동 정보 초기화
  };

  return (
    <div className="container">
      <Header />
      <main>
        <SearchBar />
        <FilterTabs />
        <div className="sort-bar">
          <span className="sort-label">정렬</span>
        </div>
        <div className="exercise-grid">
          {EXERCISE_DETAILS.map((exercise) => ( // [변경] EXERCISE_DETAILS 데이터 사용
            <ExerciseCard
              key={exercise.id}
              name={exercise.name}
              onClick={() => handleCardClick(exercise.id)} // [추가] 클릭 이벤트 핸들러
            />
          ))}

          {/* '추가 예정' 카드를 div로 직접 만듭니다. */}
          <div className="exercise-card">
            <div className="image-placeholder">
              {'추가 예정'}
            </div>
          </div>
        </div>
      </main>

      {/* 모달 컴포넌트 렌더링 */}
      <ExerciseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        exercise={selectedExercise}
      />
    </div>
  );
}

export default App;