import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// 데이터
const data = [
  { name: "부상경험", value: 60.6 },
  { name: "미경험", value: 39.4 },
];

const COLORS = ["#860000", "#d9d9d9"];

// 현재 화면 크기를 가져오는 커스텀 훅
const useWindowSize = () => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
};

const InjuryPieChart = () => {
  const { width } = useWindowSize();

  // 화면 크기에 따른 반응형 설정
  const isMobile = width < 768;
  const chartHeight = isMobile ? 300 : 500;
  const innerRadius = isMobile ? 50 : 100;
  const outerRadius = isMobile ? 120 : 200;

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill="#8884d8"
          labelLine={false}
          label={(entry: any) => {
            const RADIAN = Math.PI / 180;
            const radius = entry.outerRadius + (isMobile ? 10 : 20);
            const x = entry.cx + radius * Math.cos(-entry.midAngle * RADIAN);
            const y = entry.cy + radius * Math.sin(-entry.midAngle * RADIAN);

            // 화면 크기에 따른 글자 크기 조정
            const fontSize = entry.name === "부상경험" ? (isMobile ? 20 : 26) : (isMobile ? 15 : 18);
            const color = entry.name === "부상경험" ? "#860000" : "#d9d9d9";

            return (
              <text
                x={x}
                y={y}
                fill={color}
                textAnchor={x > entry.cx ? "start" : "end"}
                dominantBaseline="middle"
                fontSize={fontSize}
                fontWeight="bold"
              >
                {`${entry.name} ${entry.value}%`}
              </text>
            );
          }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default InjuryPieChart;
