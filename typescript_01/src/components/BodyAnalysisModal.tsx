import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// --- 스타일 컴포넌트 ---

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalContent = styled.form`
  background: white;
  padding: 30px 40px;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 2rem;
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
`;

const Title = styled.h2`
  text-align: center;
  margin-top: 0;
  margin-bottom: 30px;
  color: #333;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #850000;
    box-shadow: 0 0 0 3px rgba(133, 0, 0, 0.1);
  }
`;

const GenderSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const GenderButton = styled.button<{ selected?: boolean }>`
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${(props) => (props.selected ? '#850000' : '#ccc')};
  background-color: ${(props) => (props.selected ? '#850000' : 'white')};
  color: ${(props) => (props.selected ? 'white' : '#555')};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #850000;
  }
`;

const StartButton = styled.button`
  width: 100%;
  padding: 15px;
  margin-top: 20px;
  background: linear-gradient(135deg, #850000 0%, #a00000 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(133, 0, 0, 0.3);
  }
`;

// --- 인터페이스 ---

interface BodyDataForStart {
  height: number;
  weight: number;
  gender: 'male' | 'female';
  age: number;
}

interface BodyAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (data: BodyDataForStart) => void;
}

// --- 컴포넌트 ---

const BodyAnalysisModal: React.FC<BodyAnalysisModalProps> = ({ isOpen, onClose, onStart }) => {
  // 입력값 관리를 위한 state
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  // ESC 키로 모달을 닫는 기능
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // "분석 시작하기" 버튼 클릭 시 실행될 함수
  const handleStartAnalysis = (event: React.FormEvent) => {
    event.preventDefault(); // form의 기본 제출 동작 방지
    
    // 간단한 유효성 검사
    if (!height || !weight || !age) {
      alert('모든 정보를 입력해주세요.');
      return;
    }

    // 부모 컴포넌트로 데이터 전달
    onStart({
      height: Number(height),
      weight: Number(weight),
      age: Number(age),
      gender: gender,
    });
  };

  // 모달이 닫혀있으면 아무것도 렌더링하지 않음
  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()} onSubmit={handleStartAnalysis}>
        <CloseButton type="button" onClick={onClose}>&times;</CloseButton>
        <Title>신체 정보 입력</Title>

        <InputGroup>
          <Label htmlFor="height">키 (cm)</Label>
          <Input id="height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="예: 175" />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="weight">몸무게 (kg)</Label>
          <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="예: 70" />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="age">나이</Label>
          <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="예: 30" />
        </InputGroup>
        
        <InputGroup>
          <Label>성별</Label>
          <GenderSelector>
            <GenderButton type="button" selected={gender === 'male'} onClick={() => setGender('male')}>남성</GenderButton>
            <GenderButton type="button" selected={gender === 'female'} onClick={() => setGender('female')}>여성</GenderButton>
          </GenderSelector>
        </InputGroup>

        <StartButton type="submit">
          분석 시작하기
        </StartButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default BodyAnalysisModal;