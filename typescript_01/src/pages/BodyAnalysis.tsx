import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import MeasureOrchestrator, { MeasureResult } from "../measure/MeasureOrchestrator";
import BodyAnalysisModal, {
  BodyDataForStart,
} from "../components/BodyAnalysisModal";
import CompletionModal from "../components/CompletionModal";

// --- 스타일 컴포넌트 ---
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
    &:hover { background-color: #6b0000; }
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
        top: 0; left: 0; right: 0;
        height: 4px;
        background: linear-gradient(90deg, #850000 0%, #ff6b6b 100%);
    }
    h3 { margin: 0 0 15px 0; font-size: 16px; color: #850000; }
    ul { margin: 0; padding-left: 0; list-style: none; font-size: 14px; color: #666; line-height: 1.6; }
`;

const PoseImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 8px;
`;

const SaveButton = styled.button`
    background: linear-gradient(135deg, #850000 0%, #a00000 100%);
    color: white;
    border: none;
    padding: 15px 25px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 700;
    min-height: 50px;
    margin-top: auto;
    &:disabled {
        background: linear-gradient(135deg, #ccc 0%, #999 100%);
        cursor: not-allowed;
    }
    &:hover:not(:disabled) {
        transform: translateY(-3px);
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
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background-color: #ccc; transition: 0.4s; border-radius: 34px;
  &:before { position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: 0.4s; border-radius: 50%; }
`;

const StyledToggleSwitch = styled.div`
  ${HiddenCheckbox}:checked + ${SliderSpan} { background-color: #850000; }
  ${HiddenCheckbox}:checked + ${SliderSpan}:before { transform: translateX(26px); }
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
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [result, setResult] = useState<MeasureResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (result) {
      setShowCompletionModal(true);
    }
  }, [result]);

  const onStart = (data: BodyDataForStart) => {
    setHeightCm(data.height);
    setOpenModal(false);
  };

  const handleEndAnalysis = () => {
    setResult(null);
    setSavedId(null);
    navigate('/main');
  };
  
  const handleNavigateToWorkout = () => {
    navigate('/workout-items');
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
            <FeedbackBox>
              {getFeedbackMessage()}
            </FeedbackBox>
            
            <CameraWrapper>
              {!openModal && !result ? (
                <MeasureOrchestrator heightCm={heightCm} onDone={setResult} />
              ) : (
                <div style={{ background: '#f0f2f5', width: '100%', height: '100%' }} />
              )}
            </CameraWrapper>
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
                      onChange={() => alert('미구현 서비스입니다.')}
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
              <PoseImage
                src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMQEQ4NEBIQDxIQEA8PEA8QDxAPDQ4PFhEiFxUdFRUYKCggGBolHRcTITEiJyk3Li4uFyszODMuNygtOi4BCgoKDg0OGhAQGy0lHyU3MystLy0vLi0tLS0tLystMi0tLS0yLS0tLS0tLS0tLS0tLSstLS0uLS0tLTctLzctLv/AABEIALcBEwMBEQACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAAAwYBBAUCB//EAEEQAAEDAQIGDwcDBAMBAAAAAAABAgMRBSEEEhRSk9EGFSIxMjM0QVFTcXODsrMTYYGRobHBI2LwQoKS4WNyokP/xAAZAQEAAwEBAAAAAAAAAAAAAAAAAQMEAgX/xAAxEQEAAQQBAwIEBQMFAQAAAAAAAQIDERIxBCEyQVEiYXHwEyMzgZEUscGh0eHi8iT/2gAMAwEAAhEDEQA/APpGAYFH7KFfZx8XH/8ANmanuNUzOVURGE+RRdVFo2aiNpMQZFF1UWjZqG0mIMii6qLRs1DaTEGRRdVFo2ahtJiDIouqi0bNQ2kxBkUXVRaNmobSYgyKLqotGzUNpMQZFF1UWjZqG0mIMii6qLRs1DaTEGRRdVFo2ahtJiDIouqi0bNQ2kxBkUXVRaNmobSYgyKLqotGzUNpMQZFF1UWjZqG0mIMii6qLRs1DaTEGRRdVFo2ahtJiDIouqi0bNQ2kxBkUXVRaNmobSYgyKLqotGzUNpMQZFF1UWjZqG0mIMii6qLRs1DaTEGRRdVFo2ahtJiDIouqi0bNQ2kxBkUXVRaNmobSYgyKLqotGzUNpMQZFF1UWjZqG0mIMii6qLRs1DaTEGRRdVFo2ahtJiDIouqi0bNQ2kxBkUXVRaNmobSYgyKLqotGzUNpMQZFF1UWjZqG0mIMii6qLRs1DaTEKJsnhamFTIjWon6dyNRE4tDTbn4VVURle7P4qHuo/IhmnlbHCchIAAAAAAAAAAAAAAAArds7L44HpDGx+ESc7Y+a+hlr6qInELqLM1RlPY2yePCHJG5qwSKtEY9a1XordedUdRTVOJRVaml3TQqAAAAAAAAAAAAAAAAACg7KuVTeH6TTVb8YVVcrvZ/FQ91H5EM08rI4TkJAAAAAAAAAAAAAAAIMOcqRSq1aKkb1RehcVaHFyZiicezqiM1QoOx39J6RvY5ZJd26TFcqJXgoq0pvU5zxZjtl6seyK1sHfhCvljjfE+HGoqorUkolWqi9NUQnhFUZfRMCkV0cT133MYq9qtv+p7NudqIl5dcYqmEx25AAAAAAAAAAAAAAAAFB2Vcqm8P0mmq34wqq5Xez+Kh7qPyIZp5WRwnISAAAAAAAAAAAAAAAYc1FRUW9FSiou8qETGe0mcK3asSxUjZulo1W1crVxUu37+g8e9ai3Xj0erYufiRmU1nN9pSN9Kq1cZEdjXU6VFm3FyvX0Rer0pzDvMaiIjUuREREToRD2IiIjEPMmZmcyySgAAAAAAAAAAAAAAAAUHZVyqbw/SaarfjCqrld7P4qHuo/IhmnlZHCchIAAAAAAAAAAAAAABG+dqJVVT4XqVVXqKYzMu6bdVXEK9alZpEdSiNSjek8nqLs3K8+j0bFGlOGcBcsT2uRLt5elUIsV/h17JvUb04WBk7VRFql96VWi79D16b1FXEvNqt1U8wkLXAAAAAAAAAAAAAAAAAoOyrlU3h+k01W/GFVXK72fxUPdR+RDNPKyOE5CQAAAAAAAAAAAAAHNtedW4rUWiUVzuzm/J5/XXJjFMNnS24nNUtmyomujqqIuMt9U6CizTE0rLkzFSfa+PN/wDTjv8ACp9nP4lXuymAxotcVK+9VURbpgmuqfVrW01Eax/vxfhSqfZSu/HaJdWeZhFZcyrjNVa0RFTs/lDR0VyZzTKrqqIjFUN89BkAAAAAAAAAAAAAAAKDsq5VN4fpNNVvxhVVyu9n8VD3UfkQzTysjhOQkAAAAAAAAAAAAABxLc4fh/lTyuu/Uj6PR6Pwn6ptieEY2DJVaq2SVir2PVE+lCLfalF2Pjl2UcWZVikjj7KZ8WFjeeSVrEXouVVX5IvzKrvelbZj4nix+F/Yv3Qnoo/M/ZHV+P7uueq88AAAAAAAAAAAAAAAoOyrlU3h+k01W/GFVXK72fxUPdR+RDNPKyOE5CQAAAAAAAAAAAAAHDt3hp3afdTyuu/Uj6PR6Pwn6tywIEZBEic6K9e1zld+TvXFFP0V1VZrq+rqIShmoHI2SR40Vc18bk/yp+SK6fyqp+jq1V+bEI7FTdP9zUT5r/odD5VSnrOIdY9JgAAAAAAAAAAAAAAAKDsq5VN4fpNNVvxhVVyu9n8VD3UfkQzTysjhOQkAAAAAAAAAAAAABXdkL6ud+1Gp8KV/J4/W1Zu49nqdHGLf1dPA8Ge6GBUesapEy7FRf6SyrNdNMROMQpjFNdUzGcyyuCTpvSY39yoVaXPdZtR7M5PhHM9E7VRfwTrd9za37NW2IpW4PIsjkfV0XBTg7tPcnuO5muLVUVIo1m7TMMWA7hV31ai/Jf8AZ30E96oc9bHaHYPSYAAAAAAAAAAAAAAACg7KuVTeH6TTVb8YVVcrvZ/FQ91H5EM08rI4TkJAAAAAAAAAAAAAAVq1m40qxdZLHH2I6iL9KnjdRGb8x98PVsVYsxK0+4vZipIyigQWlF7SGaNN90b0T/tS760ImMxhNM4mJcfY+/G3SbyxtX5qOhj4pd9bxDtHpPPAAAAAAAAAAAAAAAKDsq5VN4fpNNVvxhVVyu9n8VD3UfkQzTysjhOQkAAAAAAAAAAAAABxJ2plkVc+qdqQLQ8u9H/0S9C3P5H37u8dq2KgekUDEj0a1zl3kRVXsRAOLsbZuFcu+qMSnRdX8nfRR5SnrJ70w65uYgAAAAAAAAAAAAAACg7KuVTeH6TTVb8YVVcrvZ/FQ91H5EM08rI4TkJAAAAAAAAAAAAAAcLDJESdXrdiPaqfBtF+iqeReq/Pl6dmnNmIWBqlyh4whd6n8uJiMo4ekIS0rampErc/c/Cl/wBPucV1YhZao2qRWLwX/wDZPsX9F4z9VfWecOgbWMAAAAAAAAAAAAAAAoOyrlU3h+k01W/GFVXK72fxUPdR+RDNPKyOE5CQAAAAAAAAAAAAAHBtvA5aufE32jXY2M1KLJVU/prTnr8zBes1bzMR2lvsXqdYiqcTH8O7FvJ2IcQ4lmS/5KXWYzM/RXcnEDFuQphbLj2+5caFMRZMbGTFvou9vqm8c1cwttcT3w3LLwdWM3VyuWqpzom8n895s6a3NFHfmWXqbkV19uG4aGcAAAAAAAAAAAAAAAoOyrlU3h+k01W/GFVXK72fxUPdR+RDNPKyOE5CQAAAAAAAAAAAAAAAYK4xVMNVE5gXfLbHlLi7wwwonmVkcPbuYvsR3mVV2fR5NSkAAAAAAAAAAAAAAAAUHZVyqbw/SaarfjCqrld7P4qHuo/IhmnlZHCchIAAAAAAAAAAAAAABkx3vOWi34sKd9P6ubvowzn7SmuMVyson4Ye3cxfY4lVd5eTQqAAAAAAAAAAAAAAAAFB2Vcqm8P0mmq34wqq5Xez+Kh7qPyIZp5WRwnISAAAAAAAAAAAAAAAQLhTKq1XIitWiotx592uN5bLdE6w9QTNfXFWtFoq++ho6aYmmVN+mYmMsrIiOxaoi0rSt9Cu/iK3dqJml79oirioqKtK0S+466eqMzDm9HaJZNSgAAAAAAAAAAAAAAAAUHZVyqbw/SaarfjCqrld7P4qHuo/IhmnlZHCchIAAAAAAAAAAAAAABw7XZiyVzkRfil34PN6qnFefd6HS1Zox7NqweA9f3r5UL+j8J+qnq/OPogtrjGL+38lXWeULOl8ZT2Q3hu7E/n0Oujp5lz1U8Q6RuYwAAAAAAAAAAAAAAABQdlXKpvD9Jpqt+MKquV3s/ioe6j8iGaeVkcJyEgAAAAAAAAAAAAAAHNt2PcNfmup8F/3Qy9XTmnLV0lWKse5YPFu7x32QdJ4fujq/wBRBb/Ci7H/AI1lXWc0rOj9W/ZjKRt/duvnvfSho6enFuFF+rNyW0XqQAAAAAAAAAAAAAAABQdlXKpvD9Jpqt+MKquV3s/ioe6j8iGaeVkcJyEgAAAAAAAAAAAAAAGtafFSc9yfcp6j9OpbZ/UhqWE/jWcyK1yL73JRfKhn6GrNMwu6uPiiUFuOq9rV3mxqv+TqfhCvrqviiFnSRimZdiDgs5ty27ouPQo8YYauZezpAAAAAAAAAAAAAAAAAoOyrlU3h+k01W/GFVXK72fxUPdR+RDNPKyOE5CQAAAAAAAAAAAAAADRtaajMTnf9kW8ydXcimjX3aOnomas+yKxkRFkTnVGL8q60KuhmPihZ1fpKO1o6yIv7E8ynHXR8cOuln4Zb1nzo5qN52oiL+DX013ejHrDPet61Z92yaFIAAAAAAAAAAAAAAAAoOyrlU3h+k01W/GFVXK72fxUPdR+RDNPKyOE5CQAAAAAAAAAAAAAADXw3AmzIiOrdejmrRyfyiFVy1Tcj4llu7Vb4R2dZyQ49HOdjZ1Lr1X8kWrFNrOHV29NzGYLQs5Jlaquc3FzaXpWt/yIu2KbuMlq9NvOISYFgbYW4rK+9VWrl7Tu3aptxilzcu1XJzLYLFYAAAAAAAAAAAAAAAAoOyrlU3h+k01W/GFVXL6Y2yYkRERqoiXIiSSIiJ7rzz96mjWDauLNdpJNY3qNYNq4s12kk1jeo1g2rizXaSTWN6jWDauLNdpJNY3qNYNq4s12kk1jeo1g2rizXaSTWN6jWDauLNdpJNY3qNYNq4s12kk1jeo1g2rizXaSTWN6kawbWRdDtJJrG9SdYNq4s12kk1jepGsG1cWa7SSaxvUnWDauLNdpJNY3qNYNrIuh2kk1jeo1g2rizXaSTWN6kawbVxZrtJJrG9RrBtXFmu0kmsb1GsG1cWa7SSaxvUawbVxZrtJJrG9RrBtZF0O0kmsb1J1g2ri6HaSTWN6kawbVxZrtJJrG9RrBtZF0LpJNY3qTrBtZF0O0kmsb1GsG1cWa7SSaxvUawbVxZrtJJrG9RrBtXFmu0kmsb1GsG1cWa7SSaxvUawbVxZrtJJrG9RrBtXFmu0kmsb1GsG1cWa7SSaxvUawbVxZrtJJrG9RrBtXFmu0kmsb1GsIZNj+DOVXOhY5V33Oq5y9qqT+JXHqjSn2dM4dAAAAAAANS0cGdIjUa7FVHIq30ur/P5enNUTK21XFEzmPv7+/Rq2hZ8kkbWtkorYnspRFx3OZi1VbkTpS74HNVMzHZbZv0UV5mn1ifpic/fdA6yXK+ZyLi47lckm5W/FREuREVOytOffVaxpOZWf1VOtMT3x2x95++3EQ0rQsKdzMRjmuXHVVcq0xkWBjL0VF52u5/ucVW6sYj77NFnrbMVbVRj/1M/wBp9nSweznJhDp16bnVbVU9miX3V5t7eurQsimdssld+JsxRH33+/mjdZ86ua9FY1GyTuRvtHORWvciot7bnUR6e7G31SqLGtWXcX7WsxMT3iPT2ifnxxPzx+72yy5FTCW+1ViTUaiovtHMRXOV6oqo2jlR2Km/TETfpQaT378uZ6i3midc6/tnjEcz27ZnjOZQy2PI5j6vRXLlVEoqJWRX0xVruUXHRVRa8FOgibc4/n/Kynq7cVR27fD/AKa/zjHbjlK+zH407kRn6rXt4aXIq3UTEu9961Jmie/3/hXHUU4pjv2+X/b/AGYish64OuDucyNyvR6uYiyMrctUR1KXpd2do0nXCauqpi/+JETMcd+39kiWW5YoolVv6avdc2iquNVqNpTFStKp0XE6dsOf6iPxKq49fuc+/wAvn3QR2VIkrJdw5GMRqKr1STGSLE5m0pwrlrvkaTnKyepom3NPeMz7duc+svEVjSJg+EwORiulbRuI9aOpWmNVtEupVUTp3riItzrMOqurom9RXGcR8v7d/wCO7VksCV0KRrRH/qou7RyUciI2lU3NyXqnxR1TmbczThbT1tum7tHHb09v7/LP8w6Fo2Q+SaKdr6I18SuYteC1flzrzf1LfvHdVuZqiWax1VNFqq3VHMT3+v3/AMPODWK9uUIj2M9q5N2yKjnJRFVd+iLXGSiXUvpURbmMuq+rpq0mYmcekz9fl9J9/wBkSWHJip+pVUe5V4VVRcJfJXGrdVHoqpv1Yl9xH4c+/wB5df1lGfH71iP8fxM9kmFWU92E+2RExXYmM/2itclGqnBRL76c/wDUtSZomasuLfU002NJ59sfP79PSEi2XIr2uc+NcVsKIqxuVr8RJEVHNxv+Rq1rzE6Tn7+aP6m3FMxET3z68Z19cfLHDesyF0cbI30XFa1KotVVee6iXJvIdURMRiWe/XTXXNVPq2zpUAAAAAAAAf/Z  "
                alt="분석 자세 가이드"
              />
            </InfoBox>
            <SaveButton onClick={saveProfile} disabled={!result || saving}>
              {saving ? "저장 중..." : "프로필 저장하기"}
            </SaveButton>
            {savedId && (
              <p style={{ margin: 0, color: "#555" }}>
                저장됨: <code>{savedId}</code>
              </p>
            )}
          </Sidebar>
        </ContentContainer>

        <BodyAnalysisModal
          isOpen={openModal}
          onStart={onStart}
        />

        <CompletionModal
          isOpen={showCompletionModal}
          onNavigate={handleNavigateToWorkout}
        />
      </MainLayoutContainer>
      <Footer />
    </>
  );
};

export default BodyAnalysis;