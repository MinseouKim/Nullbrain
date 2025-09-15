import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Styled Components
const MainPageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 60px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  animation: slideInUp 0.6s ease-out;

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 800;
  color: #333;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #850000 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: #666;
  margin-bottom: 40px;
  line-height: 1.6;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
`;

const StartButton = styled.button`
  background: linear-gradient(135deg, #850000 0%, #a00000 100%);
  color: white;
  border: none;
  padding: 20px 40px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(133, 0, 0, 0.3);
  min-width: 200px;

  &:hover {
    background: linear-gradient(135deg, #6b0000 0%, #8b0000 100%);
    transform: translateY(-3px);
    box-shadow: 0 12px 25px rgba(133, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const FeatureButton = styled.button`
  background: white;
  color: #850000;
  border: 2px solid #850000;
  padding: 20px 40px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;

  &:hover {
    background: #850000;
    color: white;
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(133, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const FeaturesList = styled.div`
  margin-top: 40px;
  text-align: left;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-size: 16px;
  color: #666;
`;

const FeatureIcon = styled.span`
  font-size: 20px;
  margin-right: 12px;
  color: #850000;
`;

const MainPage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartWorkout = () => {
    navigate('/camera');
  };

  const handleViewFeatures = () => {
    // 추후 기능 구현
    alert('추후 구현될 기능입니다.');
  };

  return (
    <MainPageContainer>
      <ContentCard>
        <Title>자세온</Title>
        <Subtitle>
          AI 기반 운동 자세 분석으로<br />
          더 정확하고 안전한 운동을 시작하세요
        </Subtitle>
        
        <ButtonContainer>
          <StartButton onClick={handleStartWorkout}>
            운동 시작하기
          </StartButton>
          <FeatureButton onClick={handleViewFeatures}>
            기능 둘러보기
          </FeatureButton>
        </ButtonContainer>

        <FeaturesList>
          <FeatureItem>
            <FeatureIcon>🎯</FeatureIcon>
            실시간 자세 분석 및 피드백
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>⏱️</FeatureIcon>
            정확한 운동 시간 측정
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>📊</FeatureIcon>
            상세한 운동 통계 제공
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>🏆</FeatureIcon>
            개인 맞춤형 운동 계획
          </FeatureItem>
        </FeaturesList>
      </ContentCard>
    </MainPageContainer>
  );
};

export default MainPage;
