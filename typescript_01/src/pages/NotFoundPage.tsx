import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fafafa;
`;

const Title = styled.h1`
  font-size: 80px;
  color: #860000;
  margin-bottom: 24px;
`;

const Message = styled.p`
  font-size: 22px;
  color: #333;
  margin-bottom: 32px;
`;

const HomeButton = styled.button`
  padding: 12px 32px;
  background: linear-gradient(135deg, #860000 0%, #a00000 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  &:hover {
    background: linear-gradient(135deg, #6b0000 0%, #8b0000 100%);
  }
`;

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Title>404</Title>
      <Message>페이지를 찾을 수 없습니다.</Message>
      <HomeButton onClick={() => navigate("/")}>홈으로 이동</HomeButton>
    </Container>
  );
};

export default NotFoundPage;