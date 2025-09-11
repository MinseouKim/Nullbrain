import React from "react";
import styled from "styled-components";


interface ExerciseCardProps {
  name: string;
  onClick: () => void;
}

// 카드 전체
const Card = styled.div`
  border-radius: 15px;
  background-color: #f1f1f1;
  text-align: center;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const CardContainer = styled.div`
  display: flex;         /* 가로 정렬 */
  flex-wrap: wrap;       /* 공간이 부족하면 다음 줄로 넘김 */
  gap: 20px;             /* 카드 사이의 간격 */
  padding: 20px;         /* 컨테이너 안쪽 여백 */
`;

// 이미지 영역
const ImagePlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  width: 100%;
  color: #333;
  font-size: 2.5rem;
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

const ExerciseCard = ({ name, onClick }: ExerciseCardProps) => {
  return (
    <Card onClick={onClick}>
      <ImagePlaceholder>사진</ImagePlaceholder>
      <CardName>{name}</CardName>
    </Card>
  );
};

export { CardContainer };
export default ExerciseCard;
