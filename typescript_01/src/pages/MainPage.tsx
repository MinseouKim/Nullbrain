import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import InjuryPieChart from "../components/InjuryPieChart";
import InjuryCauseBarChart from "../components/InjuryCauseBarChart";
import styled from "styled-components";

const Container = styled.div`
  margin: 0 auto;
  padding:0;
  text-align: center;
`;

const CardContainer = styled.div`
  display: flex;
  gap: 24px;
  justify-content: center;
  margin: 100px 0;
`;

const Card = styled.div`
  background: #f2f2f2;
  border-radius: 16px;
  width: 400px;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
`;

const MainHeader = styled.div`
  background: #f2f2f2;
  height: 500px;
  border-radius: 20px;
  margin: 10px;
  color: black;
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
  background-color: #860000;
  color: white;
  border: none;
  padding: 10px 30px;
  border-radius: 50px;
  cursor: pointer;
  font-size: 15px;
  font-weight: bold;
  margin-top: 30px;
`;

const SectionTitle = styled.h2`
  font-size: 35px;
  text-align: center;
  margin-bottom: 50px;
  margin-top: 300px;
`;

const ChartRow = styled.div`
  display: flex;
  flex-direction: row; /* 가로 정렬 */
  align-items: center;
  justify-content: center;
  gap: 40px;
  margin: 50px 0;
`;

const ChartBox = styled.div`
  width: 80%;
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

const Video = styled.video`
  width: 800px;
  height: 500px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.8);
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0 100px 0;
`;

const FeatureItemLeft = styled.div`
  background: #860000;
  color: white;
  font-size: 18px;
  display: flex;
  flex-direction: column;
  text-align: left;
  padding : 20px;
  border-radius: 0 100px 100px 0;
  width: 80%;
  height: 130px;
  align-self: flex-start;
`;

const FeatureItemRight = styled.div`
  background: #f2f2f2;
  font-size: 18px;
  display: flex;
  flex-direction: column;
  text-align: right;
  padding : 20px;
  border-radius: 100px 0 0 100px;
  width: 80%;
  height: 130px;
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

const FeatureItemRitghtText = styled.p`
  margin: 0;
  font-size: 16px;
  width: 90%;
  text-align: right;
`;

const MainPage = () => {
  return (
    <Container>
      <Header />
      <MainHeader>
        <p>언제나 어디서나,<br/>정확한 자세</p>
        <StartButton>운동 시작하기</StartButton>
      </MainHeader>
      <CardContainer>
        <Card>플랭크</Card>
        <Card>스쿼트</Card>
        <Card>푸쉬업</Card>
      </CardContainer>
      <div style={{ width: '100%', height: 'auto' }}>
      <SectionTitle>부상원인</SectionTitle>
      <ChartRow>
        <ChartBox>
          <InjuryPieChart />
        </ChartBox>
        <ChartRightBox>
          <p>
            스포츠안전재단의 연구에 따르면, 운동을 하는 사람 중 약 60%가 한 번 이상 부상을 경험한 것으로 나타났습니다. 
            이러한 부상은 잘못된 자세나 과도한 운동 등 다양한 원인으로 발생하며, 꾸준한 자세 교정과 안전한 운동 습관이 중요함을 보여줍니다. 
            우리 프로그램은 이러한 부상을 예방하고, 안전하게 운동할 수 있도록 돕습니다.
          </p>
        </ChartRightBox>
      </ChartRow>

      <ChartRow>
        <ChartLeftBox>
          <p>
            운동 중 발생하는 부상의 주요 원인은 
            '무리한 동작'(35.8%), '사람과의 충돌'(25%), '미끄러져 넘어짐'(21.3%), 
            '점프 후 착지 실수'(11.6%), '운동장비와의 충돌'(11.1%) 순으로 나타났습니다. 
            특히 '무리한 동작'과 '충돌'로 인한 부상이 전체 부상의 절반 이상을 차지하며, 
            운동 중 부상의 위험이 매우 높다는 것을 보여줍니다. 
            따라서 실시간 자세 교정과 안전한 운동 습관을 지원하는 우리 프로그램은 
            사용자가 부상을 예방하고 더욱 효과적으로 운동할 수 있도록 꼭 필요한 도구입니다.
          </p>
        </ChartLeftBox>
        <ChartBox>
          <InjuryCauseBarChart />
        </ChartBox>
      </ChartRow>
      </div>

      <div>
        <SectionTitle>자세 분석 영상</SectionTitle>
        <Video controls>
          <source src="your-video-file.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </Video>
      </div>
      <div>
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
            <FeatureItemRitghtText>
              각 운동 종목마다 단계별로 올바른 자세와 주의해야 할 점을 상세하게 안내합니다. 텍스트, 이미지, 영상 등 다양한 방식으로 구성되어 있어 초보자도 쉽게 따라할 수 있으며, 올바른 동작 습관을 빠르게 익힐 수 있습니다. 
              또한 반복 학습을 통해 자신만의 정확한 자세를 구축할 수 있습니다.
            </FeatureItemRitghtText>
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
            <FeatureItemRitghtText>
              사용자의 운동 목표, 현재 체형, 운동 난이도, 이전 운동 기록 등을 종합적으로 분석하여 최적화된 맞춤형 운동 루틴을 제공합니다. 
              초보자부터 전문가까지 수준에 맞는 계획을 제시하며, 꾸준한 운동을 위한 일정 관리와 목표 달성 피드백도 포함되어 있어 장기적인 운동 습관 형성에 도움을 줍니다.
            </FeatureItemRitghtText>
          </FeatureItemRight>
        </FeatureList>
      </div>
      <Footer />
    </Container>
  );
}

export default MainPage;
