import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
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
  margin: 32px 0;
`;

const Card = styled.div`
  background: #f5f5f5;
  border-radius: 16px;
  width: 120px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
`;

const MainHeader = styled.div`
  background: #f2f2f2;
  border-radius: 20px;
  margin: 10px;
  color: black;
  padding: 100px 200px;
  font-size: 50px;
  font-weight: bold;
  text-align: left;
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
  margin-bottom: 10px;
  margin-top: 30px;
`;

const Video = styled.video`
  width: 60%;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.8);
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
`;

const FeatureItemRight = styled.div`
  background: #860000;
  font-size: 18px;
  display: flex;
  text-align: left;
  padding : 10px 20px;
  border-radius: 0 100px 100px 0;
  width: 80%;
`;

const FeatureItemLeft = styled.div`
  background: #f2f2f2;
  font-size: 18px;
  display: flex;
  text-align: right;
  padding : 10px 20px;
  border-radius: 100px 0 0 100px;
  width: 80%;
`;

function MainPage() {
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
          <FeatureItemRight>기능1</FeatureItemRight>
          <FeatureItemLeft>기능2</FeatureItemLeft>
          <FeatureItemRight>기능3</FeatureItemRight>
          <FeatureItemLeft>기능4</FeatureItemLeft>
        </FeatureList>
      </div>
      <Footer />
    </Container>
  );
}

export default MainPage;
