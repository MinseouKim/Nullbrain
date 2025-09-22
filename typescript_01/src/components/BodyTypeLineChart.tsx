import React, { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Dot
} from "recharts";
import styled from "styled-components";

const SectionTitle= styled.h2`
  margin-bottom: 10px;
`;

const Btns = styled.div`
  display: flex;
  gap: 10px;
`;

const Btn1 = styled.button`
    padding: 12px;
    font-size: 16px;
    cursor: pointer;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 100%;
    &:hover {
      background-color: #860000;
    }
`;
const Btn2 = styled.button`
    padding: 12px;
    font-size: 16px;
    cursor: pointer;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 100%;
    &:hover {
      background-color: #860000;
    }
`;
const Btn3 = styled.button`
    padding: 12px;
    font-size: 16px;
    cursor: pointer;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 100%;
    &:hover {
      background-color: #860000;
    }
`;

const BodyPhoto = styled.div`
  width: 300px;
  height: 400px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PhotoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap:10px;
  margin-right:20px;
`;

const SectionHeader = styled.div`
  margin-bottom:10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const bodyData = [
  {
    name: "2025-09-01",
    value: 85,
    note: {
      머리: "정상",
      목뼈: "약간 긴장",
      날개뼈: "좌우 불균형",
      어깨관절: "유연성 좋음",
      팔꿈치: "정상",
      등뼈: "곡선 약간 과다",
      골반: "좌우 불균형",
      무릎: "정상",
      발목: "약간 부상 흔적"
    }
  },
  {
    name: "2025-08-15",
    value: 78,
    note: {
      머리: "정상",
      목뼈: "약간 긴장",
      날개뼈: "좌우 불균형",
      어깨관절: "약간 제한",
      팔꿈치: "정상",
      등뼈: "곡선 정상",
      골반: "약간 틀어짐",
      무릎: "약간 긴장",
      발목: "정상"
    }
  },
  {
    name: "2025-08-10",
    value: 62,
    note: {
      머리: "정상",
      목뼈: "약간 긴장",
      날개뼈: "좌우 불균형",
      어깨관절: "약간 제한",
      팔꿈치: "정상",
      등뼈: "곡선 정상",
      골반: "약간 틀어짐",
      무릎: "약간 긴장",
      발목: "정상"
    }
  },
  {
    name: "2025-06-20",
    value: 80,
    note: {
      머리: "정상",
      목뼈: "약간 긴장",
      날개뼈: "좌우 불균형",
      어깨관절: "약간 제한",
      팔꿈치: "정상",
      등뼈: "곡선 정상",
      골반: "약간 틀어짐",
      무릎: "약간 긴장",
      발목: "정상"
    }
  },
  {
    name: "2025-05-15",
    value: 89,
    note: {
      머리: "정상",
      목뼈: "약간 긴장",
      날개뼈: "좌우 불균형",
      어깨관절: "약간 제한",
      팔꿈치: "정상",
      등뼈: "곡선 정상",
      골반: "약간 틀어짐",
      무릎: "약간 긴장",
      발목: "정상"
    }
  },
];

const BodyChart = () => {
  const [selected, setSelected] = useState(bodyData[0]);

  return (
    <div>
      <SectionTitle>지난 체형 기록</SectionTitle>
      <ResponsiveContainer width="100%" height={300}>
<LineChart data={bodyData}>
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />

<Line
  type="monotone"
  dataKey="value"
  stroke="#860000"
  dot={(props: any) => {
    const { index } = props;
    const isSelected = selected === bodyData[index];

    return (
      <Dot
        {...props}                // cx, cy, r 등 기본 Dot props 그대로 사용
        r={10}
        fill={isSelected ? "#860000" : "#fff"}
        stroke="#860000"
        strokeWidth={1}
        style={{ cursor: "pointer" }}
        onClick={() => setSelected(bodyData[index])}
      />
    );
  }}
  activeDot={{ r: 1, fill: "#860000" }}
/>


</LineChart>


      </ResponsiveContainer>

      <div style={{ display: "flex", margin: 60, gap:30 }}>
        {/* 사진 */}
        <PhotoSection>
          <BodyPhoto>
            사진
          </BodyPhoto>
            <Btns>
              <Btn1>
              </Btn1>
              <Btn2>
              </Btn2>
              <Btn3>
              </Btn3>
            </Btns>
          </PhotoSection>

        {/* 부위별 note */}
        <div style={{ flex: 1}}>
          <SectionHeader>
          <h3>{selected.name} 
            </h3>
            <h3 style={{color: "#860000"}}>{selected.value}점</h3>
          </SectionHeader>
          {Object.entries(selected.note).map(([part, text]) => (
            <div key={part} style={{
              backgroundColor: "#fff",
              marginBottom: 8,
              padding: 8,
              fontSize: 12,
              borderRadius: 4
            }}>
              <strong>{part}:</strong> {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BodyChart;
