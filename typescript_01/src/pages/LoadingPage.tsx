import React from "react";
import styled, { keyframes } from "styled-components";

const spin = keyframes`
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
`;

const LoaderWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fafafa;
`;

const Spinner = styled.div`
  width: 64px;
  height: 64px;
  border: 8px solid #eee;
  border-top: 8px solid #860000;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 24px;
`;

const LoadingText = styled.div`
  font-size: 22px;
  color: #860000;
  font-weight: bold;
`;

const LoadingPage: React.FC = () => (
  <LoaderWrapper>
    <Spinner />
    <LoadingText>로딩 중입니다...</LoadingText>
  </LoaderWrapper>
);

export default LoadingPage;