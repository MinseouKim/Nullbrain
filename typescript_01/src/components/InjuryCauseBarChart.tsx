import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import styled from "styled-components";

const causeData = [
  { name: "무리한 동작", value: 35.8 },
  { name: "사람과 충돌", value: 25 },
  { name: "미끄러져 넘어짐", value: 21.3 },
  { name: "점프 후 착지 실수", value: 11.6 },
  { name: "운동장비에 충돌 또는 맞음", value: 11.1 },
];

// Chart 감싸는 반응형 컨테이너
const ChartWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  height: 500px;
  margin: 0 auto;

  @media (max-width: 768px) {
    height: 400px;
    max-width: 450px;
  }

  @media (max-width: 480px) {
    height: 300px;
  }

  @media (max-width: 320px) {
    height: 250px;
  }
`;

const InjuryCauseBarChart = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, index } = props;
    const entry = causeData[index];

    if (entry.name !== "무리한 동작") return null;

    // 화면 너비에 따른 폰트 크기 조절
    let fontSize = 26;
    if (windowWidth <= 320) fontSize = 14;
    else if (windowWidth <= 480) fontSize = 16;
    else if (windowWidth <= 768) fontSize = 20;

    let aa = 0;
    if (windowWidth <= 320) aa = 100;
    else if (windowWidth <= 480) aa = 150;
    else if (windowWidth <= 768) aa = 170;
    else aa = 220;

    return (
      <text
        x={x + width - aa}
        y={y + height / 2}
        fill="#860000"
        textAnchor="start"
        dominantBaseline="middle"
        fontWeight="bold"
        fontSize={fontSize}
      >
        {`${entry.name}  ${entry.value}`}
      </text>
    );
  };

  return (
    <ChartWrapper>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={causeData}
          layout="vertical"
          margin={{ top: 20, right: 0, left: 160, bottom: 20 }}
        >
          <XAxis type="number" reversed axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            orientation="left"
            axisLine={false}
            tickLine={false}
            tick={false}
            tickFormatter={(name: string) =>
              name === "무리한 동작" ? name : ""
            }
          />
          <Tooltip />
          <Bar dataKey="value">
            {causeData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.name === "무리한 동작" ? "#860000" : "#d9d9d9"}
              />
            ))}
            <LabelList content={renderCustomLabel} position="insideRight" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

export default InjuryCauseBarChart;
