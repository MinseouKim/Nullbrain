import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BodyAnalysisCamera from "../components/BodyAnalysisCamera";

const BodyAnalysis = () => {
  return (
    <div>
      <Header />

      <BodyAnalysisCamera />

      <h2>[의상 가이드] 밝은 조명아래에서 촬영해주세요.</h2>
      <ul>
        <li> 카메라와 얼굴이 정면을 향하도록 해주세요. </li>
        <li> 상체가 잘 보이도록 촬영해주세요. </li>
        <li> 너무 가까이서 촬영하지 마세요. </li>
        <li> 너무 멀리서 촬영하지 마세요. </li>
        <li> 배경이 단색일수록 좋아요. </li>
      </ul> 
    
      <button>음성안내</button> 
      <button>체형 분석 시작하기/중단하기</button>

      <Footer />
    </div>
  );
};

export default BodyAnalysis;