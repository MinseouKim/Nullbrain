import React from 'react';
import styled from 'styled-components';

// 스타일 컴포넌트
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 40px 50px;
  border-radius: 20px;
  width: 100%;
  max-width: 450px;
  text-align: center;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
`;

const Icon = styled.div`
  font-size: 4rem;
  line-height: 1;
`;

const Title = styled.h2`
  margin: 10px 0 0;
  color: #333;
  font-size: 1.8rem;
`;

const Message = styled.p`
  margin: 0 0 20px;
  color: #666;
  font-size: 1rem;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #850000, #a00000);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(133, 0, 0, 0.4);
  }
`;

// Props 타입 정의
interface CompletionModalProps {
  isOpen: boolean;
  onNavigate: () => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({ isOpen, onNavigate }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay>
      <ModalContent>
        <Icon>✅</Icon>
        <Title>체형 분석 완료!</Title>
        <Message>이제 측정된 정보를 바탕으로 운동을 시작할 수 있습니다.</Message>
        <ActionButton onClick={onNavigate}>
          운동 시작하기
        </ActionButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CompletionModal;