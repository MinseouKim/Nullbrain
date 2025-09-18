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
`;

const LeftBar = styled.div`
  display: flex;
  gap: 30px;
`;

const Login = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
`;

const Signup = styled.button`
  background-color: #000;
  color: white;
  border: none;
  padding: 5px 20px;
  border-radius: 50px;
  cursor: pointer;
  font-size: 16px;
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

	return (
		<HeaderContainer>
      <LeftBar>
        <span>체형 분석</span>
        <span>후기</span>
        <span>운동</span>
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
