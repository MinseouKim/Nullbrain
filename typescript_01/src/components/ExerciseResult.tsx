import React, { useEffect, useMemo } from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";

// 레이아웃 컨테이너
const Page = styled.div`
  width: 100%;
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 16px;
  box-sizing: border-box;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #111;
`;

// 상단 2열 레이아웃
const TopGrid = styled.div`
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 12px;
  align-items: stretch;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.section`
  background: #f3f3f3;
  border-radius: 12px;
  padding: 10px;
  box-sizing: border-box;
`;

const CardTitle = styled.h3`
  margin: 0 0 12px 0;
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
  gap: 6px;
  align-items: center;
  padding: 12px 14px;
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
  gap: 12px;
`;

// 우측: 비디오 영역 및 타임라인 리스트
const VideoBox = styled.div`
  background: #e5e5e5;
  min-height: 300px;
  flex: 1;
  border-radius: 10px;
  border: 1px solid #dcdcdc;
`;

const Timeline = styled.div`
  margin-top: 0;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  flex: 0 0 120px;
  display: flex;
  flex-direction: column;
`;

const TimelineRow = styled.div`
  display: grid;
  grid-template-columns: 90px 1fr 100px 60px;
  gap: 6px;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
  background: #fff;

  &:last-child {
    border-bottom: none;
  }
`;

const Pill = styled.span<{ color?: string }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${(p) => p.color || "#f1f5f9"};
  color: #111;
  font-weight: 600;
  text-align: center;
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
`;

// 추천 운동 카드가 상단의 "운동 결과" 카드와 동일한 가로 폭을 갖도록
// TopGrid가 grid-template-columns: 1fr 1.3fr 이므로 왼쪽 폭 비율은 1/2.3
const RecoCard = styled(Card)`
  width: calc(100% / 2.3);
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
  const location = useLocation();

  const workoutPlan = location.state?.workoutPlan;
  const performanceData = location.state?.performanceData;

  useEffect(() => {
    if (!workoutPlan || !performanceData) {
      alert("운동 기록이 없습니다. 메인 페이지로 이동합니다.");
      navigate("/");
    }
  }, [workoutPlan, performanceData, navigate]);

  const summaryData = useMemo(() => {
    if (!workoutPlan || !performanceData) return null;

    const { name, reps, sets } = workoutPlan;
    const { finalTime, allSetResults } = performanceData;

    const finalFeedback = allSetResults.map((r: any) => r.aiFeedback).join(" ");

    const errorTags = new Set<string>();
    allSetResults.forEach((r: any) => {
      if (
        r.analysisData?.["운동 가동범위"] &&
        r.analysisData["운동 가동범위"].includes("부족")
      ) {
        errorTags.add("엉덩이 깊이 부족");
      }
      if (
        r.analysisData?.["좌우 대칭성"] &&
        r.analysisData["좌우 대칭성"].includes("불균형")
      ) {
        errorTags.add("무릎 정렬 불균형");
      }
    });

    const totalCalories = allSetResults.reduce(
      (sum: number, r: any) => sum + (r.stats?.calories || 0),
      0
    );
    const avgAccuracy =
      allSetResults.length > 0
        ? allSetResults.reduce(
            (sum: number, r: any) => sum + (r.stats?.accuracy || 0),
            0
          ) / allSetResults.length
        : 0;

    return {
      name,
      totalReps: reps * sets,
      finalTime,
      finalFeedback,
      errorTags: Array.from(errorTags),
      accuracy: Math.round(avgAccuracy),
      kcal: Math.round(totalCalories),
    };
  }, [workoutPlan, performanceData]);

  if (!summaryData) {
    return (
      <Page>
        <h2>운동 결과를 불러오는 중...</h2>
      </Page>
    );
  }

  return (
    <Page>
      <SectionHeadline>운동 분석 결과</SectionHeadline>
      <TopGrid>
        <ResultCard>
          <CardTitle>운동 요약</CardTitle>
          <ResultTable>
            <ResultRow>
              <ResultLabel>운동</ResultLabel>
              <ResultValue>{summaryData.name}</ResultValue>
            </ResultRow>
            <ResultRow>
              <ResultLabel>총 반복 횟수</ResultLabel>
              <ResultValue>{summaryData.totalReps}회</ResultValue>
            </ResultRow>
            <ResultRow>
              <ResultLabel>평균 정확도</ResultLabel>
              <ResultValue>{summaryData.accuracy}%</ResultValue>
            </ResultRow>
            <ResultRow>
              <ResultLabel>총 운동시간</ResultLabel>
              <ResultValue>{summaryData.finalTime}</ResultValue>
            </ResultRow>
            <ResultRow>
              <ResultLabel>소모 칼로리</ResultLabel>
              <ResultValue>{summaryData.kcal}kcal</ResultValue>
            </ResultRow>
            <div
              style={{
                padding: 10,
                borderTop: "1px solid #f0f0f0",
                background: "#fff",
              }}
            >
              <CardTitle style={{ fontSize: 14, margin: "0 0 8px 0" }}>
                주요 자세 오류
              </CardTitle>
              <TagCloud>
                {summaryData.errorTags.length > 0 ? (
                  summaryData.errorTags.map((tag: string) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))
                ) : (
                  <Tag>완벽한 자세입니다!</Tag>
                )}
              </TagCloud>
            </div>
          </ResultTable>
        </ResultCard>

        {/* (우측 카드 생략) */}
      </TopGrid>

      {/* (추천 운동 생략) */}

      <FeedbackCard>
        <CardTitle>종합 피드백</CardTitle>
        <div
          style={{
            background: "#fff",
            padding: 16,
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            lineHeight: 1.6,
          }}
        >
          {summaryData.finalFeedback}
        </div>
        <Actions>
          <ActionBtn onClick={() => navigate(-1)}>다시하기</ActionBtn>
          <ActionBtn variant="ghost" onClick={() => navigate("/main")}>
            메인으로 가기
          </ActionBtn>
        </Actions>
      </FeedbackCard>
    </Page>
  );
};

export default ExerciseResult;
