import React from 'react';

interface ExerciseCardProps {
  name: string;
  onClick: () => void;
}

const ExerciseCard = ({ name, onClick }: ExerciseCardProps) => {
  return (
    <div className="exercise-card" onClick={onClick}>
      <div className="image-placeholder">
        {'사진'}
      </div>
      <p>{name}</p>
    </div>
  );
};

export default ExerciseCard;