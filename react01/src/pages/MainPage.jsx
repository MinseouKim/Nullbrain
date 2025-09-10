import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styled from "styled-components";

const Container = styled.div`
  margin: 0 auto;
  padding:0;
  text-align: center;
`;

function MainPage() {
  return (
    <Container>
      <Header />
      <h1>메인 페이지</h1>
      <p>환영합니다! 이것은 메인 페이지입니다.</p>
      <Footer />
    </Container>
  );
}

export default MainPage;
