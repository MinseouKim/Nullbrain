import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BodyTypeLineChart from "../components/BodyTypeLineChart";
import styled from "styled-components";

const Container = styled.div`
  margin: 0 auto;
  min-height: 100vh;
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 24px;
  color: #333;
`;

const HeaderSection = styled.div`
  margin-bottom: 20px;
  margin-top: 30px;
  width: 100%;
  font-size: 30px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid #ccc;
  position: relative;
`;

const BodyScore = styled.div`
  font-size: 30px;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Scorecontent = styled.div`
  font-size: 40px;
  font-weight: bold;
  color: #860000;
`;

const ScoreText = styled.div`
  font-size: 30px;
  font-weight: normal;
`;

const ChartDownload = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 30px; 
  height: 30px;
  font-size: 20px;
  color: #000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  /* 툴팁 스타일 */
  &::after {
    content: "PDF 다운로드";   /* 툴팁 텍스트 */
    position: absolute;
    bottom: 120%;               /* 아이콘 위쪽에 표시 */
    right: 50%;
    transform: translateX(50%);
    background: #333;
    color: #fff;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease-in-out;
  }

  &:hover::after {
    opacity: 1;
  }
`;

const UpDiv = styled.div`
  width: 100%;
  height: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const BodyTypeChart = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f2f2f2;
  border-radius: 8px;
  border:1px solid #e0e0e0;
`;

const ChartHeader = styled.div`
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 24px;
  font-weight: bold;
  border-bottom: 2px solid #ccc;
`;

const ChartPrevBtn = styled.button`
    padding: 8px 16px;
    font-size: 16px;
    cursor: pointer;
    color:#fff;
    background-color: #860000;
    border-radius: 100px;
    border: none;
    &:hover {
      background-color: #860000;
    }
`;

const ChartSection = styled.div`
  margin-left:30px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 50px;
  font-size: 20px;
  color: #333;
`;

const ChartContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; /* 내용 위쪽부터 쌓이도록 */
  margin: 0 20px;
  padding: 20px;
  background-color: #f2f2f2;
  border-radius: 8px;
  overflow-y: auto;    /* 내용이 넘치면 스크롤 */
  width:100%;
`;

const BodyPhotoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  width: 60%;
  height: 100%;
`;

const BodyPhoto = styled.div`
  margin: 0 auto;
  width: 450px;
  height: 550px;
  background-color: #fff;
  border:2px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 24px;
  color: #333;
`;

const Btns = styled.div`
  display: flex;
  gap: 10px;
`;

const Btn1 = styled.button`
    padding: 12px;
    font-size: 16px;
    cursor: pointer;
    background-color: #fff;
    border:2px solid #e0e0e0;
    border-radius: 100%;
    &:hover {
      background-color: #860000;
    }
`;
const Btn2 = styled.button`
    padding: 12px;
    font-size: 16px;
    cursor: pointer;
    background-color: #fff;
    border:2px solid #e0e0e0;
    border-radius: 100%;
    &:hover {
      background-color: #860000;
    }
`;
const Btn3 = styled.button`
    padding: 12px;
    font-size: 16px;
    cursor: pointer;
    background-color: #fff;
    border:2px solid #e0e0e0;
    border-radius: 100%;
    &:hover {
      background-color: #860000;
    }
`;

const DownDiv = styled.div`
  width: 100%;
  height: 50%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  margin-top: 20px;
  margin-bottom: 20px;
`;

const SolText = styled.div`
  font-size: 25px;
  font-weight: bold;
  margin-bottom: 20px;
  width: 100%;
  border-bottom: 2px solid #ccc;
`;

const SolContent = styled.div`
  padding: 30px;
  font-size: 20px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f2f2f2;
  border-radius: 8px;
  border:2px solid #e0e0e0;
`;

const ModalOverlay = styled.div`
  width:100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  width:80%;
  background: #f2f2f2;
  padding: 30px;
  border-radius: 12px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
`;

const RecoRow = styled.div`
  background-color:#f2f2f2;
  width:100%;
  padding:20px;
  border-radius:10px;
  display: flex;
  gap: 20px;
`;

const RecoBtn = styled.button`
  border: 2px solid #e0e0e0;
  background: #fff;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #850000;
    color: #850000;
  }
`;

const BtnRow = styled.div`
  width:100%;
  padding:20px;
  border-radius:10px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
`;

const GoHome = styled.button`
  border: 2px solid #850000;
    color: #850000;
  background: #fff;
  padding: 10px 16px;
  border-radius: 100px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
  background: #850000;
    color: #fff;
  }
`;

const GoExercise = styled.button`
  border: 2px solid #850000;
  background: #850000;
    color: #fff;
  padding: 10px 16px;
  border-radius: 100px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
  border: 2px solid #850000;
    color: #850000;
  background: #fff;
  }
`;

const BodyTypeResult = () => {
  
    const navigate = useNavigate();
  
    const handleExercise= () => {
      navigate('/exercise');
    };
  
    const handleHome = () => {
      navigate('/');
    };

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const openModal: React.MouseEventHandler<HTMLButtonElement> = () => {
    setIsModalOpen(true);
  };

  const closeModal: React.MouseEventHandler<HTMLButtonElement> = () => {
    setIsModalOpen(false);
  };

const bodyData = [
  {
    name: "2025-09-01",
    value: 85,
    note: {
      머리: "정상",
      목뼈: "약간 긴장",
      날개뼈: "좌우 불균형",
      어깨관절: "유연성 좋음",
      팔꿈치: "정상",
      등뼈: "곡선 약간 과다",
      골반: "좌우 불균형",
      무릎: "정상",
      발목: "약간 부상 흔적"
    }
  },]

  return (
  <>
  <Header />
  <Container>
    <UpDiv>
      <HeaderSection>
        <BodyScore>
          <ScoreText>
          OOO 님의 
          체형점수는 
          </ScoreText>
          <Scorecontent>
            85점
          </Scorecontent>
        </BodyScore>
        <ChartDownload>
          <svg xmlns="http://www.w3.org/2000/svg" fill="#fff" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </ChartDownload>
      </HeaderSection>
      <BodyTypeChart>
        <ChartHeader>
          <div>
            체형분석
          </div>
          <ChartPrevBtn onClick={openModal}>
            지난체형 보기
          </ChartPrevBtn>  
        </ChartHeader>
        <ChartSection>
          <BodyPhotoSection>
            <BodyPhoto>
              사진
            </BodyPhoto>
            <Btns>
              <Btn1>
              </Btn1>
              <Btn2>
              </Btn2>
              <Btn3>
              </Btn3>
            </Btns>
          </BodyPhotoSection>
          <ChartContent>
    {bodyData[0].note &&
      Object.entries(bodyData[0].note).map(([part, text]) => (
        <div
          key={part}
          style={{
            backgroundColor: "#fff",
            marginBottom: 8,
            padding:12,
            paddingLeft:30,
            fontSize: 16,
            borderRadius: 4,
            width: "100%",
            height: "100%",
            border: "2px solid #e0e0e0"
          }}
        >
          <strong>{part}:</strong> {text}
        </div>
      ))
    }
</ChartContent>

        </ChartSection>
      </BodyTypeChart>
    </UpDiv>
    <DownDiv>
      <SolText>
          추천 솔루션
      </SolText>
          <RecoRow>
            <RecoBtn>플랭크</RecoBtn>
            <RecoBtn>푸쉬업</RecoBtn>
          </RecoRow>
    </DownDiv>
          <BtnRow>
            <GoHome onClick={handleHome}>홈으로</GoHome>
            <GoExercise onClick={handleExercise}>운동하러가기</GoExercise>
          </BtnRow>
  </Container>
  <Footer />
        {/* 모달 */}
      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <CloseBtn onClick={closeModal}>×</CloseBtn>
            <div>
              <BodyTypeLineChart/>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
  </>
  );
}
export default BodyTypeResult;