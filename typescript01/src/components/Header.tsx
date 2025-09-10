import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <nav className="header__nav">
        <a href="#">커뮤니티</a>
        <a href="#">후기</a>
        <a href="#">운동</a>
      </nav>
       <div className="header__logo">자세온</div>
      <div className="header__auth">
        <button>로그인</button>
        <button className="signup">회원가입</button>
      </div>
    </header>
  );
};

export default Header;