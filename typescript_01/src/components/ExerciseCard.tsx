// src/components/ExerciseCard.tsx 또는 ExerciseCard.js
import React from "react";
import styled from "styled-components";

interface ExerciseCardProps {
  name: string;
  onClick: () => void;
  imageUrl?: string; // 이미지 URL prop 추가
}

// 카드 전체
const Card = styled.div`
  border-radius: 15px;
  background-color: #f1f1f1;
  text-align: center;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 100%;
  &:hover {
    transform: translateY(-5px);
  }
`;

// 이미지 영역 (실제 이미지 렌더링)
const CardImage = styled.img`
  width: 100%;
  height: 250px;
  object-fit: cover;
  display: block;
  background-color: #ddd;
`;

// 이미지 없을 때 또는 로딩 중일 때 표시할 placeholder
const ImagePlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  width: 100%;
  color: #333;
  font-size: 1.5rem; /* 텍스트 크기 조정 */
  font-weight: bold;
  background-color: #ddd;
`;

// 이름 영역
const CardName = styled.p`
  padding: 15px;
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
  background-color: #ddd;
`;

const ExerciseCard = ({ name, onClick, imageUrl }: ExerciseCardProps) => {
  return (
    <Card onClick={onClick}>
      {imageUrl ? (
        <CardImage src={imageUrl} alt={name} />
      ) : (
        <ImagePlaceholder>사진 준비중</ImagePlaceholder> // 이미지가 없을 경우 표시
      )}
      <CardName>{name}</CardName>
    </Card>
  );
};

export default ExerciseCard;
