import React, { useState } from 'react';

const FilterTabs = () => {
  const [activeTab, setActiveTab] = useState('전체');
  const tabs = ['전체', '상체', '하체', '전신', '유산소'];

  return (
    <div className="filter-tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={activeTab === tab ? 'active' : ''}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;