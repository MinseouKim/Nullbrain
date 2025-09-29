import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";

const HeaderContainer = styled.header`
  margin: 0 auto;
	background: #fff;
	display: flex;
	flex-direction: row;
  justify-content: space-between;
  align-items: center;
	padding: 10px 20px;
  position: relative;
  min-height: 60px;
`;

const RightBar = styled.div`
  display: flex;
  gap: 30px;
`;

const pulse = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.05);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
`;

const Logo = styled.div`
  font-weight: bold;
  font-size: 24px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  white-space: nowrap;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.5s;
  }

  &:hover {
    color: #850000;
    text-shadow: 0 1px 1px rgba(133, 0, 0, 0.3);

    &::before {
      left: 100%;
    }
  }

  &:active {
    animation: ${pulse} 0.2s ease-in-out;
  }
`;

const LeftBar = styled.div`
  display: flex;
  gap: 20px;
`;

const Login = styled.button`
  background-color: #fff;
  color: #000;
  border: 2px solid #000;
  padding: 5px 20px;
  border-radius: 50px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover{
    background-color: #fff;
    border: 2px solid #860000;
    color: #860000;
  }
`;

const Signup = styled.button`
  background-color: #000;
  color: white;
  border: none;
  padding: 5px 20px;
  border-radius: 50px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  
  &:hover{
    background-color: #860000;
    color: #fff;
  }
`;

const HeaderSpan = styled.span`
  cursor:pointer;
  font-weight:500;
  font-size: 16px;

  &:hover{
    color:#860000;
  }
`;

const Header = () => {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLogoClick = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/main');
    }, 300);
  };

  const handleBodyType = () => {
    navigate('/bodyAnalysis');
  };
  const handleExerciseItems = () => {
    navigate('/exercise');
  };

	return (
		<HeaderContainer>
      <LeftBar>
        <HeaderSpan onClick={handleBodyType}>체형 분석</HeaderSpan>
        <HeaderSpan onClick={handleLogoClick}>후기</HeaderSpan> {/* 추후에 onclick 주소 수정 */}
        <HeaderSpan onClick={handleExerciseItems}>운동</HeaderSpan>
      </LeftBar>
      <Logo onClick={handleLogoClick}>
        자세ON
      </Logo>
      <RightBar>
        <Login>로그인</Login>
        <Signup>회원가입</Signup>
      </RightBar>
		</HeaderContainer>
	);
}

export default Header;