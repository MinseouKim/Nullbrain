import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { AuthContext } from "../context/AuthContext";

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

  /* 768px 이하 */
  @media (max-width: 768px) {
    padding: 8px 16px;
    min-height: 55px;
  }

  /* 480px 이하 */
  @media (max-width: 480px) {
    padding: 6px 12px;
    min-height: 50px;
  }

  /* 320px 이하 */
  @media (max-width: 320px) {
    padding: 4px 8px;
    min-height: 45px;
  }
`;

const RightBar = styled.div`
  display: flex;
  gap: 30px;

  @media (max-width: 768px) {
    gap: 20px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }

  @media (max-width: 320px) {
    gap: 8px;
  }
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
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
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

  /* 반응형 폰트 크기 */
  @media (max-width: 768px) {
    font-size: 20px;
  }

  @media (max-width: 480px) {
    font-size: 18px;
  }

  @media (max-width: 320px) {
    font-size: 16px;
  }
`;

const LeftBar = styled.div`
  display: flex;
  gap: 30px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 20px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }

  @media (max-width: 320px) {
    gap: 8px;
  }
`;

const NavItem = styled.span`
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: #850000;
  }

  @media (max-width: 768px) {
    font-size: 15px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
  }

  @media (max-width: 320px) {
    font-size: 13px;
  }
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

  &:hover {
    background-color: #fff;
    border: 2px solid #860000;
    color: #860000;
  }

  @media (max-width: 768px) {
    padding: 4px 14px;
    font-size: 15px;
  }

  @media (max-width: 480px) {
    padding: 4px 10px;
    font-size: 14px;
  }

  @media (max-width: 320px) {
    padding: 3px 8px;
    font-size: 12px;
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

  &:hover {
    background-color: #860000;
    color: #fff;
  }

  @media (max-width: 768px) {
    padding: 4px 14px;
    font-size: 15px;
  }

  @media (max-width: 480px) {
    padding: 4px 10px;
    font-size: 14px;
  }

  @media (max-width: 320px) {
    padding: 3px 8px;
    font-size: 12px;
  }
`;

const Header = () => {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { isLoggedIn, logout } = useContext(AuthContext);

  const handleLogoClick = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate("/main");
    }, 300);
  };

  return (
    <HeaderContainer>
      <LeftBar>
        <NavItem onClick={() => navigate("/bodyAnalysis")}>체형 분석</NavItem>
        <NavItem onClick={() => navigate("/review")}>후기</NavItem>
        <NavItem onClick={() => navigate("/exercise")}>운동</NavItem>
      </LeftBar>

      <Logo onClick={handleLogoClick}>자세ON</Logo>

      <RightBar>
        {isLoggedIn ? (
          <>
            <Login onClick={() => navigate("/admin")}>관리자페이지</Login>
            <Login onClick={() => navigate("/mypage")}>마이페이지</Login>
            <Signup onClick={logout}>로그아웃</Signup>
          </>
        ) : (
          <>
            <Login onClick={() => navigate("/login")}>로그인</Login>
            <Signup onClick={() => navigate("/signUp")}>회원가입</Signup>
          </>
        )}
      </RightBar>
    </HeaderContainer>
  );
};

export default Header;
