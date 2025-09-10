import React from 'react';

const SearchBar = () => {
  return (
    <div className="search-bar">
      <input type="text" placeholder="어떤 운동 자세가 궁금하신가요?" />
      <button>🔍</button>
    </div>
  );
};

export default SearchBar;