import React,{ FC } from "react";
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
`;

const LeftBar = styled.div`
  padding-bottom: 20px;
  display: flex;
  gap: 30px;
`;

const BrandInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
`;

const RightBar = styled.div`
  padding-top: 20px;
  border-top: 1px solid #ddd;
  justify-content: center;
  display: flex;
  gap: 30px;
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
`;

const InfoTitle = styled.div`
  font-weight: 500;
  font-size: 18px;
`;

const InfoText = styled.div`
  font-size: 16px;
  color: #ddd;
`;

const CopyRight = styled.div`
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
`;

function Footer() {
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
        <CopyRight>
          ⓒ NullBrains | 2025 | ALL RIGHTS RESERVED
        </CopyRight>
      </RightBar>
		</FooterContainer>
	);
}

export default Footer;
