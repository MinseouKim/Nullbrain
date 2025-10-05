import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { createGlobalStyle } from "styled-components";
import Layout from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";  // ✅ 추가

// Global Styles
const GlobalStyle = createGlobalStyle`
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
    background-color: white;
    color: #333;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .App {
    min-height: 100vh;
  }

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
      {/* ✅ AuthProvider로 전체 앱 감싸기 */}
      <AuthProvider>
        <BrowserRouter basename={props.basename}>
          <Layout {...props} />
        </BrowserRouter>
      </AuthProvider>
    </>
  );
};

export default App;
