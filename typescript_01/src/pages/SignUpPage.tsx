import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const SloganMain = styled.h1`
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
  color: #374151;
  margin-bottom: 8px;
`;

const SloganHighlight = styled.p`
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  color: #860000;
`;

const SignUpContainer = styled.div`
  min-height: calc(100vh - 128px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fff;
  padding: 32px;
  animation: ${fadeInUp} 0.7s ease-out;

  @media (max-width: 768px) {
    padding: 20px;
    min-height: calc(100vh - 100px);
  }

  @media (max-width: 480px) {
    padding: 16px;
    justify-content: flex-start;
    min-height: calc(100vh - 80px);
  }
`;

const SloganContainer = styled.div`
  text-align: center;
  margin-bottom: 32px;
  animation: ${fadeInUp} 1s ease forwards;

  @media (max-width: 768px) {
    margin-bottom: 24px;
  }
  @media (max-width: 480px) {
    margin-bottom: 20px;
    ${SloganMain} {
      font-size: 24px;
    }
    ${SloganHighlight} {
      font-size: 28px;
    }
  }
`;

const SignUpBox = styled.div`
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 448px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #d1d5db;
  animation: ${fadeInUp} 0.8s ease forwards;

  @media (max-width: 480px) {
    padding: 24px 16px;
    box-shadow: none;
    border: none;
    max-width: 100%;
  }
`;

const Title = styled.h2`
  margin-bottom: 24px;
  color: #111827;
  font-size: 30px;
  font-weight: bold;
  width: 100%;
  text-align: left;

  @media (max-width: 480px) {
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  background: #f9fafb;
  color: #111827;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    border-color: transparent;
    box-shadow: 0 0 0 2px #860000;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    padding: 10px 14px;
  }
`;

const PasswordContainer = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 16px;
  & > ${Input} {
    margin-bottom: 0;
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 12px;
  top: 0;
  bottom: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    color: #888;
    transition: transform 0.2s ease, color 0.2s ease;
  }

  &:hover svg {
    color: #555;
    transform: scale(1.1);
  }
`;

const SignUpButton = styled.button`
  width: 100%;
  padding: 12px 0;
  background: #860000;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: #700000;
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #860000, 0 0 0 4px rgba(134, 0, 0, 0.3);
  }

  @media (max-width: 480px) {
    font-size: 16px;
    padding: 10px 0;
  }
`;

const LinksContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 24px;
  font-size: 14px;
  color: #4b5563;

  @media (max-width: 480px) {
    font-size: 12px;
    margin-top: 20px;
  }
`;

const StyledLink = styled.a`
  font-weight: 500;
  color: #860000;
  text-decoration: none;
  margin-left: 6px;
  cursor: pointer;
  transition: color 0.2s ease;
  &:hover {
    color: #700000;
  }
`;

const SignUpPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const navigate = useNavigate();

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !id || !pw || !pw2) {
      alert("모든 항목을 입력하세요.");
      return;
    }
    if (pw !== pw2) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    alert("회원가입이 완료되었습니다!");
    navigate("/login");
  };

  return (
    <>
      <Header />
      <SignUpContainer>
        <SloganContainer>
          <SloganMain>자세On과 함께</SloganMain>
          <SloganHighlight>당신의 첫걸음을 시작하세요</SloganHighlight>
        </SloganContainer>

        <SignUpBox>
          <Title>회원가입</Title>

          <form onSubmit={handleSignUp} style={{ width: "100%" }}>
            <Input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="아이디"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
            />

            <PasswordContainer>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
              />
              <ToggleButton
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="비밀번호 보기"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3l18 18M10.477 10.477A3 3 0 0113.5 13.5m3.315 3.315C15.648 17.977 14.328 18 12 18c-4.97 0-9-4.03-9-9 0-.457.03-.905.087-1.345m2.12-2.12C6.493 5.025 8.134 5 12 5c4.97 0 9 4.03 9 9 0 1.09-.184 2.137-.52 3.106"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </ToggleButton>
            </PasswordContainer>

            <PasswordContainer>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="비밀번호 확인"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                required
              />
              <ToggleButton
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="비밀번호 보기"
              >
                {showConfirmPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3l18 18M10.477 10.477A3 3 0 0113.5 13.5m3.315 3.315C15.648 17.977 14.328 18 12 18c-4.97 0-9-4.03-9-9 0-.457.03-.905.087-1.345m2.12-2.12C6.493 5.025 8.134 5 12 5c4.97 0 9 4.03 9 9 0 1.09-.184 2.137-.52 3.106"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </ToggleButton>
            </PasswordContainer>

            <SignUpButton type="submit">회원가입</SignUpButton>

            <LinksContainer>
              <span>이미 계정이 있으신가요?</span>
              <StyledLink onClick={() => navigate("/login")}>로그인</StyledLink>
            </LinksContainer>
          </form>
        </SignUpBox>
      </SignUpContainer>
      <Footer />
    </>
  );
};

export default SignUpPage;
