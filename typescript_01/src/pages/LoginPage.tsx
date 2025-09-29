import React, { useState, useContext } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fafafa;
`;

const LoginBox = styled.div`
  background: #fff;
  padding: 48px 36px;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 340px;
`;

const Title = styled.h2`
  margin-bottom: 32px;
  color: #860000;
  font-size: 28px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 18px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  &:focus {
    border-color: #860000;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 12px 0;
  background: linear-gradient(135deg, #860000 0%, #a00000 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
  &:hover {
    background: linear-gradient(135deg, #6b0000 0%, #8b0000 100%);
  }
`;

const users = [
  { id: "admin", pw: "123", role: "admin" },
  { id: "asd", pw: "456", role: "user" }
];

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); 

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === email && u.pw === pw);
    if (user) {
      setError("");
      login();
      navigate("/"); // 로그인 성공 시 홈으로 이동
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <>
    <Header/>
    <LoginContainer>
      <LoginBox>
        <Title>로그인</Title>
        <form onSubmit={handleLogin}>
          <Input
            type="text"
            placeholder="아이디"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={e => setPw(e.target.value)}
            required
          />
          <LoginButton type="submit">로그인</LoginButton>
        </form>
        {error && <div style={{ color: "#c00", marginTop: 12 }}>{error}</div>}
      </LoginBox>
    </LoginContainer>
    <Footer/>
    </>
  );
};

export default LoginPage;