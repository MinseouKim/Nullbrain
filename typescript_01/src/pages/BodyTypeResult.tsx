import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const BodyTypeResult = () => {
  return (
  <>
  <Header />
  <div>전체
    <div>
      위
      <div>
        체형 점수
      </div>
      <div>
        체형표
      </div>
    </div>
    <div>
      아래
      <div>
        추천 솔루션
      </div>
      <div>
        추천 운동
      </div>
    </div>
  </div>
  <Footer />
  </>
  );
}
export default BodyTypeResult;