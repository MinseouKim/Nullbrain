import React, { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

import Header from "../components/Header";
import Footer from "../components/Footer";
import MeasureOrchestrator, {
  MeasureResult,
  ResultModal,
  StepId,
} from "../measure/MeasureOrchestrator";
import BodyAnalysisModal, {
  BodyDataForStart,
} from "../components/BodyAnalysisModal";
import CompletionModal from "../components/CompletionModal";

// --- 단계별 이미지 맵 ---
const poseImageMap: Record<StepId, string | string[]> = {
  full: "/images/전신_정면.png",
  tpose: "/images/전면_T자세.png",
  side: "/images/전신_측면.png",
  waist_flex: "/images/무릎.png", // <-- 허리굽힘 이미지로 수정해야함
  squat: "/images/전신_정면.png", // 이 줄이 누락되었습니다.
  elbow_flex: "/images/팔꿈치.png",
  shoulder_abd: "/images/팔올림.png",
  neck_rom: ["/images/고개숙임.png", "/images/고개듦.png"],
  done: "/images/전신_정면.png",
};

// --- 스타일 컴포넌트 (기존과 동일) ---
const MainLayoutContainer = styled.div`
  min-height: 100vh;
  background-color: white;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    sans-serif;
  display: flex;
  flex-direction: column;
`;
const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
`;
const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 20px;
  gap: 20px;
`;
const FeedbackBox = styled.div`
  background: #f8f9fa;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e9ecef;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #333;
`;
const CameraWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e9ecef;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
`;
const Sidebar = styled.aside`
  width: 350px;
  background-color: #f8f9fa;
  padding: 20px;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  flex-shrink: 0;
`;
const EndAnalysisButton = styled.button`
  background-color: #850000;
  color: white;
  border: none;
  padding: 25px 30px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 700;
  min-height: 80px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  &:hover {
    background-color: #6b0000;
  }
`;
const ControlBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const GuideBox = styled.div`
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: #850000;
  }
  ul {
    margin: 0;
    padding-left: 0;
    list-style: none;
    font-size: 14px;
    color: #666;
    line-height: 1.6;
  }
`;
const InfoBox = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  border: 1px solid #e9ecef;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #850000 0%, #ff6b6b 100%);
  }
  h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: #850000;
  }
  ul {
    margin: 0;
    padding-left: 0;
    list-style: none;
    font-size: 14px;
    color: #666;
    line-height: 1.6;
  }
`;
const PoseImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
`;
const ActionButton = styled.button<{ isStopped?: boolean }>`
  margin-top: auto;
  background: ${(props) =>
    props.isStopped
      ? "linear-gradient(135deg, #28a745 0%, #20c997 100%)"
      : "linear-gradient(135deg, #850000 0%, #a00000 100%)"};
  color: white;
  border: none;
  padding: 18px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: ${(props) =>
    props.isStopped
      ? "0 6px 16px rgba(40, 167, 69, 0.3)"
      : "0 6px 16px rgba(133, 0, 0, 0.3)"};
  &:hover:not(:disabled) {
    background: ${(props) =>
      props.isStopped
        ? "linear-gradient(135deg, #218838 0%, #1ea085 100%)"
        : "linear-gradient(135deg, #6b0000 0%, #8b0000 100%)"};
    transform: translateY(-3px);
    box-shadow: ${(props) =>
      props.isStopped
        ? "0 8px 20px rgba(40, 167, 69, 0.4)"
        : "0 8px 20px rgba(133, 0, 0, 0.4)"};
  }
  &:disabled {
    background: linear-gradient(135deg, #ccc 0%, #999 100%);
    cursor: not-allowed;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    opacity: 0.7;
  }
`;

const ToggleSwitchLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
`;
const HiddenCheckbox = styled.input.attrs({ type: "checkbox" })`
  opacity: 0;
  width: 0;
  height: 0;
`;
const SliderSpan = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
  &:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;
const StyledToggleSwitch = styled.div`
  ${HiddenCheckbox}:checked + ${SliderSpan} {
    background-color: #850000;
  }
  ${HiddenCheckbox}:checked + ${SliderSpan}:before {
    transform: translateX(26px);
  }
`;
const ControlRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
`;

const BodyAnalysis: React.FC = () => {
  const [openModal, setOpenModal] = useState(true);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [isVoiceOn, setIsVoiceOn] = useState(true);
  const [result, setResult] = useState<MeasureResult | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);
  const userId = user?.id ?? "dev-user-01";

  // 현재 측정 단계를 저장하기 위한 state
  const [currentStepId, setCurrentStepId] = useState<StepId>("full");

  const [currentPoseImage, setCurrentPoseImage] = useState<string>("");
  useEffect(() => {
    const imagePaths = poseImageMap[currentStepId];
    let intervalId: NodeJS.Timeout | null = null;

    if (Array.isArray(imagePaths)) {
      // 이미지가 배열인 경우 (neck_rom)
      let imageIndex = 0;
      setCurrentPoseImage(imagePaths[imageIndex]); // 첫 이미지로 즉시 설정

      intervalId = setInterval(() => {
        imageIndex = (imageIndex + 1) % imagePaths.length;
        setCurrentPoseImage(imagePaths[imageIndex]);
      }, 2000); // 2초 간격
    } else if (typeof imagePaths === "string") {
      // 이미지가 단일 문자열인 경우
      setCurrentPoseImage(imagePaths);
    }

    // currentStepId가 변경될 때 이전 interval을 정리합니다. (메모리 누수 방지)
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentStepId]);

  // 결과 요약 모달
  const [resultModalOpen, setResultModalOpen] = useState(false);

  const onStart = (data: BodyDataForStart) => {
    setHeightCm(data.height);
    setOpenModal(false);
  };

  const handleEndAnalysis = () => {
    setResult(null);
    setSavedId(null);
    navigate("/main");
  };

  const handleNavigateToWorkout = () => {
    navigate("/workout-items");
  };

  // MeasureOrchestrator로부터 단계 변경 신호를 받아 state를 업데이트하는 함수
  const handleStepChange = (stepId: StepId) => {
    setCurrentStepId(stepId);
  };

  const saveProfile = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const payload = {
        userId,
        version: 2,
        body: { height_cm: heightCm },
        measures: result,
      };
      const base =
        (import.meta as any)?.env?.VITE_API_BASE ?? "http://localhost:8000";
      const res = await fetch(`${base}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const js = await res.json();
      if (js.ok) {
        setSavedId(js.id);
        alert("프로필이 저장되었습니다.");
        setResultModalOpen(false);
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const getFeedbackMessage = () => {
    if (result) {
      return "측정 완료! 결과를 확인하고 저장하세요.";
    }
    if (!openModal) {
      return "체형 측정을 시작합니다. 안내에 따라주세요.";
    }
    return "신체 정보를 입력하고 분석을 시작해주세요.";
  };

  return (
    <>
      <Header />
      <MainLayoutContainer>
        <ContentContainer>
          <MainContent>
            {/* ✅ 완료 후에도 화면 전환 없이 계속 카메라/측정 유지 */}
            <MeasureOrchestrator heightCm={heightCm} onDone={setResult} />
          </MainContent>

          <Sidebar>
            <EndAnalysisButton onClick={handleEndAnalysis}>
              분석 종료
            </EndAnalysisButton>
            <InfoBox>
              <ControlRow>
                <span>음성 안내</span>
                <StyledToggleSwitch>
                  <ToggleSwitchLabel>
                    <HiddenCheckbox
                      checked={isVoiceOn}
                      onChange={() => alert("미구현 서비스입니다.")}
                    />
                    <SliderSpan />
                  </ToggleSwitchLabel>
                </StyledToggleSwitch>
              </ControlRow>
            </InfoBox>
            <InfoBox>
              <h3>[ 의상 가이드 ]</h3>
              <ul>
                <li>밝은 조명 아래에서 촬영해주세요</li>
                <li>헐렁하지 않은 옷을 착용해주세요</li>
                <li>어두운 배경에 밝은 옷이 좋아요</li>
              </ul>
            </InfoBox>
            <InfoBox style={{ flex: 1 }}>
              <PoseImage src={currentPoseImage} alt="분석 자세 가이드" />
            </InfoBox>
            {/*       
      <SaveButton onClick={saveProfile} disabled={!result || saving}>
              {saving ? "저장 중..." : "프로필 저장하기"}
            </SaveButton>
            {savedId && (
              <p style={{ margin: 0, color: "#555" }}>
                저장됨: <code>{savedId}</code>
              </p>
            )}
          </Sidebar>
           */}
            <ActionButton
              onClick={() => {
                if (result) {
                  setResultModalOpen(true);
                  saveProfile();
                }
              }}
              disabled={!result || saving}
            >
              {saving
                ? "저장 중..."
                : result
                ? "프로필 저장하기"
                : "측정 진행 중…"}
            </ActionButton>

            {result && !savedId && (
              <p
                style={{ margin: "8px 0 0", color: "#198754", fontWeight: 600 }}
              >
                측정 완료 ✅ — 결과 요약을 확인하려면 버튼을 눌러주세요.
              </p>
            )}

            {savedId && (
              <p style={{ margin: 0, color: "#555" }}>
                저장됨: <code>{savedId}</code>
              </p>
            )}
          </Sidebar>
        </ContentContainer>

        <BodyAnalysisModal isOpen={openModal} onStart={onStart} />

        <CompletionModal
          isOpen={showCompletionModal}
          onNavigate={handleNavigateToWorkout}
        />
      </MainLayoutContainer>

      {/* 결과 요약 모달 */}
      <ResultModal
        open={resultModalOpen}
        result={result}
        onClose={() => setResultModalOpen(false)}
        onSave={saveProfile}
      />

      <Footer />
    </>
  );
};

export default BodyAnalysis;
