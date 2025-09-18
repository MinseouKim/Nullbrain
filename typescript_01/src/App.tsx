import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { createGlobalStyle } from "styled-components";
import Layout from "./components/Layout";

// Global Styles
const GlobalStyle = createGlobalStyle`
  /* 전역 스타일 리셋 */
  * {
    margin: 0;
    
    padding: 0;
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: white;
    color: #333;
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
      monospace;
  }

  .App {
    min-height: 100vh;
  }

  /* 스크롤바 스타일링 */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f5f5f5;
  }

  ::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
`;

const App = (props: any) => {
  useEffect(() => {
    // 초기화 로직
  }, []);

  return (
    <>
      <GlobalStyle />
      <BrowserRouter basename={props.basename}>
        <Layout {...props} />
      </BrowserRouter>
    </>
  );
};

export default App;
