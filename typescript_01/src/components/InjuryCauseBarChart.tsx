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

const renderCustomLabel = (props: any) => {
  const { x, y, width, height, value, index } = props;
  const entry = causeData[index];
  const isMobile = width < 768;
  const fontSize = entry.name === "무리한 동작" ? (isMobile ? 20 : 36) : (isMobile ? 15 : 18);
  if (entry.name !== "무리한 동작") return null;

  return (
    <text
      x={x + width - 170}
      y={y + height / 2}
      fill="#860000"
      textAnchor="start"
      dominantBaseline="middle"
      fontWeight="bold"
      fontSize={fontSize}
    >
      {`${entry.name}  ${value}`}
    </text>
  );
};

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

const InjuryCauseBarChart = () => (
  <ChartWrapper>
  <ResponsiveContainer>
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
        tickFormatter={(name: string) => (name === "무리한 동작" ? name : "")}
      />
      <Tooltip />
      <Bar dataKey="value">
        {causeData.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            fill={entry.name === "무리한 동작" ? "#860000" : "#d9d9d9"} // 무리한 동작만 붉은색
          />
        ))}
        <LabelList content={renderCustomLabel} position="insideRight" />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</ChartWrapper>
);

export default InjuryCauseBarChart;
