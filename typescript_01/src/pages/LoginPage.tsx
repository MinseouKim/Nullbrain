import React, { useState, useContext, createContext } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styled, { keyframes } from "styled-components";

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const AuthContext = createContext({
  login: () => {},
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = () => {
    console.log("Login successful!");
    setIsLoggedIn(true);
  };

  return (
    <AuthContext.Provider value={{ login }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Mock User Data ---
const users = [
  { id: "admin", pw: "123", role: "admin" },
  { id: "asd", pw: "456", role: "user" },
  { id: "user", pw: "posture", role: "user" },
];

// --- Styled Components ---
const PageWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  flex-direction: column;
  
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const LeftPanel = styled.div`
  width: 100%;
  background-color: #860000;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 48px;
  text-align: center;
  min-height: 300px;

  @media (min-width: 768px) {
    width: 60%;
    min-height: 100vh;
  }
`;

const SloganContainer = styled.div`
  max-width: 28rem;
`;

const SloganTitle = styled.h1`
  font-size: 2.25rem;
  /* ... */
  opacity: 0; 
  animation: ${fadeInUp} 0.8s ease-out forwards;
  animation-delay: 0.2s;
`;

const SloganSubtitle = styled.p`
  font-size: 3rem;
  /* ... */
  opacity: 0;
  animation: ${fadeInUp} 0.8s ease-out forwards;
  animation-delay: 0.5s;


  @media (min-width: 768px) {
    font-size: 3.75rem;
  }
`;

const RightPanel = styled.div`
  width: 100%;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px;

  @media (min-width: 768px) {
    width: 40%;
    padding: 48px;
  }
`;

const FormContainer = styled.div`
  max-width: 24rem;
  width: 100%;
`;

const FormTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2rem;
  text-align: left;
`;

const StyledForm = styled.form``;

const InputWrapper = styled.div`
  margin-bottom: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #D1D5DB;
  border-radius: 0.5rem;
  color: #111827;
  background-color: #F9FAFB;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #860000;
    border-color: transparent;
  }
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const CheckboxInner = styled.div`
  display: flex;
  align-items: center;
`;

const Checkbox = styled.input`
  height: 1rem;
  width: 1rem;
  color: #860000;
  border-color: #D1D5DB;
  border-radius: 0.25rem;
  &:focus {
    box-shadow: 0 0 0 2px #860000;
  }
`;

const Label = styled.label`
  margin-left: 0.5rem;
  display: block;
  font-size: 0.875rem;
  color: #111827;
`;

const ErrorMessage = styled.div`
  color: #EF4444;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem 0;
  background-color: #860000;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1.125rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #700000;
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
  margin-top: 1.5rem;
  font-size: 0.875rem;
`;

const StyledLink = styled.a`
  font-weight: 500;
  color: #4B5563;
  text-decoration: none;
  
  &:hover {
    color: #111827;
  }
`;

// --- Login Page Component ---
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [rememberId, setRememberId] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useContext(AuthContext);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === email && u.pw === pw);
    if (user) {
      setError("");
      login();
      console.log("로그인 성공! (In a real app, you would be redirected.)");
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <>
    <Header />
    <PageWrapper>
      <LeftPanel>
        <SloganContainer>
          <SloganTitle>
            언제나 어디서나,
          </SloganTitle>
          <SloganSubtitle>
            정확한 자세
          </SloganSubtitle>
        </SloganContainer>
      </LeftPanel>
      
      <RightPanel>
        <FormContainer>
          <FormTitle>
            로그인
          </FormTitle>
          
          <StyledForm onSubmit={handleLogin}>
            <InputWrapper>
              <Input
                id="email"
                type="text"
                placeholder="아이디를 입력하세요"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </InputWrapper>
            
            <InputWrapper>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={pw}
                onChange={e => setPw(e.target.value)}
                required
              />
            </InputWrapper>
            
            <CheckboxWrapper>
              <CheckboxInner>
                <Checkbox
                  id="remember-id"
                  name="remember-id"
                  type="checkbox"
                  checked={rememberId}
                  onChange={(e) => setRememberId(e.target.checked)}
                />
                <Label htmlFor="remember-id">
                  아이디 저장
                </Label>
              </CheckboxInner>
            </CheckboxWrapper>

            {error && (
              <ErrorMessage>
                {error}
              </ErrorMessage>
            )}

            <Button type="submit">
              로그인
            </Button>
          </StyledForm>

          <LinksContainer>
            <StyledLink href="#">
              회원가입
            </StyledLink>
            <StyledLink href="#">
              비밀번호 찾기
            </StyledLink>
          </LinksContainer>
        </FormContainer>
      </RightPanel>
    </PageWrapper>
    <Footer/>
        </>
  );
};

// --- Main App Component ---
export default function App() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}

