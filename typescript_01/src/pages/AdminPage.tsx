import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import Header from "../components/Header";
import Footer from "../components/Footer";

// 섹션별 페이지 리스트
const PageSections = [
  {
    title: "페이지 접근",
    pages: [
      { path: "/main", label: "메인페이지" },
      { path: "/exercise", label: "운동 목록" },
      { path: "/camera", label: "운동 카메라" },
      { path: "/bodyAnalysis", label: "신체 분석 카메라" },
      { path: "/bodyTypeResult", label: "체형 결과" },
      { path: "/result", label: "운동 결과" },
    ],
  },
  {
    title: "회원/테스트 관리",
    pages: [
      { path: "/login", label: "로그인" },
      { path: "/signUp", label: "회원가입" },
    ],
  },
];

const AdminContainer = styled.div`
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
`;

const SectionContainer = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 30px 40px;
  margin-bottom: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  min-width: 320px;
`;

const SectionTitle = styled.h3`
  color: #860000;
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
`;

const ButtonGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
`;

const PageCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fdf2f2;
  border-radius: 12px;
  padding: 12px 8px;
  min-width: 140px;
`;

const PageButton = styled.button`
  width: 100%;
  padding: 12px 0;
  border: 2px solid #860000;
  border-radius: 12px;
  background: #fff;
  color: #000;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    color: #fff;
    background: linear-gradient(135deg, #6b0000 0%, #8b0000 100%);
  }
`;

const PageLink = styled.span`
  margin-top: 6px;
  font-size: 12px;
  color: #860000;
  word-break: break-all;
`;

const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
    <Header/>
    <AdminContainer>
      <h2 style={{ color: "#860000", fontSize: "32px", marginBottom: "40px" }}>
        관리자 페이지
      </h2>
      {PageSections.map(section => (
        <SectionContainer key={section.title}>
          <SectionTitle>{section.title}</SectionTitle>
          <ButtonGrid>
            {section.pages.map(page => (
              <PageCard key={page.path}>
                <PageButton onClick={() => navigate(page.path)}>
                  {page.label}
                </PageButton>
                <PageLink>{page.path}</PageLink> {/* 링크 주소 표시 */}
              </PageCard>
            ))}
          </ButtonGrid>
        </SectionContainer>
      ))}
    </AdminContainer>
    <Footer/>
    </>
  );
};

export default AdminPage;
