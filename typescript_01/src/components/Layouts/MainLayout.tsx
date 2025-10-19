import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import Header from "../Header";
import Footer from "../Footer";

interface MainLayoutProps {
  children: React.ReactNode;
  isWorkoutActive?: boolean;
  isWorkoutPaused?: boolean;
  onToggleWorkout?: () => void;
  onEndWorkout?: () => void;
  timer?: string;
  workoutData?: {
    name: string;
    reps: number;
    sets: number;
    category: string;
  } | null;
}

// 애니메이션 키프레임
const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

// Styled Components
const MainLayoutContainer = styled.div<{ isTransitioning?: boolean }>`
  min-height: 100vh;
  background-color: white;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    sans-serif;
  animation: ${(props) => (props.isTransitioning ? fadeOut : slideIn)} 0.3s
    ease-in-out;
`;

// const Header = styled.header`
//   background-color: white;
//   padding: 20px;
//   border-bottom: 1px solid #e0e0e0;
//   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
// `;

// const HeaderContent = styled.div`
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   max-width: 1200px;
//   margin: 0 auto;
// `;

// const HeaderLeft = styled.div`
//   flex: 1;
// `;

// const HeaderCenter = styled.div`
//   flex: 1;
//   display: flex;
//   justify-content: center;
// `;

// const HeaderRight = styled.div`
//   flex: 1;
//   display: flex;
//   justify-content: flex-end;
//   gap: 10px;
// `;

// const HeaderLogo = styled.h1`
//   margin: 0;
//   font-size: 28px;
//   font-weight: 700;
//   color: #850000;
//   text-align: center;
//   cursor: pointer;
// `;

const Navigation = styled.nav`
  background-color: #f8f9fa;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
`;

const NavItems = styled.div`
  display: flex;
  gap: 30px;
`;

const NavItem = styled.span`
  color: #666;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s;
  font-weight: 500;

  &:hover {
    color: #850000;
  }
`;

const AuthButton = styled.button`
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  font-weight: 500;

  &:hover {
    background-color: #f0f0f0;
    border-color: #850000;
    color: #850000;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  height: calc(100vh - 140px);
  width: 100%;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const Sidebar = styled.aside`
  width: 350px;
  background-color: #f8f9fa;
  padding: 20px;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow-y: auto;
`;

const EndWorkoutButton = styled.button`
  background-color: #850000;
  color: white;
  border: none;
  padding: 25px 30px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 700;
  transition: background-color 0.2s;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #6b0000;
  }
`;

const TimerSection = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 2px solid #e0e0e0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100px;
`;

const TimerDisplay = styled.div`
  font-size: 36px;
  font-weight: 700;

  color: #333;
  font-family: "Courier New", monospace;
`;

const WorkoutStats = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  border: 1px solid #e9ecef;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  flex: 1;
  min-height: 180px;
  position: relative;
  overflow: visible;
  padding-bottom: 16px;
`;

const StatsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  gap: 20px;
`;

const StatItem = styled.div`
  text-align: center;
  flex: 1;
  padding: 10px 8px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  border: 1px solid rgba(133, 0, 0, 0.1);
  transition: all 0.3s ease;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 800;
  color: #850000;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: "Segoe UI", sans-serif;
`;

const StopExerciseButton = styled.button<{ isPaused?: boolean }>`
  background: ${(props) => (props.isPaused ? "#28a745" : "#850000")};
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 0 0 2px 0;
  box-sizing: border-box;

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ExerciseSelection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
  min-height: 200px;
`;

const ExerciseGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  flex: 1;
`;

const ExerciseButton = styled.button`
  background-color: white;
  color: #333;
  border: 2px solid #ddd;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 45px;

  &:hover {
    background-color: #f0f0f0;
    border-color: #850000;
    color: #850000;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const OtherExercises = styled.div`
  color: #666;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s;
  text-align: center;
  padding: 10px;
  font-weight: 500;

  &:hover {
    color: #850000;
  }
`;

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  isWorkoutActive = false,
  isWorkoutPaused = false,
  onToggleWorkout,
  onEndWorkout,
  timer = "0:00",
  workoutData = null,
}) => {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLogoClick = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate("/main");
    }, 300);
  };

  // 운동 분류별 데이터
  const exerciseCategories = {
    하체: ["스쿼트", "점프스쿼트", "런지", "월마운틴클라이머"],
    상체: ["푸쉬업", "플랭크", "사이드플랭크", "마운틴클라이머"],
    어깨: ["숄더프레스", "레터럴레이즈", "프론트레이즈", "리어델트플라이"],
    팔: ["버피", "트라이셉딥", "바이셉컬", "해머컬"],
  };

  const currentCategoryExercises = workoutData?.category
    ? exerciseCategories[
        workoutData.category as keyof typeof exerciseCategories
      ] || []
    : [];
  return (
    <MainLayoutContainer isTransitioning={isTransitioning}>
      {/* 헤더 */}
      <Header />
      {/* <Header>
        <HeaderContent>
          <HeaderLeft></HeaderLeft>
          <HeaderCenter>
            <HeaderLogo onClick={handleLogoClick}>자세온</HeaderLogo>
          </HeaderCenter>
          <HeaderRight>
            <AuthButton>로그인</AuthButton>
            <AuthButton>회원가입</AuthButton>
          </HeaderRight>
        </HeaderContent>
      </Header>

      {/* 네비게이션 
      <Navigation>
        <NavItems>
          <NavItem>Nav1</NavItem>
          <NavItem>Nav2</NavItem>
          <NavItem>Nav3</NavItem>
        </NavItems>
      </Navigation> */}

      {/* 메인 콘텐츠 영역 */}
      <ContentContainer>
        <MainContent>{children}</MainContent>

        {/* 사이드바 */}
        <Sidebar>
          {/* 운동 끝내기 버튼 */}
          <EndWorkoutButton onClick={onEndWorkout}>
            운동 끝내기
          </EndWorkoutButton>

          {/* 타이머 */}
          <TimerSection>
            <TimerDisplay>{timer}</TimerDisplay>
          </TimerSection>

          {/* 운동 통계 */}
          <WorkoutStats>
            <StatsRow>
              <StatItem>
                <StatLabel>횟수</StatLabel>
                <StatValue>{workoutData?.reps || 0}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>세트</StatLabel>
                <StatValue>{workoutData?.sets || 0}</StatValue>
              </StatItem>
            </StatsRow>
            <StopExerciseButton
              onClick={onToggleWorkout}
              disabled={!isWorkoutActive}
              isPaused={isWorkoutPaused}
            >
              {!isWorkoutActive
                ? "운동 대기 중"
                : isWorkoutPaused
                ? "운동 다시 시작"
                : "운동 정지"}
            </StopExerciseButton>
          </WorkoutStats>

          {/* 운동 선택 */}
          <ExerciseSelection>
            {currentCategoryExercises.length > 0 ? (
              <>
                <ExerciseGrid>
                  {currentCategoryExercises.slice(0, 4).map((exercise) => (
                    <ExerciseButton
                      key={exercise}
                      style={{
                        backgroundColor:
                          workoutData?.name === exercise ? "#850000" : "white",
                        color:
                          workoutData?.name === exercise ? "white" : "#333",
                        borderColor:
                          workoutData?.name === exercise ? "#850000" : "#ddd",
                      }}
                    >
                      {exercise}
                    </ExerciseButton>
                  ))}
                </ExerciseGrid>
                <OtherExercises onClick={() => navigate("/exercise")}>
                  <span>&gt; 다른 운동하러 가기</span>
                </OtherExercises>
              </>
            ) : (
              <>
                <ExerciseGrid>
                  <ExerciseButton>스쿼트</ExerciseButton>
                  <ExerciseButton>푸쉬업</ExerciseButton>
                  <ExerciseButton>플랭크</ExerciseButton>
                  <ExerciseButton>런지</ExerciseButton>
                </ExerciseGrid>
                <OtherExercises onClick={() => navigate("/exercise")}>
                  <span>&gt; 다른 운동하러 가기</span>
                </OtherExercises>
              </>
            )}
          </ExerciseSelection>
        </Sidebar>
      </ContentContainer>

      {/* 푸터 */}
      <Footer />
    </MainLayoutContainer>
  );
};

export default MainLayout;
