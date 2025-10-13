import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

// 레이아웃 컨테이너
const Page = styled.div`
  width: 100%;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
  box-sizing: border-box;
  overflow: hidden;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #111;
`;

// 상단 2열 레이아웃
const TopGrid = styled.div`
  width: 100%;
  max-width: 1200px;
  height: calc(100vh - 200px);
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 8px;
  align-items: stretch;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.section`
  background: #f3f3f3;
  border-radius: 8px;
  padding: 12px;
  box-sizing: border-box;
`;

const CardTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 700;
  color: #111;
`;

// "운동 결과" 전용 카드: 내부 컨텐츠가 남는 공간을 모두 채우도록
const ResultCard = styled(Card)`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

// 좌측: 운동 결과 표
const ResultTable = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const ResultRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  flex: 1;

  &:last-child {
    border-bottom: none;
  }
`;

const ResultLabel = styled.div`
  color: #666;
  font-weight: 600;
`;
const ResultValue = styled.div`
  text-align: right;
  color: #111;
  font-weight: 700;
`;

// 우측: 비디오 카드
const VideoCard = styled(Card)`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
`;

// 우측: 비디오 영역 및 타임라인 리스트
const VideoBox = styled.div`
  background: #e5e5e5;
  flex: 1;
  border-radius: 8px;
  border: 1px solid #dcdcdc;
  margin-bottom: 8px;
`;

const Timeline = styled.div`
  margin-top: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  height: 100px;
  display: flex;
  flex-direction: column;
`;

const TimelineRow = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 80px 50px;
  gap: 4px;
  align-items: center;
  padding: 4px 8px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 12px;
  background: #fff;

  &:last-child {
    border-bottom: none;
  }
`;

const Pill = styled.span<{ color?: string }>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 999px;
  background: ${(p) => p.color || "#f1f5f9"};
  color: #111;
  font-weight: 600;
  text-align: center;
  font-size: 10px;
`;

// 중단: 오류 분석, 추천 운동
const GridTwo = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: flex-start;
  gap: 12px;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const TagCloud = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 8px 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  background: #f1f5f9;
  color: #374151;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 13px;
`;

const RecoRow = styled.div`
  display: flex;
  gap: 8px;
`;

const RecoBtn = styled.button`
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #850000;
    color: #850000;
  }
`;

// 하단: 피드백 + 액션 버튼
const FeedbackCard = styled(Card)`
  max-width: 1200px;
  width: 100%;
  margin-top: 4px;
`;

// 추천 운동 카드가 상단의 "운동 결과" 카드와 동일한 가로 폭을 갖도록
// TopGrid가 grid-template-columns: 1fr 1.3fr 이므로 왼쪽 폭 비율은 1/2.3
const RecoCard = styled(Card)`
  width: 100%;
  @media (max-width: 1024px) {
    width: 100%;
  }
`;

const Actions = styled.div`
  margin-top: 8px;
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const ActionBtn = styled.button<{ variant?: "primary" | "ghost" }>`
  min-width: 220px;
  height: 40px;
  border-radius: 999px;
  border: ${(p) => (p.variant === "ghost" ? "1px solid #111" : "none")};
  background: ${(p) => (p.variant === "ghost" ? "#fff" : "#111")};
  color: ${(p) => (p.variant === "ghost" ? "#111" : "#fff")};
  font-weight: 800;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.05s ease;

  &:hover {
    filter: brightness(0.95);
  }
  &:active {
    transform: translateY(1px);
  }
`;

const SectionHeadline = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  text-align: center;
`;

const ExerciseResult: React.FC = () => {
  const navigate = useNavigate();

  // 데모 데이터 (연동 전)
  const summary = {
    name: "스쿼트",
    reps: 30,
    accuracy: 86,
    time: "0:00:00",
    kcal: 120,
  };

  const timeline = [
    { t: "0:00:20", part: "자세 1", issue: "무릎 펴라", status: "괜춘" },
    { t: "0:00:28", part: "자세 2", issue: "허리 펴라", status: "괜춘" },
    { t: "0:00:34", part: "자세 3", issue: "제대로 해라", status: "흠음" },
  ];

  return (
    <Page>
      <SectionHeadline>운동 분석 결과</SectionHeadline>

      <TopGrid>
        {/* 좌측: 운동 결과 */}
        <ResultCard>
          <CardTitle>운동 결과</CardTitle>
          <ResultTable>
            <ResultRow>
              <ResultLabel>운동</ResultLabel>
              <ResultValue>{summary.name}</ResultValue>
            </ResultRow>
            <ResultRow>
              <ResultLabel>총 반복 횟수</ResultLabel>
              <ResultValue>{summary.reps}회</ResultValue>
            </ResultRow>
            <ResultRow>
              <ResultLabel>정확도</ResultLabel>
              <ResultValue>{summary.accuracy}%</ResultValue>
            </ResultRow>
            <ResultRow>
              <ResultLabel>운동시간</ResultLabel>
              <ResultValue>{summary.time}</ResultValue>
            </ResultRow>
            <ResultRow>
              <ResultLabel>소모 칼로리</ResultLabel>
              <ResultValue>{summary.kcal}kcal</ResultValue>
            </ResultRow>
            {/* 합친 섹션: 자세 오류 분석 */}
            <div
              style={{
                padding: 10,
                borderTop: "1px solid #f0f0f0",
                background: "#fff",
              }}
            >
              <CardTitle style={{ fontSize: 14, margin: "0 0 8px 0" }}>
                자세 오류 분석
              </CardTitle>
              <TagCloud>
                <Tag>무릎 정렬</Tag>
                <Tag>과도한 허리 굽힘</Tag>
                <Tag>엉덩이 깊이 부족</Tag>
              </TagCloud>
            </div>
          </ResultTable>
        </ResultCard>

        {/* 우측: 비디오 & 타임라인 */}
        <VideoCard>
          <CardTitle>비디오 리뷰</CardTitle>
          <VideoBox />
          <Timeline>
            {timeline.map((row, idx) => (
              <TimelineRow key={idx}>
                <div>{row.t}</div>
                <div>{row.part}</div>
                <div>{row.issue}</div>
                <div style={{ textAlign: "right" }}>
                  <Pill color={idx === 2 ? "#fde68a" : "#e5e7eb"}>
                    {row.status}
                  </Pill>
                </div>
              </TimelineRow>
            ))}
          </Timeline>
        </VideoCard>
      </TopGrid>

      <GridTwo>
        <RecoCard>
          <CardTitle>추천 운동</CardTitle>
          <RecoRow>
            <RecoBtn>플랭크</RecoBtn>
            <RecoBtn>푸쉬업</RecoBtn>
          </RecoRow>
        </RecoCard>
      </GridTwo>

      <FeedbackCard>
        <CardTitle>피드백</CardTitle>
        <div
          style={{
            background: "#fff",
            padding: 16,
            borderRadius: 10,
            border: "1px solid #e5e7eb",
          }}
        >
          스쿼트를 할 때는 등을 곧게 펴고 무릎 정렬에 신경을 더 써야합니다.
        </div>
        <Actions>
          <ActionBtn onClick={() => navigate("/camera")}>다시하기</ActionBtn>
          <ActionBtn variant="ghost" onClick={() => navigate("/exercise")}>
            다른 운동하러 가기
          </ActionBtn>
        </Actions>
      </FeedbackCard>
    </Page>
  );
};

export default ExerciseResult;
