import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 1000;
  display: flex;
  padding: 20px;
  overflow-y: auto; /* Allow scrolling if content is too tall */

  justify-content: center;
  align-items: center; 

  /* Small screens only: Align to top */
  @media (max-width: 768px)
    align-items: flex-start; 
  }
`;
const ModalContent = styled.form`
  background: #fff;
  padding: 30px 40px;
  border-radius: 20px;
  width: 100%;
  max-width: 500px; 
  position: relative;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
  margin-top: 5vh; 
  margin-bottom: 5vh; 
  max-height: 90vh; 
  overflow-y: auto; 


  @media (max-width: 768px) 
    max-width: 90%; 
    padding: 25px 30px;
  }

  @media (max-width: 480px) { 
    max-width: 95%; /
    padding: 20px 15px; 
    margin-top: 2vh;
    margin-bottom: 2vh;
  }
`;
const BackButton = styled.button`
  position: absolute;
  top: 15px;
  left: 20px;
  background: none;
  border: none;
  font-size: 2.5rem;
  font-weight: bold;
  color: #aaa;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: all 0.2s;
  &:hover {
    color: #333;
    transform: scale(1.1);
  }
  @media (max-width: 480px) {
    font-size: 2rem; 
    top: 10px; 
    left: 15px;
  }
`;
const Title = styled.h2`
  text-align: center;
  margin: 0 0 30px;
  color: #333;
  @media (max-width: 480px) {
    font-size: 1.3rem; 
    margin-bottom: 20px; 
  }
`;
const InputGroup = styled.div`
  margin-bottom: 20px;
`;
const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;
const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #850000;
    box-shadow: 0 0 0 3px rgba(133, 0, 0, 0.1);
  }
  @media (max-width: 480px) {
    padding: 10px 12px; 
    font-size: 0.9rem;
  }
`;
const GenderSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;
const GenderButton = styled.button<{ $selected?: boolean }>`
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$selected ? "#850000" : "#ccc")};
  background: ${(p) => (p.$selected ? "#850000" : "#fff")};
  color: ${(p) => (p.$selected ? "#fff" : "#555")};
  font-weight: 600;
  cursor: pointer;
  &:hover {
    border-color: #850000;
  }
  @media (max-width: 480px) {
    padding: 10px;
    font-size: 0.9rem;
  }
`;
const StartButton = styled.button`
  width: 100%;
  padding: 15px;
  margin-top: 20px;
  background: linear-gradient(135deg, #850000, #a00000);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(133, 0, 0, 0.3);
  }
  @media (max-width: 480px) {
    padding: 12px;
    font-size: 1rem;
  }
`;

export interface BodyDataForStart {
  height: number;
  weight: number;
  gender: "male" | "female";
  age: number;
}
type Props = {
  isOpen: boolean;
  onStart: (data: BodyDataForStart) => void;
  onClose?: () => void;
};

const BodyAnalysisModal: React.FC<Props> = ({ isOpen, onStart }) => {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const navigate = useNavigate();

  if (!isOpen) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!height || !weight || !age) {
      alert("모든 정보를 입력해주세요.");
      return;
    }
    onStart({ height: +height, weight: +weight, age: +age, gender });
  };

  const handleGoBack = () => {
    navigate('/main');
  };

  return (
    <ModalOverlay>
      <ModalContent onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <BackButton type="button" onClick={handleGoBack}>&larr;</BackButton>
        <Title>신체 정보 입력</Title>
        <InputGroup>
          <Label htmlFor="h">키 (cm)</Label>
          <Input id="h" type="number" inputMode="numeric" min={50} max={250}
                 value={height} onChange={(e) => setHeight(e.target.value)} placeholder="예: 175" required />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="w">몸무게 (kg)</Label>
          <Input id="w" type="number" inputMode="numeric" min={20} max={300}
                 value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="예: 70" required />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="a">나이</Label>
          <Input id="a" type="number" inputMode="numeric" min={5} max={100}
                 value={age} onChange={(e) => setAge(e.target.value)} placeholder="예: 30" required />
        </InputGroup>
        <InputGroup>
          <Label>성별</Label>
          <GenderSelector>
            <GenderButton type="button" $selected={gender === "male"} onClick={() => setGender("male")}>남성</GenderButton>
            <GenderButton type="button" $selected={gender === "female"} onClick={() => setGender("female")}>여성</GenderButton>
          </GenderSelector>
        </InputGroup>
        <StartButton type="submit">분석 시작하기</StartButton>
      </ModalContent>
    </ModalOverlay>
  );
};
export default BodyAnalysisModal;