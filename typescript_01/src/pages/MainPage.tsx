import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import InjuryPieChart from "../components/InjuryPieChart";
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
  font-size: 24px;
  text-align: center;
  margin-bottom: 50px;
  margin-top: 300px;
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
  margin: 20px 0;
`;

const FeatureItemLeft = styled.div`
  background: #860000;
  font-size: 18px;
  display: flex;
  flex-direction: column;
  text-align: left;
  padding : 20px;
  border-radius: 0 100px 100px 0;
  width: 80%;
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
  align-self: flex-end;
`;

const FeatureItemTitle = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: bold;]
`;

const FeatureItemText = styled.p`
  margin: 0;
  font-size: 16px;
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
      <div>
        <SectionTitle>부상원인</SectionTitle>
        <InjuryPieChart />
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
            <FeatureItemTitle>기능1</FeatureItemTitle>
            <FeatureItemText>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sequi voluptatem nobis inventore architecto totam? Ad, numquam nobis, sapiente quibusdam voluptatibus voluptatem sed ipsa nostrum similique praesentium quis error id sunt!
            </FeatureItemText>
          </FeatureItemLeft>
          <FeatureItemRight>
            <FeatureItemTitle>기능2</FeatureItemTitle>
            <FeatureItemText>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sequi voluptatem nobis inventore architecto totam? Ad, numquam nobis, sapiente quibusdam voluptatibus voluptatem sed ipsa nostrum similique praesentium quis error id sunt!
            </FeatureItemText>
          </FeatureItemRight>
          <FeatureItemLeft>
            <FeatureItemTitle>기능3</FeatureItemTitle>
            <FeatureItemText>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sequi voluptatem nobis inventore architecto totam? Ad, numquam nobis, sapiente quibusdam voluptatibus voluptatem sed ipsa nostrum similique praesentium quis error id sunt!
            </FeatureItemText>
          </FeatureItemLeft>
          <FeatureItemRight>
            <FeatureItemTitle>기능4</FeatureItemTitle>
            <FeatureItemText>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sequi voluptatem nobis inventore architecto totam? Ad, numquam nobis, sapiente quibusdam voluptatibus voluptatem sed ipsa nostrum similique praesentium quis error id sunt!
            </FeatureItemText>
          </FeatureItemRight>
        </FeatureList>
      </div>
      <Footer />
    </Container>
  );
}

export default MainPage;
