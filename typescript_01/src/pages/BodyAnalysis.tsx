// src/pages/BodyAnalysis.tsx
import React, { useState } from "react";
import styled from "styled-components";

import Header from "../components/Header";
import Footer from "../components/Footer";
import MeasureOrchestrator, { MeasureResult } from "../measure/MeasureOrchestrator";
import BodyAnalysisModal, {
  BodyDataForStart,
} from "../components/BodyAnalysisModal";

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
  padding: 24px;
  box-sizing: border-box;
  gap: 32px;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
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

const PosePreview = styled.div`
  flex: 1;
  min-height: 150px;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #ddd;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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

const BodyAnalysis: React.FC = () => {
  const [openModal, setOpenModal] = useState(true);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [isVoiceOn, setIsVoiceOn] = useState(true);
  const [result, setResult] = useState<MeasureResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const onStart = (data: BodyDataForStart) => {
    setHeightCm(data.height);
    setOpenModal(false);
  };

  const saveProfile = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const payload = {
        version: 2,
        body: { height_cm: heightCm },
        measures: result,
      };
      const base = (import.meta as any)?.env?.VITE_API_BASE ?? "http://localhost:8000";
      const res = await fetch(`${base}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const js = await res.json();
      if (js.ok) setSavedId(js.id);
    } catch (e) {
      console.error(e);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <MainLayoutContainer>
        <ContentContainer>
          <MainContent>
            {!result ? (
              <MeasureOrchestrator heightCm={heightCm} onDone={setResult} />
            ) : (
              <div style={{ padding: 24 }}>
                <h2>측정 완료 ✅</h2>
                <p>요약을 확인한 뒤 저장하세요.</p>
                <pre
                  style={{
                    background: "#f6f6f6",
                    padding: 16,
                    borderRadius: 8,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </MainContent>

          <Sidebar>
            <ControlBox>
              <span>음성 안내</span>
              <StyledToggleSwitch>
                <ToggleSwitchLabel>
                  <HiddenCheckbox
                    checked={isVoiceOn}
                    onChange={() => setIsVoiceOn(!isVoiceOn)}
                  />
                  <SliderSpan />
                </ToggleSwitchLabel>
              </StyledToggleSwitch>
            </ControlBox>

            <GuideBox>
              <h3>[ 의상 가이드 ]</h3>
              <ul>
                <li>밝은 조명 아래에서 촬영해주세요</li>
                <li>헐렁하지 않은 옷을 착용해주세요</li>
                <li>어두운 배경에 밝은 옷이 좋아요</li>
              </ul>
            </GuideBox>

            <PosePreview>
              <PoseImage
                src="https://i.pinimg.com/236x/a3/87/33/a3873380fad4d9bd5062e5418eaffe4e.jpg"
                alt="분석 자세 가이드"
              />
            </PosePreview>

            <ActionButton onClick={saveProfile} disabled={!result || saving}>
              {saving ? "저장 중..." : "프로필 저장하기"}
            </ActionButton>
            {savedId && (
              <p style={{ margin: 0, color: "#555" }}>
                저장됨: <code>{savedId}</code>
              </p>
            )}
          </Sidebar>
        </ContentContainer>

        <BodyAnalysisModal
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          onStart={onStart}
        />
      </MainLayoutContainer>
      <Footer />
    </>
  );
};

export default BodyAnalysis;
