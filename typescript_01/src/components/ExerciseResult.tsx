import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import dummy from "../datas/dummydata.json"; // ✅ 더미데이터 import

// ✅ 테스트 모드 전환
const isTestMode = true;

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

const ResultCard = styled(Card)`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

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

const VideoCard = styled(Card)`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
`;

const VideoBox = styled.div`
  background: #e5e5e5;
  min-height: 300px;
  flex: 1;
  border-radius: 10px;
  border: 1px solid #dcdcdc;
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

const FeedbackCard = styled(Card)`
  max-width: 1200px;
  width: 100%;
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

  const [overallFeedback, setOverallFeedback] = useState<string>("로딩 중...");
  const [improvementTips, setImprovementTips] = useState<string[]>([]);

  useEffect(() => {
    if (!isTestMode && (!workoutPlan || !performanceData)) {
      alert("운동 기록이 없습니다. 메인 페이지로 이동합니다.");
      navigate("/");
    }
  }, [workoutPlan, performanceData, navigate]);

  const summaryData = useMemo(() => {
    // 1️⃣ 테스트 모드일 경우: 더미데이터 사용
    if (isTestMode) {
      const { workoutPlan, performanceData } = dummy;

      const { name, reps, sets } = workoutPlan;
      const { finalTime, allSetResults } = performanceData;

      const errorTags = new Set<string>();
      allSetResults.forEach((r: any) => {
        if (r.analysisData?.["운동 가동범위"]?.includes("부족"))
          errorTags.add("가동범위 부족");
        if (r.analysisData?.["좌우 대칭성"]?.includes("불균형"))
          errorTags.add("좌우 불균형");
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
        errorTags: Array.from(errorTags),
        accuracy: Math.round(avgAccuracy),
        kcal: Math.round(totalCalories),
        allSetResults,
      };
    }

    // 2️⃣ 실제 데이터 모드
    if (!workoutPlan || !performanceData) {
      return {
        name: "로딩 중",
        totalReps: 0,
        finalTime: "0:00",
        errorTags: [],
        accuracy: 0,
        kcal: 0,
        allSetResults: [],
      };
    }

    const { name, reps, sets } = workoutPlan;
    const { finalTime, allSetResults } = performanceData;

    const errorTags = new Set<string>();
    allSetResults.forEach((r: any) => {
      if (r.analysisData?.["운동 가동범위"]?.includes("부족"))
        errorTags.add("가동범위 부족");
      if (r.analysisData?.["좌우 대칭성"]?.includes("불균형"))
        errorTags.add("좌우 불균형");
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
      errorTags: Array.from(errorTags),
      accuracy: Math.round(avgAccuracy),
      kcal: Math.round(totalCalories),
      allSetResults,
    };
  }, [workoutPlan, performanceData]);

  // ✅ 전체 피드백 요청
  useEffect(() => {
    const fetchOverallFeedback = async () => {
      if (!summaryData?.allSetResults) return;
      try {
        const res = await fetch("http://localhost:8000/api/feedback/overall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ set_results: summaryData.allSetResults }),
        });
        const data = await res.json();
        setOverallFeedback(data.overall_feedback || "피드백 생성 실패");
        setImprovementTips(data.improvement_tips || []);
      } catch (err) {
        setOverallFeedback("⚠️ 종합 피드백 요청 실패");
      }
    };
    fetchOverallFeedback();
  }, [summaryData]);

  return (
    <Page>
      <SectionHeadline>운동 분석 결과</SectionHeadline>

      <TopGrid>
        {/* 좌측 요약 카드 */}
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
              <ResultValue>{summaryData.kcal} kcal</ResultValue>
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

        {/* 우측 영상 카드 */}
        <VideoCard>
          <CardTitle>운동 영상</CardTitle>
          <VideoBox />
        </VideoCard>
      </TopGrid>

      {/* ✅ 종합 피드백 + 개선 팁 */}
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
          {overallFeedback}
        </div>

        {improvementTips.length > 0 && (
          <div
            style={{
              background: "#fff",
              marginTop: 10,
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              lineHeight: 1.6,
            }}
          >
            <strong>✨ 개선 포인트</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {improvementTips.map((tip, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

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
