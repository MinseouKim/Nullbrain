import React from 'react';
import { type ExerciseDetail } from '../datas/data'; // 운동 상세 데이터 타입 불러오기

interface ExerciseModalProps {
  isOpen: boolean; // 모달이 열려있는지 여부
  onClose: () => void; // 모달을 닫는 함수
  exercise: ExerciseDetail | null; // 현재 선택된 운동 상세 정보
}

const ExerciseModal = ({ isOpen, onClose, exercise }: ExerciseModalProps) => {
  if (!isOpen || !exercise) {
    return null; // 모달이 닫혀있거나 운동 정보가 없으면 아무것도 렌더링하지 않음
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* 모달 좌측: 운동 부위 사진 */}
        <div className="modal-image-section">
          <img src={exercise.image} alt={exercise.name} />
        </div>

        {/* 모달 우측: 상세 설명 */}
        <div className="modal-details-section">
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
          <h2>{exercise.name}</h2>
          
          {/* 자극 부위 */}
          <div className="detail-item">
            <h3>자극 부위</h3>
            <ul>
              {exercise.stimulationArea.map((area, index) => (
                <li key={index}>{area}</li>
              ))}
            </ul>
          </div>

          {/* 효과 */}
          <div className="detail-item">
            <h3>효과</h3>
            <ul>
              {exercise.effect.map((eff, index) => (
                <li key={index}>{eff}</li>
              ))}
            </ul>
          </div>

          {/* 주의사항 */}
          <div className="detail-item">
            <h3>주의사항</h3>
            <ul>
              {exercise.caution.map((cau, index) => (
                <li key={index}>{cau}</li>
              ))}
            </ul>
          </div>

          {/* 하단 버튼 */}
          <div className="modal-actions">
            <button className="modal-start-button">운동 시작하기</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseModal;