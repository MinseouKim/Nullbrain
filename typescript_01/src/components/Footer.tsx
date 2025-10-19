import React from "react";
import styled from "styled-components";

const FooterContainer = styled.footer`
  margin: 0 auto;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 20px 50px;
  z-index: 100;

  /* 768px 이하: 패딩 축소 */
  @media (max-width: 768px) {
    padding: 16px 30px;
  }

  /* 480px 이하: 패딩 더 축소 */
  @media (max-width: 480px) {
    padding: 14px 20px;
  }

  /* 320px 이하: 최소 패딩 */
  @media (max-width: 320px) {
    padding: 12px 15px;
  }
`;

const LeftBar = styled.div`
  padding-bottom: 20px;
  display: flex;
  gap: 30px;

  @media (max-width: 768px) {
    gap: 20px;
  }

  /* 작은 화면에서는 세로 배치 */
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 15px;
    padding-bottom: 16px;
  }

  @media (max-width: 320px) {
    gap: 12px;
    padding-bottom: 12px;
  }
`;

const BrandInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;

  @media (max-width: 480px) {
    gap: 4px;
  }
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;

  @media (max-width: 480px) {
    gap: 4px;
  }
`;

const RightBar = styled.div`
  padding-top: 20px;
  border-top: 1px solid #ddd;
  justify-content: center;
  display: flex;
  gap: 30px;

  @media (max-width: 768px) {
    gap: 20px;
    padding-top: 16px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    padding-top: 12px;
  }

  @media (max-width: 320px) {
    gap: 8px;
    padding-top: 10px;
  }
`;

const InfoTitle = styled.div`
  font-weight: 500;
  font-size: 18px;

  @media (max-width: 768px) {
    font-size: 15px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
  }

  @media (max-width: 320px) {
    font-size: 10px;
  }
`;

const InfoText = styled.div`
  font-size: 16px;
  color: #ddd;

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

const CopyRight = styled.div`
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 12px;
  }

  @media (max-width: 480px) {
    font-size: 10px;
  }

  @media (max-width: 320px) {
    font-size: 8px;
  }
`;

const Footer = () => {
  return (
    <FooterContainer>
      <LeftBar>
        <BrandInfo>
          <InfoTitle>자세ON</InfoTitle>
          <InfoText>운동 자세 교정 서비스</InfoText>
        </BrandInfo>
        <ContactInfo>
          <InfoTitle>문의하기</InfoTitle>
          <InfoText>example@test.com</InfoText>
        </ContactInfo>
      </LeftBar>
      <RightBar>
        <CopyRight>ⓒ NullBrains | 2025 | ALL RIGHTS RESERVED</CopyRight>
      </RightBar>
    </FooterContainer>
  );
};

export default Footer;
