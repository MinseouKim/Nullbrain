import React, { useState, useContext } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

// --- Fade-in 애니메이션 ---
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

// --- Styled Components ---

const LoginContainer = styled.div`
  min-height: calc(100vh - 128px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fff;
  padding: 32px;
  animation: ${fadeInUp} 0.7s ease-out;

  @media (max-width: 480px) {
    padding: 20px;
  }
`;

const SloganContainer = styled.div`
  text-align: center;
  margin-bottom: 32px;
  animation: ${fadeInUp} 1s ease forwards;
`;

const SloganMain = styled.h1`
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
  color: #374151;
  margin-bottom: 8px;

  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

const SloganHighlight = styled.p`
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  color: #860000;
`;

const LoginBox = styled.div`
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 384px;
  animation: ${fadeInUp} 0.8s ease forwards;

  @media (max-width: 480px) {
    padding: 24px;
  }
`;

const Title = styled.h2`
  margin-bottom: 32px;
  color: #111827;
  font-size: 30px;
  font-weight: bold;
  width: 100%;
  text-align: center;
`;

const StyledForm = styled.form`
  width: 100%;
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

  &:focus {
    border-color: transparent;
    box-shadow: 0 0 0 2px #860000;
  }
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 24px;
`;

const CheckboxInput = styled.input`
  width: 16px;
  height: 16px;
  accent-color: #860000;
  border-color: #d1d5db;
  border-radius: 4px;
`;

const CheckboxLabel = styled.label`
  margin-left: 8px;
  font-size: 14px;
  color: #111827;
  cursor: pointer;
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 14px;
  text-align: center;
  margin-bottom: 16px;
  min-height: 20px;
`;

const LoginButton = styled.button`
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
`;

const LinksContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  font-size: 14px;
  width: 100%;
`;

const StyledLink = styled.a`
  font-weight: 500;
  color: #4b5563;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
  &:hover {
    color: #111827;
  }
`;

// --- Mock User Data ---
const users = [
  { id: "admin", pw: "123", role: "admin" },
  { id: "asd", pw: "456", role: "user" },
];

// --- React Component ---

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [rememberId, setRememberId] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find((u) => u.id === email && u.pw === pw);
    if (user) {
      setError("");
      login({ id: user.id, role: user.role });
      navigate("/"); // 로그인 성공 시 홈으로 이동
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <>
      <Header />
      <LoginContainer>
        <SloganContainer>
          <SloganMain>로그인 하시면 자세ON의 모든 서비스를 이용 하실 수 있습니다.</SloganMain>
          <SloganHighlight>아직 회원이 아니시면 회원가입을 해주세요.</SloganHighlight>
        </SloganContainer>

        <LoginBox>
          <Title>로그인</Title>
          <StyledForm onSubmit={handleLogin}>
            <Input
              type="text"
              placeholder="아이디를 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />

            <CheckboxWrapper>
              <CheckboxInput
                id="remember-id"
                type="checkbox"
                checked={rememberId}
                onChange={(e) => setRememberId(e.target.checked)}
              />
              <CheckboxLabel htmlFor="remember-id">아이디 저장</CheckboxLabel>
            </CheckboxWrapper>

            <ErrorMessage>{error && error}</ErrorMessage>

            <LoginButton type="submit">로그인</LoginButton>
          </StyledForm>

          <LinksContainer>
            <StyledLink onClick={() => navigate("/SignUp")}>
              회원가입
            </StyledLink>
            <StyledLink href="#">비밀번호 찾기</StyledLink>
          </LinksContainer>
        </LoginBox>
      </LoginContainer>
      <Footer />
    </>
  );
};

export default LoginPage;
