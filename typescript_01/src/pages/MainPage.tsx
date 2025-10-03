import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import Header from "../components/Header";
import Footer from "../components/Footer";
import InjuryPieChart from "../components/InjuryPieChart";
import InjuryCauseBarChart from "../components/InjuryCauseBarChart";
import styled, { keyframes, css } from "styled-components";

const CARD_WIDTH = 300; // 카드 너비
const CARD_HEIGHT = 400; // 카드 높이
const CARD_GAP = 50;    // 카드 간격
const VISIBLE_CARDS = 3; // 화면에 보여질 카드 수

const Container = styled.div`
  margin: 0 auto;
  padding: 0;
  text-align: center;
`;

const CardSection = styled.div`
  position: relative;
  width: 60%; /* 화면에 보여질 카드 영역 */
  height: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  margin: 50px auto;
`;

interface CardContainerProps {
  activeIndex: number;
}

const CardContainer = styled.div<{ activeIndex: number; transitionEnabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  transition: ${({ transitionEnabled }) => (transitionEnabled ? "transform 0.8s ease" : "none")};
  transform: ${({ activeIndex }) =>
    `translateX(calc(50% - ${CARD_WIDTH / 2}px - ${(CARD_WIDTH + CARD_GAP) * activeIndex}px))`};
  gap: ${CARD_GAP}px;
  overflow: visible;
`;


const Card = styled.div<{ active: boolean }>`
  flex: 0 0 ${CARD_WIDTH}px;
  width: ${CARD_WIDTH}px;
  height: ${CARD_HEIGHT}px;
  background: #f0f0f0;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 20px;
  /* 부드러운 scale, opacity 전환 */
  transition: transform 0.3s ease, opacity 0.3s ease;

  opacity: ${({ active }) => (active ? 1 : 0.6)};
  transform: ${({ active }) => `scale(${active ? 1.1 : 1})`};
`;

const ButtonSection = styled.div`
  margin-top: 70px;
  display: flex;
  justify-content: center; /* 왼쪽 정렬 */
  width: 100%;
  gap: 100px; /* 버튼 사이 간격 */
`;

const ButtonLeft = styled.button`
  padding: 10px 15px;
  background: #333;
  color: white;
  border: none;
  border-radius: 100%;
  cursor: pointer;

  &:hover {
    background: #555;
  }
`;

const ButtonRight = styled.button`
  padding: 10px 15px;
  background: #333;
  color: white;
  border: none;
  border-radius: 100%;
  cursor: pointer;

  &:hover {
    background: #555;
  }
`;


const MainHeader = styled.div`
  background: #d9d9d9;
  height: 500px;
  border-radius: 20px;
  margin: 10px;
  color: white;
  padding: 100px 200px;
  font-size: 50px;
  font-weight: bold;
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
`;

const StartButton = styled.button`
  background: linear-gradient(135deg, #860000 0%, #a00000 100%);
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 50px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  margin-top: 30px;
  transition: all 0.3s ease;
  box-shadow: 0 5px 5px rgba(133, 0, 0, 0.3);

  &:hover {
    background: linear-gradient(135deg, #6b0000 0%, #8b0000 100%);
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const SectionTitle = styled.h2`
  font-size: 35px;
  text-align: center;
  margin-bottom: 50px;
  color: #333;
`;

const SectionDiv = styled.div`
  width: 100%;
  height: auto;
  margin-top: 500px;
`;

const ChartRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 40px;
  margin: 50px 0;
`;

const ChartBox = styled.div`
  width: 80%;
  height:500px;
  display: flex;
  flex-direction: column;
  align-items: center;

  p {
    width: 90%;
  }
`;

const ChartRightBox = styled.div`
  width: 80%;
  display: flex;
  margin-right: 50px;
  align-items: center;
  text-align: right;
`;

const ChartLeftBox = styled.div`
  width: 80%;
  display: flex;
  margin-left: 50px;
  align-items: center;
  text-align: left;
`;

const ExerciseVidoe = styled.div`
  background: #d9d9d9;
  padding: 100px 0;
`;

const Video = styled.video`
  width: 800px;
  height: 500px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.8);
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  margin: 30px 0 100px 0;
`;

const FeatureItemLeft = styled.div`
  background: #860000;
  color: white;
  font-size: 18px;
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: 20px;
  border-radius: 0 100px 100px 0;
  width: 80%;
  height: 160px;
  align-self: flex-start;
`;

const FeatureItemRight = styled.div`
  background: #f2f2f2;
  font-size: 18px;
  display: flex;
  flex-direction: column;
  text-align: right;
  padding: 20px;
  border-radius: 100px 0 0 100px;
  width: 80%;
  height: 160px;
  align-self: flex-end;
  align-items: flex-end;
`;

const FeatureItemTitle = styled.h1`
  margin: 10px 0;
  font-size: 30px;
  font-weight: bold;
`;

const FeatureItemLeftText = styled.p`
  margin: 0;
  font-size: 16px;
  width: 90%;
`;

const FeatureItemRightText = styled.p`
  margin: 0;
  font-size: 16px;
  width: 90%;
  text-align: right;
`;

// 애니메이션 정의
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ChartRowAnimated = styled.div<{ inview: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 40px;
  margin: 50px 0;
  opacity: 0;
  transform: translateY(50px);
  min-width: 300px; /* 최소 width 추가 */
  ${({ inview }) =>
    inview &&
    css` 
      animation: ${fadeIn} 1s forwards;
    `}
`;

const MainPage = () => {
  
  const { ref: pieRef, inView: pieInView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const { ref: barRef, inView: barInView } = useInView({ triggerOnce: true, threshold: 0.3 });

  const exercises = ["플랭크", "스쿼트", "푸쉬업","런지","버피테스트"];


const [cards, setCards] = useState(exercises);
const [activeIndex, setActiveIndex] = useState(1); // 가운데 카드
const [isAnimating, setIsAnimating] = useState(false);
const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);

  const navigate = useNavigate();

  const handleStartWorkout = () => {
    navigate('/bodyAnalysis');
  };

  // 카드 클릭
const handleCardClick = (index: number) => {
  setCards((prev) => {
    const newArr = [...prev];
    // 클릭한 카드가 가운데(activeIndex=1)가 되도록 회전
    while (index !== activeIndex) {
      if (index < activeIndex) {
        const last = newArr.pop()!;
        newArr.unshift(last);
        index++;
      } else {
        const first = newArr.shift()!;
        newArr.push(first);
        index--;
      }
    }
    return newArr;
  });

  navigate('/camera');
};

const prevCard = () => {
  setActiveIndex(prev => (prev === 0 ? exercises.length - 1 : prev - 1));
};

const nextCard = () => {
  setActiveIndex(prev => (prev === exercises.length - 1 ? 0 : prev + 1));
};


  return (
    <Container>
      <Header />
      <MainHeader>
        <p>언제나 어디서나,<br/>정확한 자세</p>
        <StartButton onClick={handleStartWorkout}>운동 시작하기</StartButton>
      </MainHeader>
      
<CardSection>
<CardContainer activeIndex={activeIndex} transitionEnabled={isTransitionEnabled}>
  {cards.map((exercise, index) => (
    <Card 
      key={index} 
      active={index === activeIndex} // 중앙 카드만 active
    >
      {exercise}
    </Card>
  ))}
</CardContainer>

  <ButtonSection>
    <ButtonLeft onClick={prevCard}>◀</ButtonLeft>
    <ButtonRight onClick={nextCard}>▶</ButtonRight>
  </ButtonSection>
</CardSection>


      <SectionDiv style={{ width: '100%', height: 'auto' }}>
        <SectionTitle>부상원인</SectionTitle>
        <ChartRowAnimated ref={pieRef} inview={pieInView}>
          <ChartBox>
            {pieInView && <InjuryPieChart />}
          </ChartBox>
        </ChartRowAnimated>
          <ChartRightBox>
            <p>
              스포츠안전재단의 연구에 따르면, 운동을 하는 사람 중 약 60%가 한 번 이상 부상을 경험한 것으로 나타났습니다. 
              이러한 부상은 잘못된 자세나 과도한 운동 등 다양한 원인으로 발생하며, 꾸준한 자세 교정과 안전한 운동 습관이 중요함을 보여줍니다. 
              우리 프로그램은 이러한 부상을 예방하고, 안전하게 운동할 수 있도록 돕습니다.
            </p>
          </ChartRightBox>


        <ChartRow>
          <ChartLeftBox>
            <p> 
              특히 '무리한 동작'과 '충돌'로 인한 부상이 전체 부상의 절반 이상을 차지하며, 
              운동 중 부상의 위험이 매우 높다는 것을 보여줍니다. 
              따라서 실시간 자세 교정과 안전한 운동 습관을 지원하는 우리 프로그램은 
              사용자가 부상을 예방하고 더욱 효과적으로 운동할 수 있도록 꼭 필요한 도구입니다.
            </p>
          </ChartLeftBox>
  <ChartRowAnimated ref={barRef} inview={barInView} style={{ minWidth: "500px", minHeight: "500px" }}>
    <ChartBox style={{ minHeight: "500px" }}>
      { barInView && <InjuryCauseBarChart /> }
    </ChartBox>
  </ChartRowAnimated>
        </ChartRow>
      </SectionDiv>

      <SectionDiv>
        <ExerciseVidoe>
        <SectionTitle>자세 분석 영상</SectionTitle>
        <Video controls>
          <source src="your-video-file.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </Video>
        </ExerciseVidoe>
      </SectionDiv>

      <SectionDiv>
        <SectionTitle>주요기능</SectionTitle>
        <FeatureList>
          <FeatureItemLeft>
            <FeatureItemTitle>실시간 자세교정</FeatureItemTitle>
            <FeatureItemLeftText>
              사용자가 운동을 하는 동안 카메라를 통해 실시간으로 자세를 분석합니다. 잘못된 동작이 감지되면 즉시 시각적, 청각적 알림을 제공하여 올바른 자세를 유지하도록 돕습니다. 
              이를 통해 운동 효과를 극대화하고, 반복적인 잘못된 자세로 인한 부상을 예방할 수 있습니다.
            </FeatureItemLeftText>
          </FeatureItemLeft>
          <FeatureItemRight>
            <FeatureItemTitle>운동별 자세 가이드</FeatureItemTitle>
            <FeatureItemRightText>
              각 운동 종목마다 단계별로 올바른 자세와 주의해야 할 점을 상세하게 안내합니다. 텍스트, 이미지, 영상 등 다양한 방식으로 구성되어 있어 초보자도 쉽게 따라할 수 있으며, 올바른 동작 습관을 빠르게 익힐 수 있습니다. 
              또한 반복 학습을 통해 자신만의 정확한 자세를 구축할 수 있습니다.
            </FeatureItemRightText>
          </FeatureItemRight>
          <FeatureItemLeft>
            <FeatureItemTitle>체형 분석</FeatureItemTitle>
            <FeatureItemLeftText>
              사용자의 신체 구조와 체형을 분석하여, 개인에게 가장 적합한 운동 방법과 자세를 추천합니다. 예를 들어 상체가 발달한 사람과 하체가 발달한 사람에게 맞는 운동 루틴과 자세 포인트를 제시하여, 보다 효율적으로 목표를 달성할 수 있도록 도와줍니다. 
              이 기능은 운동의 효율성을 높이고 부상 가능성을 최소화하는 데 큰 역할을 합니다.
            </FeatureItemLeftText>
          </FeatureItemLeft>
          <FeatureItemRight>
            <FeatureItemTitle>개인 맞춤 루틴 추천</FeatureItemTitle>
            <FeatureItemRightText>
              사용자의 운동 목표, 현재 체형, 운동 난이도, 이전 운동 기록 등을 종합적으로 분석하여 최적화된 맞춤형 운동 루틴을 제공합니다. 
              초보자부터 전문가까지 수준에 맞는 계획을 제시하며, 꾸준한 운동을 위한 일정 관리와 목표 달성 피드백도 포함되어 있어 장기적인 운동 습관 형성에 도움을 줍니다.
            </FeatureItemRightText>
          </FeatureItemRight>
        </FeatureList>
      </SectionDiv>
      <Footer />
    </Container>
  );
}

export default MainPage;