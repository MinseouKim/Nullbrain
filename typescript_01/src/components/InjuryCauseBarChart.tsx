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

  if (entry.name !== "무리한 동작") return null;

  return (
    <text
      x={x + width - 220}
      y={y + height / 2}
      fill="#860000"
      textAnchor="start"
      dominantBaseline="middle"
      fontWeight="bold"
      fontSize={30}
    >
      {`${entry.name}  ${value}`} 
    </text>
  );
};

const InjuryCauseBarChart = () => (
  <ResponsiveContainer width="100%" height={500}>
    <BarChart
      data={causeData}
      layout="vertical"
      margin={{ top: 20, right: 50, left: 160, bottom: 20 }}
    >
      <XAxis type="number" reversed axisLine={false} tickLine={false} />
      <YAxis
        type="category"
        dataKey="name"
        orientation="left"
        axisLine={false}
        tickLine={false}
        tick = {false}
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
);

export default InjuryCauseBarChart;
