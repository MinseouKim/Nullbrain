import React from "react";
import styled from "styled-components";

interface ExerciseCardProps {
  name: string;
  onClick: () => void;
  imageUrl?: string;
}

const Card = styled.div`
  border-radius: 15px;
  background-color: #fff;
  text-align: center;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 250px;
  object-fit: cover;
  display: block;
  background-color: #f0f0f0;
`;

const ImagePlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  width: 100%;
  color: #888;
  font-size: 1.1rem;
  font-weight: 500;
  background-color: #f8f9fa;
`;

const CardName = styled.p`
  padding: 15px;
  font-size: 1.1rem;
  font-weight: 550;
  margin: 0;
  background-color: #ddd;
  color: #333;
`;

const ExerciseCard = ({ name, onClick, imageUrl }: ExerciseCardProps) => {
  return (
    <Card onClick={onClick}>
      {imageUrl ? (
        <CardImage src={imageUrl} alt={name} />
      ) : (
        <ImagePlaceholder>사진 준비중</ImagePlaceholder>
      )}
      <CardName>{name}</CardName>
    </Card>
  );
};

export default ExerciseCard;