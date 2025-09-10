import React from "react";
import styled from "styled-components";

const HeaderContainer = styled.header`
  margin: 0 auto;
	background: #fff;
	display: flex;
	flex-direction: row;
  justify-content: space-between;
	padding: 10px 20px;
  position: relative;
`;

const RightBar = styled.div`
  display: flex;
  gap: 10px;
`;

const Logo = styled.div`
  font-weight: bold;
  font-size: 24px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
`;

const LeftBar = styled.div`
  display: flex;
  gap: 30px;
`;


function Header() {
	return (
		<HeaderContainer>
      <LeftBar>
        <span>체형 분석</span>
        <span>후기</span>
        <span>운동</span>
      </LeftBar>
      <Logo>
        자세ON
      </Logo>
      <RightBar>
        <button>로그인</button>
        <button>회원가입</button>
      </RightBar>
		</HeaderContainer>
	);
}

export default Header;
