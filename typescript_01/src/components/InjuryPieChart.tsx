import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "부상경험", value: 60.6 },
  { name: "미경험", value: 39.4 },
];

const COLORS = ["#860000", "#d9d9d9"];

const InjuryPieChart = () => (
  <ResponsiveContainer width="100%" height={500}>
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        innerRadius={100}
        outerRadius={200}
        fill="#8884d8"
        labelLine={false}
        label={(entry: any) => {
          const RADIAN = Math.PI / 180;
          const radius = entry.outerRadius + 20;
          const x = entry.cx + radius * Math.cos(-entry.midAngle * RADIAN);
          const y = entry.cy + radius * Math.sin(-entry.midAngle * RADIAN);

          // name에 따라 글자 크기 다르게 지정
          const fontSize = entry.name === "부상경험" ? 30 : 20;
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

export default InjuryPieChart;
