import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '경험 부족', value: 5 },
  { name: '과도한 관절 사용', value: 12 },
  { name: '다른사람과 충돌', value: 8 },
];

const COLORS = ['#860000', '#f2a654', '#6c5ce7'];

const InjuryPieChart = () => (
  <ResponsiveContainer width="80%" height={300}>
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={100}
        fill="#8884d8"
        label
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

export default InjuryPieChart;