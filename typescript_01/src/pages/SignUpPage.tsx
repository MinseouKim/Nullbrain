import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const SignUpContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fafafa;
`;

const SignUpBox = styled.div`
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

const SignUpButton = styled.button`
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

const SignUpPage: React.FC = () => {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate(); // 추가

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !id || !pw || !pw2) {
      alert("모든 항목을 입력하세요.");
      setSuccess(false);
      return;
    }
    if (pw !== pw2) {
      alert("비밀번호가 일치하지 않습니다.");
      setSuccess(false);
      return;
    }
    setError("");
    setSuccess(true);
    setTimeout(() => {
      alert("회원가입이 완료되었습니다!");
      navigate("/login"); // 회원가입 성공 시 로그인 페이지로 이동
    }, 1000); // 1초 후 이동 (성공 메시지 잠깐 보여주기)
  };

  return (
    <>
  <Header />
    <SignUpContainer>
      <SignUpBox>
        <Title>회원가입</Title>
        <form onSubmit={handleSignUp}>
          <Input
            type="text"
            placeholder="이름"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="아이디"
            value={id}
            onChange={e => setId(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={e => setPw(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="비밀번호 확인"
            value={pw2}
            onChange={e => setPw2(e.target.value)}
            required
          />
          <SignUpButton type="submit">회원가입</SignUpButton>
        </form>
      </SignUpBox>
    </SignUpContainer>
    <Footer/>
    </>
  );
};

export default SignUpPage;