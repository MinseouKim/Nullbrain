import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// public/index.html 파일의 <div id="root"></div>에 React 앱을 렌더링합니다.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);