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

  /* <=768 */
  @media (max-width: 768px) {
    padding: 8px 16px;
    min-height: 55px;
  }

  /* <=480 */
  @media (max-width: 480px) {
    padding: 6px 12px;
    min-height: 50px;
  }

  /* <=320 */
  @media (max-width: 320px) {
    padding: 4px 8px;
    min-height: 45px;
  }
`;

const RightBar = styled.div`
  display: flex;
  gap: 12px;
  flex-shrink: 1;
  align-items: center;

  @media (max-width: 768px) {
    gap: 10px;
  }

  @media (max-width: 480px) {
    gap: 8px;
  }

  @media (max-width: 320px) {
    gap: 5px;
  }
`;

const pulse = keyframes`
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-2px) scale(1.03); }
  100% { transform: translateY(0) scale(1); }
`;

const Logo = styled.div`
  font-weight: bold;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  white-space: nowrap;
  text-align: center;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  padding: 4px 8px;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    transition: left 0.5s;
  }

  &:hover {
    color: #850000;
    text-shadow: 0 1px 1px rgba(133,0,0,0.3);
    &::before { left: 100%; }
  }

  &:active { animation: ${pulse} 0.2s ease-in-out; }

  @media (max-width: 768px) {
    font-size: 20px;
  }

  @media (max-width: 480px) {
    font-size: 18px;
    /* 모바일에서 로고가 너무 넓어지지 않게 패딩 축소 */
    padding: 2px 6px;
  }

  @media (max-width: 320px) {
    font-size: 16px;
  }
`;

const LeftBar = styled.div`
  display: flex;
  gap: 30px;
  align-items: center;
  flex-shrink: 1;

  @media (max-width: 768px) {
    gap: 10px;
  }

  @media (max-width: 480px) {
    gap: 5px;
    display: none; /* <=480에서는 숨김 */
  }

  @media (max-width: 320px) {
    gap: 3px;
  }
`;

const NavItem = styled.span`
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s ease-in-out;

  &:hover { color: #850000; }

  @media (max-width: 768px) {
    font-size: 13px;
  }

  @media (max-width: 480px) {
    font-size: 10px;
  }

  @media (max-width: 320px) {
    font-size: 8px;
  }
`;

const Login = styled.button`
  background-color: #fff;
  color: #000;
  border: 2px solid #000;
  padding: 5px 20px;
  border-radius: 50px;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #fff;
    border: 2px solid #860000;
    color: #860000;
  }

  @media (max-width: 768px) {
    padding: 4px 10px;
    font-size: 10px;
  }

  @media (max-width: 480px) {
    padding: 4px 8px;
    font-size: 8px;
  }

  @media (max-width: 320px) {
    padding: 3px 6px;
    font-size: 6px;
  }
`;

const Signup = styled.button`
  background-color: #000;
  color: white;
  border: none;
  padding: 5px 20px;
  border-radius: 50px;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #860000;
    color: #fff;
  }

  @media (max-width: 768px) {
    padding: 4px 10px;
    font-size: 10px;
  }

  @media (max-width: 480px) {
    padding: 4px 8px;
    font-size: 8px;
  }

  @media (max-width: 320px) {
    padding: 3px 6px;
    font-size: 6px;
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
